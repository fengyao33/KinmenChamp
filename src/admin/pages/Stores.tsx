import { useMemo, useState } from 'react'
import { Download, Loader2, MapPin, Pencil, Search, Store } from 'lucide-react'
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
  const [importing, setImporting] = useState(false)
  const [editing, setEditing] = useState<AdminStore | null>(null)

  const update = (next: AdminDB) => {
    setDb(next)
    saveDB(next)
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
        .map((c) => ({ ...c, desc: '', published: false, reviews: [] }))
      if (toAdd.length === 0) {
        setImporting(false)
        toast('目前沒有新商家可匯入')
        return
      }
      update({ ...db, stores: [...toAdd, ...db.stores] })
      setImporting(false)
      toast('匯入完成')
    }, 1200)
  }

  const togglePublish = (id: string, on: boolean) => {
    update({ ...db, stores: db.stores.map((s) => (s.id === id ? { ...s, published: on } : s)) })
  }

  const saveEdit = (s: AdminStore) => {
    update({ ...db, stores: db.stores.map((x) => (x.id === s.id ? s : x)) })
    setEditing(null)
    toast('商家已更新')
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
                <p className="mt-1 flex items-center gap-1 text-xs text-ink-400">
                  <MapPin className="h-3 w-3" strokeWidth={2} /> {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                  {boundLabel(s.id) && <span className="ml-2">· {boundLabel(s.id)}</span>}
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

      {/* 編輯 Modal */}
      {editing && (
        <Modal
          open={!!editing}
          onClose={() => setEditing(null)}
          title={`編輯「${editing.name}」`}
          footer={<Btn onClick={() => saveEdit(editing)}>儲存</Btn>}
        >
          <div className="space-y-4">
            <Field label="商家名稱" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
            <SelectField label="分類" value={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} options={CAT_OPTIONS} />
            <Textarea label="特色說明" value={editing.desc} onChange={(v) => setEditing({ ...editing, desc: v })} placeholder="例如:在地料理,午餐首選" rows={3} />
            <div className="flex items-center justify-between rounded-xl bg-paper-100 p-3">
              <p className="text-sm font-bold text-ink-800">是否上架?</p>
              <Toggle checked={editing.published} onChange={(v) => setEditing({ ...editing, published: v })} label="是否上架" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
