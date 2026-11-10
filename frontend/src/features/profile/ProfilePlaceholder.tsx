type Props = {
	title: string
	onBack: () => void
}

export function ProfilePlaceholder({ title, onBack }: Props) {
	return (
		<div className="mx-auto grid w-full max-w-xl gap-4 p-5">
			<button
				type="button"
				className="w-fit rounded-xl border border-[#e5e2dc] bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm transition-colors hover:bg-[#f5f3ef] cursor-pointer"
				onClick={onBack}
			>
				← Назад
			</button>
			<section className="grid gap-2 rounded-2xl border border-[#e5e2dc] bg-[#f5f3ef] p-5 shadow-sm">
				<h2 className="m-0 text-xl font-bold text-ink">{title}</h2>
				<p className="m-0 text-sm text-muted">Пока пусто.</p>
			</section>
		</div>
	)
}
