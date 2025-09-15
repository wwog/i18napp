/**
 * 翻译项接口
 */
export interface TranslationItem {
  id: string;
  key: string;
  [languageCode: string]: string; // 动态语言字段
}

/**
 * 语言进度统计
 */
export interface LanguageProgress {
  overall: number;
  byLanguage: { [languageCode: string]: number };
}

/**
 * 翻译进度计算工具类
 */
export class TranslationProgressCalculator {
  /**
   * 计算翻译进度
   * @param translations 翻译项数组
   * @param languageCodes 语言代码数组
   * @returns 进度统计对象
   */
  static calculate(translations: TranslationItem[], languageCodes: string[]): LanguageProgress {
    if (translations.length === 0) {
      return { overall: 0, byLanguage: {} };
    }

    const progressByLanguage: { [key: string]: number } = {};

    // 计算各语言进度
    languageCodes.forEach(langCode => {
      const completed = translations.filter(item => 
        item[langCode] && item[langCode].trim() !== ''
      ).length;
      progressByLanguage[langCode] = Math.round((completed / translations.length) * 100);
    });

    // 计算整体进度：所有语言都有翻译的key数量 / 总key数量
    const fullyTranslatedCount = translations.filter(item => 
      languageCodes.every(langCode => item[langCode] && item[langCode].trim() !== '')
    ).length;
    const overallProgress = Math.round((fullyTranslatedCount / translations.length) * 100);

    return { overall: overallProgress, byLanguage: progressByLanguage };
  }

  /**
   * 获取未完成的翻译项
   * @param translations 翻译项数组
   * @param languageCodes 语言代码数组
   * @returns 未完成的翻译项数组
   */
  static getIncompleteItems(translations: TranslationItem[], languageCodes: string[]): TranslationItem[] {
    return translations.filter(item => 
      !languageCodes.every(langCode => item[langCode] && item[langCode].trim() !== '')
    );
  }

  /**
   * 检查翻译项是否完成
   * @param item 翻译项
   * @param languageCodes 语言代码数组
   * @returns 是否完成
   */
  static isItemComplete(item: TranslationItem, languageCodes: string[]): boolean {
    return languageCodes.every(langCode => item[langCode] && item[langCode].trim() !== '');
  }

  /**
   * 获取语言完成度统计
   * @param translations 翻译项数组
   * @param languageCode 语言代码
   * @returns 完成度统计 { completed: number, total: number, percentage: number }
   */
  static getLanguageStats(translations: TranslationItem[], languageCode: string) {
    const total = translations.length;
    const completed = translations.filter(item => 
      item[languageCode] && item[languageCode].trim() !== ''
    ).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }
}

/**
 * 翻译搜索工具类
 */
export class TranslationSearchUtils {
  /**
   * 搜索翻译项
   * @param translations 翻译项数组
   * @param searchTerm 搜索词
   * @param languageCodes 语言代码数组
   * @returns 过滤后的翻译项数组
   */
  static filter(translations: TranslationItem[], searchTerm: string, languageCodes: string[]): TranslationItem[] {
    if (!searchTerm.trim()) {
      return translations;
    }

    const lowercaseSearchTerm = searchTerm.toLowerCase();

    return translations.filter(item => {
      // 搜索翻译键
      if (item.key.toLowerCase().includes(lowercaseSearchTerm)) {
        return true;
      }

      // 搜索各语言翻译内容
      return languageCodes.some(langCode => 
        item[langCode]?.toLowerCase().includes(lowercaseSearchTerm)
      );
    });
  }

  /**
   * 高亮搜索结果
   * @param text 原文本
   * @param searchTerm 搜索词
   * @returns 高亮后的文本（HTML字符串）
   */
  static highlight(text: string, searchTerm: string): string {
    if (!searchTerm.trim()) {
      return text;
    }

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}

/**
 * 翻译数据工具类
 */
export class TranslationDataUtils {
  /**
   * 创建新的翻译项
   * @param key 翻译键
   * @param languageCodes 语言代码数组
   * @returns 新的翻译项
   */
  static createNewItem(key: string, languageCodes: string[]): TranslationItem {
    const newItem: TranslationItem = {
      id: Date.now().toString(),
      key: key.trim(),
    };

    // 为每种语言初始化空字符串
    languageCodes.forEach(langCode => {
      newItem[langCode] = '';
    });

    return newItem;
  }

  /**
   * 更新翻译项的语言内容
   * @param translations 翻译项数组
   * @param itemId 翻译项ID
   * @param languageCode 语言代码
   * @param value 新值
   * @returns 更新后的翻译项数组
   */
  static updateTranslation(
    translations: TranslationItem[], 
    itemId: string, 
    languageCode: string, 
    value: string
  ): TranslationItem[] {
    return translations.map(item =>
      item.id === itemId ? { ...item, [languageCode]: value } : item
    );
  }

  /**
   * 删除翻译项
   * @param translations 翻译项数组
   * @param itemId 翻译项ID
   * @returns 删除后的翻译项数组
   */
  static deleteItem(translations: TranslationItem[], itemId: string): TranslationItem[] {
    return translations.filter(item => item.id !== itemId);
  }

  /**
   * 获取所有翻译键
   * @param translations 翻译项数组
   * @returns 翻译键数组
   */
  static getAllKeys(translations: TranslationItem[]): string[] {
    return translations.map(item => item.key);
  }

  /**
   * 按键排序翻译项
   * @param translations 翻译项数组
   * @param ascending 是否升序（默认true）
   * @returns 排序后的翻译项数组
   */
  static sortByKey(translations: TranslationItem[], ascending: boolean = true): TranslationItem[] {
    return [...translations].sort((a, b) => {
      const comparison = a.key.localeCompare(b.key);
      return ascending ? comparison : -comparison;
    });
  }
}