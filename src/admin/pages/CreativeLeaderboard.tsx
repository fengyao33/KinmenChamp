import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye, EyeOff, Image as ImageIcon, Search, Trophy } from 'lucide-react'
import { loadEntries, type CreativeEntry } from '../../data/leaderboard'
import { loadModeration, moderationTimestamp, saveModeration, type ModerationMap } from '../leaderboardModeration'
import { Btn, Card, EmptyState, PageHeader, StatusPill, useToast } from '../ui'

type Filter = 'all' | 'visible' | 'hidden'
type Sort = 'new' | 'votes'

const REASONS = ['不當或違法內容', '廣告或垃圾內容', '侵犯隱私或著作權', '其他']
const formatDate = (time: number) => new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
}).format(time)

export default function CreativeLeaderboard() {
  const toast = useToast()
  const [entries, setEntries] = useState<CreativeEntry[]>(loadEntries)
  const [moderation, setModeration] = useState<ModerationMap>(loadModeration)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('new')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const reasonRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    const refresh = () => {
      setEntries(loadEntries())
      setModeration(loadModeration())
    }
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => {
    if (actionId && !moderation[actionId]) reasonRef.current?.focus()
  }, [actionId, moderation])

  const hiddenCount = entries.filter((entry) => !!moderation[entry.id]).length
  const visibleCount = entries.length - hiddenCount
  const list = useMemo(() => entries
    .filter((entry) => {
      const hidden = !!moderation[entry.id]
      if (filter === 'visible' && hidden) return false
      if (filter === 'hidden' && !hidden) return false
      const q = query.trim().toLocaleLowerCase()
      return !q || [entry.title, entry.desc, entry.author].some((value) => value.toLocaleLowerCase().includes(q))
    })
    .sort((a, b) => sort === 'new'
      ? b.createdAt - a.createdAt
      : b.votes - a.votes || a.createdAt - b.createdAt),
  [entries, moderation, query, filter, sort])

  const startAction = (id: string) => {
    setActionId(id)
    setReason('')
    setNote('')
    setError('')
    setExpandedId(id)
  }

  const confirmAction = (entry: CreativeEntry) => {
    const hidden = !!moderation[entry.id]
    if (!hidden && !reason) {
      setError('請選擇下架原因')
      reasonRef.current?.focus()
      return
    }
    const next = { ...moderation }
    if (hidden) delete next[entry.id]
    else next[entry.id] = { reason, note: note.trim(), updatedAt: moderationTimestamp() }
    if (!saveModeration(next)) {
      setError('無法儲存，請檢查瀏覽器儲存空間後重試')
      return
    }
    setModeration(next)
    setActionId(null)
    setError('')
    toast(hidden ? '已恢復上架狀態' : '已記錄下架狀態')
  }

  return (
    <div>
      <PageHeader title="管理創意排行榜" desc="旅客投稿後立即上架；發現不適當內容時，可查看全文與照片後下架。" />

      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-ink-700" role="note">
        <strong className="text-ink-900">前端展示：</strong>目前投稿與下架紀錄只存在這台裝置的瀏覽器。正式跨裝置下架與旅客端同步，需串接後端 API。
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3" aria-label="投稿統計">
        {[
          ['全部投稿', entries.length],
          ['已上架', visibleCount],
          ['已下架', hiddenCount],
        ].map(([label, count]) => (
          <Card key={label} className="px-3 py-3 sm:px-5 sm:py-4">
            <p className="text-xs font-medium text-ink-500 sm:text-sm">{label}</p>
            <p className="mt-1 text-xl font-black tabular-nums text-ink-900 sm:text-2xl">{count}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-4 grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
        <div>
          <label htmlFor="leaderboard-search" className="mb-1.5 block text-sm font-bold text-ink-800">搜尋投稿</label>
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input id="leaderboard-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋遊程名稱、內容或作者" className="min-h-11 w-full rounded-xl border border-paper-300 bg-white pl-10 pr-3 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:border-ocean-500 focus:ring-4 focus:ring-ocean-500/15" />
          </div>
        </div>
        <div>
          <label htmlFor="leaderboard-filter" className="mb-1.5 block text-sm font-bold text-ink-800">上架狀態</label>
          <select id="leaderboard-filter" value={filter} onChange={(event) => setFilter(event.target.value as Filter)} className="min-h-11 w-full rounded-xl border border-paper-300 bg-white px-3 text-sm text-ink-900 focus:border-ocean-500 focus:ring-4 focus:ring-ocean-500/15">
            <option value="all">全部</option><option value="visible">已上架</option><option value="hidden">已下架</option>
          </select>
        </div>
        <div>
          <label htmlFor="leaderboard-sort" className="mb-1.5 block text-sm font-bold text-ink-800">排序</label>
          <select id="leaderboard-sort" value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="min-h-11 w-full rounded-xl border border-paper-300 bg-white px-3 text-sm text-ink-900 focus:border-ocean-500 focus:ring-4 focus:ring-ocean-500/15">
            <option value="new">最新上傳</option><option value="votes">票數最高</option>
          </select>
        </div>
      </Card>

      <p className="mb-3 text-sm text-ink-500" role="status">顯示 {list.length} 則投稿</p>
      {list.length === 0 ? (
        <EmptyState icon={<Trophy className="h-6 w-6" />} title={entries.length ? '找不到符合條件的投稿' : '目前還沒有投稿'} hint={entries.length ? '試著清除搜尋字，或切換上架狀態。' : '旅客投稿後會顯示在這裡。'} />
      ) : (
        <div className="space-y-3">
          {list.map((entry) => {
            const record = moderation[entry.id]
            const expanded = expandedId === entry.id
            const acting = actionId === entry.id
            return (
              <Card key={entry.id} className="overflow-hidden">
                <article aria-labelledby={`entry-title-${entry.id}`}>
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 gap-3">
                      {entry.photos[0] ? <img src={entry.photos[0]} alt="" className="h-16 w-16 shrink-0 rounded-xl bg-paper-100 object-cover" /> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-paper-100 text-ink-400"><ImageIcon aria-hidden="true" className="h-6 w-6" /></div>}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 id={`entry-title-${entry.id}`} className="break-words font-bold text-ink-900">{entry.title}</h2>
                          <StatusPill on={!record} />
                        </div>
                        <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-ink-600">{entry.desc}</p>
                        <p className="mt-1 text-xs text-ink-500">{entry.author} · {formatDate(entry.createdAt)} · {entry.votes} 票 · {entry.photos.length} 張照片</p>
                      </div>
                    </div>
                    <Btn variant="secondary" aria-expanded={expanded} aria-controls={`entry-detail-${entry.id}`} onClick={() => { setExpandedId(expanded ? null : entry.id); setActionId(null) }} className="shrink-0 focus-visible:ring-4 focus-visible:ring-ocean-500/30">
                      {expanded ? '收合內容' : '查看內容'}
                    </Btn>
                  </div>

                  {expanded && <div id={`entry-detail-${entry.id}`} className="border-t border-paper-200 px-4 py-5">
                    <h3 className="text-sm font-bold text-ink-900">投稿內容</h3>
                    <p className="mt-2 whitespace-pre-line break-words text-sm leading-7 text-ink-700">{entry.desc}</p>
                    <h3 className="mt-5 text-sm font-bold text-ink-900">照片（{entry.photos.length} 張）</h3>
                    {entry.photos.length ? <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {entry.photos.map((photo, index) => <a key={index} href={photo} target="_blank" rel="noopener noreferrer" aria-label={`另開視窗查看「${entry.title}」第 ${index + 1} 張照片`} className="block rounded-xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-ocean-500"><img src={photo} alt={`「${entry.title}」第 ${index + 1} 張照片`} className="aspect-[4/3] w-full rounded-xl bg-paper-100 object-cover" /></a>)}
                    </div> : <p className="mt-2 text-sm text-ink-500">此投稿沒有照片。</p>}
                    <div className="mt-5 rounded-xl bg-paper-100 p-3 text-sm text-ink-700">
                      <p><strong>投稿者：</strong>{entry.author}</p>
                      <p className="mt-1"><strong>聯絡電話（僅後台）：</strong>{entry.phone || '未提供'}</p>
                      <p className="mt-1"><strong>上傳時間：</strong>{formatDate(entry.createdAt)}</p>
                    </div>
                    {record && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-ink-700">
                      <p><strong>下架原因：</strong>{record.reason}</p>
                      {record.note && <p className="mt-1 whitespace-pre-line break-words"><strong>處理備註：</strong>{record.note}</p>}
                      <p className="mt-1 text-xs text-ink-500">處理時間：{formatDate(record.updatedAt)}</p>
                    </div>}
                    {!acting ? <Btn variant={record ? 'secondary' : 'danger'} onClick={() => startAction(entry.id)} className="mt-5 focus-visible:ring-4 focus-visible:ring-ocean-500/30">
                      {record ? <Eye aria-hidden="true" className="h-4 w-4" /> : <EyeOff aria-hidden="true" className="h-4 w-4" />}
                      {record ? '恢復上架' : '下架投稿'}
                    </Btn> : <div className="mt-5 rounded-xl border border-paper-300 bg-paper-50 p-4">
                      <h3 className="font-bold text-ink-900">{record ? '確認恢復上架？' : '確認下架這則投稿？'}</h3>
                      <p className="mt-1 text-sm text-ink-600">{record ? '恢復後，這則投稿會重新列為已上架。' : '保留投稿與票數紀錄，方便日後查核或恢復。'}</p>
                      {!record && <div className="mt-4 space-y-3">
                        <div>
                          <label htmlFor={`reason-${entry.id}`} className="mb-1 block text-sm font-bold text-ink-800">下架原因 <span className="text-red-600">*</span></label>
                          <select ref={reasonRef} id={`reason-${entry.id}`} value={reason} onChange={(event) => { setReason(event.target.value); setError('') }} aria-invalid={!!error && !reason} aria-describedby={error ? `action-error-${entry.id}` : undefined} className="min-h-11 w-full rounded-xl border border-paper-300 bg-white px-3 text-sm text-ink-900 focus:border-ocean-500 focus:ring-4 focus:ring-ocean-500/15">
                            <option value="">請選擇原因</option>{REASONS.map((value) => <option key={value} value={value}>{value}</option>)}
                          </select>
                        </div>
                        <div>
                          <label htmlFor={`note-${entry.id}`} className="mb-1 block text-sm font-bold text-ink-800">處理備註（選填）</label>
                          <textarea id={`note-${entry.id}`} value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} rows={2} placeholder="例如：哪張照片或哪段文字有問題" className="w-full rounded-xl border border-paper-300 bg-white p-3 text-sm text-ink-900 focus:border-ocean-500 focus:ring-4 focus:ring-ocean-500/15" />
                        </div>
                      </div>}
                      {error && <p id={`action-error-${entry.id}`} className="mt-3 text-sm font-medium text-red-700" role="alert">{error}</p>}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Btn variant={record ? 'primary' : 'danger'} onClick={() => confirmAction(entry)} className="focus-visible:ring-4 focus-visible:ring-ocean-500/30">{record ? '確認恢復上架' : '確認下架'}</Btn>
                        <Btn variant="secondary" onClick={() => { setActionId(null); setError('') }} className="focus-visible:ring-4 focus-visible:ring-ocean-500/30">取消</Btn>
                      </div>
                    </div>}
                  </div>}
                </article>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
