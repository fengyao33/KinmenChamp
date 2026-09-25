import { useMemo, useRef, useState } from 'react'
import { Clock3, Download, Images, Loader2, MapPin, Pencil, Plus, Search, Store, Trash2 } from 'lucide-react'
import { compressImage } from '../../data/leaderboard'
import {
  categoryLabel,
  loadDB,
  placeCandidates,
  saveDB,
  type AdminDB,
  type AdminStore,
  type Category,
} from '../data'
import { Btn, Card, EmptyState, Field, Modal, PageHeader, SelectField, StatusPill, Textarea, Toggle, useToast } from '../ui'

const CAT_OPTIONS: { value: Category; label: string }[] = [
  { value: 'food', label: '美食' },
  { value: 'culture', label: '文化' },
  { value: 'nature', label: '自然' },
  { value: 'shopping', label: '購物' },
]
const MAX_PHOTOS = 5
const MAX_PHOTO_MB = 15
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function Stores() {
  const toast = useToast()
  const [db, setDb] = useState<AdminDB>(loadDB())
  const [q, setQ] = useState('')
  const [importing, setImporting] = useState(false)
  const [editing, setEditing] = useState<AdminStore | null>(null)
  const [viewing, setViewing] = useState<AdminStore | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [stayError, setStayError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const update = (next: AdminDB) => {
    if (!saveDB(next)) {
      toast('儲存失敗，瀏覽器儲存空間可能已滿')
      return false
    }
    setDb(next)
    return true
  }

  const filtered = useMemo(
    () => db.stores.filter((s) => s.name.includes(q.trim())),
    [db.stores, q],
  )

  // 匯入商家:直接呼叫 Google Place API(原型以候選資料模擬),不跳視窗。
  const doImport = () => {
    if (importing) return
    setImporting(true)
    setTimeout(() => {
      const toAdd: AdminStore[] = placeCandidates
        .filter((c) => !db.stores.some((s) => s.name === c.name))
        .map((c) => ({ ...c, desc: '', stayMin: 60, photos: [], published: false, reviews: [] }))
      if (toAdd.length === 0) {
        setImporting(false)
        toast('目前沒有新商家可匯入')
        return
      }
      const saved = update({ ...db, stores: [...toAdd, ...db.stores] })
      setImporting(false)
      if (saved) toast('匯入完成')
    }, 1200)
  }

  const togglePublish = (id: string, on: boolean) => {
    update({ ...db, stores: db.stores.map((s) => (s.id === id ? { ...s, published: on } : s)) })
  }

  const saveEdit = (s: AdminStore) => {
    if (!Number.isInteger(s.stayMin) || s.stayMin < 1 || s.stayMin > 1440) {
      setStayError('請輸入 1 到 1440 分鐘的整數')
      return
    }
    if (!update({ ...db, stores: db.stores.map((x) => (x.id === s.id ? s : x)) })) return
    setEditing(null)
    setStayError('')
    toast('商家已更新')
  }

  const addPhotos = async (files: FileList | null) => {
    if (!files || !editing || photoBusy) return
    const room = MAX_PHOTOS - editing.photos.length
    if (room <= 0) return
    const selected = Array.from(files)
    if (selected.length > room) toast(`最多 ${MAX_PHOTOS} 張，已選取前 ${room} 張`)
    setPhotoBusy(true)
    const added: string[] = []
    for (const file of selected.slice(0, room)) {
      if (!IMAGE_TYPES.includes(file.type)) {
        toast(`「${file.name}」格式不支援，請使用 JPG、PNG 或 WebP`)
        continue
      }
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        toast(`「${file.name}」超過 ${MAX_PHOTO_MB}MB，已略過`)
        continue
      }
      try {
        added.push(await compressImage(file, 960, 0.72))
      } catch {
        toast(`「${file.name}」無法讀取，已略過`)
      }
    }
    setEditing((current) => current ? { ...current, photos: [...current.photos, ...added] } : current)
    setPhotoBusy(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const boundLabel = (id: string) => {
    const list = db.offers.filter((o) => o.storeId === id)
    const a = list.filter((o) => o.kind === 'activity').length
    const o = list.filter((o) => o.kind === 'offer').length
    if (a + o === 0) return null
    const parts = []
    if (a > 0) parts.push(`活動 ${a} 則`)
    if (o > 0) parts.push(`優惠 ${o} 則`)
    return `綁定 ${parts.join('、')}`
  }

  return (
    <div>
      <PageHeader
        title="管理「金門縣」商家"
        desc={
          <>
            (1) 點擊匯入商家按鈕,自動從 Google 匯入商家
            <br />
            (2) 剛匯入的商家未上架,請找到商家將上架開關打開
            <br />
            (3) 系統每個月自動匯入一次
          </>
        }
        actions={
          <Btn onClick={doImport} disabled={importing}>
            {importing ? (
              <Loader2 className="h-4 w-4 dz-spin-fast" strokeWidth={2.5} />
            ) : (
              <Download className="h-4 w-4" strokeWidth={2.5} />
            )}
            匯入商家
          </Btn>
        }
      />

      {/* 搜尋 */}
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-paper-300 bg-white px-3.5">
        <Search className="h-4 w-4 shrink-0 text-ink-400" strokeWidth={2} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋商家名稱"
          aria-label="搜尋商家名稱"
          className="min-h-11 w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Store className="h-6 w-6" strokeWidth={2} />}
          title={q ? '找不到符合的商家' : '還沒有商家'}
          hint={q ? '換個關鍵字試試。' : '點右上角「匯入商家」,自動從 Google 匯入金門商家。'}
          action={
            !q && (
              <Btn onClick={doImport} disabled={importing}>
                {importing ? (
                  <Loader2 className="h-4 w-4 dz-spin-fast" strokeWidth={2.5} />
                ) : (
                  <Download className="h-4 w-4" strokeWidth={2.5} />
                )}
                匯入商家
              </Btn>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <Card key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-ink-900">{s.name}</h3>
                  <span className="rounded-full bg-paper-200 px-2 py-0.5 text-xs font-medium text-ink-600">{categoryLabel[s.category]}</span>
                  <StatusPill on={s.published} />
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-ink-500">{s.desc || '尚未填寫特色說明'}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" strokeWidth={2} /> {s.lat.toFixed(4)}, {s.lng.toFixed(4)}</span>
                  <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" strokeWidth={2} /> 預設停留 {s.stayMin} 分鐘</span>
                  {boundLabel(s.id) && <span>· {boundLabel(s.id)}</span>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                {s.photos.length > 0 && (
                  <Btn variant="secondary" onClick={() => setViewing(s)}>
                    <Images className="h-4 w-4" strokeWidth={2} /> 照片 {s.photos.length} 張
                  </Btn>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-500">上架</span>
                  <Toggle checked={s.published} onChange={(v) => togglePublish(s.id, v)} label={`上架 ${s.name}`} />
                </div>
                <Btn variant="secondary" onClick={() => setEditing(s)}>
                  <Pencil className="h-4 w-4" strokeWidth={2} /> 編輯
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 編輯 Modal */}
      {editing && (
        <Modal
          open={!!editing}
          onClose={() => { if (!photoBusy) { setEditing(null); setStayError('') } }}
          title={`編輯「${editing.name}」`}
          footer={<Btn onClick={() => saveEdit(editing)} disabled={photoBusy}>{photoBusy ? '照片處理中' : '儲存'}</Btn>}
        >
          <div className="space-y-4">
            <Field label="商家名稱" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
            <SelectField label="分類" value={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} options={CAT_OPTIONS} />
            <Textarea label="特色說明" value={editing.desc} onChange={(v) => setEditing({ ...editing, desc: v })} placeholder="例如:在地料理,午餐首選" rows={3} />
            <div>
              <label htmlFor="store-stay-min" className="mb-1.5 block text-sm font-bold text-ink-900">預設停留時間（分鐘）</label>
              <input
                id="store-stay-min"
                type="number"
                min={1}
                max={1440}
                step={1}
                value={editing.stayMin || ''}
                onChange={(e) => { setEditing({ ...editing, stayMin: Number(e.target.value) }); setStayError('') }}
                aria-invalid={!!stayError}
                aria-describedby={stayError ? 'store-stay-error' : undefined}
                className={`min-h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-ink-900 outline-none focus:border-brick-400 focus:ring-4 focus:ring-brick-600/10 ${stayError ? 'border-red-400' : 'border-paper-300'}`}
              />
              {stayError && <p id="store-stay-error" role="alert" className="mt-1 text-xs text-red-600">{stayError}</p>}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-ink-900">商家照片</p>
                <span className="text-xs text-ink-500">{editing.photos.length} / {MAX_PHOTOS} 張</span>
              </div>
              {editing.photos.length > 0 && (
                <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {editing.photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square overflow-hidden rounded-xl bg-paper-100">
                      <img src={photo} alt={`${editing.name}第 ${index + 1} 張照片`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        aria-label={`移除第 ${index + 1} 張照片`}
                        onClick={() => setEditing({ ...editing, photos: editing.photos.filter((_, i) => i !== index) })}
                        className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-ink-900 shadow-sm hover:bg-white"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => addPhotos(e.target.files)} aria-label="選擇商家照片" />
              <Btn variant="secondary" onClick={() => fileRef.current?.click()} disabled={photoBusy || editing.photos.length >= MAX_PHOTOS}>
                {photoBusy ? <Loader2 className="h-4 w-4 dz-spin-fast" strokeWidth={2} /> : <Plus className="h-4 w-4" strokeWidth={2} />}
                {photoBusy ? '照片處理中' : '新增照片'}
              </Btn>
              <p className="mt-1.5 text-xs text-ink-500">最多 5 張，支援 JPG、PNG、WebP，單張 15MB 以內。照片會保存在此瀏覽器。</p>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-paper-100 p-3">
              <p className="text-sm font-bold text-ink-800">是否上架?</p>
              <Toggle checked={editing.published} onChange={(v) => setEditing({ ...editing, published: v })} label="是否上架" />
            </div>
          </div>
        </Modal>
      )}
      {viewing && (
        <Modal open onClose={() => setViewing(null)} title={`${viewing.name}的照片`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {viewing.photos.map((photo, index) => (
              <figure key={index} className="overflow-hidden rounded-xl bg-paper-100">
                <img src={photo} alt={`${viewing.name}第 ${index + 1} 張照片`} className="aspect-[4/3] w-full object-cover" />
                <figcaption className="px-3 py-2 text-xs text-ink-500">第 {index + 1} 張</figcaption>
              </figure>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
