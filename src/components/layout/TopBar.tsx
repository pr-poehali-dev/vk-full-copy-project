import Icon from "@/components/ui/icon";
import { TabType } from "@/pages/Index";

const TITLES: Record<TabType, string> = {
  feed: "Вспышка",
  search: "Поиск",
  live: "Трансляции",
  chats: "Сообщения",
  profile: "Профиль",
};

interface Props {
  activeTab: TabType;
  onNotifications: () => void;
  notificationsOpen: boolean;
}

export default function TopBar({ activeTab, onNotifications, notificationsOpen }: Props) {
  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 glass-dark border-b border-white/5 px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {activeTab === "feed" ? (
          <span className="font-display font-bold text-xl gradient-text">Вспышка</span>
        ) : (
          <span className="font-semibold text-foreground text-lg">{TITLES[activeTab]}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onNotifications}
          className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${notificationsOpen ? "bg-primary/20 text-primary" : "hover:bg-white/5 text-muted-foreground"}`}
        >
          <Icon name="Bell" size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500 live-badge" />
        </button>
        <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/5 text-muted-foreground transition-all">
          <Icon name="Settings" size={20} />
        </button>
      </div>
    </header>
  );
}
