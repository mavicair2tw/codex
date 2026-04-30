import { describe, expect, it } from "vitest";
import { englishFonts, getEditorFontCssFamily, traditionalChineseFonts } from "@/lib/text/fonts";

describe("editor font options", () => {
  it("includes at least 10 major Traditional Chinese fonts", () => {
    expect(traditionalChineseFonts).toHaveLength(10);
    expect(traditionalChineseFonts.map((font) => font.value)).toEqual(
      expect.arrayContaining([
        "Noto Sans TC",
        "Noto Serif TC",
        "Microsoft JhengHei",
        "PingFang TC",
        "Heiti TC",
        "DFKai-SB",
        "PMingLiU",
        "MingLiU",
        "Source Han Sans TC",
        "Source Han Serif TC"
      ])
    );
  });

  it("includes at least 10 major English fonts", () => {
    expect(englishFonts).toHaveLength(10);
    expect(englishFonts.map((font) => font.value)).toEqual(
      expect.arrayContaining([
        "Arial",
        "Helvetica",
        "Times New Roman",
        "Georgia",
        "Verdana",
        "Tahoma",
        "Trebuchet MS",
        "Roboto",
        "Open Sans",
        "Montserrat"
      ])
    );
  });

  it("resolves selected fonts to explicit CSS stacks", () => {
    expect(getEditorFontCssFamily("Noto Sans TC")).toContain("Noto Sans TC");
    expect(getEditorFontCssFamily("Noto Sans TC")).toContain("Microsoft JhengHei");
    expect(getEditorFontCssFamily("Times New Roman")).toContain("Times New Roman");
    expect(getEditorFontCssFamily("Unknown Font")).toContain("Unknown Font");
  });
});
