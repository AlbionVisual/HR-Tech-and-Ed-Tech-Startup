type Props = {
  value: number
}

export function InterviewProgress({ value }: Props) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="h-1 bg-line" aria-label="Прогресс интервью">
      <div
        className="h-full bg-accent transition-[width] duration-200 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
