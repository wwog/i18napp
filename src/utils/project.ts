import { Project, projectService } from '../db/projects';
import { SupportedLanguage, languageService } from '../db/languages';
import { translationService, SortConfig, SortOption } from '../db/translations';
import { TranslationItem } from './translation';

/**
 * 项目数据管理工具类
 */
export class ProjectDataManager {
  /**
   * 加载完整的项目数据（项目信息、语言、翻译数据）
   */
  static async loadCompleteProjectData(
    projectId: number,
    sortConfig: SortConfig = { sortBy: SortOption.TIME_DESC }
  ): Promise<{
    project: Project;
    languages: SupportedLanguage[];
    translations: TranslationItem[];
  }> {
    // 加载项目信息
    const project = await projectService.getProjectById(projectId);
    if (!project) {
      throw new Error(`项目 ID ${projectId} 不存在`);
    }

    // 加载项目支持的语言
    const allLanguages = await languageService.getAllActiveLanguages();
    const languages = allLanguages.filter((lang) =>
      project.selected_languages.includes(lang.code)
    );

    // 加载翻译数据
    const translations = await this.loadTranslationData(projectId, languages.map(lang => lang.code), sortConfig);

    return { project, languages, translations };
  }

  /**
   * 从数据库加载翻译数据
   */
  static async loadTranslationData(
    projectId: number, 
    languageCodes: string[], 
    sortConfig?: SortConfig
  ): Promise<TranslationItem[]> {
    // 获取项目翻译分组数据，传递排序配置
    const translationGroups = await translationService.getProjectTranslations(
      projectId, 
      sortConfig || { sortBy: SortOption.TIME_DESC }
    );
    
    // 将分组数据转换为UI需要的格式
    const formattedTranslations: TranslationItem[] = translationGroups.map(group => {
      const item: TranslationItem = {
        id: group.key, // 使用key作为id
        key: group.key
      };
      
      // 为每个语言设置翻译值
      languageCodes.forEach(langCode => {
        const translation = group.translations.find(t => t.language === langCode);
        item[langCode] = translation?.value || '';
      });
      
      return item;
    });
    
    return formattedTranslations;
  }

  /**
   * 重新加载翻译数据（用于排序变更后的重新加载）
   */
  static async reloadTranslationData(
    projectId: number,
    languageCodes: string[],
    sortConfig: SortConfig
  ): Promise<TranslationItem[]> {
    return this.loadTranslationData(projectId, languageCodes, sortConfig);
  }
}

/**
 * 翻译操作管理器
 * 处理翻译相关的复合操作
 */
export class TranslationOperationManager {
  /**
   * 批量创建翻译
   */
  static async createTranslation(
    projectId: number,
    key: string,
    languageCodes: string[]
  ): Promise<void> {
    // 准备批量创建翻译的数据
    const translations = languageCodes.map(langCode => ({
      language: langCode,
      value: '',
      is_completed: false
    }));
    
    // 保存到数据库
    await translationService.bulkCreateTranslations({
      project_id: projectId,
      key: key.trim(),
      translations: translations
    });
  }

  /**
   * 更新单个翻译
   */
  static async updateTranslation(
    projectId: number,
    key: string,
    languageCode: string,
    value: string
  ): Promise<void> {
    const is_completed = value.trim() !== '';
    
    // 更新数据库
    await translationService.updateTranslation(
      projectId,
      key,
      languageCode,
      value,
      is_completed
    );
  }

  /**
   * 批量删除翻译
   */
  static async deleteTranslations(
    projectId: number,
    keys: string[]
  ): Promise<void> {
    // 批量删除
    for (const key of keys) {
      await translationService.deleteTranslationKey(projectId, key);
    }
  }

  /**
   * 导出项目翻译数据
   */
  static async exportProjectTranslations(
    project: Project,
    languages: SupportedLanguage[]
  ): Promise<any> {
    // 使用翻译服务导出数据
    const translationsData = await translationService.exportProjectTranslations(project.id);
    
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
      translations: translationsData,
      exportTime: new Date().toISOString(),
    };

    return exportData;
  }
}