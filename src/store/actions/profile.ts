import type { ApiConfig, DisplaySettings, UserProfile } from '../../types'

export type ProfileAction =
  | { type: 'profile/setApiConfigs'; configs: ApiConfig[] }
  | { type: 'profile/upsertApiConfig'; config: ApiConfig }
  | { type: 'profile/removeApiConfig'; configId: string }
  | { type: 'profile/setUserProfile'; profile: UserProfile }
  | { type: 'profile/setDisplaySettings'; settings: DisplaySettings }
  | { type: 'profile/setFeatureApiAssignment'; assignment: Record<string, string> }
