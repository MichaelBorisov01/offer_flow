/// <reference types="vite/client" />
/// <reference types="vitest/config" />

interface ImportMetaEnv {
  readonly VITE_APP_DEBUG: string
  readonly VITE_APP_TITLE: string

  [key: string]: string | boolean | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}