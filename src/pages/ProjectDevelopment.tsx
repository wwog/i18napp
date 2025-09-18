import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Input,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  ProgressBar,
  Badge,
  tokens,
  Toaster,
  useToastController,
  ToastTitle,
  Toast,
  Checkbox,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Dropdown,
  Option,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from "@fluentui/react-components";
import {
  AddRegular,
  SearchRegular,
  ArrowLeftRegular,
  CheckmarkCircleRegular,
  WarningRegular,
  ArrowExportRegular,
  DeleteRegular,
  CopyRegular,
} from "@fluentui/react-icons";
import { Project } from "../db/projects";
import { SupportedLanguage } from "../db/languages";
import { translationService, SortOption, SortConfig } from "../db/translations";
import { TranslationKeyValidator } from "../utils/validation";
import {
  TranslationItem,
  TranslationProgressCalculator,
  TranslationSearchUtils,
  TranslationDataUtils,
} from "../utils/translation";
import {
  ProjectDataManager,
  TranslationOperationManager,
  WindowLifecycleManager,
  DOMUtils,
} from "../utils";
import { TranslationExportManager } from "../utils/export";
import { useStyles } from "./ProjectDevelopment.style";

export const ProjectDevelopment: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const classes = useStyles();
  const { dispatchToast } = useToastController();
  const toasterId = "project-development-toaster";

  // 状态管理
  const [project, setProject] = useState<Project | null>(null);
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [translations, setTranslations] = useState<TranslationItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newRowKey, setNewRowKey] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [keyValidationError, setKeyValidationError] = useState<string | null>(
    null
  );

  // 删除相关状态
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<TranslationItem[]>([]);

  // 批量添加相关状态
  const [isBatchAddDialogOpen, setIsBatchAddDialogOpen] = useState(false);
  const [batchKeys, setBatchKeys] = useState("");
  const [batchValidationResults, setBatchValidationResults] = useState<
    { key: string; isValid: boolean; message?: string }[]
  >([]);
  const [isBatchCreating, setIsBatchCreating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // 排序状态
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    sortBy: SortOption.TIME_DESC,
  });

  // 引用用于自动聚焦
  const newKeyInputRef = useRef<HTMLInputElement>(null);

  // 加载项目数据
  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  // 窗口管理
  useEffect(() => {
    const lifecycle = WindowLifecycleManager.setupProjectDevelopmentLifecycle();

    lifecycle.setup().catch((error) => {
      console.error("设置窗口失败:", error);
    });

    // 组件卸载时清理
    return () => {
      lifecycle.cleanup().catch((error) => {
        console.error("窗口清理失败:", error);
      });
    };
  }, []);

  const loadProjectData = async () => {
    try {
      if (!projectId) return;

      const projectIdNum = parseInt(projectId);
      const {
        project: projectData,
        languages: projectLanguages,
        translations: translationData,
      } = await ProjectDataManager.loadCompleteProjectData(
        projectIdNum,
        sortConfig
      );

      setProject(projectData);
      setLanguages(projectLanguages);
      setTranslations(translationData);
    } catch (error) {
      console.error("加载项目数据失败:", error);
      if (error instanceof Error && error.message.includes("不存在")) {
        navigate("/");
        return;
      }
      dispatchToast(
        <Toast>
          <ToastTitle>加载项目失败</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  // 计算翻译进度
  const calculateProgress = () => {
    const languageCodes = languages.map((lang) => lang.code);
    return TranslationProgressCalculator.calculate(translations, languageCodes);
  };

  // 搜索过滤
  const languageCodes = languages.map((lang) => lang.code);
  const filteredTranslations = TranslationSearchUtils.filter(
    translations,
    searchTerm,
    languageCodes
  );

  // 处理排序变更
  const handleSortChange = async (newSortConfig: SortConfig) => {
    setSortConfig(newSortConfig);
    if (project) {
      const languageCodes = languages.map((lang) => lang.code);
      const updatedTranslations =
        await ProjectDataManager.reloadTranslationData(
          project.id,
          languageCodes,
          newSortConfig
        );
      setTranslations(updatedTranslations);
    }
  };

  // 获取排序选项的显示文本
  const getSortOptionText = (option: SortOption): string => {
    switch (option) {
      case SortOption.TIME_DESC:
        return "按时间排序（新→旧）";
      case SortOption.TIME_ASC:
        return "按时间排序（旧→新）";
      case SortOption.KEY_ASC:
        return "按键名排序（A→Z）";
      case SortOption.KEY_DESC:
        return "按键名排序（Z→A）";
      default:
        return "按时间排序（新→旧）";
    }
  };
  const getIncompleteItems = () => {
    const languageCodes = languages.map((lang) => lang.code);
    return TranslationProgressCalculator.getIncompleteItems(
      translations,
      languageCodes
    );
  };

  // 处理翻译键输入变化
  const handleKeyInputChange = (value: string) => {
    setNewRowKey(value);

    // 实时验证（包含重复性检查、相似度检查和命名空间冲突检查）
    if (value.trim()) {
      const existingKeys = TranslationDataUtils.getAllKeys(translations);
      const validation = TranslationKeyValidator.validateComplete(
        value,
        existingKeys,
        {
          caseSensitive: true,
          checkSimilarity: true,
          similarityThreshold: 0.85,
          checkNamespaceConflict: true,
        }
      );
      setKeyValidationError(
        validation.isValid ? null : validation.message || null
      );
    } else {
      setKeyValidationError(null);
    }
  };

  // 添加新翻译行
  const handleAddNew = () => {
    setIsAddingNew(true);
    setNewRowKey("");
    setKeyValidationError(null);
    setTimeout(() => {
      newKeyInputRef.current?.focus();
    }, 100);
  };

  // 保存新翻译行
  const handleSaveNewRow = async () => {
    if (!project) return;

    const existingKeys = TranslationDataUtils.getAllKeys(translations);
    const validation = TranslationKeyValidator.validateComplete(
      newRowKey,
      existingKeys,
      {
        caseSensitive: true,
        checkSimilarity: true,
        similarityThreshold: 0.85,
        checkNamespaceConflict: true,
      }
    );

    if (!validation.isValid) {
      dispatchToast(
        <Toast>
          <ToastTitle>{validation.message}</ToastTitle>
        </Toast>,
        { intent: "warning" }
      );
      return;
    }

    try {
      const languageCodes = languages.map((lang) => lang.code);

      // 使用TranslationOperationManager创建翻译
      await TranslationOperationManager.createTranslation(
        project.id,
        newRowKey.trim(),
        languageCodes
      );

      // 重新加载翻译数据
      const updatedTranslations =
        await ProjectDataManager.reloadTranslationData(
          project.id,
          languageCodes,
          sortConfig
        );
      setTranslations(updatedTranslations);

      // 重置UI状态
      setIsAddingNew(false);
      setNewRowKey("");

      dispatchToast(
        <Toast>
          <ToastTitle>添加翻译成功</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
    } catch (error) {
      console.error("保存翻译失败:", error);
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      dispatchToast(
        <Toast>
          <ToastTitle>保存翻译失败: {errorMessage}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  // 取消添加新行
  const handleCancelNewRow = () => {
    setIsAddingNew(false);
    setNewRowKey("");
    setKeyValidationError(null);
  };

  // 处理翻译输入变化（仅更新本地状态）
  const handleTranslationInputChange = (
    itemId: string,
    languageCode: string,
    value: string
  ) => {
    // 只更新本地状态，不触发数据库操作
    setTranslations((prev) =>
      TranslationDataUtils.updateTranslation(prev, itemId, languageCode, value)
    );
  };

  // 失去焦点时保存翻译到数据库
  const handleTranslationBlur = async (
    itemId: string,
    languageCode: string,
    value: string
  ) => {
    if (!project) return;

    try {
      // 使用itemId作为key，因为在我们的数据结构中，itemId就是翻译key
      const key = itemId;

      // 使用TranslationOperationManager更新翻译
      await TranslationOperationManager.updateTranslation(
        project.id,
        key,
        languageCode,
        value
      );
    } catch (error) {
      console.error("保存翻译失败:", error);
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      dispatchToast(
        <Toast>
          <ToastTitle>保存翻译失败: {errorMessage}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  // 处理选择项变化
  const handleItemSelection = (itemId: string, selected: boolean) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  // 处理全选/取消全选
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = new Set(filteredTranslations.map((item) => item.id));
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  // 单个删除
  const handleDeleteSingle = (item: TranslationItem) => {
    setItemsToDelete([item]);
    setIsDeleteDialogOpen(true);
  };

  // 批量删除
  const handleDeleteBatch = () => {
    const itemsToRemove = translations.filter((item) =>
      selectedItems.has(item.id)
    );
    setItemsToDelete(itemsToRemove);
    setIsDeleteDialogOpen(true);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!project) return;

    try {
      // 在我们的设计中，item.id 实际上是翻译键
      const keysToDelete = itemsToDelete.map((item) => item.key);

      // 使用TranslationOperationManager批量删除
      await TranslationOperationManager.deleteTranslations(
        project.id,
        keysToDelete
      );

      // 更新本地状态
      const idsToDelete = new Set(itemsToDelete.map((item) => item.id));
      setTranslations((prev) =>
        prev.filter((item) => !idsToDelete.has(item.id))
      );
      setSelectedItems(new Set());
      setIsDeleteDialogOpen(false);
      setItemsToDelete([]);

      dispatchToast(
        <Toast>
          <ToastTitle>成功删除 {itemsToDelete.length} 个翻译项</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
    } catch (error) {
      console.error("删除翻译失败:", error);

      dispatchToast(
        <Toast>
          <ToastTitle>删除翻译失败</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  // 取消删除
  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setItemsToDelete([]);
  };

  // 跳转到指定行
  const handleJumpToItem = (itemKey: string) => {
    const success = DOMUtils.scrollToElement(`row-${itemKey}`, "center");
    if (success) {
      // 添加高亮效果，使用Griffel生成的样式类
      DOMUtils.highlightElement(`row-${itemKey}`, 2000, classes.highlightRow);
    }
  };

  // 返回首页并恢复窗口状态
  const handleGoBack = async () => {
    try {
      await WindowLifecycleManager.cleanup();
    } catch (error) {
      console.error("窗口清理失败:", error);
    } finally {
      // 无论窗口设置是否成功，都要导航回首页
      navigate("/");
    }
  };

  // 导出项目翻译数据
  const handleExportProject = async () => {
    if (!project) {
      dispatchToast(
        <Toast>
          <ToastTitle>项目数据未加载</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    try {
      const translationData =
        await translationService.exportProjectTranslations(project.id);
      const success = await TranslationExportManager.exportProjectAsJson(
        project,
        languages,
        translationData
      );

      if (success) {
        dispatchToast(
          <Toast>
            <ToastTitle>导出成功</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      }
    } catch (error) {
      console.error("导出失败:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>导出失败</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  // 导出CSV格式
  const handleExportCsv = async () => {
    if (!project) {
      dispatchToast(
        <Toast>
          <ToastTitle>项目数据未加载</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    try {
      const translationData =
        await translationService.exportProjectTranslations(project.id);
      const success = await TranslationExportManager.exportAsCsv(
        project,
        languages,
        translationData
      );

      if (success) {
        dispatchToast(
          <Toast>
            <ToastTitle>CSV导出成功</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      }
    } catch (error) {
      console.error("CSV导出失败:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>CSV导出失败</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  // 导出所有语言的单独 JSON 文件
  const handleExportAllLanguages = async () => {
    if (!project) {
      dispatchToast(
        <Toast>
          <ToastTitle>项目数据未加载</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    try {
      const translationData =
        await translationService.exportProjectTranslations(project.id);
      const result = await TranslationExportManager.exportAllLanguagesAsJson(
        project,
        languages,
        translationData
      );

      if (result.success > 0) {
        dispatchToast(
          <Toast>
            <ToastTitle>
              成功导出 {result.success} 个语言文件
              {result.failed > 0 ? `，${result.failed} 个失败` : ""}
            </ToastTitle>
          </Toast>,
          { intent: result.failed > 0 ? "warning" : "success" }
        );
      } else {
        dispatchToast(
          <Toast>
            <ToastTitle>导出被取消</ToastTitle>
          </Toast>,
          { intent: "info" }
        );
      }
    } catch (error) {
      console.error("分语言导出失败:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>分语言导出失败</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  // 批量添加相关函数
  const handleBatchAdd = () => {
    setIsBatchAddDialogOpen(true);
    setBatchKeys("");
    setBatchValidationResults([]);
  };

  const handleBatchKeysChange = (value: string) => {
    setBatchKeys(value);

    // 实时验证所有键
    const keys = value
      .split("\n")
      .map((key) => key.trim())
      .filter((key) => key.length > 0);

    if (keys.length === 0) {
      setBatchValidationResults([]);
      return;
    }

    const existingKeys = TranslationDataUtils.getAllKeys(translations);

    const results = keys.map((key) => {
      // 基础格式验证
      const basicValidation = TranslationKeyValidator.validateComplete(
        key,
        existingKeys,
        {
          caseSensitive: true,
          checkSimilarity: true,
          similarityThreshold: 0.85,
          checkNamespaceConflict: true,
        }
      );

      if (!basicValidation.isValid) {
        return {
          key,
          isValid: false,
          message: basicValidation.message,
        };
      }

      // 检查是否与其他待添加的键重复
      const duplicateInBatch = keys.filter((k) => k === key).length > 1;
      if (duplicateInBatch) {
        return {
          key,
          isValid: false,
          message: "在批量添加列表中重复",
        };
      }

      return {
        key,
        isValid: true,
      };
    });

    setBatchValidationResults(results);
  };

  const handleBatchCreate = async () => {
    if (!project) return;

    const validKeys = batchValidationResults
      .filter((result) => result.isValid)
      .map((result) => result.key);

    if (validKeys.length === 0) {
      dispatchToast(
        <Toast>
          <ToastTitle>没有有效的翻译键可以添加</ToastTitle>
        </Toast>,
        { intent: "warning" }
      );
      return;
    }

    setIsBatchCreating(true);
    setBatchProgress({ current: 0, total: validKeys.length });

    try {
      const languageCodes = languages.map((lang) => lang.code);
      let successCount = 0;
      let failureCount = 0;

      // 逐个创建翻译键以便显示进度
      for (let i = 0; i < validKeys.length; i++) {
        const key = validKeys[i];
        setBatchProgress({ current: i + 1, total: validKeys.length });

        try {
          await TranslationOperationManager.createTranslation(
            project.id,
            key,
            languageCodes
          );
          successCount++;
        } catch (error) {
          console.error(`创建翻译键 ${key} 失败:`, error);
          failureCount++;
        }
      }

      // 重新加载翻译数据
      const updatedTranslations =
        await ProjectDataManager.reloadTranslationData(
          project.id,
          languageCodes,
          sortConfig
        );
      setTranslations(updatedTranslations);

      // 关闭对话框
      setIsBatchAddDialogOpen(false);
      setBatchKeys("");
      setBatchValidationResults([]);

      // 显示结果
      if (failureCount === 0) {
        dispatchToast(
          <Toast>
            <ToastTitle>成功添加 {successCount} 个翻译键</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      } else {
        dispatchToast(
          <Toast>
            <ToastTitle>
              添加完成：成功 {successCount} 个，失败 {failureCount} 个
            </ToastTitle>
          </Toast>,
          { intent: "warning" }
        );
      }
    } catch (error) {
      console.error("批量创建翻译失败:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>批量创建翻译失败</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsBatchCreating(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  const handleBatchCancel = () => {
    setIsBatchAddDialogOpen(false);
    setBatchKeys("");
    setBatchValidationResults([]);
  };

  const getValidKeysCount = () => {
    return batchValidationResults.filter((result) => result.isValid).length;
  };

  const progress = calculateProgress();
  const incompleteItems = getIncompleteItems();

  if (!project) {
    return <div>加载中...</div>;
  }

  return (
    <div className={classes.container}>
      <Toaster toasterId={toasterId} className={classes.toaster} />

      {/* 左侧面板 */}
      <div className={classes.leftPanel}>
        {/* 搜索区域 */}
        <div className={classes.searchSection}>
          <div className={classes.searchLabel}>搜索翻译</div>
          <Input
            contentBefore={<SearchRegular />}
            placeholder="搜索键或翻译内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* 进度展示 */}
        <div className={classes.progressSection}>
          <div className={classes.searchLabel}>翻译进度</div>

          {/* 整体进度 */}
          <div className={classes.progressItem}>
            <div className={classes.progressHeader}>
              <span className={classes.progressLabel}>整体进度</span>
              <span className={classes.progressValue}>{progress.overall}%</span>
            </div>
            <ProgressBar value={progress.overall / 100} />
            <div className={classes.progressLabel}>
              {translations.length} 个翻译键
            </div>
          </div>

          {/* 各语言进度 */}
          {languages.map((lang) => (
            <div key={lang.code} className={classes.progressItem}>
              <div className={classes.progressHeader}>
                <span className={classes.progressLabel}>{lang.name}</span>
                <span className={classes.progressValue}>
                  {progress.byLanguage[lang.code] || 0}%
                </span>
              </div>
              <ProgressBar
                value={(progress.byLanguage[lang.code] || 0) / 100}
              />
            </div>
          ))}
        </div>

        {/* 未完成项目导航 */}
        <div className={classes.navigationSection}>
          <div className={classes.searchLabel}>
            未完成项 ({incompleteItems.length})
          </div>
          <div className={classes.navigationList}>
            {incompleteItems.map((item) => (
              <button
                key={item.id}
                className={classes.navItem}
                onClick={() => handleJumpToItem(item.key)}
              >
                <WarningRegular className={classes.navIcon} />
                <span>{item.key}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧主内容区域 */}
      <div className={classes.rightPanel}>
        {/* 页面头部 */}
        <div className={classes.header}>
          {/* 左侧信息区域 */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Button
              appearance="subtle"
              icon={<ArrowLeftRegular />}
              onClick={handleGoBack}
            >
              返回
            </Button>
            <h1 className={classes.projectTitle}>{project.name}</h1>
            {project.description && (
              <Badge appearance="outline">{project.description}</Badge>
            )}
          </div>

          {/* 右侧操作区域 */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button appearance="outline" icon={<ArrowExportRegular />}>
                  导出
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem onClick={handleExportProject}>
                    导出项目（JSON）
                  </MenuItem>
                  <MenuItem onClick={handleExportCsv}>导出表格（CSV）</MenuItem>
                  <MenuItem onClick={handleExportAllLanguages}>
                    分语言导出（JSON）
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </div>

        {/* 表格区域 */}
        <div className={classes.tableContainer}>
          {/* 操作按钮组 */}
          <div className={classes.actionGroup}>
            <Button
              appearance="primary"
              icon={<AddRegular />}
              onClick={handleAddNew}
              disabled={isAddingNew}
            >
              新增翻译
            </Button>
            <Button
              appearance="outline"
              icon={<CopyRegular />}
              onClick={handleBatchAdd}
            >
              批量添加
            </Button>
            <Button
              appearance="outline"
              icon={<DeleteRegular />}
              onClick={handleDeleteBatch}
              disabled={selectedItems.size === 0}
            >
              删除选中 ({selectedItems.size})
            </Button>

            {/* 排序选择器 - 只有当有翻译数据时才显示 */}
            {translations.length > 0 && (
              <Dropdown
                placeholder="选择排序方式"
                value={getSortOptionText(sortConfig.sortBy)}
                onOptionSelect={(_, data) => {
                  if (data.optionValue) {
                    handleSortChange({
                      sortBy: data.optionValue as SortOption,
                    });
                  }
                }}
              >
                <Option value={SortOption.TIME_DESC}>
                  按时间排序（新→旧）
                </Option>
                <Option value={SortOption.TIME_ASC}>按时间排序（旧→新）</Option>
                <Option value={SortOption.KEY_ASC}>按键名排序（A→Z）</Option>
                <Option value={SortOption.KEY_DESC}>按键名排序（Z→A）</Option>
              </Dropdown>
            )}
          </div>

          {/* 表格包装器 */}
          <div className={classes.tableWrapper}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell className={classes.selectCell}>
                    <Checkbox
                      checked={
                        filteredTranslations.length > 0 &&
                        filteredTranslations.every((item) =>
                          selectedItems.has(item.id)
                        )
                      }
                      onChange={(_, data) => handleSelectAll(!!data.checked)}
                    />
                  </TableHeaderCell>
                  <TableHeaderCell className={classes.tableCell}>
                    翻译键
                  </TableHeaderCell>
                  {languages.map((lang) => (
                    <TableHeaderCell
                      key={lang.code}
                      className={classes.tableCell}
                    >
                      {lang.name}
                    </TableHeaderCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* 新增行 */}
                {isAddingNew && (
                  <TableRow>
                    <TableCell className={classes.selectCell}>
                      {/* 空白选择框区域 */}
                    </TableCell>
                    <TableCell className={classes.tableCell}>
                      <Input
                        ref={newKeyInputRef}
                        value={newRowKey}
                        onChange={(e) => handleKeyInputChange(e.target.value)}
                        placeholder="输入翻译键... (仅支持字母、数字、点号、下划线)"
                        className={classes.keyInput}
                        autoComplete="off"
                        spellCheck={false}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveNewRow();
                          } else if (e.key === "Escape") {
                            handleCancelNewRow();
                          }
                        }}
                        style={{
                          borderColor: keyValidationError
                            ? tokens.colorPaletteRedBorder1
                            : undefined,
                        }}
                      />
                      {keyValidationError && (
                        <div
                          style={{
                            color: tokens.colorPaletteRedForeground1,
                            fontSize: "12px",
                            marginTop: "2px",
                          }}
                        >
                          {keyValidationError}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginTop: "4px",
                        }}
                      >
                        <Button
                          size="small"
                          appearance="primary"
                          onClick={handleSaveNewRow}
                          disabled={!!keyValidationError || !newRowKey.trim()}
                        >
                          保存
                        </Button>
                        <Button
                          size="small"
                          appearance="subtle"
                          onClick={handleCancelNewRow}
                        >
                          取消
                        </Button>
                      </div>
                    </TableCell>
                    {languages.map((lang) => (
                      <TableCell key={lang.code} className={classes.tableCell}>
                        <Input
                          placeholder={`输入${lang.name}翻译...`}
                          className={classes.translationInput}
                          autoComplete="off"
                          spellCheck={false}
                          disabled
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                )}

                {/* 现有翻译行 */}
                {filteredTranslations.map((item) => (
                  <TableRow key={item.id} id={`row-${item.key}`}>
                    <TableCell className={classes.selectCell}>
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onChange={(_, data) =>
                          handleItemSelection(item.id, !!data.checked)
                        }
                      />
                    </TableCell>
                    <TableCell className={classes.tableCell}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {TranslationProgressCalculator.isItemComplete(
                            item,
                            languageCodes
                          ) && (
                            <CheckmarkCircleRegular
                              style={{
                                color: tokens.colorPaletteGreenForeground2,
                                fontSize: "16px",
                              }}
                            />
                          )}
                          <span style={{ fontFamily: "monospace" }}>
                            {item.key}
                          </span>
                        </div>
                        <Button
                          appearance="subtle"
                          icon={<DeleteRegular />}
                          size="small"
                          onClick={() => handleDeleteSingle(item)}
                          title="删除此翻译"
                          aria-label="删除此翻译"
                        />
                      </div>
                    </TableCell>
                    {languages.map((lang) => (
                      <TableCell key={lang.code} className={classes.tableCell}>
                        <Input
                          value={item[lang.code] || ""}
                          onChange={(e) =>
                            handleTranslationInputChange(
                              item.id,
                              lang.code,
                              e.target.value
                            )
                          }
                          onBlur={(e) =>
                            handleTranslationBlur(
                              item.id,
                              lang.code,
                              e.target.value
                            )
                          }
                          placeholder={`输入${lang.name}...`}
                          className={classes.translationInput}
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* 删除确认对话框 */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(_, data) => setIsDeleteDialogOpen(data.open)}
      >
        <DialogSurface>
          <DialogTitle>确认删除</DialogTitle>
          <DialogContent>
            <DialogBody>
              <p>
                您确定要删除以下 {itemsToDelete.length}{" "}
                个翻译项吗？此操作不可撤销。
              </p>
              <div
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  margin: "12px 0",
                  padding: "8px",
                  backgroundColor: tokens.colorNeutralBackground2,
                  borderRadius: tokens.borderRadiusSmall,
                }}
              >
                {itemsToDelete.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "4px 0",
                      fontFamily: "monospace",
                      fontSize: "12px",
                    }}
                  >
                    • {item.key}
                  </div>
                ))}
              </div>
            </DialogBody>
            <DialogActions>
              <Button appearance="secondary" onClick={handleCancelDelete}>
                取消
              </Button>
              <Button appearance="primary" onClick={handleConfirmDelete}>
                确认删除
              </Button>
            </DialogActions>
          </DialogContent>
        </DialogSurface>
      </Dialog>

      {/* 批量添加翻译键对话框 */}
      <Dialog
        open={isBatchAddDialogOpen}
        onOpenChange={(_, data) => setIsBatchAddDialogOpen(data.open)}
      >
        <DialogSurface style={{ maxWidth: "600px" }}>
          <DialogTitle>批量添加翻译键</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                  }}
                >
                  翻译键列表：
                </label>
                <textarea
                  value={batchKeys}
                  autoCapitalize={"off"}
                  onChange={(e) => handleBatchKeysChange(e.target.value)}
                  placeholder={`例如：\nuser.profile.name\nuser.profile.email\nuser.profile.phone\nsettings.language\nsettings.theme`}
                  rows={8}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: `1px solid ${tokens.colorNeutralStroke1}`,
                    borderRadius: tokens.borderRadiusSmall,
                    fontFamily: "monospace",
                    fontSize: "14px",
                    resize: "vertical",
                    minHeight: "120px",
                    boxSizing: "border-box",
                  }}
                  disabled={isBatchCreating}
                />
              </div>

              {/* 验证结果显示 */}
              {batchValidationResults.length > 0 && (
                <div
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    border: `1px solid ${tokens.colorNeutralStroke1}`,
                    borderRadius: tokens.borderRadiusSmall,
                    padding: "8px",
                    backgroundColor: tokens.colorNeutralBackground2,
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "600",
                      marginBottom: "8px",
                      fontSize: "14px",
                    }}
                  >
                    验证结果：有效 {getValidKeysCount()} / 总计{" "}
                    {batchValidationResults.length} 个
                  </div>
                  {batchValidationResults.map((result, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "2px 0",
                        fontSize: "12px",
                      }}
                    >
                      <span
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          backgroundColor: result.isValid
                            ? tokens.colorPaletteGreenBackground2
                            : tokens.colorPaletteRedBackground2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          color: "white",
                        }}
                      >
                        {result.isValid ? "✓" : "✗"}
                      </span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          flex: 1,
                        }}
                      >
                        {result.key}
                      </span>
                      {!result.isValid && result.message && (
                        <span
                          style={{
                            color: tokens.colorPaletteRedForeground1,
                            fontSize: "11px",
                          }}
                        >
                          {result.message}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 进度显示 */}
              {isBatchCreating && (
                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                      fontSize: "14px",
                    }}
                  >
                    <span>创建进度</span>
                    <span>
                      {batchProgress.current} / {batchProgress.total}
                    </span>
                  </div>
                  <ProgressBar
                    value={
                      batchProgress.total > 0
                        ? batchProgress.current / batchProgress.total
                        : 0
                    }
                  />
                </div>
              )}
            </DialogBody>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={handleBatchCancel}
                disabled={isBatchCreating}
              >
                取消
              </Button>
              <Button
                appearance="primary"
                onClick={handleBatchCreate}
                disabled={
                  isBatchCreating ||
                  getValidKeysCount() === 0 ||
                  batchValidationResults.length === 0
                }
              >
                {isBatchCreating
                  ? "创建中..."
                  : `添加 ${getValidKeysCount()} 个翻译键`}
              </Button>
            </DialogActions>
          </DialogContent>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
