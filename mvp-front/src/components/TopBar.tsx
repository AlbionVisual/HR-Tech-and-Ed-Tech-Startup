import { ModelSelect } from './ModelSelect'

type Props = {
  title: string
  onMenuClick?: () => void
}

export function TopBar({ title, onMenuClick }: Props) {
  return (
    <header className="flex items-center justify-between gap-2.5 border-b border-line bg-bg-elevated py-0 pr-3 pl-4">
      <h1 className="m-0 min-w-0 flex-none truncate text-[1.1rem] font-semibold">
        {title}
      </h1>
      <div className="flex min-w-0 items-center gap-2">
        <ModelSelect />
        <button
          type="button"
          className="grid h-10 w-10 place-content-center gap-1 rounded-lg border border-line bg-bg-panel"
          aria-label="Меню"
          onClick={onMenuClick}
        >
          <span className="block h-0.5 w-4 bg-ink" />
          <span className="block h-0.5 w-4 bg-ink" />
          <span className="block h-0.5 w-4 bg-ink" />
        </button>
      </div>
    </header>
  )
}
