import { useEffect, useRef, useState } from 'react'
import SubPage from '../../../components/SubPage'
import { useAppDispatch, useAppState } from '../../../store/AppContext'
import { createId, get, getAll, put, remove } from '../../../services/storage'
import { testConnection } from '../../../services/ai'
import type { ApiConfig, ApiUsageLog, ApiUsageStats, LowPriorityFeature } from '../../../types'
import './ApiSettings.css'

const SUGGESTED_MODELS = [
  'deepseek-v4-pro',
  'deepseek-v3-0324',
  'deepseek-r1',
  'deepseek-r1-0528',
  'gpt-4o',
  'gpt-4o-mini',
]

const FEATURES: { key: LowPriorityFeature; label: string }[] = [
  { key: 'heart_voice', label: '角色心声' },
  { key: 'auto_summary', label: '自动总结' },
  { key: 'auto_send', label: '自动发消息' },
  { key: 'auto_diary', label: '自动日记' },
  { key: 'auto_moments', label: '自动朋友圈' },
]

function makeEmptyConfig(isPrimary: boolean): ApiConfig {
  return {
    id: createId(),
    url: 'https://api.deepseek.com',
    key: '',
    model: 'deepseek-v4-pro',
    isPrimary,
    usageStats: { todayRequests: 0, todayTokens: 0, todayFailures: 0, recordLimit: 200 },
  }
}

export default function ApiSettings({ onBack }: { onBack: () => void }) {
  const { apiConfigs, featureApiAssignment } = useAppState()
  const dispatch = useAppDispatch()
  const primaryConfig = apiConfigs.find((c) => c.isPrimary)
  const secondaryConfigs = apiConfigs.filter((c) => !c.isPrimary)

  // Primary API form state
  const [url, setUrl] = useState('https://api.deepseek.com')
  const [key, setKey] = useState('')
  const [model, setModel] = useState('deepseek-v4-pro')
  const [showKey, setShowKey] = useState(false)
  const formInit = useRef(false)

  // Interaction state
  const [testState, setTestState] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle')
  const [testMsg, setTestMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Usage stats (loaded fresh from storage)
  const [liveStats, setLiveStats] = useState<ApiUsageStats | null>(null)
  const [logs, setLogs] = useState<ApiUsageLog[]>([])
  const [logsFilter, setLogsFilter] = useState<'none' | 'today' | 'all'>('none')

  // Secondary API add form
  const [addingSecondary, setAddingSecondary] = useState(false)
  const [newUrl, setNewUrl] = useState('https://api.deepseek.com')
  const [newKey, setNewKey] = useState('')
  const [newModel, setNewModel] = useState('deepseek-v4-pro')
  const [newShowKey, setNewShowKey] = useState(false)

  // Feature assignment
  const [localAssignment, setLocalAssignment] = useState<Record<string, string>>({})
  const [assignSaved, setAssignSaved] = useState(false)

  useEffect(() => {
    if (!formInit.current && primaryConfig) {
      formInit.current = true
      setUrl(primaryConfig.url)
      setKey(primaryConfig.key)
      setModel(primaryConfig.model)
    } else if (!formInit.current && apiConfigs.length >= 0) {
      // apiConfigs loaded (may be empty if no configs yet)
      formInit.current = true
    }
  }, [primaryConfig, apiConfigs])

  useEffect(() => {
    setLocalAssignment({ ...featureApiAssignment })
  }, [featureApiAssignment])

  useEffect(() => {
    void refreshStats()
  }, [primaryConfig?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function refreshStats() {
    if (!primaryConfig) return
    const fresh = await get<ApiConfig>('apiConfigs', primaryConfig.id)
    setLiveStats(fresh?.usageStats ?? null)
  }

  async function handleTest() {
    setTestState('testing')
    setTestMsg('')
    const cfg: ApiConfig = { ...(primaryConfig ?? makeEmptyConfig(true)), url, key, model }
    try {
      await testConnection(cfg)
      setTestState('ok')
      setTestMsg('连接成功')
    } catch (e) {
      setTestState('fail')
      setTestMsg(e instanceof Error ? e.message : '连接失败')
    }
    setTimeout(() => setTestState('idle'), 4000)
  }

  async function handleSave() {
    setSaving(true)
    const cfg: ApiConfig = {
      ...(primaryConfig ?? makeEmptyConfig(true)),
      url: url.trim(),
      key: key.trim(),
      model: model.trim(),
      isPrimary: true,
    }
    await put('apiConfigs', cfg)
    dispatch({ type: 'profile/upsertApiConfig', config: cfg })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    void refreshStats()
  }

  async function handleViewLogs(filter: 'today' | 'all') {
    if (logsFilter === filter) { setLogsFilter('none'); return }
    const all = await getAll<ApiUsageLog>('apiUsageLogs')
    const own = all
      .filter((l) => l.configId === (primaryConfig?.id ?? ''))
      .sort((a, b) => b.timestamp - a.timestamp)
    const today = new Date().toISOString().slice(0, 10)
    setLogs(filter === 'today' ? own.filter((l) => new Date(l.timestamp).toISOString().slice(0, 10) === today) : own)
    setLogsFilter(filter)
  }

  async function handleAddSecondary() {
    if (!newUrl.trim() || !newKey.trim()) return
    const cfg = makeEmptyConfig(false)
    cfg.url = newUrl.trim()
    cfg.key = newKey.trim()
    cfg.model = newModel.trim()
    await put('apiConfigs', cfg)
    dispatch({ type: 'profile/upsertApiConfig', config: cfg })
    setAddingSecondary(false)
    setNewUrl('https://api.deepseek.com')
    setNewKey('')
    setNewModel('deepseek-v4-pro')
  }

  async function handleDeleteSecondary(id: string) {
    await remove('apiConfigs', id)
    dispatch({ type: 'profile/removeApiConfig', configId: id })
    const updated = { ...localAssignment }
    for (const k of Object.keys(updated)) {
      if (updated[k] === id) delete updated[k]
    }
    setLocalAssignment(updated)
  }

  async function handleSaveAssignment() {
    await put('settings', { id: 'featureApiAssignment', value: localAssignment })
    dispatch({ type: 'profile/setFeatureApiAssignment', assignment: localAssignment })
    setAssignSaved(true)
    setTimeout(() => setAssignSaved(false), 2000)
  }

  function hostLabel(u: string) {
    try { return new URL(u).hostname } catch { return u.slice(0, 20) }
  }

  return (
    <SubPage title="API 设置" onBack={onBack}>
      <div className="api-settings">
        <p className="api-settings__section-title">主 API 配置</p>
        <div className="api-settings__block">
          <div className="api-settings__row">
            <span className="api-settings__label">API 地址</span>
            <input
              className="api-settings__input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.deepseek.com"
            />
          </div>
          <div className="api-settings__row">
            <span className="api-settings__label">API Key</span>
            <div className="api-settings__key-wrap">
              <input
                className="api-settings__input"
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-..."
              />
              <button className="api-settings__eye" onClick={() => setShowKey((v) => !v)}>
                {showKey ? '隐藏' : '显示'}
              </button>
            </div>
          </div>
          <div className="api-settings__row">
            <span className="api-settings__label">模型</span>
            <input
              className="api-settings__input"
              list="api-model-list"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="deepseek-v4-pro"
            />
            <datalist id="api-model-list">
              {SUGGESTED_MODELS.map((m) => <option key={m} value={m} />)}
            </datalist>
          </div>
        </div>

        <div className="api-settings__actions">
          <button
            className={`api-settings__btn api-settings__btn--outline api-settings__btn--test${testState === 'ok' ? ' api-settings__btn--ok' : testState === 'fail' ? ' api-settings__btn--fail' : ''}`}
            onClick={() => void handleTest()}
            disabled={testState === 'testing'}
          >
            {testState === 'testing' ? '测试中…' : testState === 'ok' ? '✓ 成功' : testState === 'fail' ? '✗ 失败' : '测试连接'}
          </button>
          <button
            className={`api-settings__btn api-settings__btn--primary${saved ? ' api-settings__btn--saved' : ''}`}
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saved ? '已保存 ✓' : saving ? '保存中…' : '保存配置'}
          </button>
        </div>
        {testMsg && <p className={`api-settings__test-msg${testState === 'fail' ? ' api-settings__test-msg--fail' : ''}`}>{testMsg}</p>}

        {primaryConfig && (
          <>
            <p className="api-settings__section-title">用量账本</p>
            <div className="api-settings__stats">
              <div className="api-settings__stat">
                <span className="api-settings__stat-num">{liveStats?.todayRequests ?? 0}</span>
                <span className="api-settings__stat-label">今日请求</span>
              </div>
              <div className="api-settings__stat">
                <span className="api-settings__stat-num">{liveStats?.todayTokens ?? 0}</span>
                <span className="api-settings__stat-label">今日 tokens</span>
              </div>
              <div className="api-settings__stat api-settings__stat--danger">
                <span className="api-settings__stat-num">{liveStats?.todayFailures ?? 0}</span>
                <span className="api-settings__stat-label">今日失败</span>
              </div>
            </div>
            <p className="api-settings__record-limit">记录上限 {liveStats?.recordLimit ?? 200} 条</p>
            <div className="api-settings__log-btns">
              <button className={`api-settings__btn api-settings__btn--sm${logsFilter === 'today' ? ' api-settings__btn--outline' : ''}`} onClick={() => void handleViewLogs('today')}>今日明细</button>
              <button className={`api-settings__btn api-settings__btn--sm${logsFilter === 'all' ? ' api-settings__btn--outline' : ''}`} onClick={() => void handleViewLogs('all')}>全部记录</button>
            </div>
            {logsFilter !== 'none' && (
              <div className="api-settings__logs">
                {logs.length === 0
                  ? <p className="api-settings__empty">暂无记录</p>
                  : logs.map((l) => (
                    <div key={l.id} className="api-settings__log-item">
                      <span className="api-settings__log-time">
                        {new Date(l.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="api-settings__log-tokens">{l.tokens} tokens</span>
                      <span className={`api-settings__log-status${l.success ? '' : ' api-settings__log-status--fail'}`}>
                        {l.success ? '成功' : '失败'}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}

        <p className="api-settings__section-title">副 API 管理</p>
        {secondaryConfigs.length > 0 && (
          <div className="api-settings__block">
            {secondaryConfigs.map((c) => (
              <div key={c.id} className="api-settings__secondary-item">
                <div>
                  <div className="api-settings__secondary-model">{c.model}</div>
                  <div className="api-settings__secondary-url">{hostLabel(c.url)}</div>
                </div>
                <button className="api-settings__btn api-settings__btn--danger" onClick={() => void handleDeleteSecondary(c.id)}>删除</button>
              </div>
            ))}
          </div>
        )}
        <button className="api-settings__add-btn" onClick={() => setAddingSecondary((v) => !v)}>
          {addingSecondary ? '取消' : '＋ 添加副 API'}
        </button>
        {addingSecondary && (
          <div className="api-settings__block api-settings__block--add">
            <div className="api-settings__row">
              <span className="api-settings__label">地址</span>
              <input className="api-settings__input" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
            </div>
            <div className="api-settings__row">
              <span className="api-settings__label">Key</span>
              <div className="api-settings__key-wrap">
                <input className="api-settings__input" type={newShowKey ? 'text' : 'password'} value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="sk-..." />
                <button className="api-settings__eye" onClick={() => setNewShowKey((v) => !v)}>{newShowKey ? '隐藏' : '显示'}</button>
              </div>
            </div>
            <div className="api-settings__row">
              <span className="api-settings__label">模型</span>
              <input className="api-settings__input" list="api-model-list" value={newModel} onChange={(e) => setNewModel(e.target.value)} />
            </div>
            <button className="api-settings__btn api-settings__btn--primary" onClick={() => void handleAddSecondary()}>确认添加</button>
          </div>
        )}

        {secondaryConfigs.length > 0 && (
          <>
            <p className="api-settings__section-title">低优先功能分配</p>
            <div className="api-settings__block">
              {FEATURES.map((f) => (
                <div key={f.key} className="api-settings__row">
                  <span className="api-settings__label">{f.label}</span>
                  <select
                    className="api-settings__select"
                    value={localAssignment[f.key] ?? ''}
                    onChange={(e) => setLocalAssignment((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  >
                    <option value="">主 API</option>
                    {secondaryConfigs.map((c) => (
                      <option key={c.id} value={c.id}>{c.model} · {hostLabel(c.url)}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="api-settings__footer">
              <button
                className={`api-settings__btn api-settings__btn--primary${assignSaved ? ' api-settings__btn--saved' : ''}`}
                onClick={() => void handleSaveAssignment()}
              >
                {assignSaved ? '已保存 ✓' : '保存功能分配'}
              </button>
            </div>
          </>
        )}
      </div>
    </SubPage>
  )
}
