const DEMO_RECENT = [
  { id: '1', content: '飘窗上一起看了很久的雨', color: '#C17C74', date: 'Jun 19' },
  { id: '2', content: '他第一次叫了我的名字', color: '#D4917A', date: 'Jun 18' },
]

export default function RecentList() {
  return (
    <div className="recent-list">
      <div className="recent-list__title">RECENT</div>
      {DEMO_RECENT.map((item, i) => (
        <div
          key={item.id}
          className={`recent-list__item${i < DEMO_RECENT.length - 1 ? ' recent-list__item--bordered' : ''}`}
        >
          <span className="recent-list__dot" style={{ backgroundColor: item.color }} />
          <span className="recent-list__text">{item.content}</span>
          <span className="recent-list__date">{item.date}</span>
        </div>
      ))}
    </div>
  )
}
