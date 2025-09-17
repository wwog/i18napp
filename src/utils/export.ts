import { Project, projectService } from "../db/projects";
import { SupportedLanguage, languageService } from "../db/languages";
import { translationService } from "../db/translations";
import { openSaveDialog, openDirectoryDialog, openFileDialog, fs } from "./file";

/**
 * 导出数据的类型定义
 */
export interface ExportData {
  project: {
    id: number;
    name: string;
    description: string | null;
  };
  languages: {
    code: string;
    name: string;
  }[];
  translations: any; // 从数据库服务获取的翻译数据
  exportTime: string;
}

/**
 * 文件导出工具类
 */
export class FileExportManager {
  /**
   * 生成导出文件名
   */
  static generateFileName(
    projectName: string,
    format: string = "json",
    suffix?: string
  ): string {
    const date = new Date().toISOString().split("T")[0];
    const safeName = projectName.replace(/[^\w\-_]/g, "_"); // 移除非文件名安全字符
    const suffixPart = suffix ? `_${suffix}` : "";
    return `${safeName}_translations${suffixPart}_${date}.${format}`;
  }

  /**
   * 使用Tauri保存JSON文件
   */
  static async saveJsonFile(
    data: any,
    defaultFileName: string,
    title: string = "导出JSON文件"
  ): Promise<boolean> {
    try {
      const filePath = await openSaveDialog({
        title,
        defaultPath: defaultFileName,
        filters: [
          {
            name: "JSON文件",
            extensions: ["json"],
          },
        ],
      });

      if (!filePath) {
        return false; // 用户取消
      }

      await fs.writeTextFile(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error("保存JSON文件失败:", error);
      throw error;
    }
  }

  /**
   * 使用Tauri保存CSV文件
   */
  static async saveCsvFile(
    csvContent: string,
    defaultFileName: string,
    title: string = "导出CSV文件"
  ): Promise<boolean> {
    try {
      const filePath = await openSaveDialog({
        title,
        defaultPath: defaultFileName,
        filters: [
          {
            name: "CSV文件",
            extensions: ["csv"],
          },
        ],
      });

      if (!filePath) {
        return false; // 用户取消
      }

      await fs.writeTextFile(filePath, csvContent);
      return true;
    } catch (error) {
      console.error("保存CSV文件失败:", error);
      throw error;
    }
  }

  /**
   * 将导出数据转换为CSV格式
   */
  static convertToCSV(data: ExportData): string {
    const headers = ["Key", ...data.languages.map((lang) => lang.code)];
    const csvRows = [headers.join(",")];

    // 数据库返回的是 { [key: string]: { [language: string]: string } } 格式
    if (data.translations && typeof data.translations === 'object') {
      Object.keys(data.translations).forEach((key: string) => {
        const translationData = data.translations[key];
        const row = [
          `"${key.replace(/"/g, '""')}"`, // 转义CSV中的双引号
          ...data.languages.map(
            (lang) => `"${(translationData[lang.code] || "").replace(/"/g, '""')}"`
          ),
        ];
        csvRows.push(row.join(","));
      });
    }

    return "\uFEFF" + csvRows.join("\n"); // 添加BOM以支持中文
  }

  /**
   * 生成单语言JSON数据
   */
  static generateSingleLanguageJson(
    data: ExportData,
    languageCode: string
  ): any {
    const result: { [key: string]: string } = {};

    // 数据库返回的是 { [key: string]: { [language: string]: string } } 格式
    if (data.translations && typeof data.translations === 'object') {
      Object.keys(data.translations).forEach((key: string) => {
        const translationData = data.translations[key];
        if (translationData[languageCode]) {
          result[key] = translationData[languageCode];
        }
      });
    }

    return result;
  }
}

/**
 * 翻译数据导出管理器
 * 专门处理翻译项目的导出逻辑
 */
export class TranslationExportManager {
  /**
   * 创建标准的翻译导出数据
   */
  static createExportData(
    project: Project,
    languages: SupportedLanguage[],
    translationsData: any
  ): ExportData {
    return {
      project: {
        id: project.id,
        name: project.name,
        description: project.description || null,
      },
      languages: languages.map((lang) => ({
        code: lang.code,
        name: lang.name,
      })),
      translations: translationsData,
      exportTime: new Date().toISOString(),
    };
  }

  /**
   * 导出为完整项目JSON格式
   */
  static async exportProjectAsJson(
    project: Project,
    languages: SupportedLanguage[],
    translationsData: any
  ): Promise<boolean> {
    const exportData = this.createExportData(
      project,
      languages,
      translationsData
    );
    const fileName = FileExportManager.generateFileName(project.name, "json");
    return await FileExportManager.saveJsonFile(
      exportData,
      fileName,
      "导出项目翻译"
    );
  }

  /**
   * 导出为CSV格式
   */
  static async exportAsCsv(
    project: Project,
    languages: SupportedLanguage[],
    translationsData: any
  ): Promise<boolean> {
    const exportData = this.createExportData(
      project,
      languages,
      translationsData
    );
    const csvContent = FileExportManager.convertToCSV(exportData);
    const fileName = FileExportManager.generateFileName(project.name, "csv");
    return await FileExportManager.saveCsvFile(
      csvContent,
      fileName,
      "导出CSV翻译表"
    );
  }

  /**
   * 导出单语言JSON文件
   */
  static async exportSingleLanguageJson(
    project: Project,
    language: SupportedLanguage,
    translationsData: any
  ): Promise<boolean> {
    const exportData = this.createExportData(
      project,
      [language],
      translationsData
    );
    const languageJson = FileExportManager.generateSingleLanguageJson(
      exportData,
      language.code
    );
    const fileName = FileExportManager.generateFileName(
      project.name,
      "json",
      language.code
    );
    return await FileExportManager.saveJsonFile(
      languageJson,
      fileName,
      `导出${language.name}翻译`
    );
  }

  /**
   * 批量导出所有语言的单独 JSON 文件
   */
  static async exportAllLanguagesAsJson(
    project: Project,
    languages: SupportedLanguage[],
    translationsData: any
  ): Promise<{ success: number; failed: number }> {
    // 选择目录
    const selectedDirectory = await openDirectoryDialog({
      title: '选择导出目录'
    });

    if (!selectedDirectory) {
      return { success: 0, failed: 0 }; // 用户取消
    }

    let success = 0;
    let failed = 0;
    
    const exportData = this.createExportData(
      project,
      languages,
      translationsData
    );

    for (const language of languages) {
      try {
        const languageJson = FileExportManager.generateSingleLanguageJson(
          exportData,
          language.code
        );
        const fileName = FileExportManager.generateFileName(
          project.name,
          "json",
          language.code
        );
        const filePath = `${selectedDirectory}/${fileName}`;
        
        await fs.writeTextFile(filePath, JSON.stringify(languageJson, null, 2));
        success++;
      } catch (error) {
        console.error(`导出${language.name}失败:`, error);
        failed++;
      }
    }
    
    return { success, failed };
  }

  /**
   * 创建导出选项
   */
  static createExportOptions(
    project: Project,
    languages: SupportedLanguage[],
    translationsData: any
  ): {
    projectJson: () => Promise<boolean>;
    csv: () => Promise<boolean>;
    allLanguagesJson: () => Promise<{ success: number; failed: number }>;
    singleLanguageJson: (language: SupportedLanguage) => Promise<boolean>;
  } {
    return {
      projectJson: () =>
        this.exportProjectAsJson(project, languages, translationsData),
      csv: () => this.exportAsCsv(project, languages, translationsData),
      allLanguagesJson: () =>
        this.exportAllLanguagesAsJson(project, languages, translationsData),
      singleLanguageJson: (language: SupportedLanguage) =>
        this.exportSingleLanguageJson(project, language, translationsData),
    };
  }
}

/**
 * 导出状态管理器
 */
export class ExportStateManager {
  private static exportHistory: {
    projectId: number;
    format: string;
    timestamp: string;
    fileName: string;
  }[] = [];

  /**
   * 记录导出历史
   */
  static recordExport(
    projectId: number,
    format: string,
    fileName: string
  ): void {
    this.exportHistory.push({
      projectId,
      format,
      timestamp: new Date().toISOString(),
      fileName,
    });

    // 只保留最近的100条记录
    if (this.exportHistory.length > 100) {
      this.exportHistory = this.exportHistory.slice(-100);
    }
  }

  /**
   * 获取项目的导出历史
   */
  static getProjectExportHistory(
    projectId: number
  ): typeof ExportStateManager.exportHistory {
    return this.exportHistory.filter(
      (record) => record.projectId === projectId
    );
  }

  /**
   * 清除导出历史
   */
  static clearHistory(): void {
    this.exportHistory = [];
  }

  /**
   * 获取最近的导出记录
   */
  static getRecentExports(
    limit: number = 10
  ): typeof ExportStateManager.exportHistory {
    return this.exportHistory.slice(-limit).reverse();
  }
}

/**
 * 翻译数据导入管理器
 * 专门处理翻译项目的导入逻辑
 */
export class TranslationImportManager {
  /**
   * 解析CSV文件内容
   */
  static parseCsvContent(csvContent: string): { [key: string]: { [language: string]: string } } {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('无效的CSV文件格式');
    }

    // 解析标题行
    const headerLine = lines[0];
    const headers = this.parseCsvLine(headerLine);
    
    if (headers[0] !== 'Key') {
      throw new Error('CSV文件的第一列必须是"Key"');
    }

    const languageCodes = headers.slice(1); // 除去"Key"列的其他列作为语言代码
    const result: { [key: string]: { [language: string]: string } } = {};

    // 解析数据行
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCsvLine(line);
      if (values.length < 2) continue; // 跳过无效行

      const key = values[0];
      if (!key) continue; // 跳过空键

      result[key] = {};
      
      // 为每种语言设置翻译值
      languageCodes.forEach((langCode, index) => {
        const value = values[index + 1] || ''; // +1因为第0列是Key
        result[key][langCode] = value;
      });
    }

    return result;
  }

  /**
   * 解析CSV行（处理引号和逗号）
   */
  static parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          // 双引号转义
          current += '"';
          i += 2;
        } else {
          // 开始或结束引号
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // 分隔符
        result.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    result.push(current);
    return result;
  }

  /**
   * 解析JSON文件内容
   */
  static parseJsonContent(jsonContent: string): { [key: string]: { [language: string]: string } } {
    try {
      const data = JSON.parse(jsonContent);
      
      // 检查是否是完整项目导出格式
      if (data.project && data.translations && data.languages) {
        return data.translations;
      }
      
      // 检查是否是简单的键值对格式（单语言JSON）
      if (typeof data === 'object' && !Array.isArray(data)) {
        // 对于单语言JSON，需要用户指定语言代码
        throw new Error('单语言JSON文件需要通过其他方式导入');
      }
      
      throw new Error('无法识别JSON文件格式');
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('无效的JSON文件格式');
      }
      throw error;
    }
  }

  /**
   * 从文件导入翻译数据
   */
  static async importFromFile(): Promise<{ [key: string]: { [language: string]: string } } | null> {
    try {
      const filePath = await openFileDialog({
        title: '选择要导入的翻译文件',
        filters: [
          {
            name: '翻译文件',
            extensions: ['json', 'csv']
          },
          {
            name: 'JSON文件',
            extensions: ['json']
          },
          {
            name: 'CSV文件',
            extensions: ['csv']
          }
        ]
      });

      if (!filePath) {
        return null; // 用户取消
      }

      const fileContent = await fs.readTextFile(filePath as string);
      const fileName = (filePath as string).toLowerCase();

      if (fileName.endsWith('.csv')) {
        return this.parseCsvContent(fileContent);
      } else if (fileName.endsWith('.json')) {
        // 存储完整的JSON数据以供extractProjectInfo使用
        const jsonData = JSON.parse(fileContent);
        this._lastImportedJsonData = jsonData; // 临时存储完整数据
        return this.parseJsonContent(fileContent);
      } else {
        throw new Error('不支持的文件格式');
      }
    } catch (error) {
      console.error('导入文件失败:', error);
      throw error;
    }
  }

  // 临时存储完整JSON数据的静态属性
  private static _lastImportedJsonData: any = null;

  /**
   * 将翻译数据导入到项目中
   */
  static async importToProject(
    projectId: number,
    translationData: { [key: string]: { [language: string]: string } }
  ): Promise<void> {
    if (!translationData || Object.keys(translationData).length === 0) {
      throw new Error('没有可导入的翻译数据');
    }

    try {
      await translationService.importTranslations(projectId, translationData);
    } catch (error) {
      console.error('导入到数据库失败:', error);
      throw new Error('导入翻译数据失败');
    }
  }

  /**
   * 从导出数据中提取项目信息
   */
  static extractProjectInfo(data: any): {
    name: string;
    description?: string;
    languages: string[];
  } {
    // 如果有存储的完整JSON数据，优先使用它
    const fullData = this._lastImportedJsonData || data;
    
    if (fullData.project && fullData.languages) {
      // 完整项目导出格式
      return {
        name: fullData.project.name || '导入的项目',
        description: fullData.project.description,
        languages: fullData.languages.map((lang: any) => lang.code)
      };
    } else if (data && typeof data === 'object') {
      // 简单的翻译数据格式，需要从数据中推断语言
      const languages = new Set<string>();
      Object.values(data).forEach((translations: any) => {
        if (typeof translations === 'object') {
          Object.keys(translations).forEach(lang => languages.add(lang));
        }
      });
      
      return {
        name: '导入的项目',
        description: undefined,
        languages: Array.from(languages)
      };
    }
    
    throw new Error('无法从数据中提取项目信息');
  }

  /**
   * 检查项目名称是否冲突
   */
  static async checkProjectNameConflict(projectName: string): Promise<Project | null> {
    try {
      const projects = await projectService.getAllProjects();
      return projects.find(p => p.name === projectName) || null;
    } catch (error) {
      console.error('检查项目名称冲突失败:', error);
      return null;
    }
  }

  /**
   * 创建新项目并导入翻译数据
   */
  static async createProjectFromImport(
    projectInfo: { name: string; description?: string; languages: string[] },
    translationData: { [key: string]: { [language: string]: string } },
    overwriteExisting: boolean = false
  ): Promise<Project> {
    try {
      // 检查名称冲突
      const existingProject = await this.checkProjectNameConflict(projectInfo.name);
      
      if (existingProject && !overwriteExisting) {
        throw new Error(`项目名称 "${projectInfo.name}" 已存在`);
      }

      // 如果需要覆盖，先删除旧项目
      if (existingProject && overwriteExisting) {
        await projectService.deleteProject(existingProject.id);
      }

      // 检查语言是否存在
      const availableLanguages = await languageService.getAllActiveLanguages();
      const availableLanguageCodes = availableLanguages.map(lang => lang.code);
      
      const validLanguages = projectInfo.languages.filter(lang => 
        availableLanguageCodes.includes(lang)
      );
      
      if (validLanguages.length === 0) {
        throw new Error('没有找到有效的语言');
      }

      // 创建项目
      const projectId = await projectService.createProject({
        name: projectInfo.name,
        description: projectInfo.description,
        selected_languages: validLanguages
      });

      // 导入翻译数据
      await translationService.importTranslations(projectId, translationData);

      // 返回创建的项目
      const createdProject = await projectService.getProjectById(projectId);
      if (!createdProject) {
        throw new Error('创建项目失败');
      }

      return createdProject;
    } catch (error) {
      console.error('创建项目失败:', error);
      throw error;
    }
  }

  /**
   * 完整的项目导入流程
   */
  static async importProject(): Promise<{
    success: boolean;
    project?: Project;
    needsOverwriteConfirmation?: boolean;
    conflictingProject?: Project;
    projectInfo?: { name: string; description?: string; languages: string[] };
    translationData?: { [key: string]: { [language: string]: string } };
    message: string;
  }> {
    try {
      // 第一步：选择并解析文件
      const fileData = await this.importFromFile();
      
      if (!fileData) {
        this._lastImportedJsonData = null; // 清理临时数据
        return {
          success: false,
          message: '用户取消了导入操作'
        };
      }

      // 第二步：提取项目信息
      const projectInfo = this.extractProjectInfo(fileData);
      
      // 第三步：检查名称冲突
      const conflictingProject = await this.checkProjectNameConflict(projectInfo.name);
      
      if (conflictingProject) {
        return {
          success: false,
          needsOverwriteConfirmation: true,
          conflictingProject,
          projectInfo,
          translationData: fileData,
          message: `项目名称 "${projectInfo.name}" 已存在，是否覆盖？`
        };
      }

      // 第四步：直接创建项目
      const createdProject = await this.createProjectFromImport(
        projectInfo,
        fileData,
        false
      );

      this._lastImportedJsonData = null; // 清理临时数据

      return {
        success: true,
        project: createdProject,
        message: `成功导入项目 "${createdProject.name}"，包含 ${Object.keys(fileData).length} 个翻译键`
      };
    } catch (error) {
      console.error('导入项目失败:', error);
      this._lastImportedJsonData = null; // 清理临时数据
      return {
        success: false,
        message: error instanceof Error ? error.message : '导入失败'
      };
    }
  }

  /**
   * 确认覆盖并完成导入
   */
  static async confirmOverwriteAndImport(
    projectInfo: { name: string; description?: string; languages: string[] },
    translationData: { [key: string]: { [language: string]: string } }
  ): Promise<{
    success: boolean;
    project?: Project;
    message: string;
  }> {
    try {
      const createdProject = await this.createProjectFromImport(
        projectInfo,
        translationData,
        true // 允许覆盖
      );

      this._lastImportedJsonData = null; // 清理临时数据

      return {
        success: true,
        project: createdProject,
        message: `成功覆盖并导入项目 "${createdProject.name}"，包含 ${Object.keys(translationData).length} 个翻译键`
      };
    } catch (error) {
      console.error('覆盖导入失败:', error);
      this._lastImportedJsonData = null; // 清理临时数据
      return {
        success: false,
        message: error instanceof Error ? error.message : '覆盖导入失败'
      };
    }
  }
}
