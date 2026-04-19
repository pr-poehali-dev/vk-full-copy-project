import { useState } from "react";
import Icon from "@/components/ui/icon";

const AVATAR_URL = "https://cdn.poehali.dev/projects/f344abbe-cf43-412f-bff1-a62a4be6abec/files/bf2e15b6-3231-480c-8c9a-ed29b356d688.jpg";

const CHATS = [
  { id: 1, name: "Артём Волков", avatar: AVATAR_URL, last: "Увидимся завтра!", time: "сейчас", unread: 2, online: true },
  { id: 2, name: "Катя Морозова", avatar: AVATAR_URL, last: "Спасибо за помощь!", time: "5 мин", unread: 0, online: true },
  { id: 3, name: "Команда проекта", avatar: AVATAR_URL, last: "Миша: Деплой прошёл ✓", time: "12 мин", unread: 7, online: false, isGroup: true },
  { id: 4, name: "Даша Белова", avatar: AVATAR_URL, last: "Ты видел этот фильм?", time: "1 ч", unread: 0, online: false },
  { id: 5, name: "Рома Ким", avatar: AVATAR_URL, last: "Ок, буду в 18:00", time: "3 ч", unread: 0, online: true },
  { id: 6, name: "Миша Орлов", avatar: AVATAR_URL, last: "Фото с вечера ⬆️", time: "вчера", unread: 0, online: false },
];

const MESSAGES = [
  { id: 1, from: "them", text: "Привет! Как дела?", time: "14:20" },
  { id: 2, from: "me", text: "Отлично! Работаю над новым проектом", time: "14:21" },
  { id: 3, from: "them", text: "О, расскажи! Что за проект?", time: "14:22" },
  { id: 4, from: "me", text: "Соцсеть с живыми трансляциями 🚀", time: "14:23" },
  { id: 5, from: "them", text: "Звучит круто! Когда запуск?", time: "14:23" },
  { id: 6, from: "me", text: "Уже скоро 😄", time: "14:24" },
  { id: 7, from: "them", text: "Увидимся завтра!", time: "14:25" },
];

export default function ChatsSection() {
  const [openChat, setOpenChat] = useState<typeof CHATS[0] | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(MESSAGES);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages(prev => [...prev, { id: prev.length + 1, from: "me", text: message, time: "сейчас" }]);
    setMessage("");
  };

  if (openChat) {
    return (
      <div className="flex flex-col h-[calc(100vh-7rem)]">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 glass border-b border-white/5">
          <button onClick={() => setOpenChat(null)} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ChevronLeft" size={22} />
          </button>
          <div className="w-9 h-9 rounded-full overflow-hidden story-ring p-[1.5px] shrink-0 relative">
            <img src={openChat.avatar} alt={openChat.name} className="w-full h-full rounded-full object-cover" />
            {openChat.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">{openChat.name}</div>
            <div className="text-xs text-emerald-400">{openChat.online ? "онлайн" : "был(а) 3 ч назад"}</div>
          </div>
          <button className="text-muted-foreground hover:text-cyan-400 transition-colors">
            <Icon name="Phone" size={20} />
          </button>
          <button className="text-muted-foreground hover:text-purple-400 transition-colors">
            <Icon name="Video" size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                msg.from === "me"
                  ? "btn-gradient text-white rounded-br-sm"
                  : "glass text-foreground rounded-bl-sm"
              }`}>
                {msg.text}
                <div className={`text-[10px] mt-0.5 ${msg.from === "me" ? "text-white/60 text-right" : "text-muted-foreground"}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-3 glass border-t border-white/5 flex items-center gap-2">
          <button className="text-muted-foreground hover:text-purple-400 transition-colors">
            <Icon name="Smile" size={22} />
          </button>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Сообщение..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="Paperclip" size={20} />
          </button>
          <button
            onClick={sendMessage}
            className="w-9 h-9 rounded-full btn-gradient flex items-center justify-center shrink-0"
          >
            <Icon name="Send" size={16} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 pt-3">
      {/* Search chats */}
      <div className="mx-2 mb-4 relative">
        <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Поиск в сообщениях..."
          className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      <div className="flex flex-col">
        {CHATS.map((chat, i) => (
          <button
            key={chat.id}
            onClick={() => setOpenChat(chat)}
            className="flex items-center gap-3 px-2 py-3 rounded-2xl hover:bg-white/5 transition-all text-left animate-fade-in-up"
            style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
          >
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden story-ring p-[2px]">
                <img src={chat.avatar} alt={chat.name} className="w-full h-full rounded-full object-cover" />
              </div>
              {chat.online && <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-sm text-foreground flex items-center gap-1">
                  {chat.name}
                  {chat.isGroup && <Icon name="Users" size={12} className="text-muted-foreground" />}
                </span>
                <span className="text-xs text-muted-foreground">{chat.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground truncate">{chat.last}</span>
                {chat.unread > 0 && (
                  <span className="ml-2 min-w-[18px] h-[18px] rounded-full btn-gradient text-white text-[10px] font-bold flex items-center justify-center px-1 shrink-0">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
