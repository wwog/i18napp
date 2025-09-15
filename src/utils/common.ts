/**
 * DOM操作工具类
 */
export class DOMUtils {
  /**
   * 平滑滚动到指定元素
   * @param elementId 元素ID
   * @param block 滚动位置（默认'center'）
   * @returns 是否成功滚动
   */
  static scrollToElement(elementId: string, block: ScrollLogicalPosition = 'center'): boolean {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block });
      return true;
    }
    return false;
  }

  /**
   * 高亮元素（添加临时高亮效果）
   * @param elementId 元素ID
   * @param duration 高亮持续时间（毫秒，默认2000）
   * @param highlightClass 高亮CSS类名（默认'highlight'）
   */
  static highlightElement(elementId: string, duration: number = 2000, highlightClass: string = 'highlight'): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add(highlightClass);
      setTimeout(() => {
        element.classList.remove(highlightClass);
      }, duration);
    }
  }

  /**
   * 获取元素的可见性状态
   * @param elementId 元素ID
   * @returns 是否可见
   */
  static isElementVisible(elementId: string): boolean {
    const element = document.getElementById(elementId);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
}

/**
 * 异步操作工具类
 */
export class AsyncUtils {
  /**
   * 延迟执行
   * @param ms 延迟毫秒数
   * @returns Promise
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 防抖函数
   * @param func 要防抖的函数
   * @param wait 等待时间（毫秒）
   * @returns 防抖后的函数
   */
  static debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: number;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  }

  /**
   * 节流函数
   * @param func 要节流的函数
   * @param limit 限制时间（毫秒）
   * @returns 节流后的函数
   */
  static throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }
}

/**
 * 数据格式化工具类
 */
export class FormatUtils {
  /**
   * 格式化日期
   * @param dateString 日期字符串
   * @param locale 地区代码（默认'zh-CN'）
   * @returns 格式化后的日期字符串
   */
  static formatDate(dateString: string, locale: string = 'zh-CN'): string {
    return new Date(dateString).toLocaleDateString(locale);
  }

  /**
   * 格式化时间
   * @param dateString 日期字符串
   * @param locale 地区代码（默认'zh-CN'）
   * @returns 格式化后的时间字符串
   */
  static formatDateTime(dateString: string, locale: string = 'zh-CN'): string {
    return new Date(dateString).toLocaleString(locale);
  }

  /**
   * 格式化文件大小
   * @param bytes 字节数
   * @returns 格式化后的文件大小字符串
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 格式化百分比
   * @param value 数值（0-100）
   * @param decimals 小数位数（默认0）
   * @returns 格式化后的百分比字符串
   */
  static formatPercentage(value: number, decimals: number = 0): string {
    return `${value.toFixed(decimals)}%`;
  }
}

/**
 * 字符串工具类
 */
export class StringUtils {
  /**
   * 首字母大写
   * @param str 字符串
   * @returns 首字母大写的字符串
   */
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * 驼峰命名转换
   * @param str 字符串
   * @returns 驼峰命名字符串
   */
  static toCamelCase(str: string): string {
    return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  }

  /**
   * 短横线命名转换
   * @param str 字符串
   * @returns 短横线命名字符串
   */
  static toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * 截断字符串
   * @param str 字符串
   * @param length 最大长度
   * @param suffix 后缀（默认'...'）
   * @returns 截断后的字符串
   */
  static truncate(str: string, length: number, suffix: string = '...'): string {
    if (str.length <= length) return str;
    return str.substring(0, length) + suffix;
  }

  /**
   * 生成随机字符串
   * @param length 长度
   * @param charset 字符集（默认字母数字）
   * @returns 随机字符串
   */
  static random(length: number, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }
}