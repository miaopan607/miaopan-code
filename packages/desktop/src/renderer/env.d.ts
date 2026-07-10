import type { ElectronAPI } from "../preload/types"

declare global {
  interface Window {
    api: ElectronAPI
    __MIAOPAN_CODE__?: {
      deepLinks?: string[]
    }
  }
}
