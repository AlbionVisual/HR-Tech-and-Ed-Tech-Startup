from dataclasses import dataclass


@dataclass(frozen=True)
class ModelDef:
    id: str
    label: str


@dataclass(frozen=True)
class ProviderDef:
    label: str
    models: tuple[ModelDef, ...]
    default_model: str


def _provider(
    label: str,
    models: list[tuple[str, str]],
    default: str,
) -> ProviderDef:
    return ProviderDef(label, tuple(ModelDef(*model) for model in models), default)


PROVIDER_CATALOG: dict[str, ProviderDef] = {
    "openrouter": _provider(
        "OpenRouter",
        [
            ("nvidia/nemotron-3-ultra-550b-a55b:free", "Nemotron 3 Ultra 550B"),
            ("dots-studio/dots-3-note-preview:free", "Dots 3 Note Preview"),
            ("nvidia/nemotron-3-super-120b-a12b:free", "Nemotron 3 Super 120B"),
            ("cohere/north-mini-code:free", "North Mini Code"),
        ],
        "nvidia/nemotron-3-ultra-550b-a55b:free",
    ),
    "gemini": _provider(
        "Gemini",
        [
            ("gemini-3.5-flash-lite", "Gemini 3.5 Flash Lite"),
            ("gemini-3.8-flash", "Gemini 3.8 Flash"),
        ],
        "gemini-3.5-flash-lite",
    ),
    "aiai": _provider(
        "AIAI",
        [
            ("gemini-3.5-flash-lite", "Gemini 3.5 Flash Lite"),
            ("deepseek-v4.1-flash", "DeepSeek V4.1 Flash"),
        ],
        "gemini-3.5-flash-lite",
    ),
    "mock": _provider("Локально", [("demo", "Демо")], "demo"),
}
