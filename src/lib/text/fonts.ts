export interface EditorFontOption {
  label: string;
  value: string;
}

export const traditionalChineseFonts: EditorFontOption[] = [
  { label: "Noto Sans TC", value: "Noto Sans TC" },
  { label: "Noto Serif TC", value: "Noto Serif TC" },
  { label: "Microsoft JhengHei", value: "Microsoft JhengHei" },
  { label: "PingFang TC", value: "PingFang TC" },
  { label: "Heiti TC", value: "Heiti TC" },
  { label: "DFKai-SB / 標楷體", value: "DFKai-SB" },
  { label: "PMingLiU / 新細明體", value: "PMingLiU" },
  { label: "MingLiU / 細明體", value: "MingLiU" },
  { label: "Source Han Sans TC", value: "Source Han Sans TC" },
  { label: "Source Han Serif TC", value: "Source Han Serif TC" }
];

export const englishFonts: EditorFontOption[] = [
  { label: "Arial", value: "Arial" },
  { label: "Helvetica", value: "Helvetica" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Georgia", value: "Georgia" },
  { label: "Verdana", value: "Verdana" },
  { label: "Tahoma", value: "Tahoma" },
  { label: "Trebuchet MS", value: "Trebuchet MS" },
  { label: "Roboto", value: "Roboto" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Montserrat", value: "Montserrat" }
];

export const editorFontFallback = "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
