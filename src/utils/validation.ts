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

    return { isValid: true };
  }

  /**
   * 检查翻译键是否重复
   * @param key 待检查的翻译键
   * @param existingKeys 已存在的翻译键数组
   * @returns 验证结果
   */
  static checkDuplicate(key: string, existingKeys: string[]): ValidationResult {
    if (existingKeys.includes(key.trim())) {
      return { isValid: false, message: '翻译键已存在' };
    }
    return { isValid: true };
  }

  /**
   * 综合验证翻译键（格式 + 重复检查）
   * @param key 待验证的翻译键
   * @param existingKeys 已存在的翻译键数组
   * @returns 验证结果
   */
  static validateComplete(key: string, existingKeys: string[] = []): ValidationResult {
    // 先验证格式
    const formatValidation = this.validate(key);
    if (!formatValidation.isValid) {
      return formatValidation;
    }

    // 再验证重复
    return this.checkDuplicate(key, existingKeys);
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