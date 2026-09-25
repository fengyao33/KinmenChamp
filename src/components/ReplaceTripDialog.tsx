import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

/* 產生新遊程前的提醒:旅客改過的行程會被取代 */
export default function ReplaceTripDialog({
  tripName,
  onBack,
  onReplace,
  onClose,
}: {
  tripName: string
  onBack: () => void // 回到我的行程
  onReplace: () => void // 用新遊程取代
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="fixed inset-0 z-[900] flex items-end justify-center bg-ink-900/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="要用新遊程取代嗎?"
        onClick={(e) => e.stopPropagation()}
        className="dz-sheet-in w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl outline-none ring-1 ring-ink-900/10 sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-paper-200 px-5 py-4">
          <h2 className="font-black text-ink-900">要用新遊程取代嗎?</h2>
          <button onClick={onClose} aria-label="關閉" className="flex h-10 w-10 items-center justify-center rounded-full text-ink-500 transition hover:bg-paper-100">
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
        <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <p className="text-sm leading-relaxed text-ink-700">
            你改過的「<span className="font-bold text-ink-900">{tripName}</span>」還存在這台裝置。
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            產生新的遊程後,這份行程就會被<span className="font-bold text-brick-700">新的遊程取代</span>。
          </p>
          <div className="mt-6 flex gap-2.5">
            <button
              onClick={onBack}
              className="min-h-12 flex-1 rounded-full border border-paper-300 text-sm font-bold text-ink-700 transition hover:bg-paper-100"
            >
              回到我的行程
            </button>
            <button
              onClick={onReplace}
              className="min-h-12 flex-1 rounded-full bg-brick-600 text-sm font-bold text-white transition hover:bg-brick-700"
            >
              用新遊程取代
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
