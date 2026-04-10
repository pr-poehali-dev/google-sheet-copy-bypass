import Icon from "@/components/ui/icon";
import { ParseResult } from "@/types/sheet";

interface DownloadTabProps {
  downloadId: number | null;
  parseResult: ParseResult | null;
  selectedFormat: string;
  setSelectedFormat: (v: string) => void;
  encoding: string;
  isDownloading: boolean;
  onDownload: (id: number, fmt: string, enc: string) => void;
  onGoToUpload: () => void;
}

export default function DownloadTab({
  downloadId, parseResult,
  selectedFormat, setSelectedFormat,
  encoding, isDownloading,
  onDownload, onGoToUpload,
}: DownloadTabProps) {
  return (
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
            <button onClick={onGoToUpload}
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
                { id: "csv",  label: "CSV",   ext: ".csv",  icon: "FileText",        desc: "Таблица с разделителями" },
                { id: "json", label: "JSON",  ext: ".json", icon: "Braces",          desc: "Структурированные данные" },
                { id: "sql",  label: "SQL",   ext: ".sql",  icon: "Database",        desc: "Дамп базы данных" },
                { id: "xlsx", label: "Excel", ext: ".csv",  icon: "FileSpreadsheet", desc: "Совместим с Excel" },
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
              onClick={() => onDownload(downloadId || parseResult!.id, selectedFormat, encoding)}
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
  );
}
