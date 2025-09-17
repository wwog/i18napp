import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Toast,
  ToastTitle,
  useToastController,
} from "@fluentui/react-components";
import { FolderOpenRegular, TranslateRegular, DeleteRegular } from "@fluentui/react-icons";
import { makeStyles, tokens, mergeClasses } from "@fluentui/react-components";
import { projectService, Project } from "../db/projects";
import { languageService } from "../db/languages";

const useStyles = makeStyles({
  dialogContent: {},
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
    position: "relative",
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
    fontSize: "11px",
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
  deleteButton: {
    position: "absolute",
    top: "8px",
    right: "8px",
    minWidth: "32px",
    width: "32px",
    height: "32px",
    padding: "0",
    borderRadius: "50%",
    opacity: 0,
    transition: "opacity 0.2s ease",
    ":hover": {
      backgroundColor: tokens.colorPaletteRedBackground1,
    },
  },
  projectItemHover: {
    ":hover": {
      "& .delete-button": {
        opacity: 1,
      },
    },
  },
});

interface OpenProjectDialogProps {
  trigger: React.ReactElement;
  onProjectSelect?: (project: Project) => void;
}

export const OpenProjectDialog: React.FC<OpenProjectDialogProps> = ({
  trigger,
  onProjectSelect,
}) => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { dispatchToast } = useToastController();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    project: Project | null;
  }>({ show: false, project: null });
  const [deleting, setDeleting] = useState(false);

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
    // 处理 undefined, null 或无效值
    const completedCount = completed || 0;
    const totalCount = total || 0;

    if (totalCount === 0) return 0;
    return Math.round((completedCount / totalCount) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN");
  };

  const handleProjectSelect = (project: Project) => {
    if (onProjectSelect) {
      onProjectSelect(project);
    }
    setOpen(false);

    // 导航到项目开发页面
    navigate(`/project/${project.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation(); // 防止触发项目选择
    setDeleteConfirm({ show: true, project });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.project) return;

    setDeleting(true);
    try {
      await projectService.deleteProject(deleteConfirm.project.id);
      
      // 从列表中移除已删除的项目
      setProjects(prev => prev.filter(p => p.id !== deleteConfirm.project!.id));
      
      dispatchToast(
        <Toast>
          <ToastTitle>项目删除成功</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
    } catch (error) {
      console.error('删除项目失败:', error);
      dispatchToast(
        <Toast>
          <ToastTitle>删除项目失败</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setDeleting(false);
      setDeleteConfirm({ show: false, project: null });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ show: false, project: null });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
        <DialogTrigger disableButtonEnhancement>
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {trigger}
          </div>
        </DialogTrigger>
        <DialogSurface className={styles.dialogContent}>
          <DialogBody>
            <DialogTitle>打开项目</DialogTitle>
            <DialogContent>
            {loading ? (
              <div className={styles.loadingState}>加载中...</div>
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
                      className={mergeClasses(styles.projectItem, styles.projectItemHover)}
                      onClick={() => handleProjectSelect(project)}
                    >
                      <FolderOpenRegular className={styles.projectIcon} />
                      
                      {/* 删除按钮 */}
                      <Button
                        appearance="subtle"
                        icon={<DeleteRegular />}
                        className={mergeClasses(styles.deleteButton, "delete-button")}
                        onClick={(e) => handleDeleteClick(e, project)}
                        title="删除项目"
                        aria-label="删除项目"
                        style={{
                          color: tokens.colorPaletteRedForeground1,
                        }}
                      />
                      <div className={styles.projectDetails}>
                        <div className={styles.projectName}>{project.name}</div>

                        <div className={styles.projectMeta}>
                          <div className={styles.projectDate}>
                            {formatDate(project.updated_at)}
                          </div>
                          <Badge
                            appearance="filled"
                            className={mergeClasses(
                              styles.statusBadge,
                              project.is_completed
                                ? styles.statusCompleted
                                : styles.statusInProgress
                            )}
                          >
                            {project.is_completed ? "已完成" : "进行中"}
                          </Badge>
                        </div>

                        {/* 语言支持 */}
                        <div className={styles.languageSection}>
                          <TranslateRegular className={styles.languageIcon} />
                          <div className={styles.languageTags}>
                            {(project.language_names || [])
                              .slice(0, 3)
                              .map((lang: string, index: number) => (
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
                          <div className={styles.progressText}>{progress}%</div>
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
      
      {/* 删除确认对话框 */}
      <Dialog 
        open={deleteConfirm.show} 
        onOpenChange={(_, data) => {
          if (!data.open) {
            handleCancelDelete();
          }
        }}
      >
        <DialogSurface>
          <DialogTitle>确认删除项目</DialogTitle>
          <DialogContent>
            <DialogBody>
              <p>
                您确定要删除项目 <strong>"{deleteConfirm.project?.name}"</strong> 吗？
              </p>
              <p style={{ color: tokens.colorPaletteRedForeground1, fontSize: "14px", marginTop: "12px" }}>
                此操作不可撤销，将永久删除项目及其所有翻译数据。
              </p>
            </DialogBody>
            <DialogActions>
              <Button 
                appearance="secondary" 
                onClick={handleCancelDelete}
                disabled={deleting}
              >
                取消
              </Button>
              <Button
                appearance="primary"
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{
                  backgroundColor: tokens.colorPaletteRedBackground3,
                  borderColor: tokens.colorPaletteRedBorder2,
                  color: "white",
                }}
              >
                {deleting ? "删除中..." : "确认删除"}
              </Button>
            </DialogActions>
          </DialogContent>
        </DialogSurface>
      </Dialog>
    </>
  );
};
