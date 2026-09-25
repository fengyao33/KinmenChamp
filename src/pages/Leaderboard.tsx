import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Crown, Heart, ImagePlus, Image as ImageIcon, Lock, MapPinned, ShieldCheck, Trophy, Upload, X } from 'lucide-react'
import Header from '../components/Header'
import { loadTrip, tripUrl } from '../data/trip'
import {
  compressImage,
  loadEntries,
  loadVoted,
  normalizePhone,
  rankByVotes,
  saveEntries,
  saveVoted,
  uid,
  type CreativeEntry,
} from '../data/leaderboard'
import { PRIVACY_CONSENT_LABEL, PRIVACY_SECTIONS, PRIVACY_TITLE } from '../content/privacyTerms'

const MAX_PHOTOS = 5
const TITLE_MAX = 30
const DESC_MAX = 300
const AUTHOR_MAX = 16
const FILE_MAX_MB = 15

// 沒照片時的封面底色(依 id 固定)
const COVERS = [
  'from-brick-100 to-sun-300/60',
  'from-ocean-100 to-paper-200',
  'from-sun-300/50 to-paper-200',
  'from-ocean-100 to-sun-300/40',
]
const coverOf = (id: string) => COVERS[id.charCodeAt(id.length - 1) % COVERS.length]

function Cover({ entry, className = '' }: { entry: CreativeEntry; className?: string }) {
  if (entry.photos[0]) {
    return <img src={entry.photos[0]} alt="" className={`object-cover ${className}`} />
  }
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br text-ocean-400 ${coverOf(entry.id)} ${className}`}>
      <ImageIcon className="h-6 w-6" strokeWidth={1.5} />
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  const style =
    rank === 1
      ? 'bg-sun-500 text-white'
      : rank === 2
        ? 'bg-ink-400 text-white'
        : rank === 3
          ? 'bg-ochre-500 text-white'
          : 'bg-paper-200 text-ink-500'
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${style}`} aria-label={`第 ${rank} 名`}>
      {rank === 1 ? <Crown className="h-4 w-4" strokeWidth={2.5} /> : rank}
    </span>
  )
}

function VoteButton({
  entry,
  voted,
  onVote,
  size = 'sm',
}: {
  entry: CreativeEntry
  voted: boolean
  onVote: () => void
  size?: 'sm' | 'lg'
}) {
  const big = size === 'lg'
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onVote()
      }}
      aria-pressed={voted}
      aria-label={`${voted ? '收回投給' : '投給'}「${entry.title}」,目前 ${entry.votes} 票`}
      className={`flex shrink-0 items-center justify-center gap-1.5 rounded-full font-bold transition active:scale-95 ${
        big ? 'min-h-12 w-full text-base' : 'min-h-11 flex-col px-3 py-1.5 text-xs'
      } ${voted ? 'bg-brick-600 text-white hover:bg-brick-700' : 'bg-brick-50 text-brick-700 hover:bg-brick-100'}`}
    >
      <Heart className={big ? 'h-5 w-5' : 'h-4 w-4'} strokeWidth={2.5} fill={voted ? 'currentColor' : 'none'} />
      <span>{big ? (voted ? `已投票,共 ${entry.votes} 票` : `投他一票,共 ${entry.votes} 票`) : entry.votes}</span>
    </button>
  )
}

/* 共用視窗:手機從底部滑上,桌機置中 */
function Sheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[900] flex items-end justify-center bg-ink-900/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="dz-sheet-in flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl outline-none ring-1 ring-ink-900/10 sm:max-w-lg sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-paper-200 px-5 py-4">
          <h2 className="text-lg font-black text-ink-900">{title}</h2>
          <button onClick={onClose} aria-label="關閉" className="flex h-10 w-10 items-center justify-center rounded-full text-ink-500 transition hover:bg-paper-100">
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-paper-200 bg-paper-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>
        )}
      </div>
    </div>
  )
}

/* 上傳創意路線(排行榜頁、地圖頁共用) */
export function UploadSheet({
  onClose,
  onSubmit,
  notify,
  hint,
}: {
  onClose: () => void
  onSubmit: (e: CreativeEntry) => boolean
  notify: (m: string) => void
  hint?: string
}) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [author, setAuthor] = useState('')
  const [phone, setPhone] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [showErr, setShowErr] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const errors = {
    title: !title.trim() ? '請填寫遊程名稱' : '',
    desc: !desc.trim() ? '請寫一段創意說明' : '',
    phone: !phone.trim() ? '請填寫聯絡電話' : !normalizePhone(phone) ? '電話格式不正確,例如 0912345678' : '',
    photos: photos.length === 0 ? '請至少放一張照片' : '',
    consent: !consent ? '請勾選同意個人資料蒐集告知事項' : '',
  }
  const hasError = Object.values(errors).some(Boolean)

  const pickFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return
    const room = MAX_PHOTOS - photos.length
    const files = Array.from(list)
    if (files.length > room) notify(`最多 ${MAX_PHOTOS} 張,已先放入前 ${room} 張`)
    setBusy(true)
    const next: string[] = []
    for (const f of files.slice(0, room)) {
      if (f.size > FILE_MAX_MB * 1024 * 1024) {
        notify(`「${f.name}」超過 ${FILE_MAX_MB}MB,已略過`)
        continue
      }
      try {
        next.push(await compressImage(f))
      } catch {
        notify(`「${f.name}」格式不支援,請改用 JPG 或 PNG`)
      }
    }
    setPhotos((p) => [...p, ...next].slice(0, MAX_PHOTOS))
    setBusy(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = () => {
    if (!consent) return
    if (hasError) {
      setShowErr(true)
      return
    }
    const ok = onSubmit({
      id: uid(),
      title: title.trim(),
      desc: desc.trim(),
      author: author.trim() || '匿名旅人',
      phone: normalizePhone(phone) ?? undefined,
      photos,
      votes: 0,
      createdAt: Date.now(),
      mine: true,
    })
    if (ok) onClose()
  }

  const inputCls =
    'w-full rounded-xl border bg-white px-3.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brick-400 focus:ring-4 focus:ring-brick-600/10'

  return (
    <Sheet
      title="上傳我的創意路線"
      onClose={onClose}
      footer={
        <>
          {!consent && (
            <p id="lb-consent-hint" className="mb-2.5 text-center text-xs font-medium text-ink-500">
              請先勾選同意個人資料蒐集告知事項,才能送出
            </p>
          )}
          <button
            onClick={submit}
            disabled={busy || !consent}
            aria-describedby={!consent ? 'lb-consent-hint' : undefined}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brick-600 text-base font-bold text-white transition hover:bg-brick-700 disabled:cursor-not-allowed disabled:bg-paper-300 disabled:text-ink-500 disabled:hover:bg-paper-300"
          >
            <Upload className="h-5 w-5" strokeWidth={2.5} />
            {busy ? '照片處理中' : '送出參賽'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {hint && (
          <p className="flex items-start gap-2 rounded-2xl bg-ocean-50 p-3.5 text-sm leading-relaxed text-ocean-700">
            <Camera className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.5} />
            {hint}
          </p>
        )}

        {/* 遊程名稱 */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="lb-title" className="text-sm font-bold text-ink-900">
              遊程名稱 <span className="text-brick-600">*</span>
            </label>
            <span className="text-xs text-ink-400">還可輸入 {TITLE_MAX - title.length} 字</span>
          </div>
          <input
            id="lb-title"
            value={title}
            maxLength={TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如:騎機車追夕陽"
            aria-invalid={showErr && !!errors.title}
            className={`${inputCls} min-h-12 ${showErr && errors.title ? 'border-red-400' : 'border-paper-300'}`}
          />
          {showErr && errors.title && <p className="mt-1 text-xs font-medium text-red-600">{errors.title}</p>}
        </div>

        {/* 創意說明 */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="lb-desc" className="text-sm font-bold text-ink-900">
              創意說明 <span className="text-brick-600">*</span>
            </label>
            <span className="text-xs text-ink-400">還可輸入 {DESC_MAX - desc.length} 字</span>
          </div>
          <textarea
            id="lb-desc"
            value={desc}
            maxLength={DESC_MAX}
            rows={4}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="這條路線哪裡有創意?怎麼走、推薦幾點去、有什麼私房亮點"
            aria-invalid={showErr && !!errors.desc}
            className={`${inputCls} resize-none py-3 leading-relaxed ${showErr && errors.desc ? 'border-red-400' : 'border-paper-300'}`}
          />
          {showErr && errors.desc && <p className="mt-1 text-xs font-medium text-red-600">{errors.desc}</p>}
        </div>

        {/* 暱稱 */}
        <div>
          <label htmlFor="lb-author" className="mb-1.5 block text-sm font-bold text-ink-900">
            暱稱 <span className="text-xs font-medium text-ink-400">(選填,不填顯示匿名旅人)</span>
          </label>
          <input
            id="lb-author"
            value={author}
            maxLength={AUTHOR_MAX}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="排行榜上顯示的名字"
            className={`${inputCls} min-h-12 border-paper-300`}
          />
        </div>

        {/* 聯絡電話(僅官方可見) */}
        <div>
          <label htmlFor="lb-phone" className="mb-1.5 block text-sm font-bold text-ink-900">
            聯絡電話 <span className="text-brick-600">*</span>
          </label>
          <input
            id="lb-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            maxLength={20}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912345678"
            aria-invalid={showErr && !!errors.phone}
            aria-describedby="lb-phone-note"
            className={`${inputCls} min-h-12 ${showErr && errors.phone ? 'border-red-400' : 'border-paper-300'}`}
          />
          <p id="lb-phone-note" className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-500">
            <Lock className="h-3.5 w-3.5 shrink-0 text-ocean-600" strokeWidth={2.5} />
            只給島轉官方人員聯繫活動用,不會公開顯示
          </p>
          {showErr && errors.phone && <p className="mt-1 text-xs font-medium text-red-600">{errors.phone}</p>}
        </div>

        {/* 照片 */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <p className="text-sm font-bold text-ink-900">
              照片 <span className="text-brick-600">*</span>
            </p>
            <span className="text-xs text-ink-400">
              {photos.length} 張,最多 {MAX_PHOTOS} 張
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-paper-100 ring-1 ring-ink-900/5">
                <img src={p} alt={`第 ${i + 1} 張照片`} className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded-full bg-ink-900/70 px-1.5 py-0.5 text-[10px] font-bold text-white">封面</span>
                )}
                <button
                  onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                  aria-label={`移除第 ${i + 1} 張照片`}
                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow transition hover:bg-white"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-xs font-bold transition hover:border-brick-400 hover:text-brick-600 disabled:opacity-60 ${
                  showErr && errors.photos ? 'border-red-400 text-red-600' : 'border-paper-300 text-ink-500'
                }`}
              >
                <ImagePlus className="h-6 w-6" strokeWidth={2} />
                {busy ? '處理中' : '新增照片'}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => pickFiles(e.target.files)}
            aria-label="選擇照片"
          />
          <p className="mt-1.5 text-xs text-ink-400">支援 JPG、PNG、WebP,單張 {FILE_MAX_MB}MB 以內,第一張會當封面</p>
          {showErr && errors.photos && <p className="mt-1 text-xs font-medium text-red-600">{errors.photos}</p>}
        </div>

        {/* 個資告知(內容置入區) */}
        <section
          aria-labelledby="lb-privacy-title"
          className={`overflow-hidden rounded-2xl border bg-paper-50 ${showErr && errors.consent ? 'border-red-400' : 'border-paper-300'}`}
        >
          <div className="flex items-center gap-2 px-4 pt-3.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-ocean-600" strokeWidth={2.5} />
            <h3 id="lb-privacy-title" className="text-sm font-bold text-ink-900">
              {PRIVACY_TITLE}
            </h3>
          </div>
          <div
            tabIndex={0}
            role="region"
            aria-label={`${PRIVACY_TITLE}全文`}
            className="mx-4 my-3 max-h-40 space-y-3 overflow-y-auto rounded-xl bg-white p-3.5 text-xs leading-relaxed text-ink-700 ring-1 ring-ink-900/5"
          >
            {PRIVACY_SECTIONS.map((s) => (
              <div key={s.heading}>
                <p className="font-bold text-ink-900">{s.heading}</p>
                <p className="mt-1 whitespace-pre-line">{s.body}</p>
              </div>
            ))}
          </div>
          <label className="flex cursor-pointer items-start gap-3 border-t border-paper-200 px-4 py-3.5">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              aria-invalid={showErr && !!errors.consent}
              className="mt-0.5 h-5 w-5 shrink-0 accent-brick-600"
            />
            <span className="text-sm font-medium text-ink-900">
              {PRIVACY_CONSENT_LABEL} <span className="text-brick-600">*</span>
            </span>
          </label>
        </section>
        {showErr && errors.consent && <p className="-mt-3 text-xs font-medium text-red-600">{errors.consent}</p>}
      </div>
    </Sheet>
  )
}

/* 投稿詳情 */
function DetailSheet({
  entry,
  rank,
  voted,
  onVote,
  onClose,
}: {
  entry: CreativeEntry
  rank: number
  voted: boolean
  onVote: () => void
  onClose: () => void
}) {
  const [idx, setIdx] = useState(0)
  const hasPhotos = entry.photos.length > 0
  return (
    <Sheet
      title={entry.title}
      onClose={onClose}
      footer={<VoteButton entry={entry} voted={voted} onVote={onVote} size="lg" />}
    >
      <div className="-mx-5 -mt-5 mb-4">
        {hasPhotos ? (
          <img src={entry.photos[idx]} alt={`「${entry.title}」第 ${idx + 1} 張照片`} className="aspect-[4/3] w-full bg-paper-100 object-cover" />
        ) : (
          <Cover entry={entry} className="aspect-[4/3] w-full" />
        )}
      </div>
      {entry.photos.length > 1 && (
        <div className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
          {entry.photos.map((p, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`看第 ${i + 1} 張照片`}
              aria-pressed={idx === i}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 transition ${idx === i ? 'ring-brick-600' : 'ring-transparent opacity-70 hover:opacity-100'}`}
            >
              <img src={p} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2.5">
        <RankBadge rank={rank} />
        <p className="text-sm text-ink-500">
          第 {rank} 名,由 <span className="font-bold text-ink-900">{entry.author}</span> 分享
        </p>
      </div>
      <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-ink-700">{entry.desc}</p>
    </Sheet>
  )
}

export default function Leaderboard() {
  const navigate = useNavigate()
  const savedTrip = loadTrip()
  const [entries, setEntries] = useState<CreativeEntry[]>(loadEntries)
  const [voted, setVoted] = useState<string[]>(loadVoted)
  const [sort, setSort] = useState<'hot' | 'new'>('hot')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)

  const notify = (m: string) => {
    setToast(m)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }

  const ranked = useMemo(() => rankByVotes(entries), [entries])
  const rankOf = useMemo(() => new Map(ranked.map((e, i) => [e.id, i + 1])), [ranked])
  const list = sort === 'hot' ? ranked : [...entries].sort((a, b) => b.createdAt - a.createdAt)
  const detail = detailId ? entries.find((e) => e.id === detailId) ?? null : null

  const toggleVote = (id: string) => {
    const has = voted.includes(id)
    const nextEntries = entries.map((e) => (e.id === id ? { ...e, votes: Math.max(0, e.votes + (has ? -1 : 1)) } : e))
    const nextVoted = has ? voted.filter((v) => v !== id) : [...voted, id]
    setEntries(nextEntries)
    setVoted(nextVoted)
    saveEntries(nextEntries)
    saveVoted(nextVoted)
    notify(has ? '已收回這一票' : '投票成功')
  }

  const addEntry = (e: CreativeEntry) => {
    const next = [e, ...entries]
    if (!saveEntries(next)) {
      notify('照片容量太大,請減少張數後再試')
      return false
    }
    setEntries(next)
    setSort('new')
    notify('上傳成功,快找朋友來投票')
    return true
  }

  return (
    <div className="min-h-screen bg-paper-100">
      <Header
        showBack
        backTo="/"
        right={
          savedTrip && (
            <button
              onClick={() => navigate(tripUrl(savedTrip.key))}
              aria-label="回到我的行程"
              className="inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full border border-paper-300 bg-white px-3 text-sm font-bold text-ink-700 transition hover:border-brick-400 hover:text-brick-700"
            >
              <MapPinned className="h-4 w-4 text-brick-600" strokeWidth={2.5} />
              我的行程
            </button>
          )
        }
      />

      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        {/* 吸頂區:標題 + 上傳 + 排序,捲動時固定在頂列下方 */}
        <div className="sticky top-16 z-20 -mx-4 border-b border-ink-900/5 bg-paper-100 px-4 pb-4 pt-6 sm:-mx-6 sm:px-6 sm:pt-10">
        {/* 標題 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sun-500 text-white shadow-md shadow-sun-500/30">
                <Trophy className="h-6 w-6" strokeWidth={2.25} />
              </span>
              <h1 className="text-3xl font-black tracking-tight text-ink-900">創意排行榜</h1>
            </div>
            <p className="mt-3 text-pretty text-base text-ink-500">分享你的金門玩法,讓大家投票選出最有創意的路線</p>
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brick-600 px-6 text-base font-bold text-white shadow-lg shadow-brick-600/20 transition hover:-translate-y-0.5 hover:bg-brick-700"
          >
            <Upload className="h-5 w-5" strokeWidth={2.5} />
            上傳我的路線
          </button>
        </div>

        {/* 排序 */}
        <div className="mt-5 grid max-w-xs grid-cols-2 gap-1 rounded-2xl bg-paper-200 p-1 sm:mt-6" role="group" aria-label="排序方式">
          {([
            { key: 'hot', label: '票數最高' },
            { key: 'new', label: '最新上傳' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setSort(t.key)}
              aria-pressed={sort === t.key}
              className={`min-h-11 rounded-xl text-sm font-bold transition ${sort === t.key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        </div>

        {/* 排行清單 */}
        {list.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-ink-900/5">
            <p className="font-bold text-ink-900">還沒有人上傳路線</p>
            <p className="mt-1 text-sm text-ink-500">成為第一個分享金門玩法的人</p>
          </div>
        ) : (
          <ol className="mt-5 space-y-3">
            {list.map((e) => {
              const rank = rankOf.get(e.id) ?? 0
              const top = rank <= 3
              return (
                <li key={e.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailId(e.id)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault()
                        setDetailId(e.id)
                      }
                    }}
                    aria-label={`查看「${e.title}」`}
                    className={`flex cursor-pointer items-center gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md sm:gap-4 sm:p-4 ${
                      rank === 1 ? 'ring-2 ring-sun-500/60' : top ? 'ring-ink-900/10' : 'ring-ink-900/5'
                    }`}
                  >
                    <RankBadge rank={rank} />
                    <Cover entry={e} className="h-16 w-16 shrink-0 rounded-2xl sm:h-20 sm:w-20" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h2 className="line-clamp-2 font-bold leading-snug text-ink-900 sm:line-clamp-1">{e.title}</h2>
                        {e.mine && <span className="rounded-full bg-ocean-50 px-2 py-0.5 text-[11px] font-bold text-ocean-700">我的投稿</span>}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-500 sm:text-sm">{e.desc}</p>
                      <p className="mt-1 text-[11px] text-ink-400">
                        {e.author}
                        {e.photos.length > 0 && `,${e.photos.length} 張照片`}
                      </p>
                    </div>
                    <VoteButton entry={e} voted={voted.includes(e.id)} onVote={() => toggleVote(e.id)} />
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        <p className="mt-6 text-center text-xs text-ink-400">每則路線每人可投一票,再按一次可收回</p>
      </main>

      {uploadOpen && (
        <UploadSheet
          hint="可以先截圖你的遊程畫面,當作照片上傳"
          onClose={() => setUploadOpen(false)}
          onSubmit={addEntry}
          notify={notify}
        />
      )}
      {detail && (
        <DetailSheet
          entry={detail}
          rank={rankOf.get(detail.id) ?? 0}
          voted={voted.includes(detail.id)}
          onVote={() => toggleVote(detail.id)}
          onClose={() => setDetailId(null)}
        />
      )}

      {toast && (
        <div role="status" className="dz-sheet-in fixed bottom-6 left-1/2 z-[950] -translate-x-1/2 rounded-full bg-ink-900/90 px-5 py-2.5 text-sm font-bold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
