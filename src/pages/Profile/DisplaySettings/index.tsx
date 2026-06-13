import { useEffect, useState } from 'react'
import SubPage from '../../../components/SubPage'
import { useAppDispatch, useAppState } from '../../../store/AppContext'
import { put } from '../../../services/storage'
import type { DisplaySettings } from '../../../types'
import './DisplaySettings.css'

export default function DisplaySettings({ onBack }: { onBack: () => void }) {
  const { displaySettings } = useAppState()
  const dispatch = useAppDispatch()

  const [fullscreen, setFullscreen] = useState(displaySettings.fullscreen)
  const [homePageMode, setHomePageMode] = useState<'slide' | 'flip'>(displaySettings.homePageMode)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setFullscreen(displaySettings.fullscreen)
    setHomePageMode(displaySettings.homePageMode)
  }, [displaySettings])

  useEffect(() => {
    if (fullscreen) {
      document.documentElement.requestFullscreen?.().catch(() => undefined)
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => undefined)
    }
  }, [fullscreen])

  async function handleSave() {
    const settings: DisplaySettings = { fullscreen, homePageMode }
    await put('settings', { id: 'displaySettings', value: settings })
    dispatch({ type: 'profile/setDisplaySettings', settings })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function Toggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
    return (
      <label className="ds__toggle-wrap" onClick={onToggle}>
        <input type="checkbox" className="ds__toggle-input" checked={checked} onChange={onToggle} />
        <span className="ds__toggle-track" />
        <span className="ds__toggle-thumb" />
      </label>
    )
  }

  return (
    <SubPage title="显示设置" onBack={onBack}>
      <div className="ds">
        <p className="ds__section-title">界面显示</p>
        <div className="ds__block">
          <div className="ds__row">
            <div>
              <div className="ds__label">iOS 全荧幕显示</div>
              <div className="ds__hint">填满屏幕，沉浸体验（PWA fullscreen）</div>
            </div>
            <Toggle checked={fullscreen} onToggle={() => setFullscreen((v) => !v)} />
          </div>
          <div className="ds__row ds__row--col">
            <div className="ds__label">主屏幕换页模式</div>
            <div className="ds__radio-group">
              {([['slide', '滑动'], ['flip', '翻页']] as const).map(([val, label]) => (
                <button
                  key={val}
                  className={`ds__radio-btn${homePageMode === val ? ' ds__radio-btn--active' : ''}`}
                  onClick={() => setHomePageMode(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="ds__footer">
          <button
            className={`ds__save${saved ? ' ds__save--saved' : ''}`}
            onClick={() => void handleSave()}
          >
            {saved ? '已保存 ✓' : '保存设置'}
          </button>
        </div>
      </div>
    </SubPage>
  )
}
