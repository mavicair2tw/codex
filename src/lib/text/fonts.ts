export interface EditorFontOption {
  label: string;
  value: string;
  cssFamily: string;
}

export const traditionalChineseFonts: EditorFontOption[] = [
  { label: "Noto Sans TC", value: "Noto Sans TC", cssFamily: "\"Noto Sans TC\", \"Source Han Sans TC\", \"Microsoft JhengHei\", \"PingFang TC\", sans-serif" },
  { label: "Noto Serif TC", value: "Noto Serif TC", cssFamily: "\"Noto Serif TC\", \"Source Han Serif TC\", PMingLiU, MingLiU, serif" },
  { label: "Microsoft JhengHei", value: "Microsoft JhengHei", cssFamily: "\"Microsoft JhengHei\", \"Noto Sans TC\", \"PingFang TC\", sans-serif" },
  { label: "PingFang TC", value: "PingFang TC", cssFamily: "\"PingFang TC\", \"Heiti TC\", \"Noto Sans TC\", sans-serif" },
  { label: "Heiti TC", value: "Heiti TC", cssFamily: "\"Heiti TC\", \"PingFang TC\", \"Noto Sans TC\", sans-serif" },
  { label: "DFKai-SB / 標楷體", value: "DFKai-SB", cssFamily: "DFKai-SB, BiauKai, 標楷體, KaiTi, serif" },
  { label: "PMingLiU / 新細明體", value: "PMingLiU", cssFamily: "PMingLiU, 新細明體, MingLiU, 細明體, serif" },
  { label: "MingLiU / 細明體", value: "MingLiU", cssFamily: "MingLiU, 細明體, PMingLiU, 新細明體, serif" },
  { label: "Source Han Sans TC", value: "Source Han Sans TC", cssFamily: "\"Source Han Sans TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif" },
  { label: "Source Han Serif TC", value: "Source Han Serif TC", cssFamily: "\"Source Han Serif TC\", \"Noto Serif TC\", PMingLiU, serif" }
];

export const englishFonts: EditorFontOption[] = [
  { label: "Arial", value: "Arial", cssFamily: "Arial, Helvetica, sans-serif" },
  { label: "Helvetica", value: "Helvetica", cssFamily: "Helvetica, Arial, sans-serif" },
  { label: "Times New Roman", value: "Times New Roman", cssFamily: "\"Times New Roman\", Times, serif" },
  { label: "Georgia", value: "Georgia", cssFamily: "Georgia, \"Times New Roman\", serif" },
  { label: "Verdana", value: "Verdana", cssFamily: "Verdana, Geneva, sans-serif" },
  { label: "Tahoma", value: "Tahoma", cssFamily: "Tahoma, Geneva, sans-serif" },
  { label: "Trebuchet MS", value: "Trebuchet MS", cssFamily: "\"Trebuchet MS\", Arial, sans-serif" },
  { label: "Roboto", value: "Roboto", cssFamily: "Roboto, Arial, sans-serif" },
  { label: "Open Sans", value: "Open Sans", cssFamily: "\"Open Sans\", Arial, sans-serif" },
  { label: "Montserrat", value: "Montserrat", cssFamily: "Montserrat, Arial, sans-serif" }
];

export const editorFontFallback = "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";

export const editorFonts = [...traditionalChineseFonts, ...englishFonts];

export const getEditorFontCssFamily = (fontFamily: string) => {
  const option = editorFonts.find((font) => font.value === fontFamily);
  return option ? `${option.cssFamily}, ${editorFontFallback}` : `"${fontFamily}", ${editorFontFallback}`;
};
