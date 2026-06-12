import { useState } from 'react'
import { useAppState } from '../../store/AppContext'
import ApiSettings from './ApiSettings'
import DisplaySettings from './DisplaySettings'
import './Profile.css'

type ProfileView = 'menu' | 'apiSettings' | 'displaySettings'

// "我的"模块入口：菜单 + 二级设置页
export default function ProfileModule() {
  const [view, setView] = useState<ProfileView>('menu')
  const { userProfile } = useAppState()

  if (view === 'apiSettings') {
    return <ApiSettings onBack={() => setView('menu')} />
  }
  if (view === 'displaySettings') {
    return <DisplaySettings onBack={() => setView('menu')} />
  }

  return (
    <div className="profile">
      <h1 className="profile__title">我的</h1>
      <div className="profile__card">
        <span className="profile__avatar">{(userProfile?.name ?? '京').slice(0, 1)}</span>
        <span className="profile__name">{userProfile?.name ?? '京京'}</span>
      </div>
      <ul className="profile__menu">
        <li>
          <button className="profile__menu-item" onClick={() => setView('apiSettings')}>
            <span>API 设置</span>
            <span className="profile__arrow">›</span>
          </button>
        </li>
        <li>
          <button className="profile__menu-item" onClick={() => setView('displaySettings')}>
            <span>显示设置</span>
            <span className="profile__arrow">›</span>
          </button>
        </li>
      </ul>
    </div>
  )
}
