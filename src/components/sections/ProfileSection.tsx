import { useState } from "react";
import Icon from "@/components/ui/icon";

const AVATAR_URL = "https://cdn.poehali.dev/projects/f344abbe-cf43-412f-bff1-a62a4be6abec/files/bf2e15b6-3231-480c-8c9a-ed29b356d688.jpg";

const POSTS_GRID = Array.from({ length: 9 }, (_, i) => ({ id: i + 1, img: AVATAR_URL }));

const STATS = [
  { label: "Публикации", value: "248" },
  { label: "Подписчики", value: "12.4K" },
  { label: "Подписки", value: "381" },
];

export default function ProfileSection() {
  const [tab, setTab] = useState<"posts" | "saved" | "tags">("posts");
  const [following, setFollowing] = useState(false);

  return (
    <div>
      {/* Cover */}
      <div className="h-28 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #a855f7 0%, #06b6d4 50%, #ec4899 100%)" }} />
        <div className="absolute inset-0 opacity-30 animate-shimmer" />
        <button className="absolute top-3 right-3 glass rounded-full p-1.5 text-white/80 hover:text-white transition-colors">
          <Icon name="Camera" size={16} />
        </button>
      </div>

      <div className="px-4 pb-4">
        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-10 mb-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full story-ring p-[3px] bg-background">
              <img src={AVATAR_URL} alt="Профиль" className="w-full h-full rounded-full object-cover" />
            </div>
            <button className="absolute bottom-0 right-0 w-6 h-6 rounded-full btn-gradient flex items-center justify-center border-2 border-background">
              <Icon name="Camera" size={11} className="text-white" />
            </button>
          </div>
          <div className="flex gap-2 pb-1">
            <button
              onClick={() => setFollowing(!following)}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                following ? "glass neon-border text-foreground" : "btn-gradient text-white neon-glow"
              }`}
            >
              {following ? "Подписан" : "Подписаться"}
            </button>
            <button className="glass neon-border rounded-full px-3 py-1.5 text-sm text-foreground hover:bg-white/10 transition-all">
              <Icon name="MessageCircle" size={16} />
            </button>
          </div>
        </div>

        {/* Name & bio */}
        <div className="mb-4">
          <h2 className="font-display font-bold text-lg gradient-text">Алекс Новиков</h2>
          <p className="text-xs text-muted-foreground mb-1">@alex.novikov · Москва</p>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Разработчик, дизайнер, мечтатель ✨<br />
            Создаю вещи, которые меняют мир к лучшему
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs text-cyan-400">
            <Icon name="Link" size={12} />
            <span>vspishka.app</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {STATS.map((s) => (
            <div key={s.label} className="glass rounded-2xl py-3 text-center">
              <div className="font-display font-bold text-lg gradient-text">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 glass rounded-xl p-1">
          {([
            { key: "posts", icon: "Grid3X3", label: "Посты" },
            { key: "saved", icon: "Bookmark", label: "Сохранено" },
            { key: "tags", icon: "Tag", label: "Отметки" },
          ] as const).map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === key ? "btn-gradient text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon name={icon} size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
          {POSTS_GRID.map((p, i) => (
            <div key={p.id} className="aspect-square overflow-hidden relative group cursor-pointer">
              <img src={p.img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-3 text-white text-xs font-semibold">
                  <span className="flex items-center gap-1"><Icon name="Heart" size={14} /> {120 + i * 23}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
