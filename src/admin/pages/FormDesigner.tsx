import { useRef, useState } from 'react'
import { GripVertical, ListChecks, Pencil, Plus, Trash2, X } from 'lucide-react'
import { loadDB, saveDB, uid, type AdminDB, type FieldType, type FormField } from '../data'
import { Btn, Card, EmptyState, Field, Modal, PageHeader, SelectField, StatusPill, Textarea, Toggle, useToast } from '../ui'

const TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: 'single', label: '單選' },
  { value: 'multi', label: '複選' },
  { value: 'text', label: '自由填答' },
]
const typeLabel = (t: FieldType) => TYPE_OPTIONS.find((o) => o.value === t)!.label
const blank = (): FormField => ({ id: uid(), label: '', type: 'single', options: ['選項一'], published: true })

export default function FormDesigner() {
  const toast = useToast()
  const [db, setDb] = useState<AdminDB>(loadDB())
  const [editing, setEditing] = useState<FormField | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [deleting, setDeleting] = useState<FormField | null>(null)

  const update = (next: AdminDB) => {
    setDb(next)
    saveDB(next)
  }

  const save = () => {
    if (!editing) return
    if (!editing.label.trim()) {
      toast('請輸入題目')
      return
    }
    const cleaned = { ...editing, options: editing.type === 'text' ? [] : editing.options.map((o) => o.trim()).filter(Boolean) }
    if (cleaned.type !== 'text' && cleaned.options.length < 2) {
      toast('選擇題至少要 2 個選項')
      return
    }
    update(isNew ? { ...db, form: [...db.form, cleaned] } : { ...db, form: db.form.map((f) => (f.id === cleaned.id ? cleaned : f)) })
    setEditing(null)
    toast(isNew ? '題目已新增' : '題目已更新')
  }

  const confirmRemove = () => {
    if (!deleting) return
    update({ ...db, form: db.form.filter((f) => f.id !== deleting.id) })
    setDeleting(null)
    toast('題目已刪除')
  }

  const togglePublish = (id: string, on: boolean) =>
    update({ ...db, form: db.form.map((f) => (f.id === id ? { ...f, published: on } : f)) })

  // 拖曳排序:pointer 事件,滑鼠與觸控都能拖
  const dragFrom = useRef<number | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [dragging, setDragging] = useState<number | null>(null)

  const onDragStart = (i: number, e: React.PointerEvent) => {
    dragFrom.current = i
    setDragging(i)
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onDragMove = (e: React.PointerEvent) => {
    if (dragFrom.current === null) return
    const y = e.clientY
    const arr = db.form
    let target = arr.length - 1
    for (let k = 0; k < arr.length; k++) {
      const el = itemRefs.current[k]
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (y < rect.top + rect.height / 2) {
        target = k
        break
      }
    }
    if (target !== dragFrom.current) {
      const next = [...arr]
      const [moved] = next.splice(dragFrom.current, 1)
      next.splice(target, 0, moved)
      dragFrom.current = target
      setDragging(target)
      update({ ...db, form: next })
    }
  }
  const onDragEnd = () => {
    dragFrom.current = null
    setDragging(null)
  }

  return (
    <div>
      <PageHeader
        title="設計 AI 客製化問卷"
        desc="設定旅客想要 AI 客製化遊程時,要回答的題目"
        actions={
          <Btn onClick={() => { setEditing(blank()); setIsNew(true) }}>
            <Plus className="h-4 w-4" strokeWidth={2.5} /> 新增題目
          </Btn>
        }
      />

      {db.form.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-6 w-6" strokeWidth={2} />}
          title="還沒有題目"
          hint="點「新增題目」開始設計旅客表單。"
          action={<Btn onClick={() => { setEditing(blank()); setIsNew(true) }}><Plus className="h-4 w-4" strokeWidth={2.5} /> 新增題目</Btn>}
        />
      ) : (
        <>
          <p className="mb-2 text-xs text-ink-400">拖曳左側把手可調整題目順序</p>
          <div className="space-y-3">
            {db.form.map((f, i) => (
              <div key={f.id} ref={(el) => { itemRefs.current[i] = el }}>
                <Card className={`flex flex-col gap-3 p-4 transition sm:flex-row sm:items-start ${dragging === i ? 'ring-2 ring-ocean-400' : ''}`}>
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <button
                      onPointerDown={(e) => onDragStart(i, e)}
                      onPointerMove={onDragMove}
                      onPointerUp={onDragEnd}
                      onPointerCancel={onDragEnd}
                      aria-label={`拖曳排序 ${f.label}`}
                      style={{ touchAction: 'none' }}
                      className="mt-0.5 flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-lg text-ink-400 transition hover:bg-paper-200 active:cursor-grabbing"
                    >
                      <GripVertical className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ocean-600 text-xs font-black text-white">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-ink-900">{f.label}</h3>
                        <span className="rounded-full bg-paper-200 px-2 py-0.5 text-xs font-medium text-ink-600">{typeLabel(f.type)}</span>
                        <StatusPill on={f.published !== false} />
                      </div>
                      {f.type === 'text' ? (
                        <p className="mt-1 text-sm text-ink-400">旅客自由輸入文字</p>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {f.options.map((o) => (
                            <span key={o} className="rounded-full border border-paper-300 px-2.5 py-0.5 text-xs text-ink-600">{o}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink-500">上架</span>
                      <Toggle checked={f.published !== false} onChange={(v) => togglePublish(f.id, v)} label={`上架 ${f.label}`} />
                    </div>
                    <Btn variant="secondary" onClick={() => { setEditing({ ...f }); setIsNew(false) }}>
                      <Pencil className="h-4 w-4" strokeWidth={2} /> 編輯
                    </Btn>
                    <button onClick={() => setDeleting(f)} aria-label={`刪除 ${f.label}`} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </>
      )}

      {editing && (
        <Modal
          open={!!editing}
          onClose={() => setEditing(null)}
          title={isNew ? '新增題目' : '編輯題目'}
          footer={<Btn onClick={save}>{isNew ? '新增' : '儲存'}</Btn>}
        >
          <div className="space-y-4">
            <Field label="題目" value={editing.label} onChange={(v) => setEditing({ ...editing, label: v })} placeholder="例如:你想玩多久?" />
            <SelectField label="作答方式" value={editing.type} onChange={(v) => setEditing({ ...editing, type: v })} options={TYPE_OPTIONS} />

            {editing.type === 'text' ? (
              <Textarea label="提示文字(選填)" value={editing.options[0] ?? ''} onChange={(v) => setEditing({ ...editing, options: [v] })} placeholder="例如:想吃海鮮、不想走太多路" rows={2} />
            ) : (
              <div>
                <p className="mb-1.5 text-sm font-bold text-ink-800">選項</p>
                <div className="space-y-2">
                  {editing.options.map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={o}
                        onChange={(e) => setEditing({ ...editing, options: editing.options.map((x, j) => (j === i ? e.target.value : x)) })}
                        aria-label={`選項 ${i + 1}`}
                        className="min-h-11 flex-1 rounded-xl border border-paper-300 bg-white px-3.5 text-sm text-ink-900 outline-none transition focus:border-ocean-500 focus:ring-4 focus:ring-ocean-500/15"
                      />
                      <button onClick={() => setEditing({ ...editing, options: editing.options.filter((_, j) => j !== i) })} aria-label="移除選項" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-400 transition hover:bg-red-50 hover:text-red-600">
                        <X className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
                <Btn variant="ghost" className="mt-2 px-2" onClick={() => setEditing({ ...editing, options: [...editing.options, ''] })}>
                  <Plus className="h-4 w-4" strokeWidth={2.5} /> 加一個選項
                </Btn>
              </div>
            )}
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
          刪掉「{deleting?.label}」這個題目後就找不回來了,確定要刪嗎?
        </p>
      </Modal>
    </div>
  )
}
