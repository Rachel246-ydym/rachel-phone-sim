import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import type {
  ApiConfig,
  Character,
  DisplaySettings,
  Message,
  UserProfile,
} from '../types'
import type { ChatAction } from './actions/chat'
import type { ProfileAction } from './actions/profile'
import { getAll } from '../services/storage'

export type AppAction = ChatAction | ProfileAction

export interface AppState {
  characters: Character[]
  activeCharacterId: string | null
  messages: Message[]
  apiConfigs: ApiConfig[]
  userProfile: UserProfile | null
  displaySettings: DisplaySettings
}

const initialState: AppState = {
  characters: [],
  activeCharacterId: null,
  messages: [],
  apiConfigs: [],
  userProfile: null,
  displaySettings: { fullscreen: false, homePageMode: 'slide' },
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'chat/setCharacters':
      return { ...state, characters: action.characters }
    case 'chat/upsertCharacter': {
      const exists = state.characters.some((c) => c.id === action.character.id)
      return {
        ...state,
        characters: exists
          ? state.characters.map((c) => (c.id === action.character.id ? action.character : c))
          : [...state.characters, action.character],
      }
    }
    case 'chat/removeCharacter':
      return {
        ...state,
        characters: state.characters.filter((c) => c.id !== action.characterId),
        activeCharacterId:
          state.activeCharacterId === action.characterId ? null : state.activeCharacterId,
      }
    case 'chat/setActiveCharacter':
      return { ...state, activeCharacterId: action.characterId }
    case 'chat/setMessages':
      return { ...state, messages: action.messages }
    case 'chat/appendMessage':
      return { ...state, messages: [...state.messages, action.message] }
    case 'profile/setApiConfigs':
      return { ...state, apiConfigs: action.configs }
    case 'profile/upsertApiConfig': {
      const exists = state.apiConfigs.some((c) => c.id === action.config.id)
      return {
        ...state,
        apiConfigs: exists
          ? state.apiConfigs.map((c) => (c.id === action.config.id ? action.config : c))
          : [...state.apiConfigs, action.config],
      }
    }
    case 'profile/removeApiConfig':
      return { ...state, apiConfigs: state.apiConfigs.filter((c) => c.id !== action.configId) }
    case 'profile/setUserProfile':
      return { ...state, userProfile: action.profile }
    case 'profile/setDisplaySettings':
      return { ...state, displaySettings: action.settings }
  }
}

const StateContext = createContext<AppState | null>(null)
const DispatchContext = createContext<Dispatch<AppAction> | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    let cancelled = false
    async function hydrate() {
      const [characters, apiConfigs, profiles] = await Promise.all([
        getAll<Character>('characters'),
        getAll<ApiConfig>('apiConfigs'),
        getAll<UserProfile>('userProfile'),
      ])
      if (cancelled) return
      dispatch({ type: 'chat/setCharacters', characters })
      dispatch({ type: 'profile/setApiConfigs', configs: apiConfigs })
      const profile = profiles[0]
      if (profile) {
        dispatch({ type: 'profile/setUserProfile', profile })
      }
    }
    void hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useAppState(): AppState {
  const state = useContext(StateContext)
  if (!state) {
    throw new Error('useAppState 必须在 AppProvider 内使用')
  }
  return state
}

export function useAppDispatch(): Dispatch<AppAction> {
  const dispatch = useContext(DispatchContext)
  if (!dispatch) {
    throw new Error('useAppDispatch 必须在 AppProvider 内使用')
  }
  return dispatch
}
