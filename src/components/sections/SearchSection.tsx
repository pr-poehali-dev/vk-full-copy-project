import { useState } from "react";
import Icon from "@/components/ui/icon";

const AVATAR_URL = "https://cdn.poehali.dev/projects/f344abbe-cf43-412f-bff1-a62a4be6abec/files/bf2e15b6-3231-480c-8c9a-ed29b356d688.jpg";

const TRENDING = [
  { tag: "#дизайн", posts: "14.2K постов" },
  { tag: "#технологии", posts: "9.8K постов" },
  { tag: "#музыка", posts: "22.1K постов" },
  { tag: "#природа", posts: "6.4K постов" },
  { tag: "#кино", posts: "18.7K постов" },
];

const PEOPLE = [
  { name: "Артём Волков", username: "@artem_v", followers: "8.2K", avatar: AVATAR_URL },
  { name: "Катя Морозова", username: "@kate.m", followers: "15.6K", avatar: AVATAR_URL },
  { name: "Даша Белова", username: "@dasha.b", followers: "4.1K", avatar: AVATAR_URL },
  { name: "Миша Орлов", username: "@misha_o", followers: "2.9K", avatar: AVATAR_URL },
];

const CATEGORIES = [
  { icon: "🎵", label: "Музыка" },
  { icon: "🎬", label: "Кино" },
  { icon: "🖥️", label: "Технологии" },
  { icon: "✈️", label: "Путешествия" },
  { icon: "🍕", label: "Еда" },
  { icon: "💪", label: "Спорт" },
  { icon: "🎨", label: "Арт" },
  { icon: "📚", label: "Книги" },
];

export default function SearchSection() {
  const [query, setQuery] = useState("");

  return (
    <div className="px-4 pt-4">
      {/* Search input */}
      <div className="relative mb-5">
        <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти людей, посты, теги..."
          className="w-full glass neon-border rounded-2xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <Icon name="X" size={16} />
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Категории</h3>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              className="glass hover:bg-white/10 rounded-2xl py-3 flex flex-col items-center gap-1.5 transition-all hover:scale-105 hover:neon-border"
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="text-[10px] text-muted-foreground font-medium">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Trending */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">В тренде</h3>
        <div className="flex flex-col gap-1">
          {TRENDING.map((t, i) => (
            <button
              key={t.tag}
              className="flex items-center justify-between px-4 py-3 glass rounded-2xl hover:bg-white/10 transition-all text-left animate-fade-in-up"
              style={{ animationDelay: `${i * 0.06}s`, opacity: 0 }}
            >
              <div>
                <div className="font-semibold text-sm gradient-text">{t.tag}</div>
                <div className="text-xs text-muted-foreground">{t.posts}</div>
              </div>
              <Icon name="TrendingUp" size={16} className="text-cyan-400" />
            </button>
          ))}
        </div>
      </div>

      {/* People */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Кого читают</h3>
        <div className="flex flex-col gap-2">
          {PEOPLE.map((p, i) => (
            <div
              key={p.username}
              className="flex items-center gap-3 glass rounded-2xl px-4 py-3 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.07}s`, opacity: 0 }}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden story-ring p-[1.5px] shrink-0">
                <img src={p.avatar} alt={p.name} className="w-full h-full rounded-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.username} · {p.followers} подписчиков</div>
              </div>
              <button className="btn-gradient text-white text-xs font-medium px-3 py-1.5 rounded-full shrink-0">
                Читать
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
