# CLAUDE.md — rachel-phone-sim

## 项目概述

AI 角色陪伴手机模拟器 PWA。用户在模拟手机界面中与 AI 角色聊天、阅读/创作剧情、管理角色记忆。

## 技术栈

* React 19 + TypeScript + Vite
* 存储：IndexedDB（不使用 localStorage）
* AI API：DeepSeek（deepseek-v4-pro）
* 部署：GitHub Pages（gh-pages 分支）

## 关键约定

* 所有开发只在 main 分支进行，不创建新分支
* 每次修改后必须 `npm run build` 确认无报错
* 单个组件文件不超过 300 行，超过必须拆分
* commit 后 push 到 main，GitHub Actions 自动部署到 gh-pages

## 目录结构

```
src/
├── components/     # 页面组件和 UI 组件
├── contexts/       # React Context + useReducer 全局状态
├── services/       # IndexedDB 存储服务、API 调用
├── types/          # TypeScript 类型定义（10 个 Store）
├── hooks/          # 自定义 hooks（useAutoScheduler 等）
├── styles/         # 全局样式和主题变量
├── App.tsx         # 根组件，路由和导航
└── main.tsx        # 入口
```

## 已完成功能模块

1. 角色档案 CRUD（头像、名称、昵称、人设）
2. 聊天室（消息气泡、DeepSeek 流式输出、多条回复）
3. 线下剧情模式（长篇叙事/短线下/IF线、分支系统、存档）
4. 记忆系统（自动总结、手动添加、标签筛选、注入 system prompt）
5. 心声系统（自动生成、顶部栏/弹窗两种显示模式）
6. 模型参数面板（温度/TopP/max tokens 等 9 项）
7. 自动行为（自动发消息/日记/朋友圈，绑定 IF 线）
8. API 设置（主副 API、用量账本）
9. 主题系统（6 个预设主题，CSS 变量注入）
10. 主屏幕（日历小组件、角色照片、App 图标网格）
11. 聊天室 UI（顶栏、侧滑面板、联络人浮层、搜索栏）

## 当前 UI 重构任务

正在进行视觉层全面更新（保持功能逻辑不变），设计规范：

* 色调：暖奶油底 `#FAF6F0`，主色赤陶玫瑰 `#C17C74`
* 卡片：1px 边框 `#E4DCD2`，不使用 box-shadow
* 图标：全部 outline 线条风格，stroke-width 1.5
* 英文/数字：衬线体标签 + tabular 数字
* 支持日间/夜间模式切换
* 详细设计变量见 src/styles/theme.ts

## 注意事项

* 不要使用 localStorage，所有持久化走 IndexedDB
* 不要创建新分支
* 修改样式时使用 CSS 变量（var(--xxx)），不要硬编码颜色值
* 每个任务完成后 npm run build + commit + push
