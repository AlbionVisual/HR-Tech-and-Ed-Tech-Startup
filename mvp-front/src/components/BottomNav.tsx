import type { PageId } from '../config'
import { config } from '../config'

type Props = {
  active: PageId
  onChange: (id: PageId) => void
}

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="grid grid-cols-4 border-t border-line bg-bg-elevated" aria-label="Навигация">
      {config.app.pages.map((page) => (
        <button
          key={page.id}
          type="button"
          className={`border-0 bg-transparent font-sans text-sm ${
            active === page.id
              ? 'bg-bg-panel font-semibold text-ink'
              : 'text-muted'
          }`}
          onClick={() => onChange(page.id)}
        >
          {page.title}
        </button>
      ))}
    </nav>
  )
}
