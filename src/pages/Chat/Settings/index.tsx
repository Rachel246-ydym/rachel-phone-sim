import { useEffect, useState } from 'react'
import SubPage from '../../../components/SubPage'
import { useAppDispatch, useAppState } from '../../../store/AppContext'
import { getAll, put } from '../../../services/storage'
import type { AutoBehaviorSettings, Character, ModelParams, Story, StoryBranch } from '../../../types'
import ModelParamsPanel from './ModelParamsPanel'
import AutoBehaviorPanel, { type BranchOption } from './AutoBehaviorPanel'
import './ChatSettings.css'

const DEFAULT_AUTO_BEHAVIOR: AutoBehaviorSettings = {
  autoSend: { enabled: false, intervalMinutes: 60 },
  autoDiary: { enabled: false, time: '08:00', branchId: null },
  autoMoments: { enabled: false, time: '20:00', branchId: null },
}

async function loadBranches(characterId: string): Promise<BranchOption[]> {
  const [allStories, allBranches] = await Promise.all([
    getAll<Story>('stories'),
    getAll<StoryBranch>('storyBranches'),
  ])
  const myStories = allStories.filter((s) => s.characterId === characterId)
  const storyTitles = Object.fromEntries(myStories.map((s) => [s.id, s.title]))
  const myStoryIds = new Set(myStories.map((s) => s.id))
  return allBranches
    .filter((b) => myStoryIds.has(b.storyId))
    .map((b) => ({ ...b, storyTitle: storyTitles[b.storyId] ?? '' }))
}

export default function ChatSettings({ onBack }: { onBack: () => void }) {
  const { characters, activeCharacterId } = useAppState()
  const dispatch = useAppDispatch()
  const character = characters.find((c) => c.id === activeCharacterId) ?? null

  const [params, setParams] = useState<ModelParams | null>(null)
  const [autoBehavior, setAutoBehavior] = useState<AutoBehaviorSettings>(DEFAULT_AUTO_BEHAVIOR)
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!character) return
    setParams({ ...character.modelParams })
    setAutoBehavior(character.autoBehavior ?? DEFAULT_AUTO_BEHAVIOR)
    void loadBranches(character.id).then(setBranches)
  }, [character])

  async function handleSave() {
    if (!character || !params) return
    setSaving(true)
    const updated: Character = { ...character, modelParams: params, autoBehavior }
    await put('characters', updated)
    dispatch({ type: 'chat/upsertCharacter', character: updated })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!character || !params) {
    return (
      <SubPage title="聊天设置" onBack={onBack}>
        <p className="chat-settings__missing">未选择角色</p>
      </SubPage>
    )
  }

  return (
    <SubPage title="聊天设置" onBack={onBack}>
      <div className="chat-settings">
        <ModelParamsPanel params={params} onChange={setParams} />
        <AutoBehaviorPanel settings={autoBehavior} branches={branches} onChange={setAutoBehavior} />
        <div className="chat-settings__footer">
          <button
            className={`chat-settings__save${saved ? ' chat-settings__save--saved' : ''}`}
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saved ? '已保存 ✓' : saving ? '保存中…' : '保存设置'}
          </button>
        </div>
      </div>
    </SubPage>
  )
}
