# 语言管理功能

## 功能概述

在项目开发页面(ProjectDevelopment)新增了语言管理功能，允许用户动态添加和删除项目支持的语言。

## 功能特性

### 1. 添加语言
- **位置**: 项目开发页面右上角的"语言管理"按钮
- **功能**: 
  - 从所有可用语言中选择要添加的语言
  - 自动为所有现有翻译键创建新语言的空翻译记录
  - 实时更新项目语言配置和表格显示

### 2. 删除语言
- **位置**: 语言管理对话框中每个语言条目的删除按钮
- **功能**:
  - 安全删除确认机制
  - 自动删除该语言的所有翻译数据
  - 防护机制：项目至少需要保留一种语言

### 3. 用户界面
- **语言管理对话框**: 展示当前项目语言和添加新语言的界面
- **删除确认对话框**: 带有警告信息的安全删除确认
- **实时反馈**: Toast消息提示操作结果

## 技术实现

### 数据库扩展
```typescript
// translations.ts 新增方法
async deleteLanguageTranslations(project_id: number, language: string): Promise<void>
```

### 工具类扩展
```typescript
// TranslationOperationManager 新增方法
static async addLanguageToProject(projectId: number, languageCode: string, existingKeys: string[]): Promise<void>
static async removeLanguageFromProject(projectId: number, languageCode: string): Promise<void>
```

### UI组件
1. **语言管理按钮**: 位于页面header的操作区域
2. **语言管理对话框**: 包含当前语言列表和新语言添加功能
3. **删除确认对话框**: 带有安全警告的删除确认界面

## 操作流程

### 添加语言
1. 点击"语言管理"按钮
2. 在下拉选择器中选择要添加的语言
3. 点击"添加"按钮
4. 系统自动：
   - 更新项目语言配置
   - 为所有现有翻译键创建新语言的空翻译
   - 刷新页面显示

### 删除语言
1. 在语言管理对话框中点击语言的"删除"按钮
2. 确认删除警告信息
3. 点击"确认删除"
4. 系统自动：
   - 删除该语言的所有翻译数据
   - 更新项目语言配置
   - 刷新页面显示

## 安全特性

1. **最少语言要求**: 项目必须至少保留一种语言
2. **删除确认**: 危险操作需要用户明确确认
3. **数据完整性**: 添加/删除语言时确保翻译数据的一致性
4. **错误处理**: 完善的错误捕获和用户反馈机制

## 状态管理

使用React状态管理语言管理相关的UI状态：
- `isLanguageManageDialogOpen`: 语言管理对话框开关
- `allLanguages`: 所有可用语言列表
- `selectedNewLanguage`: 选中的新语言
- `isAddingLanguage`: 添加语言中状态
- `isRemoveLanguageDialogOpen`: 删除确认对话框开关
- `languageToRemove`: 待删除的语言
- `isRemovingLanguage`: 删除进行中状态

## 后续优化建议

1. **批量语言操作**: 支持一次性添加/删除多种语言
2. **语言排序**: 支持语言显示顺序的自定义排序
3. **语言搜索**: 在可用语言列表中添加搜索功能
4. **导入导出**: 支持语言配置的导入导出
5. **语言模板**: 为新语言提供翻译模板功能