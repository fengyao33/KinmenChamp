import { useMemo, useState } from 'react'
import { BadgePercent, CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react'
import { loadDB, saveDB, uid, type AdminDB, type OfferKind } from '../data'
import { Btn, Card, EmptyState, Field, Modal, PageHeader, SelectField, StatusPill, Toggle, useToast } from '../ui'

const KIND_OPTIONS: { value: OfferKind; label: string }[] = [
  { value: 'offer', label: '優惠' },
  { value: 'activity', label: '活動' },
]

export default function Offers() {
  const toast = useToast()
  const [db, setDb] = useState<AdminDB>(loadDB())
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [storeId, setStoreId] = useState(db.stores[0]?.id ?? '')
  const [kind, setKind] = useState<OfferKind>('offer')
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<AdminDB['offers'][number] | null>(null)

  const update = (next: AdminDB) => {
    setDb(next)
    saveDB(next)
  }
  const storeName = useMemo(() => Object.fromEntries(db.stores.map((s) => [s.id, s.name])), [db.stores])

  const openNew = () => {
    setEditingId(null)
    setStoreId(db.stores[0]?.id ?? '')
    setKind('offer')
    setTitle('')
    setError('')
    setOpen(true)
  }

  const openEdit = (o: AdminDB['offers'][number]) => {
    setEditingId(o.id)
    setStoreId(o.storeId)
    setKind(o.kind)
    setTitle(o.title)
    setError('')
    setOpen(true)
  }

  const save = () => {
    if (!storeId) {
      setError('請先到「金門商家」匯入商家')
      return
    }
    if (!title.trim()) {
      setError('請輸入內容')
      return
    }
    if (editingId) {
      update({ ...db, offers: db.offers.map((o) => (o.id === editingId ? { ...o, storeId, kind, title: title.trim() } : o)) })
      toast('已更新')
    } else {
      update({ ...db, offers: [{ id: uid(), storeId, kind, title: title.trim(), published: true }, ...db.offers] })
      toast('已新增')
    }
    setOpen(false)
  }

  const togglePublish = (id: string, on: boolean) => {
    update({ ...db, offers: db.offers.map((o) => (o.id === id ? { ...o, published: on } : o)) })
  }

  const confirmRemove = () => {
    if (!deleting) return
    update({ ...db, offers: db.offers.filter((o) => o.id !== deleting.id) })
    setDeleting(null)
    toast('已刪除')
  }

  return (
    <div>
      <PageHeader
        title="綁定商家活動與優惠"
        desc="綁定到商家後,旅客可以在地圖上看到商家對應標籤"
        actions={
          <Btn onClick={openNew}>
            <Plus className="h-4 w-4" strokeWidth={2.5} /> 新增
          </Btn>
        }
      />

      {db.offers.length === 0 ? (
        <EmptyState
          icon={<BadgePercent className="h-6 w-6" strokeWidth={2} />}
          title="還沒有活動或優惠"
          hint="點右上角「新增」,幫商家加上優惠或活動。"
          action={<Btn onClick={openNew}><Plus className="h-4 w-4" strokeWidth={2.5} /> 新增</Btn>}
        />
      ) : (
        <div className="space-y-3">
          {db.offers.map((o) => (
            <Card key={o.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${o.kind === 'offer' ? 'bg-brick-50 text-brick-600' : 'bg-ocean-50 text-ocean-600'}`}>
                  {o.kind === 'offer' ? <BadgePercent className="h-5 w-5" strokeWidth={2} /> : <CalendarDays className="h-5 w-5" strokeWidth={2} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${o.kind === 'offer' ? 'bg-brick-50 text-brick-700' : 'bg-ocean-50 text-ocean-700'}`}>
                      {o.kind === 'offer' ? '優惠' : '活動'}
                    </span>
                    <p className="font-bold text-ink-900">{o.title}</p>
                    <StatusPill on={o.published !== false} />
                  </div>
                  <p className="mt-0.5 text-sm text-ink-500">{storeName[o.storeId] ?? '(商家已刪除)'}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-500">上架</span>
                  <Toggle checked={o.published !== false} onChange={(v) => togglePublish(o.id, v)} label={`上架 ${o.title}`} />
                </div>
                <Btn variant="secondary" onClick={() => openEdit(o)}>
                  <Pencil className="h-4 w-4" strokeWidth={2} /> 編輯
                </Btn>
                <button onClick={() => setDeleting(o)} aria-label={`刪除 ${o.title}`} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? '編輯活動或優惠' : '新增活動或優惠'}
        footer={<Btn onClick={save}>{editingId ? '儲存' : '新增'}</Btn>}
      >
        <div className="space-y-4">
          {db.stores.length === 0 ? (
            <p className="text-sm text-ink-500">目前沒有商家,請先到「金門商家」匯入。</p>
          ) : (
            <>
              <SelectField label="綁定商家" value={storeId} onChange={setStoreId} options={db.stores.map((s) => ({ value: s.id, label: s.name }))} />
              <SelectField label="類型" value={kind} onChange={setKind} options={KIND_OPTIONS} />
              <Field label="內容" value={title} onChange={(v) => { setTitle(v); setError('') }} placeholder="例如:優惠 9 折 / 南管表演" />
              {error && <p className="text-sm font-medium text-red-600" role="alert">{error}</p>}
            </>
          )}
        </div>
      </Modal>

      {/* 刪除確認 */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="確定要刪除?"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setDeleting(null)}>取消</Btn>
            <Btn variant="danger" onClick={confirmRemove}>刪除</Btn>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          刪掉「{deleting?.title}」這則{deleting && (deleting.kind === 'offer' ? '優惠' : '活動')}後就找不回來了,確定要刪嗎?
        </p>
      </Modal>
    </div>
  )
}
