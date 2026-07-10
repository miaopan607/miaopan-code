declare global {
  const MIAOPAN_CODE_VERSION: string
  const MIAOPAN_CODE_CHANNEL: string
}

export const InstallationVersion = typeof MIAOPAN_CODE_VERSION === "string" ? MIAOPAN_CODE_VERSION : "local"
export const InstallationChannel = typeof MIAOPAN_CODE_CHANNEL === "string" ? MIAOPAN_CODE_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
