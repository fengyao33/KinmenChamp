import { useMemo, useState } from 'react'
import { BadgePercent, CalendarDays, Plus, Trash2 } from 'lucide-react'
import { loadDB, saveDB, uid, type AdminDB, type OfferKind } from '../data'
import { Btn, Card, EmptyState, Field, Modal, PageHeader, SelectField, useToast } from '../ui'

const KIND_OPTIONS: { value: OfferKind; label: string }[] = [
  { value: 'offer', label: '優惠' },
  { value: 'activity', label: '活動' },
]

export default function Offers() {
  const toast = useToast()
  const [db, setDb] = useState<AdminDB>(loadDB())
  const [open, setOpen] = useState(false)
  const [storeId, setStoreId] = useState(db.stores[0]?.id ?? '')
  const [kind, setKind] = useState<OfferKind>('offer')
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')

  const update = (next: AdminDB) => {
    setDb(next)
    saveDB(next)
  }
  const storeName = useMemo(() => Object.fromEntries(db.stores.map((s) => [s.id, s.name])), [db.stores])

  const add = () => {
    if (!storeId) {
      setError('請先到「店家管理」匯入店家')
      return
    }
    if (!title.trim()) {
      setError('請輸入內容')
      return
    }
    update({ ...db, offers: [{ id: uid(), storeId, kind, title: title.trim() }, ...db.offers] })
    setTitle('')
    setError('')
    setOpen(false)
    toast('已新增')
  }

  const remove = (id: string) => {
    update({ ...db, offers: db.offers.filter((o) => o.id !== id) })
    toast('已刪除')
  }

  return (
    <div>
      <PageHeader
        title="活動與優惠"
        desc="新增優惠或活動,綁定到店家後,旅客在地圖 pin 上會看到對應標籤。"
        actions={
          <Btn onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={2.5} /> 新增
          </Btn>
        }
      />

      {db.offers.length === 0 ? (
        <EmptyState
          icon={<BadgePercent className="h-6 w-6" strokeWidth={2} />}
          title="還沒有活動或優惠"
          hint="點右上角「新增」,幫店家加上優惠或活動。"
          action={<Btn onClick={() => setOpen(true)}><Plus className="h-4 w-4" strokeWidth={2.5} /> 新增</Btn>}
        />
      ) : (
        <div className="space-y-3">
          {db.offers.map((o) => (
            <Card key={o.id} className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${o.kind === 'offer' ? 'bg-brick-50 text-brick-600' : 'bg-ocean-50 text-ocean-600'}`}>
                {o.kind === 'offer' ? <BadgePercent className="h-5 w-5" strokeWidth={2} /> : <CalendarDays className="h-5 w-5" strokeWidth={2} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${o.kind === 'offer' ? 'bg-brick-50 text-brick-700' : 'bg-ocean-50 text-ocean-700'}`}>
                    {o.kind === 'offer' ? '優惠' : '活動'}
                  </span>
                  <p className="font-bold text-ink-900">{o.title}</p>
                </div>
                <p className="mt-0.5 text-sm text-ink-500">{storeName[o.storeId] ?? '(店家已刪除)'}</p>
              </div>
              <button onClick={() => remove(o.id)} aria-label="刪除" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-400 transition hover:bg-red-50 hover:text-red-600">
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新增活動 / 優惠"
        footer={<Btn onClick={add}>新增</Btn>}
      >
        <div className="space-y-4">
          {db.stores.length === 0 ? (
            <p className="text-sm text-ink-500">目前沒有店家,請先到「店家管理」匯入。</p>
          ) : (
            <>
              <SelectField label="綁定店家" value={storeId} onChange={setStoreId} options={db.stores.map((s) => ({ value: s.id, label: s.name }))} />
              <SelectField label="類型" value={kind} onChange={setKind} options={KIND_OPTIONS} />
              <Field label="內容" value={title} onChange={(v) => { setTitle(v); setError('') }} placeholder="例如:優惠 9 折 / 南管表演" />
              {error && <p className="text-sm font-medium text-red-600" role="alert">{error}</p>}
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
