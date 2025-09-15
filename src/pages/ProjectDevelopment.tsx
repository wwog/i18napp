import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
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
  makeStyles,
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
} from "@fluentui/react-components";
import {
  AddRegular,
  SearchRegular,
  ArrowLeftRegular,
  CheckmarkCircleRegular,
  WarningRegular,
  ArrowExportRegular,
  DeleteRegular,
} from "@fluentui/react-icons";
import { projectService, Project } from "../db/projects";
import { languageService, SupportedLanguage } from "../db/languages";
import { TranslationKeyValidator } from "../utils/validation";
import {
  TranslationItem,
  TranslationProgressCalculator,
  TranslationSearchUtils,
  TranslationDataUtils,
} from "../utils/translation";
import { DOMUtils } from "../utils/common";
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

  // 引用用于自动聚焦
  const newKeyInputRef = useRef<HTMLInputElement>(null);

  // 加载项目数据
  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  // 窗口控制
  useEffect(() => {
    const setupWindow = async () => {
      try {
        const appWindow = getCurrentWindow();

        // 设置窗口为可调整大小
        await appWindow.setResizable(true);

        // 设置窗口大小为 1250x750
        await appWindow.setSize(new LogicalSize(1250, 750));
      } catch (error) {
        console.error("设置窗口失败:", error);
      }
    };

    setupWindow();

    // 组件卸载时恢复原始设置
    return () => {
      const resetWindow = async () => {
        try {
          const appWindow = getCurrentWindow();
          // 重置为不可调整大小（根据原始设计）
          await appWindow.setResizable(false);
        } catch (error) {
          console.error("重置窗口失败:", error);
        }
      };
      resetWindow();
    };
  }, []);

  const loadProjectData = async () => {
    try {
      if (!projectId) return;

      // 加载项目信息
      const projectData = await projectService.getProjectById(
        parseInt(projectId)
      );
      if (!projectData) {
        navigate("/");
        return;
      }
      setProject(projectData);

      // 加载项目支持的语言
      const allLanguages = await languageService.getAllActiveLanguages();
      const projectLanguages = allLanguages.filter((lang) =>
        projectData.selected_languages.includes(lang.code)
      );
      setLanguages(projectLanguages);

      // TODO: 加载翻译数据 - 暂时使用模拟数据
      const mockTranslations: TranslationItem[] = [
        {
          id: "1",
          key: "welcome.title",
          "zh-CN": "欢迎",
          "en-US": "Welcome",
          "ja-JP": "ようこそ",
        },
        {
          id: "2",
          key: "welcome.description",
          "zh-CN": "欢迎使用我们的应用程序",
          "en-US": "Welcome to our application",
          "ja-JP": "",
        },
      ];
      setTranslations(mockTranslations);
    } catch (error) {
      console.error("加载项目数据失败:", error);
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

  // 获取未完成的翻译项
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
  const handleSaveNewRow = () => {
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

    const languageCodes = languages.map((lang) => lang.code);
    const newItem = TranslationDataUtils.createNewItem(
      newRowKey,
      languageCodes
    );

    setTranslations((prev) => [...prev, newItem]);
    setIsAddingNew(false);
    setNewRowKey("");

    dispatchToast(
      <Toast>
        <ToastTitle>添加翻译成功</ToastTitle>
      </Toast>,
      { intent: "success" }
    );
  };

  // 取消添加新行
  const handleCancelNewRow = () => {
    setIsAddingNew(false);
    setNewRowKey("");
    setKeyValidationError(null);
  };

  // 更新翻译内容
  const handleTranslationChange = (
    itemId: string,
    languageCode: string,
    value: string
  ) => {
    setTranslations((prev) =>
      TranslationDataUtils.updateTranslation(prev, itemId, languageCode, value)
    );
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
  const handleConfirmDelete = () => {
    const idsToDelete = new Set(itemsToDelete.map((item) => item.id));
    setTranslations((prev) => prev.filter((item) => !idsToDelete.has(item.id)));
    setSelectedItems(new Set());
    setIsDeleteDialogOpen(false);
    setItemsToDelete([]);

    dispatchToast(
      <Toast>
        <ToastTitle>成功删除 {itemsToDelete.length} 个翻译项</ToastTitle>
      </Toast>,
      { intent: "success" }
    );
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
      // 添加高亮效果
      DOMUtils.highlightElement(`row-${itemKey}`, 2000);
    }
  };

  // 返回首页并恢复窗口状态
  const handleGoBack = async () => {
    try {
      const appWindow = getCurrentWindow();
      // 重置为不可调整大小
      await appWindow.setResizable(false);
      // 可以选择恢复到默认大小，这里暂时不设置，保持当前大小
    } catch (error) {
      console.error("重置窗口状态失败:", error);
    } finally {
      // 无论窗口设置是否成功，都要导航回首页
      navigate("/");
    }
  };

  // 导出翻译数据
  const handleExport = () => {
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
      const exportData = {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
        },
        languages: languages.map((lang) => ({
          code: lang.code,
          name: lang.name,
        })),
        translations: translations,
        exportTime: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name}_translations_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      dispatchToast(
        <Toast>
          <ToastTitle>导出成功</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
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
              icon={<DeleteRegular />}
              onClick={handleDeleteBatch}
              disabled={selectedItems.size === 0}
            >
              删除选中 ({selectedItems.size})
            </Button>
            <Button
              appearance="outline"
              icon={<ArrowExportRegular />}
              onClick={handleExport}
            >
              导出翻译
            </Button>
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
                      </div>
                    </TableCell>
                    {languages.map((lang) => (
                      <TableCell key={lang.code} className={classes.tableCell}>
                        <Input
                          value={item[lang.code] || ""}
                          onChange={(e) =>
                            handleTranslationChange(
                              item.id,
                              lang.code,
                              e.target.value
                            )
                          }
                          placeholder={`输入${lang.name}...`}
                          className={classes.translationInput}
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
    </div>
  );
};
