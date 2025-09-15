// 统一导出所有工具类
export * from './validation';
export * from './translation';
export * from './common';

// 创建便捷的导入别名
export { TranslationKeyValidator as Validator } from './validation';
export { TranslationProgressCalculator as ProgressCalculator } from './translation';
export { TranslationSearchUtils as SearchUtils } from './translation';
export { TranslationDataUtils as DataUtils } from './translation';
export { DOMUtils as DOM } from './common';
export { AsyncUtils as Async } from './common';
export { FormatUtils as Format } from './common';
export { StringUtils as Str } from './common';