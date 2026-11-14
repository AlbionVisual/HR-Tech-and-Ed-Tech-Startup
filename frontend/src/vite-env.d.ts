/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_API_BASE_URL?: string
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (options: {
          client_id: string
          callback: (response: { credential?: string }) => void
        }) => void
        renderButton: (
          element: HTMLElement,
          options: Record<string, unknown>,
        ) => void
      }
    }
  }
}
