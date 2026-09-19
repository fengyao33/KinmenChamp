import { useMemo, useState } from 'react'
import { Download, MapPin, Pencil, Plus, Search, Store, Trash2 } from 'lucide-react'
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

export default function Stores() {
  const toast = useToast()
  const [db, setDb] = useState<AdminDB>(loadDB())
  const [q, setQ] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [editing, setEditing] = useState<AdminStore | null>(null)

  const update = (next: AdminDB) => {
    setDb(next)
    saveDB(next)
  }

  const filtered = useMemo(
    () => db.stores.filter((s) => s.name.includes(q.trim())),
    [db.stores, q],
  )
  const importable = placeCandidates.filter((c) => !db.stores.some((s) => s.name === c.name))

  const importStore = (c: (typeof placeCandidates)[number]) => {
    const store: AdminStore = { ...c, desc: '', published: false, reviews: [] }
    update({ ...db, stores: [store, ...db.stores] })
    toast(`已匯入「${c.name}」`)
  }

  const togglePublish = (id: string, on: boolean) => {
    update({ ...db, stores: db.stores.map((s) => (s.id === id ? { ...s, published: on } : s)) })
  }

  const saveEdit = (s: AdminStore) => {
    update({ ...db, stores: db.stores.map((x) => (x.id === s.id ? s : x)) })
    setEditing(null)
    toast('店家已更新')
  }

  const removeStore = (id: string) => {
    update({ ...db, stores: db.stores.filter((s) => s.id !== id), offers: db.offers.filter((o) => o.storeId !== id) })
    setEditing(null)
    toast('店家已刪除')
  }

  const offerCount = (id: string) => db.offers.filter((o) => o.storeId === id).length

  return (
    <div>
      <PageHeader
        title="店家管理"
        desc="從 Google Place 匯入店家,維護特色說明、分類,決定是否上架給旅客看到。"
        actions={
          <Btn onClick={() => setImportOpen(true)}>
            <Download className="h-4 w-4" strokeWidth={2.5} /> 匯入店家
          </Btn>
        }
      />

      {/* 搜尋 */}
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-paper-300 bg-white px-3.5">
        <Search className="h-4 w-4 shrink-0 text-ink-400" strokeWidth={2} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋店家名稱"
          aria-label="搜尋店家名稱"
          className="min-h-11 w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Store className="h-6 w-6" strokeWidth={2} />}
          title={q ? '找不到符合的店家' : '還沒有店家'}
          hint={q ? '換個關鍵字試試。' : '點右上角「匯入店家」,從 Google Place 匯入金門店家。'}
          action={!q && <Btn onClick={() => setImportOpen(true)}><Download className="h-4 w-4" strokeWidth={2.5} /> 匯入店家</Btn>}
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
                <p className="mt-1 flex items-center gap-1 text-xs text-ink-400">
                  <MapPin className="h-3 w-3" strokeWidth={2} /> {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                  {offerCount(s.id) > 0 && <span className="ml-2">· 綁定 {offerCount(s.id)} 則活動優惠</span>}
                </p>
              </div>
              <div className="flex items-center gap-3 sm:shrink-0">
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

      {/* 匯入 Modal */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="從 Google Place 匯入店家">
        <p className="mb-4 text-sm text-ink-500">
          以下是 Google Place 回傳的候選店家(含座標與基礎資訊)。點「匯入」加入清單,匯入後記得補特色說明並上架。
        </p>
        {importable.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-400">候選店家都已匯入了。</p>
        ) : (
          <div className="space-y-2">
            {importable.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-paper-200 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink-900">{c.name}</p>
                  <p className="text-xs text-ink-400">
                    {categoryLabel[c.category]} · ★ {c.rating}({c.reviewCount})
                  </p>
                </div>
                <Btn variant="secondary" onClick={() => importStore(c)}>
                  <Plus className="h-4 w-4" strokeWidth={2.5} /> 匯入
                </Btn>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* 編輯 Modal */}
      {editing && (
        <Modal
          open={!!editing}
          onClose={() => setEditing(null)}
          title={`編輯「${editing.name}」`}
          footer={
            <>
              <Btn variant="danger" onClick={() => removeStore(editing.id)}>
                <Trash2 className="h-4 w-4" strokeWidth={2} /> 刪除
              </Btn>
              <Btn onClick={() => saveEdit(editing)}>儲存</Btn>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="店家名稱" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
            <SelectField label="分類" value={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} options={CAT_OPTIONS} />
            <Textarea label="特色說明" value={editing.desc} onChange={(v) => setEditing({ ...editing, desc: v })} placeholder="例如:在地料理,午餐首選" rows={3} />
            <div className="flex items-center justify-between rounded-xl bg-paper-100 p-3">
              <div>
                <p className="text-sm font-bold text-ink-800">上架給旅客</p>
                <p className="text-xs text-ink-500">關閉後旅客地圖不會顯示這家店</p>
              </div>
              <Toggle checked={editing.published} onChange={(v) => setEditing({ ...editing, published: v })} label="上架給旅客" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
