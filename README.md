# Rachel Phone Simulator

AI 角色陪伴手机模拟器 Web App。用户在模拟手机界面中与 AI 角色聊天、阅读/创作线下剧情、管理角色记忆和 API 设置。

> 当前 README 记录的是本仓库源码的真实状态，不等同于 `CLAUDE.md` 或 `docs/architecture.md` 中的目标蓝图。

## 技术栈

- React 19
- TypeScript
- Vite
- IndexedDB
- DeepSeek/OpenAI-compatible Chat Completions API
- GitHub Pages

## 启动与构建

```bash
npm install
npm run dev
npm run build
npm run preview
```

部署命令：

```bash
npm run deploy
```

部署地址：

- GitHub Pages: https://rachel246-ydym.github.io/rachel-phone-sim/
- Vite base path: `/rachel-phone-sim/`

## 当前已实现功能

- 手机外壳：模拟手机容器、状态栏、底部导航、主页、聊天、故事、我的入口。
- 主页：问候语、日期、角色卡片、关系卡片、情绪热力图、App 图标网格、最近列表。
- 角色档案：角色创建、编辑、删除，头像上传，昵称、人设、说话风格、自定义指令、关系状态、心声、自动行为和模型参数配置。
- 聊天室：消息列表、输入框、流式回复、停止生成、错误提示、动作描写渲染、聊天记录搜索、顶部栏、菜单面板、角色信息侧滑面板。
- AI 调用：统一 API 封装，支持普通和流式 chat completion，支持测试连接和基础用量记录。
- 线下剧情：主线故事、长篇叙事、短线下互动、继续生成、扩写、段落重生成、编辑、删除、撤销、置顶段落。
- IF 线与分支：主线分支、IF 线创建、从段落创建 IF 线、分支切换、重命名、删除。
- 存档：为剧情创建存档、AI 生成总结、编辑存档名称/总结、删除存档、加载到存档点。
- 记忆核心：手动添加、编辑、删除、固定、标签筛选、按标签/全部清空。
- 自动总结：聊天达到配置轮次后可调用 AI 生成核心记忆。
- 心声系统：回复后可生成角色心声，支持顶部栏和通知弹窗展示，可查看历史。
- API 设置：主 API、副 API、低优先功能 API 分配、连接测试、今日用量、日志查看。
- 数据导出：可导出消息、记忆、存档 JSON。
- 主题：日间/夜间模式、若干主题色变量、部分页面已切换到暖奶油视觉变量。
- 自动行为基础：自动发消息、自动日记、自动朋友圈的配置与定时逻辑已存在。

## 当前未实现或半成品功能

- `DisplaySettings` 页面文件存在，但当前“我的”页面没有入口。
- 独立 `ChatSettings` 页面存在，但当前主要配置入口已并入角色档案，页面未接入当前导航链路。
- `ChatList`、`ContactsOverlay`、`Placeholder` 等组件存在但未接入当前界面。
- 用户资料 `userProfile` 有类型和读取逻辑，但缺少编辑/保存入口。
- 主页图标中的动态、时刻、设置、更多等功能多数仍为禁用或占位。
- 群聊、论坛、语音/TTS、图片识别 API、浮动 API 切换按钮尚未实现。
- PWA 只有 manifest 和 fullscreen 配置，暂未实现 service worker/offline cache。
- 剧情设置中的“每几条自动总结”字段已保存，但未看到完整接入段落总结展示流程。
- 动作描写开关主要影响 `*动作*` 的显示样式，尚未系统性注入 AI prompt。

## 当前已知问题

- 部分组件超过项目约定的 300 行：`StoryReader.tsx`、`ApiSettings/index.tsx`、`CharacterForm.tsx`。
- `useStoryReader.ts` 体量较大，剧情生成、分支、存档恢复等逻辑集中，维护风险较高。
- `App.tsx` 使用 `sessionStorage` 保存页面状态；这与“所有持久化走 IndexedDB”的约定需要重新确认边界。
- 主题系统存在新旧变量混用：`src/services/theme.ts` 与 `src/styles/theme.ts` 都会写 CSS 变量。
- 样式仍有硬编码颜色和 `box-shadow`，未完全符合当前 UI 重构规范。
- 删除角色、故事或 IF 线时，相关消息、分支、存档、记忆等级联清理不完整，可能产生孤儿数据。
- API Key 当前存放在 IndexedDB 中，没有额外加密或权限隔离。

## 推荐开发顺序

1. 补齐文档和真实状态记录，保持 README 与代码同步。
2. 接通已存在但不可达的页面入口，优先处理显示设置与必要的聊天设置。
3. 修复 IndexedDB 数据一致性，补齐角色/故事/IF 线删除时的级联清理。
4. 拆分超长组件与超长 hook，优先 `StoryReader`、`ApiSettings`、`CharacterForm`、`useStoryReader`。
5. 统一主题变量来源，逐步清理硬编码颜色和阴影。
6. 补齐用户资料编辑、动态/时刻、群组等真实功能入口。
7. 完善 PWA 能力，包括 service worker、离线缓存与安装体验。
