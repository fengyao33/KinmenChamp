import { useNavigate } from 'react-router-dom'

/** 手繪品牌標。預設可點擊回首頁。 */
export default function Logo({
  className = 'h-9',
  clickable = true,
}: {
  className?: string
  clickable?: boolean
}) {
  const navigate = useNavigate()
  const img = (
    <img
      src="/logo.png"
      alt="島轉 金門一日遊"
      className={`${className} w-auto select-none`}
      draggable={false}
    />
  )
  if (!clickable) return img
  return (
    <button
      onClick={() => navigate('/')}
      aria-label="回首頁"
      className="rounded-lg transition hover:opacity-80 focus-visible:opacity-80"
    >
      {img}
    </button>
  )
}
