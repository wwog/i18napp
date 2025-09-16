import { Project } from '../db/projects';
import { SupportedLanguage } from '../db/languages';

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
  static generateFileName(projectName: string, format: string = 'json'): string {
    const date = new Date().toISOString().split('T')[0];
    const safeName = projectName.replace(/[^\w\-_]/g, '_'); // 移除非文件名安全字符
    return `${safeName}_translations_${date}.${format}`;
  }

  /**
   * 创建并下载JSON文件
   */
  static downloadJsonFile(data: any, fileName: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    
    this.downloadBlob(blob, fileName);
  }

  /**
   * 创建并下载CSV文件
   */
  static downloadCsvFile(data: ExportData): void {
    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    
    const fileName = this.generateFileName(data.project.name, 'csv');
    this.downloadBlob(blob, fileName);
  }

  /**
   * 下载Blob对象
   */
  private static downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // 清理对象URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * 将导出数据转换为CSV格式
   */
  private static convertToCSV(data: ExportData): string {
    const headers = ['Key', ...data.languages.map(lang => lang.name)];
    const csvRows = [headers.join(',')];

    // 假设 translations 是一个对象数组，每个对象包含 key 和各语言的翻译
    if (Array.isArray(data.translations)) {
      data.translations.forEach((translation: any) => {
        const row = [
          `"${translation.key || ''}"`,
          ...data.languages.map(lang => `"${translation[lang.code] || ''}"`)
        ];
        csvRows.push(row.join(','));
      });
    }

    return csvRows.join('\n');
  }

  /**
   * 生成多种格式的导出数据
   */
  static createMultiFormatExport(data: ExportData): {
    json: () => void;
    csv: () => void;
  } {
    return {
      json: () => {
        const fileName = this.generateFileName(data.project.name, 'json');
        this.downloadJsonFile(data, fileName);
      },
      csv: () => {
        this.downloadCsvFile(data);
      }
    };
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
   * 导出为JSON格式
   */
  static exportAsJson(
    project: Project,
    languages: SupportedLanguage[],
    translationsData: any
  ): void {
    const exportData = this.createExportData(project, languages, translationsData);
    const fileName = FileExportManager.generateFileName(project.name, 'json');
    FileExportManager.downloadJsonFile(exportData, fileName);
  }

  /**
   * 导出为CSV格式
   */
  static exportAsCsv(
    project: Project,
    languages: SupportedLanguage[],
    translationsData: any
  ): void {
    const exportData = this.createExportData(project, languages, translationsData);
    FileExportManager.downloadCsvFile(exportData);
  }

  /**
   * 创建导出选项
   */
  static createExportOptions(
    project: Project,
    languages: SupportedLanguage[],
    translationsData: any
  ): {
    json: () => void;
    csv: () => void;
    data: ExportData;
  } {
    const exportData = this.createExportData(project, languages, translationsData);
    
    return {
      json: () => this.exportAsJson(project, languages, translationsData),
      csv: () => this.exportAsCsv(project, languages, translationsData),
      data: exportData
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
      fileName
    });

    // 只保留最近的100条记录
    if (this.exportHistory.length > 100) {
      this.exportHistory = this.exportHistory.slice(-100);
    }
  }

  /**
   * 获取项目的导出历史
   */
  static getProjectExportHistory(projectId: number): typeof ExportStateManager.exportHistory {
    return this.exportHistory.filter(record => record.projectId === projectId);
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
  static getRecentExports(limit: number = 10): typeof ExportStateManager.exportHistory {
    return this.exportHistory.slice(-limit).reverse();
  }
}