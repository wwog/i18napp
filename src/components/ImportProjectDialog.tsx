import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Toast,
  ToastTitle,
  useToastController,
  Text,
  Spinner,
} from "@fluentui/react-components";
import { DocumentRegular } from "@fluentui/react-icons";
import { Project } from "../db/projects";
import { TranslationImportManager } from "../utils/export";

interface ImportProjectDialogProps {
  onProjectCreated?: (project: Project) => void;
}

export const ImportProjectDialog: React.FC<ImportProjectDialogProps> = ({
  onProjectCreated,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [overwriteDialog, setOverwriteDialog] = useState<{
    show: boolean;
    projectInfo?: any;
    translationData?: any;
    conflictingProject?: Project;
  }>({ show: false });
  const { dispatchToast } = useToastController();

  const handleImport = async () => {
    setIsImporting(true);

    try {
      const result = await TranslationImportManager.importProject();

      if (result.success && result.project) {
        // 导入成功
        dispatchToast(
          <Toast>
            <ToastTitle>{result.message}</ToastTitle>
          </Toast>,
          { intent: "success" }
        );

        if (onProjectCreated) {
          onProjectCreated(result.project);
        }

        setIsDialogOpen(false);
      } else if (result.needsOverwriteConfirmation) {
        // 需要用户确认覆盖
        setOverwriteDialog({
          show: true,
          projectInfo: result.projectInfo,
          translationData: result.translationData,
          conflictingProject: result.conflictingProject,
        });
        setIsImporting(false);
      } else {
        // 导入失败或取消
        if (result.message !== "用户取消了导入操作") {
          dispatchToast(
            <Toast>
              <ToastTitle>{result.message}</ToastTitle>
            </Toast>,
            { intent: "error" }
          );
        }
        setIsImporting(false);
      }
    } catch (error) {
      console.error("导入失败:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>导入失败</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      setIsImporting(false);
    }
  };

  const handleConfirmOverwrite = async () => {
    if (!overwriteDialog.projectInfo || !overwriteDialog.translationData) {
      return;
    }

    setIsImporting(true);

    try {
      const result = await TranslationImportManager.confirmOverwriteAndImport(
        overwriteDialog.projectInfo,
        overwriteDialog.translationData
      );

      if (result.success && result.project) {
        dispatchToast(
          <Toast>
            <ToastTitle>{result.message}</ToastTitle>
          </Toast>,
          { intent: "success" }
        );

        if (onProjectCreated) {
          onProjectCreated(result.project);
        }

        setIsDialogOpen(false);
        setOverwriteDialog({ show: false });
      } else {
        dispatchToast(
          <Toast>
            <ToastTitle>{result.message}</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      }
    } catch (error) {
      console.error("覆盖导入失败:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>覆盖导入失败</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancelOverwrite = () => {
    setOverwriteDialog({ show: false });
    setIsImporting(false);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setOverwriteDialog({ show: false });
    setIsImporting(false);
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
        <DialogTrigger disableButtonEnhancement>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              width: "100%",
              height: "100%",
              minHeight: "120px",
              cursor: "pointer",
            }}
          >
            <DocumentRegular style={{ fontSize: "48px", color: "#0078d4" }} />
            <span style={{ fontSize: "16px", fontWeight: 500 }}>导入项目</span>
          </div>
        </DialogTrigger>

        <DialogSurface>
          <DialogTitle>导入项目</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <Text>
                  选择要导入的翻译文件，系统将自动创建新项目。
                </Text>
                
                <Text size={200} style={{ color: "#6b7280" }}>
                  支持导入 JSON 和 CSV 格式的翻译文件：
                  <br />
                  • CSV 格式：第一列为 Key，其他列为语言代码
                  <br />
                  • JSON 格式：支持完整项目导出格式
                  <br />
                  <br />
                  如果项目名称已存在，将提示您是否覆盖。
                </Text>
              </div>
            </DialogBody>
            <DialogActions>
              <Button appearance="secondary" onClick={handleCancel}>
                取消
              </Button>
              <Button
                appearance="primary"
                onClick={handleImport}
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <Spinner size="tiny" />
                    导入中...
                  </>
                ) : (
                  "选择文件并导入"
                )}
              </Button>
            </DialogActions>
          </DialogContent>
        </DialogSurface>
      </Dialog>

      {/* 覆盖确认对话框 */}
      <Dialog 
        open={overwriteDialog.show} 
        onOpenChange={(_, data) => {
          if (!data.open) {
            handleCancelOverwrite();
          }
        }}
      >
        <DialogSurface>
          <DialogTitle>项目名称冲突</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <Text>
                  项目名称 <strong>"{overwriteDialog.projectInfo?.name}"</strong> 已存在。
                </Text>
                
                <Text size={200} style={{ color: "#6b7280" }}>
                  选择"覆盖"将删除现有项目及其所有数据，并创建新项目。
                  <br />
                  选择"取消"可重新选择文件或修改项目名称。
                </Text>

                {overwriteDialog.conflictingProject && (
                  <div style={{ 
                    padding: "12px", 
                    backgroundColor: "#f9f9f9", 
                    borderRadius: "4px",
                    border: "1px solid #e1e1e1"
                  }}>
                    <Text size={200}>
                      <strong>现有项目信息：</strong>
                      <br />
                      名称：{overwriteDialog.conflictingProject.name}
                      <br />
                      描述：{overwriteDialog.conflictingProject.description || "无"}
                      <br />
                      语言数量：{overwriteDialog.conflictingProject.selected_languages?.length || 0}
                    </Text>
                  </div>
                )}
              </div>
            </DialogBody>
            <DialogActions>
              <Button appearance="secondary" onClick={handleCancelOverwrite}>
                取消
              </Button>
              <Button
                appearance="primary"
                onClick={handleConfirmOverwrite}
                disabled={isImporting}
                style={{ backgroundColor: "#d13438", borderColor: "#d13438" }}
              >
                {isImporting ? (
                  <>
                    <Spinner size="tiny" />
                    覆盖中...
                  </>
                ) : (
                  "确认覆盖"
                )}
              </Button>
            </DialogActions>
          </DialogContent>
        </DialogSurface>
      </Dialog>
    </>
  );
};