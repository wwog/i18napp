// 统一导出所有工具类
export * from './validation';
export * from './translation';
export * from './common';
export * from './project';
export * from './window';
export * from './export';

// 创建便捷的导入别名
export { TranslationKeyValidator as Validator } from './validation';
export { TranslationProgressCalculator as ProgressCalculator } from './translation';
export { TranslationSearchUtils as SearchUtils } from './translation';
export { TranslationDataUtils as DataUtils } from './translation';
export { DOMUtils as DOM } from './common';
export { AsyncUtils as Async } from './common';
export { FormatUtils as Format } from './common';
export { StringUtils as Str } from './common';
export { ProjectDataManager as ProjectData } from './project';
export { TranslationOperationManager as TranslationOps } from './project';
export { WindowManager as Window } from './window';
export { WindowLifecycleManager as WindowLifecycle } from './window';
export { FileExportManager as FileExport } from './export';
export { TranslationExportManager as TranslationExport } from './export';
export { ExportStateManager as ExportState } from './export';