// 所有 TypeScript 类型的单一来源，与 docs/architecture.md 第四节的 IndexedDB 设计对应

export type Role = 'user' | 'assistant' | 'system'

export type NarrativePerson = 'first' | 'third' | 'mixed'

export type StoryTheme = 'dark' | 'light' | 'cream' | 'navy'

export type ReplyMode = 'manual' | 'auto-interruptible' | 'auto-uninterruptible'

export type MemoryTag =
  | 'auto-summary'
  | 'manual-summary'
  | 'manual-add'
  | 'self-reflection'
  | 'story'
  | 'interaction'

export interface ModelParams {
  minReplies: number
  maxReplies: number
  temperature: number
  topP: number
  maxTokens: number
  stream: boolean
  contextLimit: number
  timeAware: boolean
  memoryCount?: number
  replyMode?: ReplyMode
}

export interface AutoSendSettings {
  enabled: boolean
  intervalMinutes: number
}

export interface AutoDailySettings {
  enabled: boolean
  time: string
  branchId: string | null
}

export interface AutoBehaviorSettings {
  autoSend: AutoSendSettings
  autoDiary: AutoDailySettings
  autoMoments: AutoDailySettings
}

export interface Character {
  id: string
  name: string
  nickname: string
  avatar: string | null
  persona: string
  online: boolean
  modelParams: ModelParams
  createdAt: number
  heartVoiceEnabled?: boolean
  heartVoiceMode?: 'topbar' | 'notification'
  autoBehavior?: AutoBehaviorSettings
}

export interface Message {
  id: string
  characterId: string
  role: Role
  content: string
  timestamp: number
  storyId?: string
  storyBranchId?: string
}

export interface StorySegment {
  id: string
  content: string
  summary: string | null
  interactionCount: number
}

export interface Story {
  id: string
  characterId: string
  title: string
  activeBranchId: string
  createdAt: number
  updatedAt: number
}

export interface StoryBranch {
  id: string
  storyId: string
  parentBranchId: string | null
  branchPoint: number | null
  name: string
  createdAt: number
}

export interface Archive {
  id: string
  storyId: string
  branchId: string
  segmentIndex: number
  name: string
  summary: string
  createdAt: number
}

export interface Memory {
  id: string
  characterId: string
  content: string
  tag: MemoryTag
  source: string
  branchId?: string
  createdAt: number
}

export interface HeartVoice {
  id: string
  characterId: string
  content: string
  createdAt: number
}

export type LowPriorityFeature =
  | 'heart_voice'
  | 'auto_summary'
  | 'auto_send'
  | 'auto_diary'
  | 'auto_moments'

export interface ApiUsageLog {
  id: string
  configId: string
  timestamp: number
  tokens: number
  success: boolean
}

export interface ApiUsageStats {
  todayRequests: number
  todayTokens: number
  todayFailures: number
  recordLimit: number
  statsDate?: string
}

export interface ApiConfig {
  id: string
  url: string
  key: string
  model: string
  isPrimary: boolean
  usageStats: ApiUsageStats
}

export interface UserProfile {
  id: string
  name: string
  nickname: string
  gender: string
  age: string
  aboutMe: string
}

export interface DisplaySettings {
  fullscreen: boolean
  homePageMode: 'slide' | 'flip'
}

export interface Moment {
  id: string
  characterId: string
  content: string
  type: 'diary' | 'moment'
  branchId: string | null
  createdAt: number
}

export interface SettingEntry {
  id: string
  value: unknown
}
