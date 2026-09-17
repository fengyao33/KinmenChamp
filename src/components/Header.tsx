import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import Logo from './Logo'

interface HeaderProps {
  showBack?: boolean
  right?: React.ReactNode
}

export default function Header({ showBack, right }: HeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-ink-900/5 bg-paper-50/85 px-4 backdrop-blur-md sm:px-6">
      <div className="flex w-32 items-center">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-ink-500 transition hover:bg-paper-200 hover:text-ink-900"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
            返回
          </button>
        )}
      </div>

      <Logo className="h-9" />

      <div className="flex w-32 items-center justify-end">{right}</div>
    </header>
  )
}
