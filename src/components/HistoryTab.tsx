import Icon from "@/components/ui/icon";
import { HistoryItem } from "@/types/sheet";

interface HistoryTabProps {
  history: HistoryItem[];
  historyLoading: boolean;
  onRefresh: () => void;
  onDownloadItem: (id: number) => void;
}

export default function HistoryTab({ history, historyLoading, onRefresh, onDownloadItem }: HistoryTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <Icon name="History" size={18} className="neon-text-orange" />
          История операций
          {historyLoading && <Icon name="Loader2" size={14} className="animate-spin text-muted-foreground" />}
        </h2>
        <button onClick={onRefresh}
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
                      onClick={() => onDownloadItem(item.id)}
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
  );
}
