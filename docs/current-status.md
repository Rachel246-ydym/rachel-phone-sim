# 当前真实进度报告

检查时间：2026-07-15

本报告基于当前仓库源码检查，不根据旧总结推断完成度。

## 可运行情况

- `npm run build` 在接手检查时通过，TypeScript 与 Vite 生产构建未报错。
- 当前项目可作为 Vite React 应用运行，部署 base path 为 `/rachel-phone-sim/`。
- GitHub Pages 预期部署地址为 `https://rachel246-ydym.github.io/rachel-phone-sim/`。
- 当前 PWA 能力较轻量：存在 `manifest.webmanifest`，但未见 service worker/offline cache。

## 已实现

- 基础手机外壳：模拟手机容器、状态栏、底部导航、主页/聊天/故事/我的模块切换。
- 全局状态：`src/store/AppContext.tsx` 使用 Context + reducer 管理角色、消息、API 配置、用户资料、显示设置等。
- IndexedDB：`src/services/storage.ts` 封装 `characters`、`messages`、`stories`、`storyBranches`、`archives`、`memories`、`heartVoices`、`settings`、`apiConfigs`、`userProfile`、`moments`、`apiUsageLogs` 等 store。
- API：`src/services/ai.ts` 支持普通和流式 chat completion、连接测试、API 用量统计。
- 主页：问候、日期、角色卡、关系卡、情绪热力图、App 图标网格、最近列表。
- 角色档案：角色 CRUD、头像上传、人设、说话风格、自定义指令、关系状态、模型参数、心声、自动行为、记忆设置。
- 聊天室：消息展示、发送、流式回复、停止生成、搜索、心声展示、角色信息面板、动作描写显示。
- 线下剧情：主线故事、长篇叙事、短线下互动、继续、扩写、编辑、删除、撤销、重生成、段落置顶。
- 分支与 IF 线：故事分支、IF 线创建、从段落创建 IF 线、分支切换/重命名/删除。
- 存档：创建、AI 总结、编辑、删除、加载到指定段落。
- 记忆核心：手动添加、编辑、删除、固定、标签筛选、清空。
- 自动总结与心声：聊天回复后可触发自动记忆总结和角色心声生成。
- API 设置：主/副 API 管理、低优先功能分配、测试连接、今日统计和日志。
- 主题：日夜模式与多组主题色变量部分接入。
- 自动行为：自动发消息、自动日记、自动朋友圈的配置和定时逻辑已存在。

## 半成品

- `src/pages/Profile/DisplaySettings` 存在，但当前“我的”页面没有入口。
- `src/pages/Chat/Settings` 存在，但当前未作为独立页面接入。
- `src/pages/Chat/ChatList`、`ContactsOverlay`、`Placeholder` 等组件存在但未使用。
- 用户资料 `userProfile` 有读取和展示痕迹，但缺少编辑保存页面。
- 主页动态、时刻、设置、更多、群组等入口仍是禁用或占位状态。
- 剧情设置中的段落自动总结配置未完整接入展示和生成流程。
- 动作描写开关主要影响渲染，不是完整 prompt 控制。
- PWA 离线能力尚未实现。

## 主要风险

- 多个组件超过 300 行项目约定，尤其是 `StoryReader.tsx`、`ApiSettings/index.tsx`、`CharacterForm.tsx`。
- `useStoryReader.ts` 逻辑集中度高，包含剧情生成、分支、编辑、删除、存档恢复等核心流程，后续修改容易引发回归。
- 删除角色、故事、IF 线时缺少完整级联清理，IndexedDB 中可能残留孤儿数据。
- `App.tsx` 使用 `sessionStorage` 保存页面状态，需确认是否符合“持久化走 IndexedDB”的约定。
- 主题变量来源不统一，新旧 CSS 变量并存。
- 样式中仍有硬编码颜色与 `box-shadow`，当前 UI 规范尚未完全落地。
- API Key 直接存在 IndexedDB，没有额外安全处理。

## 下一步建议

1. 先保持文档同步，把真实状态、目标蓝图、开发约定分清楚。
2. 接通 `DisplaySettings` 和必要的设置入口，减少“文件存在但用户不可达”的状态。
3. 修复数据删除和级联清理，优先保证 IndexedDB 数据一致性。
4. 拆分超长组件和 hook，降低剧情与设置模块维护成本。
5. 统一主题变量和样式规范，再继续 UI 重构。
6. 补齐用户资料编辑、动态/时刻、群组等明确入口。
7. 最后增强 PWA 离线能力与部署体验。
