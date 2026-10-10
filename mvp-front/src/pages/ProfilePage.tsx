import { useEffect, useState } from 'react'
import { buildSetupLink } from '../ai/bootstrapFromUrl'
import { clearByokKey, getByokKey, setByokKey } from '../ai/byok'
import { AI_SETTINGS_EVENT, resolveSelection } from '../ai/selection'
import type { AiProviderId } from '../config'
import { btn, btnPrimary, fieldInput, fieldLabel } from '../ui/btn'

type KeyField = {
  provider: AiProviderId
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
]

export function ProfilePage() {
  const [geminiKey, setGeminiKey] = useState(() => getByokKey('gemini'))
  const [openrouterKey, setOpenrouterKey] = useState(() =>
    getByokKey('openrouter'),
  )
  const [saved, setSaved] = useState<AiProviderId | null>(null)
  const [demoLink, setDemoLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState(() => {
    const selected = resolveSelection()
    return selected.option
      ? `${selected.provider} / ${selected.model}`
      : 'ничего'
  })

  useEffect(() => {
    function sync() {
      const selected = resolveSelection()
      setSelectedLabel(
        selected.option
          ? `${selected.provider} / ${selected.model}`
          : 'ничего',
      )
      setGeminiKey(getByokKey('gemini'))
      setOpenrouterKey(getByokKey('openrouter'))
    }
    window.addEventListener(AI_SETTINGS_EVENT, sync)
    return () => window.removeEventListener(AI_SETTINGS_EVENT, sync)
  }, [])

  function save(provider: AiProviderId) {
    const value = provider === 'gemini' ? geminiKey : openrouterKey
    setByokKey(value, provider)
    setSaved(provider)
  }

  function clear(provider: AiProviderId) {
    clearByokKey(provider)
    if (provider === 'gemini') setGeminiKey('')
    else setOpenrouterKey('')
    setSaved(null)
  }

  function makeLink() {
    const selected = resolveSelection()
    const link = buildSetupLink({
      gemini: geminiKey.trim() || undefined,
      openrouter: openrouterKey.trim() || undefined,
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
    <div className="grid max-w-xl gap-3 p-4">
      <h2 className="m-0 text-[1.05rem]">API-ключи (BYOK)</h2>
      <p className="m-0 text-[0.92rem] text-muted">
        Можно сохранить оба ключа. В шапке появятся модели тех провайдеров, для
        которых есть ключ. Сейчас выбрано: <strong>{selectedLabel}</strong>
      </p>

      {fields.map((field) => {
        const value = field.provider === 'gemini' ? geminiKey : openrouterKey
        const setValue =
          field.provider === 'gemini' ? setGeminiKey : setOpenrouterKey
        return (
          <section
            key={field.provider}
            className="grid gap-2 border-b border-line pb-3"
          >
            <label className="grid gap-1.5">
              <span className={fieldLabel}>{field.label}</span>
              <input
                className={fieldInput}
                type="password"
                placeholder={field.placeholder}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setSaved(null)
                }}
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                className={btnPrimary}
                onClick={() => save(field.provider)}
              >
                Сохранить
              </button>
              <button
                type="button"
                className={btn}
                onClick={() => clear(field.provider)}
              >
                Удалить
              </button>
            </div>
            {saved === field.provider ? (
              <p className="m-0 text-[0.92rem] text-ok">Сохранено</p>
            ) : null}
          </section>
        )
      })}

      <section className="grid gap-2 border-t border-line pt-3">
        <h3 className="m-0 text-base">Демо-ссылка с ключами</h3>
        <p className="m-0 text-[0.92rem] text-muted">
          Для жюри: откроют ссылку — ключи сами попадут в localStorage, из
          адресной строки уберутся. Свои BYOK-ключи других людей это не
          затирает, только если в ссылке переданы те же провайдеры.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} onClick={makeLink}>
            Собрать ссылку
          </button>
          <button
            type="button"
            className={btn}
            disabled={!demoLink}
            onClick={() => void copyLink()}
          >
            Копировать
          </button>
        </div>
        {demoLink ? (
          <textarea
            className={`${fieldInput} min-h-20 break-all`}
            readOnly
            value={demoLink}
          />
        ) : null}
        {copied ? <p className="m-0 text-[0.92rem] text-ok">Скопировано</p> : null}
      </section>

      <section className="mt-2 grid gap-2 border-t border-line pt-3">
        <h3 className="m-0 text-base">Gemini</h3>
        <ol className="m-0 list-decimal pl-[18px] text-muted">
          <li>
            Откройте{' '}
            <a
              className="text-ink"
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
            >
              Google AI Studio
            </a>
          </li>
          <li>Create API key → вставьте сюда</li>
        </ol>
        <h3 className="m-0 text-base">OpenRouter</h3>
        <ol className="m-0 list-decimal pl-[18px] text-muted">
          <li>
            Откройте{' '}
            <a
              className="text-ink"
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
            >
              OpenRouter Keys
            </a>
          </li>
          <li>Create API Key → вставьте сюда</li>
          <li>
            Список моделей: <code>src/config/ai.ts</code> →{' '}
            <code>openrouter.models</code>
          </li>
        </ol>
      </section>
    </div>
  )
}
