import { useEffect, useState } from 'react'
import SubPage from '../../../components/SubPage'
import { getAll, remove } from '../../../services/storage'
import type { HeartVoice } from '../../../types'

interface HeartVoiceListProps {
  characterId: string
  characterName: string
  onBack: () => void
}

export default function HeartVoiceList({ characterId, characterName, onBack }: HeartVoiceListProps) {
  const [voices, setVoices] = useState<HeartVoice[]>([])
  const [loaded, setLoaded] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const all = await getAll<HeartVoice>('heartVoices')
      if (cancelled) return
      const own = all
        .filter((v) => v.characterId === characterId)
        .sort((a, b) => b.createdAt - a.createdAt)
      setVoices(own)
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [characterId])

  async function clearAll() {
    const all = await getAll<HeartVoice>('heartVoices')
    const own = all.filter((v) => v.characterId === characterId)
    await Promise.all(own.map((v) => remove('heartVoices', v.id)))
    setVoices([])
    setConfirmClear(false)
  }

  return (
    <SubPage
      title={`${characterName}的心声`}
      onBack={onBack}
      action={
        <button className="hv-list__clear-trigger" onClick={() => setConfirmClear(true)}>
          清除
        </button>
      }
    >
      <div className="hv-list">
        {confirmClear && (
          <div className="hv-list__confirm">
            <span className="hv-list__confirm-text">确定清除全部心声记录？</span>
            <button className="hv-list__confirm-yes" onClick={() => void clearAll()}>
              确定
            </button>
            <button className="hv-list__confirm-no" onClick={() => setConfirmClear(false)}>
              取消
            </button>
          </div>
        )}
        {!loaded ? (
          <p className="hv-list__empty">加载中…</p>
        ) : voices.length === 0 ? (
          <p className="hv-list__empty">暂无心声记录</p>
        ) : (
          <ul className="hv-list__items">
            {voices.map((v) => (
              <li key={v.id} className="hv-list__item">
                <time className="hv-list__time">
                  {new Date(v.createdAt).toLocaleString('zh-CN', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
                <p className="hv-list__content">{v.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SubPage>
  )
}
