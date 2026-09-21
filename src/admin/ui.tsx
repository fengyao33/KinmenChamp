import { createContext, useCallback, useContext, useEffect, useId, useState, type ReactNode } from 'react'
import { Check, X } from 'lucide-react'

/* 按鈕:大目標、清楚變體、鍵盤可用 */
export function Btn({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const base =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50'
  const styles = {
    primary: 'bg-brick-600 text-white hover:bg-brick-700',
    secondary: 'border border-paper-300 bg-white text-ink-700 hover:border-ink-400 hover:bg-paper-100',
    ghost: 'text-ink-600 hover:bg-paper-200',
    danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
  }[variant]
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  )
}

/* 文字輸入:label 一定綁定、可帶說明 */
export function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-ink-800">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-xl border border-paper-300 bg-white px-3.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-ocean-500 focus:ring-4 focus:ring-ocean-500/15"
      />
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  )
}

export function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-ink-800">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-paper-300 bg-white p-3.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-ocean-500 focus:ring-4 focus:ring-ocean-500/15"
      />
    </div>
  )
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-ink-800">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="min-h-11 w-full rounded-xl border border-paper-300 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-ocean-500 focus:ring-4 focus:ring-ocean-500/15"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/* 上下架開關:role=switch,鍵盤可切 */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition ${checked ? 'bg-ocean-600' : 'bg-paper-300'}`}
    >
      <span className={`h-6 w-6 rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-ink-900/5 ${className}`}>{children}</div>
}

export function PageHeader({ title, desc, actions }: { title: string; desc?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink-900">{title}</h1>
        {desc && <p className="mt-1 text-sm text-ink-500">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({ icon, title, hint, action }: { icon: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-paper-300 bg-paper-50 px-6 py-14 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-paper-200 text-ink-400">{icon}</div>
      <p className="font-bold text-ink-800">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-ink-500">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function StatusPill({ on, onText = '已上架', offText = '已下架' }: { on: boolean; onText?: string; offText?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
        on ? 'bg-ocean-50 text-ocean-700' : 'bg-paper-200 text-ink-500'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${on ? 'bg-ocean-500' : 'bg-ink-400'}`} />
      {on ? onText : offText}
    </span>
  )
}

/* Modal:role=dialog、Esc 關閉、點背景關閉 */
export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[900] flex items-end justify-center bg-ink-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="dz-slide-up flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-paper-200 px-5 py-4">
          <h2 className="text-lg font-black text-ink-900">{title}</h2>
          <button onClick={onClose} aria-label="關閉" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition hover:bg-paper-200">
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-paper-200 px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}

/* Toast 回饋 */
type Toast = { id: string; text: string }
const ToastCtx = createContext<(text: string) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((text: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[1000] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} className="dz-rise pointer-events-auto flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
            <Check className="h-4 w-4 text-ocean-300" strokeWidth={3} />
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
