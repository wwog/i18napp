import { Project } from "../db/projects";
import { SupportedLanguage } from "../db/languages";
import { openSaveDialog, openDirectoryDialog, fs } from "./file";

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
