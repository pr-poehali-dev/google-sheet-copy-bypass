import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { TabId, HistoryItem, ParseResult, tabs, colorMap, PARSE_URL, DOWNLOAD_URL } from "@/types/sheet";
import UploadTab from "@/components/UploadTab";
import SettingsTab from "@/components/SettingsTab";
import DownloadTab from "@/components/DownloadTab";
import HistoryTab from "@/components/HistoryTab";

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
          {activeTab === "upload" && (
            <UploadTab
              sheetUrl={sheetUrl} setSheetUrl={setSheetUrl}
              sheetName={sheetName} setSheetName={setSheetName}
              sheetRange={sheetRange} setSheetRange={setSheetRange}
              isProcessing={isProcessing} progress={progress}
              parseResult={parseResult} parseError={parseError}
              history={history} onProcess={handleProcess}
            />
          )}

          {activeTab === "settings" && (
            <SettingsTab
              bypassMode={bypassMode} setBypassMode={setBypassMode}
              useHeaders={useHeaders} setUseHeaders={setUseHeaders}
              removeEmpty={removeEmpty} setRemoveEmpty={setRemoveEmpty}
              encoding={encoding} setEncoding={setEncoding}
            />
          )}

          {activeTab === "download" && (
            <DownloadTab
              downloadId={downloadId} parseResult={parseResult}
              selectedFormat={selectedFormat} setSelectedFormat={setSelectedFormat}
              encoding={encoding} isDownloading={isDownloading}
              onDownload={handleDownload} onGoToUpload={() => setActiveTab("upload")}
            />
          )}

          {activeTab === "history" && (
            <HistoryTab
              history={history} historyLoading={historyLoading}
              onRefresh={loadHistory}
              onDownloadItem={(id) => { setDownloadId(id); setParseResult(null); setActiveTab("download"); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
