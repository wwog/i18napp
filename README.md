# I18n Studio

一个基于Tauri + React + TypeScript的国际化管理工具，界面设计参考了Android Studio的布局风格。

## 功能特点

- 📁 **项目管理** - 创建、打开和管理国际化项目
- 🌐 **多语言支持** - 支持多种语言的翻译管理
- 🎯 **直观操作** - 通过模态对话框选择项目，简化用户体验

## 界面布局

### 侧边栏
- **Projects** - 项目管理页面
- **Settings** - 设置页面
- **主题切换** - 位于底部的主题切换按钮

### 主要功能
- **新建项目** - 创建新的国际化项目
- **打开项目** - 通过模态对话框选择现有项目
- **导入项目** - 导入现有的翻译文件

## 技术栈

- **前端框架**: React 18 + TypeScript
- **桌面框架**: Tauri
- **UI组件库**: Fluent UI React Components
- **样式系统**: Fluent UI Design Tokens
- **构建工具**: Vite

## 推荐开发环境

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## 开发和构建

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建应用
npm run build
```
工作流
git push origin main

git checkout release

git merge main

git push origin release

git checkout main