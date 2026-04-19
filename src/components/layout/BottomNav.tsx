import Icon from "@/components/ui/icon";
import { TabType } from "@/pages/Index";

const ITEMS: { tab: TabType; icon: string; label: string }[] = [
  { tab: "feed", icon: "Home", label: "Лента" },
  { tab: "search", icon: "Search", label: "Поиск" },
  { tab: "live", icon: "Radio", label: "Эфир" },
  { tab: "chats", icon: "MessageCircle", label: "Чаты" },
  { tab: "profile", icon: "User", label: "Профиль" },
];

interface Props {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 glass-dark border-t border-white/5 flex items-center h-16 px-2">
      {ITEMS.map(({ tab, icon, label }) => {
        const active = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all duration-200 ${active ? "scale-105" : "hover:bg-white/5"}`}
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${active ? "btn-gradient neon-glow" : ""}`}>
              <Icon
                name={icon}
                size={18}
                className={active ? "text-white" : "text-muted-foreground"}
              />
            </div>
            <span className={`text-[10px] font-medium transition-all ${active ? "gradient-text font-semibold" : "text-muted-foreground"}`}>
              {label}
            </span>
            {tab === "live" && (
              <span className="absolute top-2 right-1/2 translate-x-3 w-1.5 h-1.5 rounded-full live-badge" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
