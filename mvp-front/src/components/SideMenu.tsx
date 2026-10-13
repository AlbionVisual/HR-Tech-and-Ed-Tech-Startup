import { useEffect } from 'react'

type SideMenuProps = {
  isOpen: boolean
  onClose: () => void
}

export function SideMenu({ isOpen, onClose }: SideMenuProps) {
  // Закрытие по клавише Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Затемнение фона (оверлей) - клик по нему закрывает меню */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity" 
        onClick={onClose} 
      />

      <div className="relative z-10 w-80 h-full bg-bg-panel border-l border-line shadow-xl flex flex-col p-5 animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <h2 className="text-lg font-semibold m-0">Меню</h2>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 rounded-md text-ink hover:bg-bg-elevated"
            aria-label="Закрыть меню"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 py-4">
          <p className="text-sm text-ink/70">Здесь будут пункты меню...</p>
        </div>
      </div>
    </div>
  )
}
