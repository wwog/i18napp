/**
 * 验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * 翻译键验证规则
 */
export class TranslationKeyValidator {
  /**
   * 验证翻译键格式
   * @param key 待验证的翻译键
   * @returns 验证结果
   */
  static validate(key: string): ValidationResult {
    if (!key.trim()) {
      return { isValid: false, message: '请输入翻译键' };
    }

    // 检查是否包含空格
    if (/\s/.test(key)) {
      return { isValid: false, message: '翻译键不能包含空格' };
    }

    // 只允许字母、数字、点号和下划线
    if (!/^[a-zA-Z0-9._]+$/.test(key)) {
      return { isValid: false, message: '翻译键只能包含字母、数字、点号和下划线' };
    }

    // 检查是否以数字开头
    if (/^[0-9]/.test(key)) {
      return { isValid: false, message: '翻译键不能以数字开头' };
    }

    // 检查是否有连续的点号或下划线
    if (/[._]{2,}/.test(key)) {
      return { isValid: false, message: '翻译键不能包含连续的点号或下划线' };
    }

    // 检查是否以点号或下划线开头/结尾
    if (/^[._]|[._]$/.test(key)) {
      return { isValid: false, message: '翻译键不能以点号或下划线开头或结尾' };
    }

    return { isValid: true };
  }

  /**
   * 检查翻译键是否重复
   * @param key 待检查的翻译键
   * @param existingKeys 已存在的翻译键数组
   * @param caseSensitive 是否区分大小写（默认true）
   * @returns 验证结果
   */
  static checkDuplicate(key: string, existingKeys: string[], caseSensitive: boolean = true): ValidationResult {
    const trimmedKey = key.trim();
    
    if (caseSensitive) {
      if (existingKeys.includes(trimmedKey)) {
        return { isValid: false, message: '翻译键已存在' };
      }
    } else {
      const lowerKey = trimmedKey.toLowerCase();
      const duplicateFound = existingKeys.some(existingKey => 
        existingKey.toLowerCase() === lowerKey
      );
      if (duplicateFound) {
        return { isValid: false, message: '翻译键已存在（忽略大小写）' };
      }
    }
    
    return { isValid: true };
  }

  /**
   * 检查翻译键是否与现有键相似（可能是拼写错误）
   * @param key 待检查的翻译键
   * @param existingKeys 已存在的翻译键数组
   * @param threshold 相似度阈值（0-1，默认0.8）
   * @returns 验证结果和相似的键
   */
  static checkSimilarity(
    key: string, 
    existingKeys: string[], 
    threshold: number = 0.8
  ): { isValid: boolean; message?: string; similarKeys?: string[] } {
    const trimmedKey = key.trim();
    const similarKeys: string[] = [];
    
    for (const existingKey of existingKeys) {
      const similarity = this.calculateSimilarity(trimmedKey, existingKey);
      if (similarity >= threshold && similarity < 1) {
        similarKeys.push(existingKey);
      }
    }
    
    if (similarKeys.length > 0) {
      return {
        isValid: false,
        message: `翻译键与现有键相似，可能是拼写错误：${similarKeys.join(', ')}`,
        similarKeys
      };
    }
    
    return { isValid: true };
  }

  /**
   * 检查命名空间冲突
   * @param key 待检查的翻译键
   * @param existingKeys 已存在的翻译键数组
   * @returns 验证结果
   */
  static checkNamespaceConflict(key: string, existingKeys: string[]): ValidationResult {
    const trimmedKey = key.trim();
    const conflicts: string[] = [];

    for (const existingKey of existingKeys) {
      // 检查新键是否是现有键的父级命名空间
      if (existingKey.startsWith(trimmedKey + '.')) {
        conflicts.push(existingKey);
      }
      // 检查新键是否是现有键的子级命名空间
      if (trimmedKey.startsWith(existingKey + '.')) {
        conflicts.push(existingKey);
      }
    }

    if (conflicts.length > 0) {
      return {
        isValid: false,
        message: `翻译键与现有命名空间冲突：${conflicts.slice(0, 3).join(', ')}${conflicts.length > 3 ? '...' : ''}`
      };
    }

    return { isValid: true };
  }

  /**
   * 计算两个字符串的相似度（使用Levenshtein距离）
   * @param str1 字符串1
   * @param str2 字符串2
   * @returns 相似度（0-1）
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    // 初始化矩阵
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // 计算编辑距离
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // 删除
          matrix[i][j - 1] + 1,      // 插入
          matrix[i - 1][j - 1] + cost // 替换
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
  }

  /**
   * 综合验证翻译键（格式 + 重复检查 + 相似度检查 + 命名空间冲突检查）
   * @param key 待验证的翻译键
   * @param existingKeys 已存在的翻译键数组
   * @param options 验证选项
   * @returns 验证结果
   */
  static validateComplete(
    key: string, 
    existingKeys: string[] = [],
    options: {
      caseSensitive?: boolean;
      checkSimilarity?: boolean;
      similarityThreshold?: number;
      checkNamespaceConflict?: boolean;
    } = {}
  ): ValidationResult {
    const {
      caseSensitive = true,
      checkSimilarity = false,
      similarityThreshold = 0.8,
      checkNamespaceConflict = true
    } = options;

    // 先验证格式
    const formatValidation = this.validate(key);
    if (!formatValidation.isValid) {
      return formatValidation;
    }

    // 验证重复
    const duplicateValidation = this.checkDuplicate(key, existingKeys, caseSensitive);
    if (!duplicateValidation.isValid) {
      return duplicateValidation;
    }

    // 可选：验证命名空间冲突
    if (checkNamespaceConflict) {
      const namespaceValidation = this.checkNamespaceConflict(key, existingKeys);
      if (!namespaceValidation.isValid) {
        return namespaceValidation;
      }
    }

    // 可选：验证相似度
    if (checkSimilarity) {
      const similarityValidation = this.checkSimilarity(key, existingKeys, similarityThreshold);
      if (!similarityValidation.isValid) {
        return {
          isValid: false,
          message: similarityValidation.message
        };
      }
    }

    return { isValid: true };
  }
}

/**
 * 通用验证工具类
 */
export class CommonValidator {
  /**
   * 验证是否为空字符串
   * @param value 待验证的值
   * @param fieldName 字段名称（用于错误消息）
   * @returns 验证结果
   */
  static required(value: string, fieldName: string = '字段'): ValidationResult {
    if (!value || !value.trim()) {
      return { isValid: false, message: `${fieldName}不能为空` };
    }
    return { isValid: true };
  }

  /**
   * 验证字符串长度
   * @param value 待验证的值
   * @param min 最小长度
   * @param max 最大长度
   * @param fieldName 字段名称
   * @returns 验证结果
   */
  static length(value: string, min: number = 0, max: number = Infinity, fieldName: string = '字段'): ValidationResult {
    const length = value.trim().length;
    
    if (length < min) {
      return { isValid: false, message: `${fieldName}长度不能少于${min}个字符` };
    }
    
    if (length > max) {
      return { isValid: false, message: `${fieldName}长度不能超过${max}个字符` };
    }
    
    return { isValid: true };
  }

  /**
   * 验证正则表达式
   * @param value 待验证的值
   * @param pattern 正则表达式
   * @param message 错误消息
   * @returns 验证结果
   */
  static pattern(value: string, pattern: RegExp, message: string): ValidationResult {
    if (!pattern.test(value)) {
      return { isValid: false, message };
    }
    return { isValid: true };
  }
}