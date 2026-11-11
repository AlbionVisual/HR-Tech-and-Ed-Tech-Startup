import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { extractResume, type ResumeSource } from "../../api/resumes";
import type { ChatMessage } from "../../ai/types";
import { useVoice } from "../../speech/VoiceContext";
import { ChatMessageList } from "./ChatMessageList";
import { Composer } from "../interview/Composer";
// import { FeedbackActions } from '../interview/FeedbackActions'
import { ResumeStartGrid } from "./ResumeStartGrid";
import type { ResumeMode, ResumePhase } from "./useResumeSession";

type Props = {
  messages: ChatMessage[];
  phase: ResumePhase;
  mode: ResumeMode | null;
  status: "idle" | "thinking" | "streaming" | "error";
  error: string;
  thought: string;
  onChooseAtsCheck: () => void;
  onChooseImproveExperience: () => void;
  onChooseKeywords: () => void;
  onChooseFormatting: () => void;
  onStartCheck: (resumeText: string, source?: ResumeSource) => void;
  onSend: (text: string) => void;
  onRefine: () => void;
};

type FileInfo = {
  filename: string;
  sourceType: "pdf" | "docx";
  chars: number;
  truncated: boolean;
};

export function ChatView({
  messages,
  phase,
  mode,
  status,
  error,
  thought,
  onChooseAtsCheck,
  onChooseImproveExperience,
  onChooseKeywords,
  onChooseFormatting,
  onStartCheck,
  onSend,
}: Props) {
  const [presetText, setPresetText] = useState<string>("");
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [fileError, setFileError] = useState("");
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setExtracting(true);
    setFileError("");
    setFileInfo(null);
    try {
      const extracted = await extractResume(file);
      setPresetText(extracted.text);
      setFileInfo({
        filename: extracted.filename,
        sourceType: extracted.source_type,
        chars: extracted.chars,
        truncated: extracted.truncated,
      });
    } catch (error) {
      setFileError(
        error instanceof Error ? error.message : "Не удалось извлечь текст",
      );
    } finally {
      setExtracting(false);
    }
  }

  const listRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const isIdle = phase === "idle";
  const busy = status === "thinking" || status === "streaming";

  const { voiceError, stopAll } = useVoice();

  useEffect(() => {
    const el = listRef.current;
    if (!el || !stickRef.current || isIdle) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, thought, status, error, isIdle]);

  useEffect(() => {
    if (busy) stopAll();
  }, [busy, stopAll]);

  const handleSubmit = (text: string) => {
    if (isIdle) {
      const source = fileInfo
        ? {
            sourceType: fileInfo.sourceType,
            sourceFilename: fileInfo.filename,
          }
        : undefined;
      onStartCheck(text, source);
      setFileInfo(null);
      setFileError("");
    } else {
      onSend(text);
    }
  };

  return (
    <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto]">
      <div ref={listRef} className="flex flex-col gap-2.5 overflow-auto p-4">
        {isIdle ?
          <ResumeStartGrid
            mode={mode}
            onChooseAtsCheck={onChooseAtsCheck}
            onChooseImproveExperience={onChooseImproveExperience}
            onChooseKeywords={onChooseKeywords}
            onChooseFormatting={onChooseFormatting}
          />
        : <ChatMessageList
            messages={messages}
            status={status}
            thought={thought}
            error={error}
            voiceError={voiceError}
          />
        }
      </div>

      {phase === "awaiting_next" ?
        1
      : <div className="flex flex-col gap-1 p-2 pt-0">
          {isIdle && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(event) => void handleFileChange(event)}
                />
                <button
                  type="button"
                  className="px-3 py-2 rounded-2xl border border-[#b6b3ad] bg-white text-sm font-medium text-gray-800 hover:bg-[#f5f3ef] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={extracting || busy}
                >
                  {extracting ? "Извлекаю текст…" : "Загрузить PDF/DOCX"}
                </button>

                {fileInfo ? (
                  <span className="text-xs text-gray-500">
                    {fileInfo.filename} · {fileInfo.chars} символов
                    {fileInfo.truncated ? " · текст обрезан" : ""}
                  </span>
                ) : null}
              </div>

              {fileError ? (
                <p className="m-0 text-sm text-danger">{fileError}</p>
              ) : null}

            </div>
          )}
          <Composer
            disabled={busy || extracting}
            value={presetText}
            onSend={handleSubmit}
            textPlaceholder={extracting ? "Извлекаю текст…" : "Отправьте резюме"}
          />
        </div>
      }
    </div>
  );
}
