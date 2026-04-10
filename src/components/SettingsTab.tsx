import Icon from "@/components/ui/icon";

interface SettingsTabProps {
  bypassMode: string;
  setBypassMode: (v: string) => void;
  useHeaders: boolean;
  setUseHeaders: (fn: (v: boolean) => boolean) => void;
  removeEmpty: boolean;
  setRemoveEmpty: (fn: (v: boolean) => boolean) => void;
  encoding: string;
  setEncoding: (v: string) => void;
}

export default function SettingsTab({
  bypassMode, setBypassMode,
  useHeaders, setUseHeaders,
  removeEmpty, setRemoveEmpty,
  encoding, setEncoding,
}: SettingsTabProps) {
  return (
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
            { id: "auto",    label: "Автоматический",  desc: "Система выбирает лучший метод",   icon: "Wand2"  },
            { id: "browser", label: "Браузерный агент", desc: "Эмуляция браузерных запросов",    icon: "Globe"  },
            { id: "script",  label: "Скрипт-инъекция", desc: "Обход через экспортный endpoint", icon: "Code2"  },
            { id: "api",     label: "Google API",       desc: "gviz-запрос без авторизации",     icon: "Key"    },
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
            { label: "Удалять пустые строки",  desc: "Автоочистка пустых значений",        val: removeEmpty, toggle: () => setRemoveEmpty(v => !v) },
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
  );
}
