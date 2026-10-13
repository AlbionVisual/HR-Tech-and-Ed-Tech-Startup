type Props = {
	value: number
}

export function InterviewProgress({ value }: Props) {
	const clamped = Math.max(0, Math.min(100, value))
	return (
		<div
			className="h-2.5 mt-2 w-full bg-[#bdbab4] rounded-full overflow-hidden" // Увеличили высоту, изменили фон и добавили сильное скругление
			role="progressbar"
			aria-label="Прогресс интервью"
			aria-valuenow={clamped}
			aria-valuemin={0}
			aria-valuemax={100}
		>
			<div
				className="h-full bg-[#70BFA1] rounded-full transition-[width] duration-200 ease-out" // Изменили цвет на зеленый, добавили скругление и transition
				style={{ width: `${clamped}%` }}
			/>
		</div> 
	)
}
