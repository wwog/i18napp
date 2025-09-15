import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { LogicalSize } from '@tauri-apps/api/dpi';
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
} from '@fluentui/react-components';
import {
  AddRegular,
  SearchRegular,
  ArrowLeftRegular,
  CheckmarkCircleRegular,
  WarningRegular,
} from '@fluentui/react-icons';
import { projectService, Project } from '../db/projects';
import { languageService, SupportedLanguage } from '../db/languages';
import { TranslationKeyValidator } from '../utils/validation';
import {
  TranslationItem,
  TranslationProgressCalculator,
  TranslationSearchUtils,
  TranslationDataUtils,
} from '../utils/translation';
import { DOMUtils } from '../utils/common';

const useStyles = makeStyles({
  container: {
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    display: 'flex',
    overflow: 'hidden',
  },
  leftPanel: {
    width: '300px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflow: 'auto',
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 24px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  projectTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  tableContainer: {
    flex: 1,
    padding: '16px 24px',
    overflow: 'auto',
  },
  searchSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  searchLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  progressSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  progressItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
  },
  progressValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  navigationSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: tokens.borderRadiusSmall,
    cursor: 'pointer',
    fontSize: '12px',
    backgroundColor: 'transparent',
    border: 'none',
    color: tokens.colorNeutralForeground2,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      color: tokens.colorNeutralForeground1,
    },
  },
  navIcon: {
    fontSize: '14px',
  },
  addButton: {
    marginBottom: '16px',
  },
  tableCell: {
    padding: '8px',
  },
  keyInput: {
    width: '100%',
  },
  translationInput: {
    width: '100%',
  },
  toaster: {
    position: 'fixed',
    top: '16px',
    right: '16px',
    zIndex: 1000,
  },
  // 高亮效果样式
  '@global': {
    '.highlight': {
      backgroundColor: `${tokens.colorBrandBackgroundHover} !important`,
      transition: 'background-color 0.3s ease',
    },
  },
});

export const ProjectDevelopment: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const classes = useStyles();
  const { dispatchToast } = useToastController();
  const toasterId = 'project-development-toaster';

  // 状态管理
  const [project, setProject] = useState<Project | null>(null);
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [translations, setTranslations] = useState<TranslationItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newRowKey, setNewRowKey] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [keyValidationError, setKeyValidationError] = useState<string | null>(null);
  
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
        
        // 设置窗口大小为 1250x650
        await appWindow.setSize(new LogicalSize(1250, 650));
        
        // 居中窗口
        await appWindow.center();
      } catch (error) {
        console.error('设置窗口失败:', error);
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
          console.error('重置窗口失败:', error);
        }
      };
      resetWindow();
    };
  }, []);

  const loadProjectData = async () => {
    try {
      if (!projectId) return;

      // 加载项目信息
      const projectData = await projectService.getProjectById(parseInt(projectId));
      if (!projectData) {
        navigate('/');
        return;
      }
      setProject(projectData);

      // 加载项目支持的语言
      const allLanguages = await languageService.getAllActiveLanguages();
      const projectLanguages = allLanguages.filter(lang => 
        projectData.selected_languages.includes(lang.code)
      );
      setLanguages(projectLanguages);

      // TODO: 加载翻译数据 - 暂时使用模拟数据
      const mockTranslations: TranslationItem[] = [
        {
          id: '1',
          key: 'welcome.title',
          'zh-CN': '欢迎',
          'en-US': 'Welcome',
          'ja-JP': 'ようこそ',
        },
        {
          id: '2',
          key: 'welcome.description',
          'zh-CN': '欢迎使用我们的应用程序',
          'en-US': 'Welcome to our application',
          'ja-JP': '',
        },
      ];
      setTranslations(mockTranslations);
    } catch (error) {
      console.error('加载项目数据失败:', error);
      dispatchToast(
        <Toast>
          <ToastTitle>加载项目失败</ToastTitle>
        </Toast>,
        { intent: 'error' }
      );
    }
  };

  // 计算翻译进度
  const calculateProgress = () => {
    const languageCodes = languages.map(lang => lang.code);
    return TranslationProgressCalculator.calculate(translations, languageCodes);
  };

  // 搜索过滤
  const languageCodes = languages.map(lang => lang.code);
  const filteredTranslations = TranslationSearchUtils.filter(translations, searchTerm, languageCodes);

  // 获取未完成的翻译项
  const getIncompleteItems = () => {
    const languageCodes = languages.map(lang => lang.code);
    return TranslationProgressCalculator.getIncompleteItems(translations, languageCodes);
  };

  // 处理翻译键输入变化
  const handleKeyInputChange = (value: string) => {
    setNewRowKey(value);
    
    // 实时验证
    if (value.trim()) {
      const validation = TranslationKeyValidator.validate(value);
      setKeyValidationError(validation.isValid ? null : validation.message || null);
    } else {
      setKeyValidationError(null);
    }
  };

  // 添加新翻译行
  const handleAddNew = () => {
    setIsAddingNew(true);
    setNewRowKey('');
    setKeyValidationError(null);
    setTimeout(() => {
      newKeyInputRef.current?.focus();
    }, 100);
  };

  // 保存新翻译行
  const handleSaveNewRow = () => {
    const existingKeys = TranslationDataUtils.getAllKeys(translations);
    const validation = TranslationKeyValidator.validateComplete(newRowKey, existingKeys);
    
    if (!validation.isValid) {
      dispatchToast(
        <Toast>
          <ToastTitle>{validation.message}</ToastTitle>
        </Toast>,
        { intent: 'warning' }
      );
      return;
    }

    const languageCodes = languages.map(lang => lang.code);
    const newItem = TranslationDataUtils.createNewItem(newRowKey, languageCodes);

    setTranslations(prev => [...prev, newItem]);
    setIsAddingNew(false);
    setNewRowKey('');

    dispatchToast(
      <Toast>
        <ToastTitle>添加翻译成功</ToastTitle>
      </Toast>,
      { intent: 'success' }
    );
  };

  // 取消添加新行
  const handleCancelNewRow = () => {
    setIsAddingNew(false);
    setNewRowKey('');
    setKeyValidationError(null);
  };

  // 更新翻译内容
  const handleTranslationChange = (itemId: string, languageCode: string, value: string) => {
    setTranslations(prev => 
      TranslationDataUtils.updateTranslation(prev, itemId, languageCode, value)
    );
  };

  // 跳转到指定行
  const handleJumpToItem = (itemKey: string) => {
    const success = DOMUtils.scrollToElement(`row-${itemKey}`, 'center');
    if (success) {
      // 添加高亮效果
      DOMUtils.highlightElement(`row-${itemKey}`, 2000);
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
          {languages.map(lang => (
            <div key={lang.code} className={classes.progressItem}>
              <div className={classes.progressHeader}>
                <span className={classes.progressLabel}>{lang.name}</span>
                <span className={classes.progressValue}>{progress.byLanguage[lang.code] || 0}%</span>
              </div>
              <ProgressBar value={(progress.byLanguage[lang.code] || 0) / 100} />
            </div>
          ))}
        </div>

        {/* 未完成项目导航 */}
        <div className={classes.navigationSection}>
          <div className={classes.searchLabel}>
            未完成项 ({incompleteItems.length})
          </div>
          {incompleteItems.slice(0, 10).map(item => (
            <button
              key={item.id}
              className={classes.navItem}
              onClick={() => handleJumpToItem(item.key)}
            >
              <WarningRegular className={classes.navIcon} />
              <span>{item.key}</span>
            </button>
          ))}
          {incompleteItems.length > 10 && (
            <div className={classes.progressLabel}>
              还有 {incompleteItems.length - 10} 个未完成项...
            </div>
          )}
        </div>
      </div>

      {/* 右侧主内容区域 */}
      <div className={classes.rightPanel}>
        {/* 页面头部 */}
        <div className={classes.header}>
          <Button
            appearance="subtle"
            icon={<ArrowLeftRegular />}
            onClick={() => navigate('/')}
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
          <Button
            appearance="primary"
            icon={<AddRegular />}
            onClick={handleAddNew}
            disabled={isAddingNew}
            className={classes.addButton}
          >
            新增翻译
          </Button>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell className={classes.tableCell}>翻译键</TableHeaderCell>
                {languages.map(lang => (
                  <TableHeaderCell key={lang.code} className={classes.tableCell}>
                    {lang.name}
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* 新增行 */}
              {isAddingNew && (
                <TableRow>
                  <TableCell className={classes.tableCell}>
                    <Input
                      ref={newKeyInputRef}
                      value={newRowKey}
                      onChange={(e) => handleKeyInputChange(e.target.value)}
                      placeholder="输入翻译键... (仅支持字母、数字、点号、下划线)"
                      className={classes.keyInput}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveNewRow();
                        } else if (e.key === 'Escape') {
                          handleCancelNewRow();
                        }
                      }}
                      style={{
                        borderColor: keyValidationError ? tokens.colorPaletteRedBorder1 : undefined
                      }}
                    />
                    {keyValidationError && (
                      <div style={{ 
                        color: tokens.colorPaletteRedForeground1, 
                        fontSize: '12px', 
                        marginTop: '2px' 
                      }}>
                        {keyValidationError}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <Button 
                        size="small" 
                        appearance="primary" 
                        onClick={handleSaveNewRow}
                        disabled={!!keyValidationError || !newRowKey.trim()}
                      >
                        保存
                      </Button>
                      <Button size="small" appearance="subtle" onClick={handleCancelNewRow}>
                        取消
                      </Button>
                    </div>
                  </TableCell>
                  {languages.map(lang => (
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
              {filteredTranslations.map(item => (
                <TableRow key={item.id} id={`row-${item.key}`}>
                  <TableCell className={classes.tableCell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {TranslationProgressCalculator.isItemComplete(item, languageCodes) && (
                        <CheckmarkCircleRegular style={{ color: tokens.colorPaletteGreenForeground2, fontSize: '16px' }} />
                      )}
                      <span style={{ fontFamily: 'monospace' }}>{item.key}</span>
                    </div>
                  </TableCell>
                  {languages.map(lang => (
                    <TableCell key={lang.code} className={classes.tableCell}>
                      <Input
                        value={item[lang.code] || ''}
                        onChange={(e) => handleTranslationChange(item.id, lang.code, e.target.value)}
                        placeholder={`输入${lang.name}翻译...`}
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
  );
};