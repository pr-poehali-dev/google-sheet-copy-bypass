export type TabId = "upload" | "settings" | "download" | "history";

export interface HistoryItem {
  id: number;
  name: string;
  url: string;
  rows_count: number;
  columns_count: number;
  status: "success" | "processing" | "error";
  error_message?: string;
  created_at: string;
}

export interface ParseResult {
  id: number;
  headers: string[];
  rows: string[][];
  rows_count: number;
  columns_count: number;
}

export const tabs = [
  { id: "upload" as TabId, label: "Загрузка", icon: "Upload", color: "green" },
  { id: "settings" as TabId, label: "Настройки", icon: "Settings2", color: "purple" },
  { id: "download" as TabId, label: "Скачать", icon: "Download", color: "cyan" },
  { id: "history" as TabId, label: "История", icon: "History", color: "orange" },
];

export const colorMap = {
  green:  { bg: "rgba(0,230,118,0.1)",  hex: "#00e676", border: "rgba(0,230,118,0.5)" },
  purple: { bg: "rgba(184,71,255,0.1)", hex: "#b847ff", border: "rgba(184,71,255,0.5)" },
  cyan:   { bg: "rgba(0,229,255,0.1)",  hex: "#00e5ff", border: "rgba(0,229,255,0.5)" },
  orange: { bg: "rgba(255,107,53,0.1)", hex: "#ff6b35", border: "rgba(255,107,53,0.5)" },
};

export const PARSE_URL = "https://functions.poehali.dev/eec1ec8f-490d-476d-ade5-5cfbb1eb4ce0";
export const DOWNLOAD_URL = "https://functions.poehali.dev/72255142-0849-44ae-8054-76df07ff051c";
