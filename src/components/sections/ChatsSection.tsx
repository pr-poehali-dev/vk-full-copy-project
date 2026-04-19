import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const EMOJIS = ["❤️", "😂", "👍", "🔥", "😮", "😢"];

interface Chat {
  id: number;
  type: string;
  name: string;
  avatar_url: string;
  is_online: boolean;
  last_message: string;
  last_message_type: string;
  unread: number;
  other_user?: { id: number; display_name: string; avatar_url: string; is_online: boolean };
}

interface Message {
  id: number;
  chat_id: number;
  user_id: number;
  text: string;
  type: string;
  file_url: string;
  file_name: string;
  reply_to: { id: number; text: string; user: string } | null;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_avatar: string;
  reactions: Record<string, number>;
}

const AVATAR_FALLBACK = "https://cdn.poehali.dev/projects/f344abbe-cf43-412f-bff1-a62a4be6abec/files/bf2e15b6-3231-480c-8c9a-ed29b356d688.jpg";

function formatTime(dt: string) {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
}

function Avatar({ url, name, size = 12, online = false }: { url: string; name: string; size?: number; online?: boolean }) {
  return (
    <div className={`relative shrink-0 w-${size} h-${size}`}>
      <div className={`w-full h-full rounded-full story-ring p-[2px]`}>
        {url ? (
          <img src={url} alt={name} className="w-full h-full rounded-full object-cover" />
        ) : (
          <div className="w-full h-full rounded-full btn-gradient flex items-center justify-center">
            <span className="text-white font-bold text-sm">{name[0]?.toUpperCase()}</span>
          </div>
        )}
      </div>
      {online && <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background" />}
    </div>
  );
}

// WebRTC Video Call Component
function VideoCall({ chat, onEnd }: { chat: Chat; onEnd: () => void }) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [connected, setConnected] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      streamRef.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;
      setTimeout(() => setConnected(true), 1500);
    }).catch(() => setConnected(true));
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const toggleMute = () => {
    setMuted(m => !m);
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted; });
  };

  const toggleCam = () => {
    setCamOff(c => !c);
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = camOff; });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Remote video */}
      <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
        <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover opacity-30" />
        {!connected ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Avatar url={chat.avatar_url} name={chat.name} size={20} />
            <p className="text-white font-semibold text-lg">{chat.name}</p>
            <p className="text-white/60 text-sm animate-pulse">Звоним...</p>
          </div>
        ) : (
          <div className="absolute top-4 left-4 text-white/60 text-sm">Видеозвонок • {chat.name}</div>
        )}
        {/* Local video PiP */}
        <div className="absolute bottom-4 right-4 w-24 h-32 rounded-2xl overflow-hidden border-2 border-white/20">
          <video ref={localRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          {camOff && <div className="absolute inset-0 bg-gray-800 flex items-center justify-center"><Icon name="VideoOff" size={20} className="text-white/60" /></div>}
        </div>
      </div>

      {/* Controls */}
      <div className="h-24 flex items-center justify-center gap-6 bg-black/80 backdrop-blur">
        <button onClick={toggleMute} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${muted ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'}`}>
          <Icon name={muted ? "MicOff" : "Mic"} size={20} className="text-white" />
        </button>
        <button onClick={onEnd} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all">
          <Icon name="PhoneOff" size={24} className="text-white" />
        </button>
        <button onClick={toggleCam} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${camOff ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'}`}>
          <Icon name={camOff ? "VideoOff" : "Video"} size={20} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// Create Group Dialog
function CreateGroupDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<Array<{ id: number; display_name: string; avatar_url: string; username: string }>>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.length < 2) return;
    api.searchUsers(search).then(r => setUsers(r.users || []));
  }, [search]);

  const create = async () => {
    if (!name || selected.length === 0) return;
    setLoading(true);
    const res = await api.createChat('group', selected, name);
    if (res.chat_id) onCreated(res.chat_id);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
      <div className="w-full max-w-md mx-auto glass-dark rounded-t-3xl p-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Создать группу</h3>
          <button onClick={onClose} className="text-muted-foreground"><Icon name="X" size={20} /></button>
        </div>
        <input
          placeholder="Название группы"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full glass border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 mb-3"
        />
        <input
          placeholder="Найти участников..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full glass border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 mb-3"
        />
        {selected.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-3">
            {selected.map(id => {
              const u = users.find(x => x.id === id);
              return u ? (
                <span key={id} className="glass rounded-full px-3 py-1 text-xs text-foreground flex items-center gap-1">
                  {u.display_name}
                  <button onClick={() => setSelected(s => s.filter(x => x !== id))}><Icon name="X" size={10} /></button>
                </span>
              ) : null;
            })}
          </div>
        )}
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto mb-4">
          {users.map(u => (
            <button key={u.id} onClick={() => setSelected(s => s.includes(u.id) ? s.filter(x => x !== u.id) : [...s, u.id])}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all ${selected.includes(u.id) ? 'bg-primary/20' : 'hover:bg-white/5'}`}>
              <div className="w-8 h-8 rounded-full story-ring p-[1.5px] shrink-0">
                {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full btn-gradient flex items-center justify-center"><span className="text-white text-xs font-bold">{u.display_name[0]}</span></div>}
              </div>
              <span className="text-sm text-foreground">{u.display_name}</span>
              {selected.includes(u.id) && <Icon name="Check" size={14} className="ml-auto text-primary" />}
            </button>
          ))}
        </div>
        <button onClick={create} disabled={!name || selected.length === 0 || loading}
          className="w-full btn-gradient text-white py-3 rounded-xl font-semibold disabled:opacity-50">
          {loading ? 'Создаём...' : `Создать группу (${selected.length} чел.)`}
        </button>
      </div>
    </div>
  );
}

export default function ChatsSection() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [openChat, setOpenChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [videoCall, setVideoCall] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState<Array<{ id: number; display_name: string; avatar_url: string; username: string }>>([]);
  const [reactingTo, setReactingTo] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (openChat) {
      loadMessages(openChat.id);
      pollRef.current = setInterval(() => loadMessages(openChat.id), 3000);
    }
    return () => clearInterval(pollRef.current);
  }, [openChat?.id]);

  const loadChats = async () => {
    setLoading(true);
    const res = await api.getChats();
    setChats(res.chats || []);
    setLoading(false);
  };

  const loadMessages = async (chatId: number) => {
    const res = await api.getMessages(chatId);
    if (res.messages) setMessages(res.messages);
  };

  const sendMessage = async () => {
    if (!text.trim() || !openChat) return;
    const t = text;
    setText('');
    setReplyTo(null);
    const res = await api.sendMessage(openChat.id, t, 'text', '', '', replyTo?.id);
    if (res.message) setMessages(prev => [...prev, res.message]);
    loadChats();
  };

  const sendEmoji = async (emoji: string) => {
    if (!openChat) return;
    setShowEmoji(false);
    const res = await api.sendMessage(openChat.id, emoji, 'text');
    if (res.message) setMessages(prev => [...prev, res.message]);
  };

  const addReaction = async (msgId: number, emoji: string) => {
    setReactingTo(null);
    await api.addReaction(msgId, emoji);
    loadMessages(openChat!.id);
  };

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setSearchResult([]); return; }
    const res = await api.searchUsers(q);
    setSearchResult(res.users || []);
  };

  const startPrivateChat = async (userId: number) => {
    setMsgLoading(true);
    setSearch('');
    setSearchResult([]);
    const res = await api.createChat('private', [userId]);
    if (res.chat_id) {
      await loadChats();
      const found = chats.find(c => c.id === res.chat_id);
      if (found) setOpenChat(found);
    }
    setMsgLoading(false);
  };

  const filteredChats = chats.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) && search.length < 2
  );

  if (videoCall && openChat) return <VideoCall chat={openChat} onEnd={() => setVideoCall(false)} />;

  if (openChat) {
    return (
      <div className="flex flex-col" style={{ height: 'calc(100dvh - 7rem)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 glass-dark border-b border-white/5 shrink-0">
          <button onClick={() => { setOpenChat(null); clearInterval(pollRef.current); }} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ChevronLeft" size={22} />
          </button>
          <Avatar url={openChat.avatar_url} name={openChat.name} size={9} online={openChat.is_online} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-foreground truncate">{openChat.name}</div>
            <div className={`text-xs ${openChat.is_online ? 'text-emerald-400' : 'text-muted-foreground'}`}>
              {openChat.type === 'group' ? `Группа` : openChat.is_online ? 'онлайн' : 'не в сети'}
            </div>
          </div>
          <button onClick={() => setVideoCall(true)} className="w-9 h-9 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-purple-400 transition-all hover:scale-105">
            <Icon name="Video" size={18} />
          </button>
          <button className="w-9 h-9 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-cyan-400 transition-all hover:scale-105">
            <Icon name="Phone" size={18} />
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="MoreVertical" size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm text-center py-12">
              Начните переписку — напишите первое сообщение
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end group`}>
                {!isMe && (
                  <div className="w-6 h-6 rounded-full overflow-hidden story-ring p-[1px] shrink-0 mb-0.5">
                    {msg.sender_avatar ? <img src={msg.sender_avatar} alt="" className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full btn-gradient flex items-center justify-center"><span className="text-white text-[8px] font-bold">{msg.sender_name[0]}</span></div>}
                  </div>
                )}
                <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && openChat.type === 'group' && (
                    <span className="text-[10px] gradient-text font-semibold mb-0.5 ml-1">{msg.sender_name}</span>
                  )}
                  {msg.reply_to && (
                    <div className={`text-[10px] mb-1 px-2 py-1 rounded-lg border-l-2 border-primary/60 ${isMe ? 'bg-white/5' : 'bg-white/5'}`}>
                      <span className="gradient-text font-semibold">{msg.reply_to.user}: </span>
                      <span className="text-muted-foreground">{msg.reply_to.text}</span>
                    </div>
                  )}
                  <div
                    className={`relative px-3.5 py-2 rounded-2xl text-sm cursor-pointer ${isMe ? 'btn-gradient text-white rounded-br-sm' : 'glass text-foreground rounded-bl-sm'}`}
                    onDoubleClick={() => setReplyTo(msg)}
                    onClick={() => setReactingTo(reactingTo === msg.id ? null : msg.id)}
                  >
                    {msg.text}
                    <div className={`text-[10px] mt-0.5 ${isMe ? 'text-white/60 text-right' : 'text-muted-foreground'}`}>
                      {formatTime(msg.created_at)}
                      {isMe && <Icon name={msg.is_read ? "CheckCheck" : "Check"} size={10} className="inline ml-1" />}
                    </div>
                  </div>
                  {/* Reactions display */}
                  {Object.keys(msg.reactions || {}).length > 0 && (
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {Object.entries(msg.reactions).map(([em, cnt]) => (
                        <span key={em} onClick={() => addReaction(msg.id, em)} className="glass rounded-full px-2 py-0.5 text-xs cursor-pointer hover:scale-110 transition-transform">
                          {em} {cnt}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Reaction picker */}
                  {reactingTo === msg.id && (
                    <div className="flex gap-1 mt-1 glass rounded-2xl px-2 py-1.5 animate-scale-in">
                      {EMOJIS.map(em => (
                        <button key={em} onClick={() => addReaction(msg.id, em)} className="text-base hover:scale-125 transition-transform">{em}</button>
                      ))}
                      <button onClick={() => setReactingTo(null)} className="text-muted-foreground hover:text-foreground ml-1"><Icon name="X" size={12} /></button>
                    </div>
                  )}
                </div>
                {/* Quick reply on hover */}
                <button
                  onClick={() => setReplyTo(msg)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground mb-1"
                >
                  <Icon name="CornerUpLeft" size={14} />
                </button>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply preview */}
        {replyTo && (
          <div className="mx-3 mb-1 glass border-l-2 border-primary/60 rounded-xl px-3 py-2 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs gradient-text font-semibold">{replyTo.sender_name}</p>
              <p className="text-xs text-muted-foreground truncate">{replyTo.text}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-muted-foreground shrink-0 ml-2"><Icon name="X" size={14} /></button>
          </div>
        )}

        {/* Emoji quick panel */}
        {showEmoji && (
          <div className="mx-3 mb-1 glass rounded-2xl px-3 py-2 flex gap-2 flex-wrap animate-fade-in">
            {['👍','❤️','😂','😮','😢','🔥','💯','🎉','👏','🚀','😍','🙏'].map(em => (
              <button key={em} onClick={() => sendEmoji(em)} className="text-xl hover:scale-125 transition-transform">{em}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 glass-dark border-t border-white/5 flex items-center gap-2 shrink-0">
          <button onClick={() => setShowEmoji(!showEmoji)} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${showEmoji ? 'text-primary bg-primary/20' : 'text-muted-foreground hover:bg-white/5'}`}>
            <Icon name="Smile" size={20} />
          </button>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Сообщение..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-white/5 transition-all">
            <Icon name="Paperclip" size={18} />
          </button>
          <button
            onClick={sendMessage}
            disabled={!text.trim()}
            className="w-9 h-9 rounded-full btn-gradient flex items-center justify-center shrink-0 disabled:opacity-50 transition-all hover:scale-105"
          >
            <Icon name="Send" size={16} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 pt-3">
      {/* Top actions */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Поиск или новый чат..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <button
          onClick={() => setShowCreateGroup(true)}
          className="btn-gradient rounded-full px-3 py-2 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
        >
          <Icon name="Users" size={14} />
          Группа
        </button>
      </div>

      {/* Search results */}
      {searchResult.length > 0 && (
        <div className="glass rounded-2xl mb-3 overflow-hidden">
          <p className="text-xs text-muted-foreground px-4 pt-2 pb-1">Найденные пользователи</p>
          {searchResult.map(u => (
            <button key={u.id} onClick={() => startPrivateChat(u.id)}
              className="flex items-center gap-3 px-4 py-3 w-full hover:bg-white/5 transition-all text-left">
              <div className="w-9 h-9 rounded-full story-ring p-[1.5px] shrink-0">
                {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full btn-gradient flex items-center justify-center"><span className="text-white text-xs font-bold">{u.display_name[0]}</span></div>}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{u.display_name}</p>
                <p className="text-xs text-muted-foreground">@{u.username}</p>
              </div>
              <Icon name="MessageCircle" size={16} className="ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {/* Chat list */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass rounded-2xl p-4 flex gap-3 items-center animate-shimmer">
              <div className="w-12 h-12 rounded-full bg-white/10" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-3 bg-white/10 rounded w-1/3" />
                <div className="h-2 bg-white/5 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredChats.length === 0 && search.length < 2 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Icon name="MessageCircle" size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Нет диалогов</p>
          <p className="text-xs mt-1">Найдите пользователей через поиск</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {filteredChats.map((chat, i) => (
            <button
              key={chat.id}
              onClick={() => setOpenChat(chat)}
              className="flex items-center gap-3 px-2 py-3 rounded-2xl hover:bg-white/5 transition-all text-left animate-fade-in-up"
              style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full story-ring p-[2px]">
                  {chat.avatar_url ? (
                    <img src={chat.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full btn-gradient flex items-center justify-center">
                      {chat.type === 'group' ? <Icon name="Users" size={20} className="text-white" /> : <span className="text-white font-bold">{chat.name[0]?.toUpperCase()}</span>}
                    </div>
                  )}
                </div>
                {chat.is_online && <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-sm text-foreground flex items-center gap-1 truncate">
                    {chat.name}
                    {chat.type === 'group' && <Icon name="Users" size={11} className="text-muted-foreground shrink-0" />}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-1">
                    {chat.last_message ? formatTime(chat.last_message) : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground truncate">
                    {chat.last_message_type === 'image' ? '📷 Фото' : chat.last_message || 'Нет сообщений'}
                  </span>
                  {chat.unread > 0 && (
                    <span className="ml-2 min-w-[18px] h-[18px] rounded-full btn-gradient text-white text-[10px] font-bold flex items-center justify-center px-1 shrink-0">
                      {chat.unread > 99 ? '99+' : chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showCreateGroup && (
        <CreateGroupDialog
          onClose={() => setShowCreateGroup(false)}
          onCreated={async (id) => {
            setShowCreateGroup(false);
            await loadChats();
            const found = chats.find(c => c.id === id);
            if (found) setOpenChat(found);
          }}
        />
      )}
    </div>
  );
}
