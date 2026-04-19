import Icon from "@/components/ui/icon";

const AVATAR_URL = "https://cdn.poehali.dev/projects/f344abbe-cf43-412f-bff1-a62a4be6abec/files/bf2e15b6-3231-480c-8c9a-ed29b356d688.jpg";

const NOTIFS = [
  { id: 1, type: "like", user: "Артём Волков", text: "оценил твой пост", time: "2 мин", icon: "Heart", color: "text-pink-500", bg: "bg-pink-500/20" },
  { id: 2, type: "follow", user: "Катя Морозова", text: "подписалась на тебя", time: "10 мин", icon: "UserPlus", color: "text-purple-400", bg: "bg-purple-500/20" },
  { id: 3, type: "comment", user: "Даша Белова", text: "прокомментировала: «Супер! 🔥»", time: "25 мин", icon: "MessageCircle", color: "text-cyan-400", bg: "bg-cyan-500/20" },
  { id: 4, type: "like", user: "Миша Орлов", text: "оценил твой пост", time: "1 ч", icon: "Heart", color: "text-pink-500", bg: "bg-pink-500/20" },
  { id: 5, type: "repost", user: "Рома Ким", text: "поделился твоим постом", time: "2 ч", icon: "Repeat2", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  { id: 6, type: "live", user: "Катя Морозова", text: "начала трансляцию", time: "3 ч", icon: "Radio", color: "text-orange-400", bg: "bg-orange-500/20" },
  { id: 7, type: "follow", user: "Алекс Новиков", text: "подписался на тебя", time: "5 ч", icon: "UserPlus", color: "text-purple-400", bg: "bg-purple-500/20" },
  { id: 8, type: "comment", user: "Ира Соколова", text: "прокомментировала: «Согласна!»", time: "вчера", icon: "MessageCircle", color: "text-cyan-400", bg: "bg-cyan-500/20" },
];

interface Props {
  onBack: () => void;
}

export default function NotificationsSection({ onBack }: Props) {
  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-lg gradient-text">Уведомления</h2>
        <button onClick={onBack} className="glass neon-border rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-all">
          Закрыть
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {["Все", "Лайки", "Подписки", "Комментарии"].map((f, i) => (
          <button
            key={f}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              i === 0 ? "btn-gradient text-white" : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {NOTIFS.map((n, i) => (
          <div
            key={n.id}
            className="flex items-center gap-3 glass rounded-2xl px-4 py-3 animate-fade-in-up"
            style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
          >
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full overflow-hidden story-ring p-[1.5px]">
                <img src={AVATAR_URL} alt={n.user} className="w-full h-full rounded-full object-cover" />
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${n.bg} flex items-center justify-center`}>
                <Icon name={n.icon} size={11} className={n.color} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-foreground">{n.user} </span>
              <span className="text-sm text-muted-foreground">{n.text}</span>
              <div className="text-xs text-muted-foreground/60 mt-0.5">{n.time}</div>
            </div>
            {(n.type === "follow") && (
              <button className="btn-gradient text-white text-xs font-medium px-3 py-1.5 rounded-full shrink-0">
                В ответ
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
