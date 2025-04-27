/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_MAPBOX_TOKEN: string;
    // Add more env variables here if needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }