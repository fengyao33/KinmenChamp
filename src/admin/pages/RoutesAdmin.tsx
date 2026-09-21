import { useRef, useState } from 'react'
import { GripVertical, Pencil, Plus, Route as RouteIcon, Trash2, X } from 'lucide-react'
import { loadDB, saveDB, uid, type AdminDB, type AdminRoute } from '../data'
import { Btn, Card, EmptyState, Field, Modal, PageHeader, SelectField, StatusPill, Textarea, Toggle, useToast } from '../ui'

const THEME_OPTIONS = [
  { value: 'brick' as const, label: '磚紅' },
  { value: 'ocean' as const, label: '海藍' },
  { value: 'ochre' as const, label: '赭黃' },
]

const blank = (): AdminRoute => ({ id: uid(), title: '', summary: '', theme: 'brick', storeIds: [], stays: {}, published: false })

export default function RoutesAdmin() {
  const toast = useToast()
  const [db, setDb] = useState<AdminDB>(loadDB())
  const [editing, setEditing] = useState<AdminRoute | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [deleting, setDeleting] = useState<AdminRoute | null>(null)

  const update = (next: AdminDB) => {
    setDb(next)
    saveDB(next)
  }
  const name = (id: string) => db.stores.find((s) => s.id === id)?.name ?? '(已刪除)'
  const availableStores = db.stores.filter((s) => !editing?.storeIds.includes(s.id))

  const openNew = () => {
    setEditing(blank())
    setIsNew(true)
  }
  const openEdit = (r: AdminRoute) => {
    setEditing({ ...r })
    setIsNew(false)
  }

  const save = () => {
    if (!editing) return
    if (!editing.title.trim()) {
      toast('請輸入遊程名稱')
      return
    }
    if (editing.storeIds.length < 2) {
      toast('至少挑 2 個站點')
      return
    }
    const next = isNew
      ? { ...db, routes: [editing, ...db.routes] }
      : { ...db, routes: db.routes.map((r) => (r.id === editing.id ? editing : r)) }
    update(next)
    setEditing(null)
    toast(isNew ? '遊程已建立' : '遊程已更新')
  }

  const confirmRemove = () => {
    if (!deleting) return
    update({ ...db, routes: db.routes.filter((r) => r.id !== deleting.id) })
    setDeleting(null)
    toast('遊程已刪除')
  }

  const togglePublish = (id: string, on: boolean) =>
    update({ ...db, routes: db.routes.map((r) => (r.id === id ? { ...r, published: on } : r)) })

  // 拖曳排序:用 pointer 事件,滑鼠與觸控都能拖
  const dragFrom = useRef<number | null>(null)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])
  const [dragging, setDragging] = useState<number | null>(null)

  const onDragStart = (i: number, e: React.PointerEvent) => {
    dragFrom.current = i
    setDragging(i)
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onDragMove = (e: React.PointerEvent) => {
    if (dragFrom.current === null || !editing) return
    const y = e.clientY
    const ids = editing.storeIds
    let target = ids.length - 1
    for (let k = 0; k < ids.length; k++) {
      const el = itemRefs.current[k]
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (y < rect.top + rect.height / 2) {
        target = k
        break
      }
    }
    if (target !== dragFrom.current) {
      const next = [...ids]
      const [moved] = next.splice(dragFrom.current, 1)
      next.splice(target, 0, moved)
      dragFrom.current = target
      setDragging(target)
      setEditing({ ...editing, storeIds: next })
    }
  }
  const onDragEnd = () => {
    dragFrom.current = null
    setDragging(null)
  }

  const setStay = (id: string, v: string) => {
    if (!editing) return
    setEditing({ ...editing, stays: { ...(editing.stays ?? {}), [id]: v } })
  }

  return (
    <div>
      <PageHeader
        title="編排精選遊程"
        desc="挑選商家並排好順序,提供島轉精選遊程給旅客"
        actions={
          <Btn onClick={openNew}>
            <Plus className="h-4 w-4" strokeWidth={2.5} /> 新增遊程
          </Btn>
        }
      />

      {db.routes.length === 0 ? (
        <EmptyState
          icon={<RouteIcon className="h-6 w-6" strokeWidth={2} />}
          title="還沒有遊程"
          hint="點「新增遊程」,挑幾個商家排成一條路線。"
          action={<Btn onClick={openNew}><Plus className="h-4 w-4" strokeWidth={2.5} /> 新增遊程</Btn>}
        />
      ) : (
        <div className="space-y-3">
          {db.routes.map((r) => (
            <Card key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-ink-900">{r.title}</h3>
                  <StatusPill on={r.published} />
                </div>
                <p className="mt-1 text-sm text-ink-500">{r.summary}</p>
                <p className="mt-1 text-xs text-ink-400">共 {r.storeIds.length} 站:{r.storeIds.map(name).join(' → ')}</p>
              </div>
              <div className="flex items-center gap-3 sm:shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-500">上架</span>
                  <Toggle checked={r.published} onChange={(v) => togglePublish(r.id, v)} label={`上架 ${r.title}`} />
                </div>
                <Btn variant="secondary" onClick={() => openEdit(r)}>
                  <Pencil className="h-4 w-4" strokeWidth={2} /> 編輯
                </Btn>
                <button onClick={() => setDeleting(r)} aria-label={`刪除 ${r.title}`} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <Modal
          open={!!editing}
          onClose={() => setEditing(null)}
          title={isNew ? '新增遊程' : `編輯「${editing.title || '遊程'}」`}
          footer={<Btn onClick={save}>{isNew ? '新增' : '儲存'}</Btn>}
        >
          <div className="space-y-4">
            <Field label="遊程名稱" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} placeholder="例如:後浦老城散步" />
            <Textarea label="一句話介紹" value={editing.summary} onChange={(v) => setEditing({ ...editing, summary: v })} placeholder="例如:走進金城後浦,老屋與商圈一次逛。" rows={2} />
            <SelectField label="主題色" value={editing.theme} onChange={(v) => setEditing({ ...editing, theme: v })} options={THEME_OPTIONS} />

            {/* 已選站點(可排序) */}
            <div>
              <p className="mb-1.5 text-sm font-bold text-ink-800">
                路線站點({editing.storeIds.length})
                {editing.storeIds.length > 1 && <span className="ml-2 font-medium text-ink-400">拖曳左側把手可調整順序</span>}
              </p>
              {editing.storeIds.length === 0 ? (
                <p className="rounded-xl bg-paper-100 p-3 text-sm text-ink-400">還沒有站點,從下方「可加入的商家」挑選。</p>
              ) : (
                <ol className="space-y-2">
                  {editing.storeIds.map((id, i) => (
                    <li
                      key={id}
                      ref={(el) => { itemRefs.current[i] = el }}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 transition ${dragging === i ? 'border-brick-400 bg-brick-50 shadow-md' : 'border-paper-200 bg-white'}`}
                    >
                      <button
                        onPointerDown={(e) => onDragStart(i, e)}
                        onPointerMove={onDragMove}
                        onPointerUp={onDragEnd}
                        onPointerCancel={onDragEnd}
                        aria-label={`拖曳排序 ${name(id)}`}
                        style={{ touchAction: 'none' }}
                        className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-ink-400 transition hover:bg-paper-200 active:cursor-grabbing"
                      >
                        <GripVertical className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brick-600 text-xs font-black text-white">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-800">{name(id)}</span>
                      <div className="flex shrink-0 items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={editing.stays?.[id] ?? ''}
                          onChange={(e) => setStay(id, e.target.value)}
                          placeholder="30"
                          aria-label={`${name(id)} 停留分鐘`}
                          className="h-8 w-14 rounded-lg border border-paper-300 bg-white px-2 text-right text-xs text-ink-800 outline-none placeholder:text-ink-400 focus:border-brick-400"
                        />
                        <span className="text-xs text-ink-400">分鐘</span>
                      </div>
                      <button onClick={() => setEditing({ ...editing, storeIds: editing.storeIds.filter((x) => x !== id) })} aria-label="移除" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition hover:bg-red-50 hover:text-red-600">
                        <X className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* 可加入 */}
            <div>
              <p className="mb-1.5 text-sm font-bold text-ink-800">可加入的商家</p>
              {availableStores.length === 0 ? (
                <p className="rounded-xl bg-paper-100 p-3 text-sm text-ink-400">沒有可加入的商家了。</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableStores.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setEditing({ ...editing, storeIds: [...editing.storeIds, s.id] })}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-paper-300 bg-white px-3 text-sm font-medium text-ink-700 transition hover:border-brick-400 hover:text-brick-700"
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={2.5} /> {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

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
          刪掉「{deleting?.title}」這條遊程後就找不回來了,確定要刪嗎?
        </p>
      </Modal>
    </div>
  )
}
