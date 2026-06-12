// 所有 TypeScript 类型的单一来源，与 docs/architecture.md 第四节的 IndexedDB 设计对应

export type Role = 'user' | 'assistant' | 'system'

export type NarrativePerson = 'first' | 'third' | 'mixed'

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
  branchPoint: string | null
  name: string
  createdAt: number
}

export interface Archive {
  id: string
  storyId: string
  branchId: string
  name: string
  summary: string
  snapshot: StorySegment[]
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

export interface ApiUsageStats {
  todayRequests: number
  todayTokens: number
  todayFailures: number
  recordLimit: number
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

export interface SettingEntry {
  id: string
  value: unknown
}
