import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";

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

interface User {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  city: string;
  followers_count: number;
  is_online: boolean;
  is_following: boolean;
}

export default function SearchSection() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [recommendations, setRecommendations] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingIds, setFollowingIds] = useState<number[]>([]);

  useEffect(() => {
    api.recommendations().then(r => setRecommendations(r.users || []));
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await api.searchUsers(query);
      setResults(res.users || []);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const followUser = async (userId: number) => {
    setFollowingIds(prev => [...prev, userId]);
    await api.follow(userId);
  };

  const showResults = query.length >= 2;

  return (
    <div className="px-4 pt-4">
      {/* Search input */}
      <div className="relative mb-5">
        <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Найти людей, посты, теги..."
          className="w-full glass neon-border rounded-2xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <Icon name="X" size={16} />
          </button>
        )}
      </div>

      {showResults ? (
        /* Search results */
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {loading ? 'Ищем...' : `Найдено: ${results.length}`}
          </h3>
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass rounded-2xl px-4 py-3 flex gap-3 items-center animate-shimmer">
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                    <div className="h-2 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="Search" size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Никого не найдено по запросу «{query}»</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {results.map((u, i) => (
                <div key={u.id}
                  className="flex items-center gap-3 glass rounded-2xl px-4 py-3 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
                >
                  <div className="w-11 h-11 rounded-full overflow-hidden story-ring p-[1.5px] shrink-0 relative">
                    {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full btn-gradient flex items-center justify-center"><span className="text-white font-bold">{u.display_name?.[0]}</span></div>}
                    {u.is_online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground">{u.display_name}</div>
                    <div className="text-xs text-muted-foreground">@{u.username} {u.city ? `· ${u.city}` : ''}</div>
                    {u.bio && <div className="text-xs text-muted-foreground/70 truncate mt-0.5">{u.bio}</div>}
                  </div>
                  <button
                    onClick={() => followUser(u.id)}
                    disabled={u.is_following || followingIds.includes(u.id)}
                    className="btn-gradient text-white text-xs font-medium px-3 py-1.5 rounded-full shrink-0 disabled:opacity-60"
                  >
                    {u.is_following || followingIds.includes(u.id) ? 'Подписан' : 'Читать'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Default view */
        <>
          {/* Categories */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Категории</h3>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  className="glass hover:bg-white/10 rounded-2xl py-3 flex flex-col items-center gap-1.5 transition-all hover:scale-105"
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* People recommendations */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Кого читают</h3>
            <div className="flex flex-col gap-2">
              {recommendations.slice(0, 5).map((u, i) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 glass rounded-2xl px-4 py-3 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.07}s`, opacity: 0 }}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden story-ring p-[1.5px] shrink-0 relative">
                    {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full btn-gradient flex items-center justify-center"><span className="text-white font-bold text-sm">{u.display_name?.[0]}</span></div>}
                    {u.is_online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground">{u.display_name}</div>
                    <div className="text-xs text-muted-foreground">@{u.username} · {u.followers_count >= 1000 ? `${(u.followers_count / 1000).toFixed(1)}K` : u.followers_count} подписчиков</div>
                  </div>
                  <button
                    onClick={() => followUser(u.id)}
                    disabled={followingIds.includes(u.id)}
                    className="btn-gradient text-white text-xs font-medium px-3 py-1.5 rounded-full shrink-0 disabled:opacity-60"
                  >
                    {followingIds.includes(u.id) ? 'Подписан' : 'Читать'}
                  </button>
                </div>
              ))}
              {recommendations.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Пока нет других пользователей
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
