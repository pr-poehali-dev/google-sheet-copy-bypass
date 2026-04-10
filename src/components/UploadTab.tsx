import Icon from "@/components/ui/icon";
import { ParseResult, HistoryItem } from "@/types/sheet";

interface UploadTabProps {
  sheetUrl: string;
  setSheetUrl: (v: string) => void;
  sheetName: string;
  setSheetName: (v: string) => void;
  sheetRange: string;
  setSheetRange: (v: string) => void;
  isProcessing: boolean;
  progress: number;
  parseResult: ParseResult | null;
  parseError: string;
  history: HistoryItem[];
  onProcess: () => void;
}

export default function UploadTab({
  sheetUrl, setSheetUrl,
  sheetName, setSheetName,
  sheetRange, setSheetRange,
  isProcessing, progress,
  parseResult, parseError,
  history, onProcess,
}: UploadTabProps) {
  return (
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
              onKeyDown={e => e.key === 'Enter' && onProcess()}
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

          <button onClick={onProcess} disabled={isProcessing || !sheetUrl.trim()}
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
  );
}
