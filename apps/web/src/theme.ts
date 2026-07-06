import type { ThemeConfig } from "antd";

/** Бренд-тема: глубокий зелёный — доверие и «легальность». */
export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: "#0F6B4E",
    colorLink: "#0F6B4E",
    borderRadius: 10,
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    colorBgLayout: "#f6f7f6",
  },
  components: {
    Button: {
      controlHeight: 42,
      controlHeightLG: 48,
    },
    Input: {
      controlHeight: 42,
    },
    Select: {
      controlHeight: 42,
    },
    Segmented: {
      trackBg: "#eef0ee",
    },
  },
};
