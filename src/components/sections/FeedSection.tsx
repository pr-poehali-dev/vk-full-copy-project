import { useState } from "react";
import Icon from "@/components/ui/icon";

const AVATAR_URL = "https://cdn.poehali.dev/projects/f344abbe-cf43-412f-bff1-a62a4be6abec/files/bf2e15b6-3231-480c-8c9a-ed29b356d688.jpg";

const STORIES = [
  { id: 1, name: "Ты", avatar: AVATAR_URL, isMe: true, seen: false },
  { id: 2, name: "Артём", avatar: AVATAR_URL, seen: false },
  { id: 3, name: "Миша", avatar: AVATAR_URL, seen: true },
  { id: 4, name: "Катя", avatar: AVATAR_URL, seen: false },
  { id: 5, name: "Даша", avatar: AVATAR_URL, seen: true },
  { id: 6, name: "Рома", avatar: AVATAR_URL, seen: false },
];

const POSTS = [
  {
    id: 1,
    user: "Артём Волков",
    username: "@artem_v",
    avatar: AVATAR_URL,
    time: "2 мин назад",
    text: "Закат над городом — просто огонь 🔥 Иногда нужно просто остановиться и посмотреть вокруг",
    image: null,
    likes: 284,
    comments: 31,
    reposts: 12,
    liked: false,
  },
  {
    id: 2,
    user: "Катя Морозова",
    username: "@kate.m",
    avatar: AVATAR_URL,
    time: "15 мин назад",
    text: "Новый проект запущен! Месяц работы — и вот он в продакшене ✨ Спасибо всей команде",
    image: null,
    likes: 512,
    comments: 89,
    reposts: 47,
    liked: true,
  },
  {
    id: 3,
    user: "Даша Белова",
    username: "@dasha.b",
    avatar: AVATAR_URL,
    time: "1 час назад",
    text: "Кто идёт на концерт в субботу? 🎵 Беру лишний билет",
    image: null,
    likes: 143,
    comments: 56,
    reposts: 8,
    liked: false,
  },
];

export default function FeedSection() {
  const [posts, setPosts] = useState(POSTS);
  const [seenStories, setSeenStories] = useState<number[]>([]);

  const toggleLike = (id: number) => {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  return (
    <div>
      {/* Stories */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {STORIES.map((story) => {
            const seen = story.seen || seenStories.includes(story.id);
            return (
              <button
                key={story.id}
                onClick={() => setSeenStories(prev => [...prev, story.id])}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div className={`w-14 h-14 rounded-full p-[2px] ${seen ? "bg-white/10" : "story-ring"}`}>
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-background relative">
                    <img src={story.avatar} alt={story.name} className="w-full h-full object-cover" />
                    {story.isMe && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full btn-gradient flex items-center justify-center">
                        <Icon name="Plus" size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium w-14 text-center truncate">{story.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5 mx-4 mb-2" />

      {/* Posts */}
      <div className="flex flex-col gap-1 px-2">
        {posts.map((post, i) => (
          <article
            key={post.id}
            className="glass rounded-2xl p-4 animate-fade-in-up"
            style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden story-ring p-[2px] shrink-0">
                <img src={post.avatar} alt={post.user} className="w-full h-full rounded-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground">{post.user}</div>
                <div className="text-xs text-muted-foreground">{post.username} · {post.time}</div>
              </div>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="MoreHorizontal" size={18} />
              </button>
            </div>

            <p className="text-sm text-foreground/90 leading-relaxed mb-3">{post.text}</p>

            <div className="flex items-center gap-4 pt-1 border-t border-white/5">
              <button
                onClick={() => toggleLike(post.id)}
                className={`flex items-center gap-1.5 text-xs transition-all hover:scale-105 ${post.liked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"}`}
              >
                <Icon name={post.liked ? "Heart" : "Heart"} size={16} className={post.liked ? "fill-pink-500" : ""} />
                <span>{post.likes}</span>
              </button>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-cyan-400 transition-colors">
                <Icon name="MessageCircle" size={16} />
                <span>{post.comments}</span>
              </button>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-purple-400 transition-colors">
                <Icon name="Repeat2" size={16} />
                <span>{post.reposts}</span>
              </button>
              <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="Bookmark" size={16} />
              </button>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="Share2" size={16} />
              </button>
            </div>
          </article>
        ))}

        {/* Suggestions */}
        <div className="glass rounded-2xl p-4 mt-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Рекомендации</h3>
          <div className="flex flex-col gap-3">
            {[
              { name: "Алекс Новиков", username: "@alex.n", mutual: 5 },
              { name: "Ира Соколова", username: "@ira.s", mutual: 3 },
            ].map((u) => (
              <div key={u.username} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden story-ring p-[1.5px] shrink-0">
                  <img src={AVATAR_URL} alt={u.name} className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.mutual} общих друга</div>
                </div>
                <button className="btn-gradient text-white text-xs font-medium px-3 py-1.5 rounded-full">
                  Подписаться
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
