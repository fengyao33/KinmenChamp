import { useState } from 'react'
import { ArrowDown, ArrowUp, ListChecks, Plus, Trash2, X } from 'lucide-react'
import { loadDB, saveDB, uid, type AdminDB, type FieldType, type FormField } from '../data'
import { Btn, Card, EmptyState, Field, Modal, PageHeader, SelectField, Textarea, useToast } from '../ui'

const TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: 'single', label: '單選' },
  { value: 'multi', label: '複選' },
  { value: 'text', label: '自由填答' },
]
const typeLabel = (t: FieldType) => TYPE_OPTIONS.find((o) => o.value === t)!.label
const blank = (): FormField => ({ id: uid(), label: '', type: 'single', options: ['選項一'] })

export default function FormDesigner() {
  const toast = useToast()
  const [db, setDb] = useState<AdminDB>(loadDB())
  const [editing, setEditing] = useState<FormField | null>(null)
  const [isNew, setIsNew] = useState(false)

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

  const remove = (id: string) => {
    update({ ...db, form: db.form.filter((f) => f.id !== id) })
    setEditing(null)
    toast('題目已刪除')
  }

  const move = (i: number, dir: -1 | 1) => {
    const arr = [...db.form]
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    update({ ...db, form: arr })
  }

  return (
    <div>
      <PageHeader
        title="AI 表單設計"
        desc="設定旅客在「AI 客製」要回答的題目。送出後會交給 AI 生成專屬路線。"
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
        <div className="space-y-3">
          {db.form.map((f, i) => (
            <Card key={f.id} className="flex items-start gap-3 p-4">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ocean-600 text-xs font-black text-white">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-ink-900">{f.label}</h3>
                  <span className="rounded-full bg-paper-200 px-2 py-0.5 text-xs font-medium text-ink-600">{typeLabel(f.type)}</span>
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
              <div className="flex shrink-0 items-center">
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="上移" className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition hover:bg-paper-200 disabled:opacity-30">
                  <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === db.form.length - 1} aria-label="下移" className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition hover:bg-paper-200 disabled:opacity-30">
                  <ArrowDown className="h-4 w-4" strokeWidth={2.5} />
                </button>
                <Btn variant="secondary" className="ml-1" onClick={() => { setEditing({ ...f }); setIsNew(false) }}>編輯</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <Modal
          open={!!editing}
          onClose={() => setEditing(null)}
          title={isNew ? '新增題目' : '編輯題目'}
          footer={
            <>
              {!isNew && <Btn variant="danger" onClick={() => remove(editing.id)}><Trash2 className="h-4 w-4" strokeWidth={2} /> 刪除</Btn>}
              <Btn onClick={save}>儲存</Btn>
            </>
          }
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
    </div>
  )
}
