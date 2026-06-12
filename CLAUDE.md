# CLAUDE.md — Rachel Phone Simulator

## 项目简介

手机模拟器 PWA，核心功能：AI 角色互动聊天（含线下剧情模式）+ 个人设置管理。
用户：京京（Rachel），中文界面。
AI 角色：江浔（主角色），支持多角色创建。
AI 服务：DeepSeek API（deepseek-v4-pro）。
数据持久化：IndexedDB（通过封装的 storage service，禁止直接使用 localStorage）。

## 技术栈

- React 19 + TypeScript + Vite
- IndexedDB（统一 storage service 封装）
- DeepSeek API（主 API）
- 部署：GitHub Pages（gh-pages 分支）

## 构建命令

```bash
npm install
npm run dev        # 开发服务器
npm run build      # 类型检查 + 生产构建（每次改动后必须运行）
npx tsc --noEmit   # 仅类型检查
```

## 当前重点模块

1. 聊天模块 — 线下剧情模式（长篇叙事 + 剧情分支）、角色档案、记忆核心、情感连贯性
2. "我的"模块 — API 设置、显示设置

## 架构原则

- 模块独立：每个功能模块在 src/pages/ 下独立文件夹，模块间不直接引用
- 公共数据通过全局 Context + useReducer 共享，action types 按模块分文件
- 存储层抽象：所有持久化通过 src/services/storage.ts 统一接口
- AI 调用层抽象：所有 API 调用通过 src/services/ai.ts 统一接口
- 组件拆分：单文件不超过 300 行，逻辑抽到 hooks，UI 拆子组件

## 文件结构

```
rachel-phone-sim/
├── CLAUDE.md
├── docs/
│   └── architecture.md      # 完整功能规格书（用 @docs/architecture.md 引用）
└── src/
    ├── main.tsx
    ├── App.tsx               # 路由容器
    ├── types/
    │   └── index.ts          # 所有 TypeScript 类型（单一来源）
    ├── store/
    │   ├── AppContext.tsx     # 全局 Context + useReducer
    │   └── actions/          # action types 按模块分文件
    ├── services/
    │   ├── storage.ts        # IndexedDB 封装（统一读写接口）
    │   ├── ai.ts             # DeepSeek API 调用封装
    │   └── memory.ts         # 记忆核心逻辑（自动总结、标签、筛选）
    ├── hooks/                # 可复用 hooks
    ├── components/           # 公共组件（StatusBar, Navigation 等）
    └── pages/
        ├── Chat/             # 聊天模块
        │   ├── ChatList/     # 联系人列表
        │   ├── ChatRoom/     # 聊天室（私聊/群聊）
        │   ├── StoryMode/    # 线下剧情模式（长篇叙事 + 分支 + 存档）
        │   ├── CharProfile/  # 角色档案设置
        │   ├── MemoryCore/   # 记忆核心管理
        │   └── Settings/     # 聊天设置（模型参数、自动行为等）
        └── Profile/          # "我的"模块
            ├── ApiSettings/  # API 配置
            └── DisplaySettings/ # 显示设置
```

## 开发规范

- 函数组件 + Hooks，禁止 class 组件
- TypeScript 严格模式，禁用 any
- CSS 每个页面对应一个 .css 文件，通过 CSS 变量共享颜色
- 主色：#4CAF7D，移动优先设计
- 动作描写用 * 包裹（如 *他低头笑了笑*）区别于对话文本

## 禁止事项

- 不要创建新分支，所有工作直接在 main 分支上 commit
- 不要一次修改多个不相关的模块
- 改动后必须确认 npm run build 无报错
- 不要使用 localStorage，统一使用 IndexedDB storage service
- 不要在单个组件文件中超过 300 行
- 不要添加多余注释，只在"为什么"不显而易见时写注释
