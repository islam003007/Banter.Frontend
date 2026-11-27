/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_HUB_URL?: string;
  readonly VITE_BOTS_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
