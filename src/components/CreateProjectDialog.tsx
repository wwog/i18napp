import React, { useState, useEffect } from 'react';
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
} from '@fluentui/react-components';
import { AddRegular } from '@fluentui/react-icons';
import { projectService, CreateProjectData } from '../db/projects';
import { languageService, SupportedLanguage } from '../db/languages';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  languagesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '8px',
    marginTop: '8px',
  },
  languageItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground2,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: '12px',
  },
});

interface CreateProjectDialogProps {
  onProjectCreated: () => void;
}

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ onProjectCreated }) => {
  const styles = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedLanguages: [] as string[],
  });
  const [availableLanguages, setAvailableLanguages] = useState<SupportedLanguage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 加载可用语言
  useEffect(() => {
    if (isOpen) {
      loadLanguages();
    }
  }, [isOpen]);

  const loadLanguages = async () => {
    try {
      const languages = await languageService.getAllActiveLanguages();
      setAvailableLanguages(languages);
    } catch (error) {
      console.error('加载语言失败:', error);
      setError('加载语言列表失败');
    }
  };

  const handleLanguageChange = (languageCode: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedLanguages: checked
        ? [...prev.selectedLanguages, languageCode]
        : prev.selectedLanguages.filter(code => code !== languageCode),
    }));
  };

  const handleSubmit = async () => {
    setError('');
    
    // 验证表单
    if (!formData.name.trim()) {
      setError('项目名称不能为空');
      return;
    }
    
    if (formData.selectedLanguages.length === 0) {
      setError('请至少选择一种语言');
      return;
    }

    setLoading(true);
    try {
      const projectData: CreateProjectData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        selected_languages: formData.selectedLanguages,
      };

      await projectService.createProject(projectData);
      
      // 重置表单
      setFormData({
        name: '',
        description: '',
        selectedLanguages: [],
      });
      
      setIsOpen(false);
      onProjectCreated();
    } catch (error) {
      console.error('创建项目失败:', error);
      setError('创建项目失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      selectedLanguages: [],
    });
    setError('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => setIsOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '12px',
          cursor: 'pointer' 
        }}>
          <AddRegular style={{ fontSize: '48px', color: tokens.colorBrandBackground }} />
          <span style={{ fontSize: '16px', fontWeight: 500 }}>新建项目</span>
        </div>
      </DialogTrigger>
      
      <DialogSurface style={{ maxWidth: '600px', width: '90vw' }}>
        <DialogTitle>创建新项目</DialogTitle>
        
        <DialogBody>
          <div className={styles.form}>
            {/* 项目名称 */}
            <div className={styles.field}>
              <Label required>项目名称</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入项目名称"
              />
            </div>

            {/* 项目描述 */}
            <div className={styles.field}>
              <Label>项目描述</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="输入项目描述（可选）"
                resize="vertical"
                rows={3}
              />
            </div>

            {/* 语言选择 */}
            <div className={styles.field}>
              <Label required>支持语言</Label>
              <div className={styles.languagesGrid}>
                {availableLanguages.map((language) => (
                  <div key={language.code} className={styles.languageItem}>
                    <Checkbox
                      checked={formData.selectedLanguages.includes(language.code)}
                      onChange={(_, data) => handleLanguageChange(language.code, !!data.checked)}
                      label={language.name}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 错误信息 */}
            {error && (
              <div className={styles.errorText}>
                {error}
              </div>
            )}
          </div>
        </DialogBody>

        <DialogActions>
          <Button appearance="secondary" onClick={handleCancel}>
            取消
          </Button>
          <Button 
            appearance="primary" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '创建中...' : '创建项目'}
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};