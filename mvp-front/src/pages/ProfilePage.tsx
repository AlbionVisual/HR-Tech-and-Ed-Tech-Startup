import { useEffect, useState } from 'react'
import { buildSetupLink } from '../ai/bootstrapFromUrl'
import { clearByokKey, getByokKey, setByokKey } from '../ai/byok'
import { AI_SETTINGS_EVENT, resolveSelection } from '../ai/selection'
import type { AiProviderId } from '../config'

type KeyProvider = Exclude<AiProviderId, 'mock'>

type KeyField = {
	provider: KeyProvider
	label: string
	placeholder: string
}

const fields: KeyField[] = [
	{
		provider: 'gemini',
		label: 'Gemini API key',
		placeholder: 'AIza...',
	},
	{
		provider: 'openrouter',
		label: 'OpenRouter API key',
		placeholder: 'sk-or-...',
	},
	{
		provider: 'aiai',
		label: 'AIAI.BY API key',
		placeholder: 'sk-...',
	},
]

type KeysState = Record<KeyProvider, string>

function readKeys(): KeysState {
	return {
		gemini: getByokKey('gemini'),
		openrouter: getByokKey('openrouter'),
		aiai: getByokKey('aiai'),
	}
}

export function ProfilePage() {
	const [keys, setKeys] = useState<KeysState>(() => readKeys())
	const [saved, setSaved] = useState<KeyProvider | null>(null)
	const [demoLink, setDemoLink] = useState('')
	const [copied, setCopied] = useState(false)
	const [selectedLabel, setSelectedLabel] = useState(() => {
		const selected = resolveSelection()
		return selected.option?.label ?? 'ничего'
	})

	useEffect(() => {
		function sync() {
			const selected = resolveSelection()
			setSelectedLabel(selected.option?.label ?? 'ничего')
			setKeys(readKeys())
		}
		window.addEventListener(AI_SETTINGS_EVENT, sync)
		return () => window.removeEventListener(AI_SETTINGS_EVENT, sync)
	}, [])

	function save(provider: KeyProvider) {
		setByokKey(keys[provider], provider)
		setSaved(provider)
	}

	function clear(provider: KeyProvider) {
		clearByokKey(provider)
		setKeys((prev) => ({ ...prev, [provider]: '' }))
		setSaved(null)
	}

	function makeLink() {
		const selected = resolveSelection()
		const link = buildSetupLink({
			gemini: keys.gemini.trim() || undefined,
			openrouter: keys.openrouter.trim() || undefined,
			aiai: keys.aiai.trim() || undefined,
			model: selected.option?.model,
			provider: selected.option?.provider,
			useHash: true,
		})
		setDemoLink(link)
		setCopied(false)
	}

	async function copyLink() {
		if (!demoLink) return
		await navigator.clipboard.writeText(demoLink)
		setCopied(true)
	}

	return (
		<div className="grid max-w-xl gap-4 p-5">
			<h2 className="m-0 text-xl font-bold text-ink">API-ключи (BYOK)</h2>
			<p className="m-0 text-sm text-muted">
				Можно сохранить ключи всех провайдеров. В шапке появятся модели тех, для
				кого есть ключ. AIAI.BY — платный бэкап. Сейчас выбрано:{' '}
				<strong className="text-ink">{selectedLabel}</strong>
			</p>

			{fields.map((field) => (
				<section
					key={field.provider}
					className="grid gap-3 bg-[#f5f3ef] p-4 rounded-2xl border border-[#e5e2dc] shadow-sm"
				>
					<label className="grid gap-1.5">
						<span className="text-sm font-semibold text-ink">{field.label}</span>
						<input
							className="w-full rounded-xl bg-white border border-[#e5e2dc] px-4 py-2.5 text-ink outline-none focus:border-gray-400 font-sans"
							type="password"
							placeholder={field.placeholder}
							value={keys[field.provider]}
							onChange={(e) => {
								setKeys((prev) => ({
									...prev,
									[field.provider]: e.target.value,
								}))
								setSaved(null)
							}}
						/>
					</label>
					<div className="flex gap-2">
						<button
							type="button"
							className="px-5 py-2 rounded-xl bg-[#FE502D] text-white font-medium hover:bg-[#5f5f5e] transition-colors cursor-pointer border-0 shadow-sm"
							onClick={() => save(field.provider)}
						>
							Сохранить
						</button>
						<button
							type="button"
							className="px-5 py-2 rounded-xl bg-[#e5e2dc] text-ink font-medium hover:bg-[#d9d5cc] transition-colors cursor-pointer border-0"
							onClick={() => clear(field.provider)}
						>
							Удалить
						</button>
					</div>
					{saved === field.provider ? (
						<p className="m-0 text-sm font-medium text-emerald-600">Сохранено</p>
					) : null}
				</section>
			))}

			<section className="grid gap-3 bg-[#f5f3ef] p-4 rounded-2xl border border-[#e5e2dc] shadow-sm">
				<h3 className="m-0 text-base font-bold text-ink">Демо-ссылка с ключами</h3>
				<p className="m-0 text-sm text-muted">
					Для жюри: откроют ссылку — ключи сами попадут в localStorage, из
					адресной строки уберутся. В ссылку попадает сейчас выбранная модель
					(<strong className="text-ink">{selectedLabel}</strong>).
				</p>
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						className="px-5 py-2 rounded-xl bg-[#717170] text-white font-medium hover:bg-[#5f5f5e] transition-colors cursor-pointer border-0 shadow-sm"
						onClick={makeLink}
					>
						Собрать ссылку
					</button>
					<button
						type="button"
						className="px-5 py-2 rounded-xl bg-[#e5e2dc] text-ink font-medium hover:bg-[#d9d5cc] transition-colors cursor-pointer border-0 disabled:opacity-50"
						disabled={!demoLink}
						onClick={() => void copyLink()}
					>
						Копировать
					</button>
				</div>
				{demoLink ? (
					<textarea
						className="w-full min-h-20 rounded-xl bg-white border border-[#e5e2dc] p-3 text-ink outline-none font-sans break-all"
						readOnly
						value={demoLink}
					/>
				) : null}
				{copied ? (
					<p className="m-0 text-sm font-medium text-emerald-600">Скопировано</p>
				) : null}
			</section>

			<section className="mt-2 grid gap-3 bg-[#f5f3ef] p-4 rounded-2xl border border-[#e5e2dc] shadow-sm">
				<h3 className="m-0 text-base font-bold text-ink">Gemini</h3>
				<ol className="m-0 list-decimal pl-5 text-sm text-muted space-y-1">
					<li>
						Откройте{' '}
						<a
							className="text-ink underline font-medium"
							href="https://aistudio.google.com/apikey"
							target="_blank"
							rel="noreferrer"
						>
							Google AI Studio
						</a>
					</li>
					<li>Create API key → вставьте сюда</li>
				</ol>
				<h3 className="m-0 text-base font-bold text-ink pt-2">OpenRouter</h3>
				<ol className="m-0 list-decimal pl-5 text-sm text-muted space-y-1">
					<li>
						Откройте{' '}
						<a
							className="text-ink underline font-medium"
							href="https://openrouter.ai/keys"
							target="_blank"
							rel="noreferrer"
						>
							OpenRouter Keys
						</a>
					</li>
					<li>Create API Key → вставьте сюда</li>
				</ol>
				<h3 className="m-0 text-base font-bold text-ink pt-2">AIAI.BY</h3>
				<ol className="m-0 list-decimal pl-5 text-sm text-muted space-y-1">
					<li>
						Откройте{' '}
						<a
							className="text-ink underline font-medium"
							href="https://aiai.by"
							target="_blank"
							rel="noreferrer"
						>
							aiai.by
						</a>{' '}
						→ кабинет → API-ключ
					</li>
					<li>
						Чат-модели: <code>config/ai.ts</code> → <code>aiai.models</code>
					</li>
					<li>
						TTS модели/голоса:{' '}
						<code>config/speech.ts</code> → <code>aiai.models</code>
					</li>
				</ol>
			</section>
		</div>
	)
}

