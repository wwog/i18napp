import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Input,
  Textarea,
  Checkbox,
  Label,
  makeStyles,
  tokens,
  DialogContent,
} from "@fluentui/react-components";
import { AddRegular } from "@fluentui/react-icons";
import { projectService, CreateProjectData } from "../db/projects";
import { languageService, SupportedLanguage } from "../db/languages";

interface CreateProjectDialogProps {
  onProjectCreated: () => void;
}

const useStyles = makeStyles({
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "12px",
    marginBottom: "12px",
  },
  field: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    "& > :first-child": {
      width: "70px",
      flexShrink: 0,
    },
  },
  languageList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: "2px 6px",
  },
  language: {
    display: "flex",
    alignItems: "center",
    gap: "0px",
    fontSize: "12px",
    cursor: "pointer",
    userSelect: "none",

    "& img": {
      width: "28px",
      height: "28px",
      borderRadius: "8px",
      userSelect: "none",
      pointerEvents: "none",
    },
  },
  languageDesc: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
  },
  languageCount: {
    marginTop: "12px",
  },
});

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  onProjectCreated,
}) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    selectedLanguages: [] as string[],
  });
  const [availableLanguages, setAvailableLanguages] = useState<
    SupportedLanguage[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 加载可用语言
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      loadLanguages();
    }
  }, [isOpen]);

  const loadLanguages = async () => {
    try {
      const languages = await languageService.getAllActiveLanguages();
      setAvailableLanguages(languages);
    } catch (error) {
      console.error("加载语言失败:", error);
      setError("加载语言列表失败");
    }
  };

  const handleLanguageChange = (languageCode: string, checked: boolean) => {
    console.log("handleLanguageChange", languageCode, checked);
    setFormData((prev) => ({
      ...prev,
      selectedLanguages: checked
        ? [...prev.selectedLanguages, languageCode]
        : prev.selectedLanguages.filter((code) => code !== languageCode),
    }));
  };

  const handleSubmit = async () => {
    setError("");

    // 验证表单
    if (!formData.name.trim()) {
      setError("项目名称不能为空");
      return;
    }

    if (formData.selectedLanguages.length === 0) {
      setError("请至少选择一种语言");
      return;
    }

    setLoading(true);
    try {
      const projectData: CreateProjectData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        selected_languages: formData.selectedLanguages,
      };

      const newProjectId = await projectService.createProject(projectData);

      setIsOpen(false);
      setCurrentStep(1);
      setFormData({
        name: "",
        description: "",
        selectedLanguages: [],
      });
      onProjectCreated();

      // 导航到项目开发页面
      navigate(`/project/${newProjectId}`);
    } catch (error) {
      console.error("创建项目失败:", error);
      setError("创建项目失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCurrentStep(1);
    setFormData({
      name: "",
      description: "",
      selectedLanguages: [],
    });
    setError("");
    setIsOpen(false);
  };

  const handleNext = () => {
    setError("");

    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setError("项目名称不能为空");
        return;
      }
      setCurrentStep(2);
    }
  };

  const handlePrevious = () => {
    setError("");
    setCurrentStep(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => setIsOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            cursor: "pointer",
            width: "100%",
            height: "100%",
            minHeight: "120px",
          }}
        >
          <AddRegular
            style={{ fontSize: "48px", color: tokens.colorBrandBackground }}
          />
          <span style={{ fontSize: "16px", fontWeight: 500 }}>新建项目</span>
        </div>
      </DialogTrigger>

      <DialogSurface>
        <DialogTitle>创建新项目</DialogTitle>

        <DialogBody>
          <DialogContent>
            <div>
              {currentStep === 1 && (
                <div className={classes.fieldGroup}>
                  <div className={classes.field}>
                    <Label required>项目名称</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="输入项目名称"
                      size="large"
                    />
                  </div>

                  <div className={classes.field}>
                    <Label>项目描述</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="输入项目描述,例如项目的变量规范（可选）"
                      rows={4}
                      resize="none"
                      style={{
                        width: "100%",
                      }}
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <div>选择支持的语言</div>

                  <div className={classes.languageList}>
                    {availableLanguages.map((language) => {
                      const isSelected = formData.selectedLanguages.includes(
                        language.code
                      );
                      return (
                        <div
                          className={classes.language}
                          key={language.code}
                          onClick={() =>
                            handleLanguageChange(language.code, !isSelected)
                          }
                        >
                          <Checkbox checked={isSelected} />
                          <div className={classes.languageDesc}>
                            {language.icon && (
                              <img
                                src={`/countries/${language.icon}.svg`}
                                alt={language.name}
                              />
                            )}
                            <span>{language.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className={classes.languageCount}>
                    已选择 {formData.selectedLanguages.length} 种语言
                  </div>
                </div>
              )}
            </div>
            {error && (
              <div style={{ color: tokens.colorPaletteRedForeground1 }}>
                {error}
              </div>
            )}
          </DialogContent>

          <DialogActions>
            <Button appearance="secondary" onClick={handleCancel}>
              取消
            </Button>

            <div style={{ flex: 1 }} />

            {currentStep === 2 && (
              <Button appearance="secondary" onClick={handlePrevious}>
                上一步
              </Button>
            )}

            {currentStep === 1 ? (
              <Button appearance="primary" onClick={handleNext}>
                下一步
              </Button>
            ) : (
              <Button
                appearance="primary"
                onClick={handleSubmit}
                disabled={loading || formData.selectedLanguages.length === 0}
              >
                {loading ? "创建中..." : "创建项目"}
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
