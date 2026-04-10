import { useState } from "react";
import Icon from "@/components/ui/icon";

type TabId = "upload" | "settings" | "download" | "history";

interface HistoryItem {
  id: number;
  name: string;
  url: string;
  rows: number;
  date: string;
  status: "success" | "processing" | "error";
}

const mockHistory: HistoryItem[] = [
  { id: 1, name: "Продажи Q1 2024", url: "https://docs.google.com/spreadsheets/d/1BxiMV...", rows: 1240, date: "09.04.2026", status: "success" },
  { id: 2, name: "База клиентов", url: "https://docs.google.com/spreadsheets/d/2CyiNW...", rows: 3872, date: "08.04.2026", status: "success" },
  { id: 3, name: "Отчёт по маркетингу", url: "https://docs.google.com/spreadsheets/d/3DzjOX...", rows: 587, date: "07.04.2026", status: "error" },
  { id: 4, name: "Инвентаризация склада", url: "https://docs.google.com/spreadsheets/d/4EakPY...", rows: 2100, date: "06.04.2026", status: "processing" },
];

const tabs = [
  { id: "upload" as TabId, label: "Загрузка", icon: "Upload", color: "green" },
  { id: "settings" as TabId, label: "Настройки", icon: "Settings2", color: "purple" },
  { id: "download" as TabId, label: "Скачать", icon: "Download", color: "cyan" },
  { id: "history" as TabId, label: "История", icon: "History", color: "orange" },
];

const colorMap = {
  green: { neonBorder: "neon-border-green", neonText: "neon-text-green", bg: "rgba(0,230,118,0.1)", hex: "#00e676" },
  purple: { neonBorder: "neon-border-purple", neonText: "neon-text-purple", bg: "rgba(184,71,255,0.1)", hex: "#b847ff" },
  cyan: { neonBorder: "neon-border-cyan", neonText: "neon-text-cyan", bg: "rgba(0,229,255,0.1)", hex: "#00e5ff" },
  orange: { neonBorder: "neon-border-orange", neonText: "neon-text-orange", bg: "rgba(255,107,53,0.1)", hex: "#ff6b35" },
};

export default function Index() {
  const [activeTab, setActiveTab] = useState<TabId>("upload");
  const [sheetUrl, setSheetUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bypassMode, setBypassMode] = useState("auto");
  const [selectedFormat, setSelectedFormat] = useState("xlsx");
  const [encoding, setEncoding] = useState("utf-8");
  const [useHeaders, setUseHeaders] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(mockHistory);

  const handleProcess = () => {
    if (!sheetUrl) return;
    setIsProcessing(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          return 100;
        }
        return p + Math.random() * 12;
      });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background bg-grid relative">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(0,230,118,0.3) 0%, transparent 70%)", filter: "blur(40px)" }} />
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
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" style={{ backgroundColor: "#00e676" }} />
              <span className="text-xs text-muted-foreground font-mono">Система готова</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-3 max-w-lg">
            Извлекай данные из Google Таблиц с обходом защиты и ограничений доступа
          </p>
        </header>

        {/* Tabs */}
        <nav className="flex gap-2 mb-6">
          {tabs.map((tab, i) => {
            const col = colorMap[tab.color as keyof typeof colorMap];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl border transition-all duration-300 hover-scale"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  background: isActive ? col.bg : "rgba(255,255,255,0.02)",
                  borderColor: isActive ? col.hex + "80" : "hsl(var(--border))",
                  boxShadow: isActive ? `0 0 20px ${col.hex}20` : "none",
                }}
              >
                <Icon name={tab.icon} size={16} style={{ color: isActive ? col.hex : "hsl(var(--muted-foreground))" }} />
                <span className="text-sm font-medium hidden sm:block" style={{ color: isActive ? col.hex : "hsl(var(--muted-foreground))" }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="animate-fade-in" key={activeTab}>

          {/* UPLOAD */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-6 neon-border-green">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,230,118,0.15)" }}>
                    <Icon name="Link" size={16} className="neon-text-green" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Ссылка на таблицу</h2>
                    <p className="text-xs text-muted-foreground">Поддерживаются публичные и приватные таблицы</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    />
                    {sheetUrl && (
                      <button onClick={() => setSheetUrl("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        <Icon name="X" size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary rounded-xl p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-1.5">Лист</p>
                      <select className="w-full bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer">
                        <option value="auto">Лист 1 (авто)</option>
                        <option value="all">Все листы</option>
                      </select>
                    </div>
                    <div className="bg-secondary rounded-xl p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-1.5">Диапазон</p>
                      <input
                        placeholder="A1:Z1000"
                        className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      />
                    </div>
                  </div>

                  {isProcessing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Извлечение данных...</span>
                        <span className="font-mono neon-text-green">{Math.min(Math.round(progress), 100)}%</span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                            background: "linear-gradient(90deg, #00e676, #69f0ae)",
                            boxShadow: "0 0 10px rgba(0,230,118,0.5)"
                          }} />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleProcess}
                    disabled={isProcessing || !sheetUrl}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover-scale flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #00e676, #00bcd4)", color: "#0a0f0d" }}>
                    {isProcessing ? (
                      <>
                        <Icon name="Loader2" size={16} className="animate-spin" />
                        Обрабатываю...
                      </>
                    ) : (
                      <>
                        <Icon name="Zap" size={16} />
                        Запустить парсинг
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Таблиц обработано", value: "24", icon: "FileSpreadsheet" },
                  { label: "Строк извлечено", value: "47.8K", icon: "Rows3" },
                  { label: "Успешных запросов", value: "96%", icon: "CheckCircle2" },
                ].map((stat) => (
                  <div key={stat.label} className="glass-card rounded-xl p-4 border border-border text-center hover-scale cursor-default">
                    <Icon name={stat.icon} size={18} className="mx-auto mb-2 neon-text-green" />
                    <p className="text-xl font-bold neon-text-green">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-6 neon-border-purple">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(184,71,255,0.15)" }}>
                    <Icon name="ShieldOff" size={16} className="neon-text-purple" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Обход защиты</h2>
                    <p className="text-xs text-muted-foreground">Методы извлечения данных</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { id: "auto", label: "Автоматический", desc: "Система выбирает лучший метод", icon: "Wand2" },
                    { id: "browser", label: "Браузерный агент", desc: "Эмуляция браузерных запросов", icon: "Globe" },
                    { id: "script", label: "Скрипт-инъекция", desc: "Внедрение скриптов для извлечения", icon: "Code2" },
                    { id: "api", label: "Google API", desc: "Прямой доступ через API ключи", icon: "Key" },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setBypassMode(method.id)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover-scale"
                      style={{
                        background: bypassMode === method.id ? "rgba(184,71,255,0.1)" : "rgba(255,255,255,0.02)",
                        borderColor: bypassMode === method.id ? "rgba(184,71,255,0.5)" : "hsl(var(--border))",
                      }}
                    >
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
                  Параметры парсинга
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Использовать заголовки", desc: "Первая строка как заголовок столбцов", value: useHeaders, toggle: () => setUseHeaders(!useHeaders) },
                    { label: "Удалять пустые строки", desc: "Автоочистка пустых значений", value: removeEmpty, toggle: () => setRemoveEmpty(!removeEmpty) },
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
                          style={{ background: item.value ? "#00e676" : "hsl(var(--secondary))" }}>
                          <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300"
                            style={{ left: item.value ? "28px" : "4px" }} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Кодировка</p>
                      <p className="text-xs text-muted-foreground">Для текстовых форматов</p>
                    </div>
                    <select value={encoding} onChange={(e) => setEncoding(e.target.value)}
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

          {/* DOWNLOAD */}
          {activeTab === "download" && (
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-6 neon-border-cyan">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,229,255,0.15)" }}>
                    <Icon name="PackageOpen" size={16} className="neon-text-cyan" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Формат выгрузки</h2>
                    <p className="text-xs text-muted-foreground">Выберите тип файла для скачивания</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { id: "xlsx", label: "Excel", ext: ".xlsx", icon: "FileSpreadsheet", desc: "Microsoft Excel" },
                    { id: "csv", label: "CSV", ext: ".csv", icon: "FileText", desc: "Таблица с разделителями" },
                    { id: "json", label: "JSON", ext: ".json", icon: "Braces", desc: "Структурированные данные" },
                    { id: "sql", label: "SQL", ext: ".sql", icon: "Database", desc: "Дамп базы данных" },
                  ].map((fmt) => (
                    <button key={fmt.id} onClick={() => setSelectedFormat(fmt.id)}
                      className="p-4 rounded-xl border transition-all duration-200 text-left hover-scale"
                      style={{
                        background: selectedFormat === fmt.id ? "rgba(0,229,255,0.08)" : "rgba(255,255,255,0.02)",
                        borderColor: selectedFormat === fmt.id ? "rgba(0,229,255,0.5)" : "hsl(var(--border))",
                      }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name={fmt.icon} size={18} style={{ color: selectedFormat === fmt.id ? "#00e5ff" : "hsl(var(--muted-foreground))" }} />
                        <span className="font-bold text-sm" style={{ color: selectedFormat === fmt.id ? "#00e5ff" : "hsl(var(--foreground))" }}>
                          {fmt.label}
                        </span>
                        <span className="ml-auto text-xs font-mono text-muted-foreground">{fmt.ext}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{fmt.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="bg-secondary rounded-xl p-4 border border-border mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-mono text-muted-foreground">ПРЕДПРОСМОТР</p>
                    <span className="text-xs font-mono neon-text-cyan">3,872 стр · 14 кол</span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr style={{ background: "rgba(0,229,255,0.08)" }}>
                          {["ID", "Имя", "Email", "Сумма"].map((h) => (
                            <th key={h} className="px-3 py-2 text-left" style={{ color: "#00e5ff" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["001", "Алексей К.", "alex@mail.ru", "₽24 500"],
                          ["002", "Мария П.", "maria@gmail.com", "₽18 200"],
                          ["003", "Дмитрий В.", "dima@yandex.ru", "₽31 750"],
                        ].map((row, i) => (
                          <tr key={i} className="border-t border-border"
                            style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-2 text-muted-foreground">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <button className="w-full py-3.5 rounded-xl font-semibold text-sm hover-scale flex items-center justify-center gap-2 transition-all"
                  style={{ background: "linear-gradient(135deg, #00e5ff, #0072ff)", color: "#050e14" }}>
                  <Icon name="Download" size={16} />
                  Скачать {selectedFormat.toUpperCase()} файл
                </button>
              </div>
            </div>
          )}

          {/* HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Icon name="History" size={18} className="neon-text-orange" />
                  История операций
                </h2>
                <button
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                  onClick={() => setHistory([])}>
                  <Icon name="Trash2" size={13} />
                  Очистить
                </button>
              </div>

              {history.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 neon-border-orange text-center">
                  <Icon name="Inbox" size={40} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">История пуста</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item, i) => (
                    <div key={item.id}
                      className="glass-card rounded-xl p-4 border border-border hover-scale transition-all animate-slide-up"
                      style={{ animationDelay: `${i * 0.06}s` }}>
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
                            <span className="text-xs font-mono text-muted-foreground flex-shrink-0">{item.date}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">{item.url}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs font-mono"
                              style={{ color: item.status === "success" ? "#00e676" : item.status === "error" ? "#ff3535" : "#ffc835" }}>
                              {item.status === "success" ? `✓ ${item.rows.toLocaleString("ru")} строк`
                                : item.status === "error" ? "✗ Ошибка доступа" : "⟳ Обрабатывается..."}
                            </span>
                            {item.status === "success" && (
                              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
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
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
