import { useState } from "react";
import Icon from "@/components/ui/icon";

const AVATAR_URL = "https://cdn.poehali.dev/projects/f344abbe-cf43-412f-bff1-a62a4be6abec/files/bf2e15b6-3231-480c-8c9a-ed29b356d688.jpg";
const LIVE_IMG = "https://cdn.poehali.dev/projects/f344abbe-cf43-412f-bff1-a62a4be6abec/files/6d519fa0-6862-4ba8-a16b-b7fad868b675.jpg";

const STREAMS = [
  { id: 1, user: "Катя Морозова", username: "@kate.m", title: "Рисую нейросетевые арты в прямом эфире", viewers: "1.2K", category: "Арт", avatar: AVATAR_URL, img: LIVE_IMG, featured: true },
  { id: 2, user: "Миша Орлов", username: "@misha_o", title: "Gamedev: делаем игру с нуля", viewers: "847", category: "Технологии", avatar: AVATAR_URL, img: LIVE_IMG, featured: false },
  { id: 3, user: "Дима Ковалёв", username: "@dima.k", title: "Готовим итальянскую пасту 🍝", viewers: "2.3K", category: "Еда", avatar: AVATAR_URL, img: LIVE_IMG, featured: false },
  { id: 4, user: "Аня Петрова", username: "@anya.p", title: "Q&A: отвечаю на ваши вопросы", viewers: "534", category: "Общение", avatar: AVATAR_URL, img: LIVE_IMG, featured: false },
];

const CHAT_MSGS = [
  { id: 1, user: "artem_v", text: "🔥 огонь!" },
  { id: 2, user: "kate.fan", text: "Такой талант 😍" },
  { id: 3, user: "dasha_b", text: "Это невероятно!" },
  { id: 4, user: "misha_o", text: "Как ты это делаешь?" },
];

export default function LiveSection() {
  const [openStream, setOpenStream] = useState<typeof STREAMS[0] | null>(null);
  const [chatMsg, setChatMsg] = useState("");
  const [chatMsgs, setChatMsgs] = useState(CHAT_MSGS);
  const [myStream, setMyStream] = useState(false);

  if (openStream) {
    return (
      <div className="flex flex-col">
        {/* Stream video */}
        <div className="relative aspect-video w-full overflow-hidden">
          <img src={openStream.img} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

          {/* Top controls */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <button
              onClick={() => setOpenStream(null)}
              className="glass-dark rounded-full p-2 text-white"
            >
              <Icon name="ChevronLeft" size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="live-badge text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
              <span className="glass-dark text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                <Icon name="Eye" size={12} />
                {openStream.viewers}
              </span>
            </div>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full overflow-hidden story-ring p-[1.5px]">
                <img src={openStream.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{openStream.user}</div>
                <div className="text-white/60 text-xs">{openStream.title}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Reactions */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto">
          {["🔥", "❤️", "😂", "👏", "😍", "🚀"].map((em) => (
            <button
              key={em}
              className="glass rounded-2xl px-4 py-2 text-lg hover:scale-110 transition-transform shrink-0"
            >
              {em}
            </button>
          ))}
          <button className="ml-auto glass neon-border rounded-2xl px-4 py-2 text-sm text-foreground hover:bg-white/10 transition-all shrink-0 flex items-center gap-1">
            <Icon name="Share2" size={14} />
            Поделиться
          </button>
        </div>

        {/* Live chat */}
        <div className="px-4 pb-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Чат трансляции</h4>
          <div className="glass rounded-2xl p-3 mb-2 h-36 overflow-y-auto flex flex-col gap-2">
            {chatMsgs.map((m) => (
              <div key={m.id} className="text-xs">
                <span className="gradient-text font-semibold">{m.user}: </span>
                <span className="text-foreground/80">{m.text}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && chatMsg.trim()) {
                  setChatMsgs(prev => [...prev, { id: prev.length + 1, user: "ты", text: chatMsg }]);
                  setChatMsg("");
                }
              }}
              placeholder="Написать в чат..."
              className="flex-1 glass border border-white/10 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
            <button className="btn-gradient rounded-full px-4 py-2 text-white text-sm font-medium">
              Отправить
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4">
      {/* Start stream CTA */}
      {!myStream ? (
        <div className="glass neon-border rounded-2xl p-4 mb-5 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full story-ring p-[2px] shrink-0">
            <img src={AVATAR_URL} alt="" className="w-full h-full rounded-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm text-foreground mb-0.5">Начни свою трансляцию</div>
            <div className="text-xs text-muted-foreground">Поделись моментом с аудиторией</div>
          </div>
          <button
            onClick={() => setMyStream(true)}
            className="btn-gradient neon-glow text-white text-sm font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 shrink-0"
          >
            <Icon name="Radio" size={14} />
            В эфир
          </button>
        </div>
      ) : (
        <div className="live-badge rounded-2xl p-4 mb-5 text-center">
          <div className="text-white font-bold text-lg mb-1 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Ты в эфире!
          </div>
          <div className="text-white/80 text-sm mb-3">Зрители: 0 · 0:00</div>
          <button
            onClick={() => setMyStream(false)}
            className="glass text-white text-sm font-medium px-4 py-2 rounded-full"
          >
            Завершить трансляцию
          </button>
        </div>
      )}

      {/* Featured stream */}
      <div className="mb-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Популярное сейчас</h3>
        <button
          onClick={() => setOpenStream(STREAMS[0])}
          className="w-full relative rounded-2xl overflow-hidden aspect-video mb-1 group"
        >
          <img src={STREAMS[0].img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="live-badge text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
            <span className="glass-dark text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
              <Icon name="Eye" size={11} />
              {STREAMS[0].viewers}
            </span>
          </div>
          <div className="absolute bottom-3 left-3 right-3 text-left">
            <div className="font-semibold text-white text-sm mb-0.5">{STREAMS[0].user}</div>
            <div className="text-white/70 text-xs">{STREAMS[0].title}</div>
          </div>
        </button>
      </div>

      {/* Other streams */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Все трансляции</h3>
        <div className="flex flex-col gap-2">
          {STREAMS.slice(1).map((stream, i) => (
            <button
              key={stream.id}
              onClick={() => setOpenStream(stream)}
              className="flex items-center gap-3 glass rounded-2xl px-4 py-3 hover:bg-white/10 transition-all text-left animate-fade-in-up"
              style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
            >
              <div className="w-20 h-14 rounded-xl overflow-hidden shrink-0 relative">
                <img src={stream.img} alt="" className="w-full h-full object-cover" />
                <span className="absolute top-1 left-1 live-badge text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">LIVE</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground truncate">{stream.user}</div>
                <div className="text-xs text-muted-foreground truncate mb-1">{stream.title}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-cyan-400 flex items-center gap-1">
                    <Icon name="Eye" size={11} />
                    {stream.viewers}
                  </span>
                  <span className="text-xs glass rounded-full px-2 py-0.5 text-muted-foreground">{stream.category}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
