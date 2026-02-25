/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
    readonly VITE_USE_BACKEND_CHAT: string
    readonly VITE_SYNC_SETTINGS: string
    readonly VITE_OLLAMA_URL: string
    readonly VITE_OLLAMA_MODEL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
