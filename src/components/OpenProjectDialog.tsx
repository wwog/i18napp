import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogBody,
  Button,
  Badge,
  ProgressBar,
} from "@fluentui/react-components";
import {
  FolderOpenRegular,
  TranslateRegular,
} from "@fluentui/react-icons";
import { makeStyles, tokens } from "@fluentui/react-components";
import { projectService, Project } from "../db/projects";
import { languageService } from "../db/languages";

const useStyles = makeStyles({
  dialogContent: {
    minWidth: "600px",
    maxWidth: "800px",
    maxHeight: "70vh",
    overflow: "hidden",
  },
  projectList: {
    maxHeight: "400px",
    overflowY: "auto",
    paddingRight: "8px",
  },
  projectItem: {
    display: "flex",
    alignItems: "center",
    padding: "12px",
    marginBottom: "8px",
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      border: `1px solid ${tokens.colorBrandBackground}`,
    },
  },
  projectIcon: {
    fontSize: "24px",
    color: tokens.colorBrandBackground,
    marginRight: "12px",
  },
  projectDetails: {
    flex: 1,
  },
  projectName: {
    fontSize: "16px",
    fontWeight: 500,
    color: tokens.colorNeutralForeground1,
    marginBottom: "4px",
  },
  projectMeta: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "8px",
  },
  projectDate: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground2,
  },
  statusBadge: {
    fontSize: "12px",
  },
  statusCompleted: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },
  statusInProgress: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground2,
  },
  languageSection: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  languageIcon: {
    fontSize: "14px",
    color: tokens.colorNeutralForeground2,
  },
  languageTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
  },
  languageTag: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
    fontSize: "11px",
    padding: "2px 6px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  progressSection: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  progressBar: {
    flex: 1,
    "& > div": {
      backgroundColor: tokens.colorBrandBackground,
    },
  },
  progressText: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground2,
    minWidth: "50px",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: tokens.colorNeutralForeground2,
  },
  loadingState: {
    textAlign: "center",
    padding: "40px 20px",
  },
});

interface OpenProjectDialogProps {
  trigger: React.ReactElement;
  onProjectSelect?: (project: Project) => void;
}

export const OpenProjectDialog: React.FC<OpenProjectDialogProps> = ({ 
  trigger, 
  onProjectSelect 
}) => {
  const styles = useStyles();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // 加载项目数据
  const loadProjects = async () => {
    setLoading(true);
    try {
      const projectsData = await projectService.getAllProjects();
      
      // 为每个项目获取语言名称
      const projectsWithLanguageNames = await Promise.all(
        projectsData.map(async (project) => {
          const languageNames = await languageService.getLanguageNamesByCodes(
            project.selected_languages
          );
          return {
            ...project,
            language_names: languageNames,
          };
        })
      );
      
      setProjects(projectsWithLanguageNames);
    } catch (error) {
      console.error("加载项目失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 当对话框打开时加载项目
  useEffect(() => {
    if (open) {
      loadProjects();
    }
  }, [open]);

  const calculateProgress = (completed: number, total: number) => {
    return Math.round((completed / total) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const handleProjectSelect = (project: Project) => {
    if (onProjectSelect) {
      onProjectSelect(project);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        {trigger}
      </DialogTrigger>
      <DialogSurface className={styles.dialogContent}>
        <DialogBody>
          <DialogTitle>打开项目</DialogTitle>
          <DialogContent>
            {loading ? (
              <div className={styles.loadingState}>
                加载中...
              </div>
            ) : projects.length === 0 ? (
              <div className={styles.emptyState}>
                暂无项目，请先创建一个项目
              </div>
            ) : (
              <div className={styles.projectList}>
                {projects.map((project: Project) => {
                  const progress = calculateProgress(
                    project.completed_translations || 0,
                    project.total_translations || 0
                  );

                  return (
                    <div
                      key={project.id}
                      className={styles.projectItem}
                      onClick={() => handleProjectSelect(project)}
                    >
                      <FolderOpenRegular className={styles.projectIcon} />
                      <div className={styles.projectDetails}>
                        <div className={styles.projectName}>{project.name}</div>
                        
                        <div className={styles.projectMeta}>
                          <div className={styles.projectDate}>
                            {formatDate(project.updated_at)}
                          </div>
                          <Badge
                            appearance="filled"
                            className={`${styles.statusBadge} ${
                              project.is_completed
                                ? styles.statusCompleted
                                : styles.statusInProgress
                            }`}
                          >
                            {project.is_completed ? "已完成" : "进行中"}
                          </Badge>
                        </div>

                        {/* 语言支持 */}
                        <div className={styles.languageSection}>
                          <TranslateRegular className={styles.languageIcon} />
                          <div className={styles.languageTags}>
                            {(project.language_names || []).slice(0, 3).map((lang: string, index: number) => (
                              <Badge
                                key={index}
                                size="small"
                                appearance="outline"
                                className={styles.languageTag}
                              >
                                {lang}
                              </Badge>
                            ))}
                            {(project.language_names || []).length > 3 && (
                              <Badge
                                size="small"
                                appearance="outline"
                                className={styles.languageTag}
                              >
                                +{(project.language_names || []).length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* 翻译进度 */}
                        <div className={styles.progressSection}>
                          <ProgressBar
                            value={progress}
                            max={100}
                            className={styles.progressBar}
                          />
                          <div className={styles.progressText}>
                            {progress}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setOpen(false)}>
              取消
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};