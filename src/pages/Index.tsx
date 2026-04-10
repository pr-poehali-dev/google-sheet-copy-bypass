import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const PARSE_URL = "https://functions.poehali.dev/eec1ec8f-490d-476d-ade5-5cfbb1eb4ce0";
const DOWNLOAD_URL = "https://functions.poehali.dev/72255142-0849-44ae-8054-76df07ff051c";

type TabId = "upload" | "settings" | "download" | "history";

interface HistoryItem {
  id: number;
  name: string;
  url: string;
  rows_count: number;
  columns_count: number;
  status: "success" | "processing" | "error";
  error_message?: string;
  created_at: string;
}

interface ParseResult {
  id: number;
  headers: string[];
  rows: string[][];
  rows_count: number;
  columns_count: number;
}

const tabs = [
  { id: "upload" as TabId, label: "Загрузка", icon: "Upload", color: "green" },
  { id: "settings" as TabId, label: "Настройки", icon: "Settings2", color: "purple" },
  { id: "download" as TabId, label: "Скачать", icon: "Download", color: "cyan" },
  { id: "history" as TabId, label: "История", icon: "History", color: "orange" },
];

const colorMap = {
  green:  { bg: "rgba(0,230,118,0.1)",   hex: "#00e676", border: "rgba(0,230,118,0.5)" },
  purple: { bg: "rgba(184,71,255,0.1)",  hex: "#b847ff", border: "rgba(184,71,255,0.5)" },
  cyan:   { bg: "rgba(0,229,255,0.1)",   hex: "#00e5ff", border: "rgba(0,229,255,0.5)" },
  orange: { bg: "rgba(255,107,53,0.1)",  hex: "#ff6b35", border: "rgba(255,107,53,0.5)" },
};

export default function Index() {
  const [activeTab, setActiveTab] = useState<TabId>("upload");
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [sheetRange, setSheetRange] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState("");

  const [bypassMode, setBypassMode] = useState("auto");
  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [encoding, setEncoding] = useState("utf-8");
  const [useHeaders, setUseHeaders] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [downloadId, setDownloadId] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const resp = await fetch(PARSE_URL);
      const data = await resp.json();
      setHistory(data.history || []);
    } catch {
      /* игнорируем */
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleProcess = async () => {
    if (!sheetUrl.trim()) return;
    setIsProcessing(true);
    setParseError("");
    setParseResult(null);
    setProgress(0);

    const ticker = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 8, 85));
    }, 400);

    try {
      const resp = await fetch(PARSE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: sheetUrl,
          name: sheetName || sheetUrl.slice(0, 40),
          range: sheetRange,
          use_headers: useHeaders,
          remove_empty: removeEmpty,
          bypass_mode: bypassMode,
        }),
      });
      const data = await resp.json();
      clearInterval(ticker);

      if (!resp.ok) {
        setParseError(data.error || "Ошибка при парсинге");
        setProgress(0);
      } else {
        setProgress(100);
        setParseResult(data);
        setDownloadId(data.id);
        await loadHistory();
        setTimeout(() => setActiveTab("download"), 800);
      }
    } catch (e) {
      clearInterval(ticker);
      setParseError("Ошибка сети. Попробуйте ещё раз.");
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (id: number, fmt: string, enc: string) => {
    setIsDownloading(true);
    try {
      const url = `${DOWNLOAD_URL}?id=${id}&format=${fmt}&encoding=${enc}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        const err = await resp.json();
        alert(err.error || "Ошибка скачивания");
        return;
      }
      const disposition = resp.headers.get("Content-Disposition") || "";
      let filename = `data.${fmt === "xlsx" ? "csv" : fmt}`;
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match) filename = match[1];

      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      alert("Ошибка при скачивании файла");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid relative">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(0,230,118,0.35) 0%, transparent 70%)", filter: "blur(50px)" }} />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(184,71,255,0.4) 0%, transparent 70%)", filter: "blur(60px)" }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center neon-border-green animate-pulse-glow"
              style={{ background: "rgba(0,230,118,0.1)" }}>
              <Icon name="Table2" size={20} className="neon-text-green" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Sheet<span className="neon-text-green">Parser</span>
              </h1>
              <p className="text-xs font-mono text-muted-foreground">v2.4.1 · ACTIVE</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#00e676" }} />
              <span className="text-xs text-muted-foreground font-mono">Система готова</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-3">
            Извлекай данные из Google Таблиц с обходом защиты и ограничений доступа
          </p>
        </header>

        {/* Tabs */}
        <nav className="flex gap-2 mb-6">
          {tabs.map((tab) => {
            const col = colorMap[tab.color as keyof typeof colorMap];
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl border transition-all duration-300 hover-scale"
                style={{
                  background: isActive ? col.bg : "rgba(255,255,255,0.02)",
                  borderColor: isActive ? col.border : "hsl(var(--border))",
                  boxShadow: isActive ? `0 0 20px ${col.hex}20` : "none",
                }}>
                <Icon name={tab.icon} size={16} style={{ color: isActive ? col.hex : "hsl(var(--muted-foreground))" }} />
                <span className="text-sm font-medium hidden sm:block" style={{ color: isActive ? col.hex : "hsl(var(--muted-foreground))" }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="animate-fade-in" key={activeTab}>

          {/* ===== UPLOAD ===== */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-6 neon-border-green">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,230,118,0.15)" }}>
                    <Icon name="Link" size={16} className="neon-text-green" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Ссылка на таблицу</h2>
                    <p className="text-xs text-muted-foreground">Публичные и приватные Google Таблицы</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <input type="text" value={sheetUrl} onChange={e => setSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      onKeyDown={e => e.key === 'Enter' && handleProcess()}
                    />
                    {sheetUrl && (
                      <button onClick={() => setSheetUrl("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        <Icon name="X" size={15} />
                      </button>
                    )}
                  </div>

                  <input type="text" value={sheetName} onChange={e => setSheetName(e.target.value)}
                    placeholder="Название (необязательно)"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary rounded-xl p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-1.5">Лист</p>
                      <select className="w-full bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer">
                        <option>Лист 1 (авто)</option>
                        <option>Все листы</option>
                      </select>
                    </div>
                    <div className="bg-secondary rounded-xl p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-1.5">Диапазон</p>
                      <input value={sheetRange} onChange={e => setSheetRange(e.target.value)}
                        placeholder="A1:Z1000"
                        className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      />
                    </div>
                  </div>

                  {(isProcessing || progress > 0) && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{isProcessing ? "Извлечение данных..." : progress === 100 ? "✓ Готово!" : "Обработка..."}</span>
                        <span className="font-mono neon-text-green">{Math.min(Math.round(progress), 100)}%</span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                            background: "linear-gradient(90deg, #00e676, #69f0ae)",
                            boxShadow: "0 0 10px rgba(0,230,118,0.5)"
                          }} />
                      </div>
                    </div>
                  )}

                  {parseError && (
                    <div className="rounded-xl p-3 border flex items-start gap-2"
                      style={{ background: "rgba(255,53,53,0.08)", borderColor: "rgba(255,53,53,0.3)" }}>
                      <Icon name="AlertCircle" size={16} style={{ color: "#ff3535", flexShrink: 0, marginTop: 1 }} />
                      <p className="text-sm" style={{ color: "#ff8080" }}>{parseError}</p>
                    </div>
                  )}

                  {parseResult && !isProcessing && (
                    <div className="rounded-xl p-3 border flex items-center gap-2"
                      style={{ background: "rgba(0,230,118,0.08)", borderColor: "rgba(0,230,118,0.3)" }}>
                      <Icon name="CheckCircle2" size={16} className="neon-text-green flex-shrink-0" />
                      <p className="text-sm neon-text-green">
                        Извлечено {parseResult.rows_count.toLocaleString("ru")} строк × {parseResult.columns_count} столбцов
                      </p>
                    </div>
                  )}

                  <button onClick={handleProcess} disabled={isProcessing || !sheetUrl.trim()}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover-scale flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #00e676, #00bcd4)", color: "#0a0f0d" }}>
                    {isProcessing ? (
                      <><Icon name="Loader2" size={16} className="animate-spin" />Парсинг...</>
                    ) : (
                      <><Icon name="Zap" size={16} />Запустить парсинг</>
                    )}
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Таблиц обработано", value: history.filter(h => h.status === "success").length.toString(), icon: "FileSpreadsheet" },
                  { label: "Строк извлечено", value: history.reduce((s, h) => s + (h.rows_count || 0), 0).toLocaleString("ru"), icon: "Rows3" },
                  { label: "Успешных", value: history.length ? `${Math.round(history.filter(h => h.status === "success").length / history.length * 100)}%` : "—", icon: "CheckCircle2" },
                ].map(stat => (
                  <div key={stat.label} className="glass-card rounded-xl p-4 border border-border text-center hover-scale cursor-default">
                    <Icon name={stat.icon} size={18} className="mx-auto mb-2 neon-text-green" />
                    <p className="text-xl font-bold neon-text-green">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== SETTINGS ===== */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-6 neon-border-purple">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(184,71,255,0.15)" }}>
                    <Icon name="ShieldOff" size={16} className="neon-text-purple" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Метод обхода защиты</h2>
                    <p className="text-xs text-muted-foreground">Способ извлечения данных</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { id: "auto",    label: "Автоматический",   desc: "Система выбирает лучший метод",      icon: "Wand2"  },
                    { id: "browser", label: "Браузерный агент",  desc: "Эмуляция браузерных запросов",       icon: "Globe"  },
                    { id: "script",  label: "Скрипт-инъекция",  desc: "Обход через экспортный endpoint",    icon: "Code2"  },
                    { id: "api",     label: "Google API",        desc: "gviz-запрос без авторизации",        icon: "Key"    },
                  ].map(method => (
                    <button key={method.id} onClick={() => setBypassMode(method.id)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover-scale"
                      style={{
                        background: bypassMode === method.id ? "rgba(184,71,255,0.1)" : "rgba(255,255,255,0.02)",
                        borderColor: bypassMode === method.id ? "rgba(184,71,255,0.5)" : "hsl(var(--border))",
                      }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: bypassMode === method.id ? "rgba(184,71,255,0.2)" : "rgba(255,255,255,0.05)" }}>
                        <Icon name={method.icon} size={16} style={{ color: bypassMode === method.id ? "#b847ff" : "hsl(var(--muted-foreground))" }} />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium" style={{ color: bypassMode === method.id ? "#b847ff" : "hsl(var(--foreground))" }}>
                          {method.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{method.desc}</p>
                      </div>
                      {bypassMode === method.id && <Icon name="CheckCircle2" size={16} style={{ color: "#b847ff" }} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Icon name="SlidersHorizontal" size={16} className="text-muted-foreground" />
                  Параметры
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Использовать заголовки", desc: "Первая строка = заголовки столбцов", val: useHeaders, toggle: () => setUseHeaders(v => !v) },
                    { label: "Удалять пустые строки",  desc: "Автоочистка пустых значений",         val: removeEmpty, toggle: () => setRemoveEmpty(v => !v) },
                  ].map((item, i) => (
                    <div key={i}>
                      {i > 0 && <div className="h-px bg-border mb-4" />}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <button onClick={item.toggle}
                          className="w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0"
                          style={{ background: item.val ? "#00e676" : "hsl(var(--secondary))" }}>
                          <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300"
                            style={{ left: item.val ? "28px" : "4px" }} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Кодировка</p>
                      <p className="text-xs text-muted-foreground">Для CSV формата</p>
                    </div>
                    <select value={encoding} onChange={e => setEncoding(e.target.value)}
                      className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none text-foreground cursor-pointer">
                      <option value="utf-8">UTF-8</option>
                      <option value="cp1251">CP1251</option>
                      <option value="latin1">Latin-1</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== DOWNLOAD ===== */}
          {activeTab === "download" && (
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-6 neon-border-cyan">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,229,255,0.15)" }}>
                    <Icon name="PackageOpen" size={16} className="neon-text-cyan" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Скачать результат</h2>
                    <p className="text-xs text-muted-foreground">
                      {downloadId ? `Запись #${downloadId} готова к выгрузке` : "Сначала выполните парсинг"}
                    </p>
                  </div>
                </div>

                {!downloadId && !parseResult && (
                  <div className="text-center py-8">
                    <Icon name="FileX2" size={36} className="mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm mb-4">Нет данных для скачивания</p>
                    <button onClick={() => setActiveTab("upload")}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold hover-scale"
                      style={{ background: "rgba(0,229,255,0.1)", color: "#00e5ff", border: "1px solid rgba(0,229,255,0.3)" }}>
                      Перейти к загрузке
                    </button>
                  </div>
                )}

                {(downloadId || parseResult) && (
                  <>
                    {parseResult && (
                      <div className="bg-secondary rounded-xl p-4 border border-border mb-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-mono text-muted-foreground">ПРЕДПРОСМОТР</p>
                          <span className="text-xs font-mono neon-text-cyan">
                            {parseResult.rows_count.toLocaleString("ru")} стр · {parseResult.columns_count} кол
                          </span>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-border">
                          <table className="w-full text-xs font-mono">
                            <thead>
                              <tr style={{ background: "rgba(0,229,255,0.08)" }}>
                                {parseResult.headers.slice(0, 5).map((h, i) => (
                                  <th key={i} className="px-3 py-2 text-left whitespace-nowrap" style={{ color: "#00e5ff" }}>{h || `кол ${i+1}`}</th>
                                ))}
                                {parseResult.headers.length > 5 && <th className="px-3 py-2 text-muted-foreground">...</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {parseResult.rows.slice(0, 3).map((row, i) => (
                                <tr key={i} className="border-t border-border"
                                  style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                                  {row.slice(0, 5).map((cell, j) => (
                                    <td key={j} className="px-3 py-2 text-muted-foreground truncate max-w-[100px]">{cell}</td>
                                  ))}
                                  {row.length > 5 && <td className="px-3 py-2 text-muted-foreground">...</td>}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {[
                        { id: "csv",  label: "CSV",  ext: ".csv",  icon: "FileText",       desc: "Таблица с разделителями" },
                        { id: "json", label: "JSON", ext: ".json", icon: "Braces",         desc: "Структурированные данные" },
                        { id: "sql",  label: "SQL",  ext: ".sql",  icon: "Database",       desc: "Дамп базы данных" },
                        { id: "xlsx", label: "Excel",ext: ".csv",  icon: "FileSpreadsheet",desc: "Совместим с Excel" },
                      ].map(fmt => (
                        <button key={fmt.id} onClick={() => setSelectedFormat(fmt.id)}
                          className="p-4 rounded-xl border transition-all duration-200 text-left hover-scale"
                          style={{
                            background: selectedFormat === fmt.id ? "rgba(0,229,255,0.08)" : "rgba(255,255,255,0.02)",
                            borderColor: selectedFormat === fmt.id ? "rgba(0,229,255,0.5)" : "hsl(var(--border))",
                          }}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icon name={fmt.icon} size={16} style={{ color: selectedFormat === fmt.id ? "#00e5ff" : "hsl(var(--muted-foreground))" }} />
                            <span className="font-bold text-sm" style={{ color: selectedFormat === fmt.id ? "#00e5ff" : "hsl(var(--foreground))" }}>{fmt.label}</span>
                            <span className="ml-auto text-xs font-mono text-muted-foreground">{fmt.ext}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{fmt.desc}</p>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handleDownload(downloadId || parseResult!.id, selectedFormat, encoding)}
                      disabled={isDownloading}
                      className="w-full py-3.5 rounded-xl font-semibold text-sm hover-scale flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #00e5ff, #0072ff)", color: "#050e14" }}>
                      {isDownloading ? (
                        <><Icon name="Loader2" size={16} className="animate-spin" />Скачиваю...</>
                      ) : (
                        <><Icon name="Download" size={16} />Скачать {selectedFormat.toUpperCase()}</>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ===== HISTORY ===== */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Icon name="History" size={18} className="neon-text-orange" />
                  История операций
                  {historyLoading && <Icon name="Loader2" size={14} className="animate-spin text-muted-foreground" />}
                </h2>
                <button onClick={loadHistory}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Icon name="RefreshCw" size={13} />
                  Обновить
                </button>
              </div>

              {!historyLoading && history.length === 0 && (
                <div className="glass-card rounded-2xl p-12 neon-border-orange text-center">
                  <Icon name="Inbox" size={40} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">История пуста — запустите первый парсинг</p>
                </div>
              )}

              <div className="space-y-3">
                {history.map((item, i) => (
                  <div key={item.id}
                    className="glass-card rounded-xl p-4 border border-border hover-scale transition-all animate-slide-up"
                    style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: item.status === "success" ? "rgba(0,230,118,0.12)"
                            : item.status === "error" ? "rgba(255,53,53,0.12)" : "rgba(255,200,53,0.12)"
                        }}>
                        <Icon
                          name={item.status === "success" ? "CheckCircle2" : item.status === "error" ? "XCircle" : "Loader2"}
                          size={18}
                          style={{ color: item.status === "success" ? "#00e676" : item.status === "error" ? "#ff3535" : "#ffc835" }}
                          className={item.status === "processing" ? "animate-spin" : ""}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm truncate">{item.name}</p>
                          <span className="text-xs font-mono text-muted-foreground flex-shrink-0">{item.created_at}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">{item.url}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs font-mono"
                            style={{ color: item.status === "success" ? "#00e676" : item.status === "error" ? "#ff3535" : "#ffc835" }}>
                            {item.status === "success"
                              ? `✓ ${(item.rows_count || 0).toLocaleString("ru")} строк · ${item.columns_count || 0} столбцов`
                              : item.status === "error" ? `✗ ${item.error_message || "Ошибка"}`
                              : "⟳ Обрабатывается..."}
                          </span>
                          {item.status === "success" && (
                            <button
                              onClick={() => { setDownloadId(item.id); setParseResult(null); setActiveTab("download"); }}
                              className="text-xs flex items-center gap-1 transition-colors hover:text-foreground"
                              style={{ color: "#00e5ff" }}>
                              <Icon name="Download" size={12} />
                              Скачать
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
