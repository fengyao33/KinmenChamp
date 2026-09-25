import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Info } from 'lucide-react'
import Logo from '../../components/Logo'
import { auth } from '../auth'
import { Btn, Field } from '../ui'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!account.trim() || !password.trim()) {
      setError('請輸入帳號與密碼')
      return
    }
    auth.login()
    navigate('/admin', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-100 px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="h-12" clickable={false} />
          <h1 className="mt-4 text-2xl font-black text-ink-900">島轉後台</h1>
          <p className="mt-1 text-sm text-ink-500">管理商家、遊程與旅遊資訊</p>
        </div>

        {/* 切換 登入 / 開新帳號 */}
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-paper-200 p-1">
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`min-h-10 rounded-xl text-sm font-bold transition ${mode === m ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
            >
              {m === 'login' ? '登入' : '開新帳號'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-ink-900/5">
          <Field label="帳號" value={account} onChange={(v) => { setAccount(v); setError('') }} placeholder="輸入帳號或 Email" />
          <Field label="密碼" type="password" value={password} onChange={(v) => { setPassword(v); setError('') }} placeholder="輸入密碼" />
          {error && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          )}
          <Btn type="submit" className="w-full">
            {mode === 'login' ? '登入' : '建立帳號並進入'} <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Btn>
        </form>

        <p className="mt-4 flex items-start gap-1.5 text-xs text-ink-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          原型階段:輸入任意帳號密碼即可進入,尚未串接真實帳號系統。
        </p>
      </div>
    </div>
  )
}
