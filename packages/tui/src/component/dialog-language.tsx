import { useDialog } from "../ui/dialog"
import { DialogSelect } from "../ui/dialog-select"
import { useI18n } from "../context/i18n"
import { useSDK } from "../context/sdk"
import { useToast } from "../ui/toast"

export function DialogLanguage() {
  const dialog = useDialog()
  const i18n = useI18n()
  const sdk = useSDK()
  const toast = useToast()

  return (
    <DialogSelect
      title={i18n.t("tui.choose_language")}
      options={[
        { title: i18n.t("language.zh_cn"), description: i18n.t("language.zh_cn"), value: "zh-CN" as const },
        { title: i18n.t("language.en"), description: i18n.t("language.en"), value: "en" as const },
      ]}
      current={i18n.language()}
      onSelect={(option) => {
        void sdk.client.global.config
          .update({ config: { language: option.value } })
          .then(() => {
            i18n.setLanguage(option.value)
            toast.show({ message: i18n.t("tui.language_updated"), variant: "success" })
            dialog.clear()
          })
          .catch((error) => {
            toast.show({ message: error instanceof Error ? error.message : String(error), variant: "error" })
          })
      }}
    />
  )
}
