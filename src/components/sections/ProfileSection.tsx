import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";

interface UserProfile {
  id: number;
  username: string;
  display_name: string;
  bio: string;
  city: string;
  website: string;
  avatar_url: string;
  cover_url: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_online: boolean;
}

interface Post {
  id: number;
  text: string;
  image_url: string;
  likes_count: number;
  comments_count: number;
}

const STATS_LABELS = ['Публикации', 'Подписчики', 'Подписки'];

export default function ProfileSection() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'saved'>('posts');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', bio: '', city: '', website: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const res = await api.getProfile();
    if (res.user) {
      setProfile(res.user);
      setPosts(res.posts || []);
      setEditForm({ display_name: res.user.display_name, bio: res.user.bio, city: res.user.city, website: res.user.website });
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    await api.updateProfile(editForm);
    setProfile(p => p ? { ...p, ...editForm } : p);
    setEditing(false);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="animate-shimmer">
        <div className="h-28 bg-white/5" />
        <div className="px-4 pt-2">
          <div className="w-20 h-20 rounded-full bg-white/10 -mt-10 mb-3" />
          <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
          <div className="h-3 bg-white/5 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const stats = [profile.posts_count, profile.followers_count, profile.following_count];

  return (
    <div>
      {/* Cover */}
      <div className="h-28 relative overflow-hidden">
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #a855f7 0%, #06b6d4 50%, #ec4899 100%)" }} />
        )}
        <div className="absolute inset-0 opacity-20 animate-shimmer" />
      </div>

      <div className="px-4 pb-4">
        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-10 mb-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full story-ring p-[3px] bg-background">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full btn-gradient flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">{profile.display_name?.[0]}</span>
                </div>
              )}
            </div>
            {profile.is_online && <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-background" />}
          </div>
          <div className="flex gap-2 pb-1">
            <button
              onClick={() => setEditing(true)}
              className="glass neon-border rounded-full px-4 py-1.5 text-sm text-foreground hover:bg-white/10 transition-all"
            >
              Редактировать
            </button>
            <button
              onClick={logout}
              className="glass rounded-full p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
            >
              <Icon name="LogOut" size={18} />
            </button>
          </div>
        </div>

        {/* Name & bio */}
        <div className="mb-4">
          <h2 className="font-display font-bold text-lg gradient-text">{profile.display_name}</h2>
          <p className="text-xs text-muted-foreground mb-1">@{profile.username}{profile.city ? ` · ${profile.city}` : ''}</p>
          {profile.bio && <p className="text-sm text-foreground/80 leading-relaxed">{profile.bio}</p>}
          {profile.website && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-cyan-400">
              <Icon name="Link" size={12} />
              <span>{profile.website}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {stats.map((v, i) => (
            <div key={i} className="glass rounded-2xl py-3 text-center">
              <div className="font-display font-bold text-lg gradient-text">{v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v}</div>
              <div className="text-xs text-muted-foreground">{STATS_LABELS[i]}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 glass rounded-xl p-1">
          {(['posts', 'saved'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${tab === t ? 'btn-gradient text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon name={t === 'posts' ? 'Grid3X3' : 'Bookmark'} size={14} />
              {t === 'posts' ? 'Посты' : 'Сохранённые'}
            </button>
          ))}
        </div>

        {/* Posts grid */}
        {tab === 'posts' && (
          posts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
              {posts.map((p) => (
                <div key={p.id} className="aspect-square overflow-hidden relative group cursor-pointer bg-white/5">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <p className="text-[10px] text-muted-foreground text-center line-clamp-4">{p.text}</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-3 text-white text-xs font-semibold">
                      <span className="flex items-center gap-1"><Icon name="Heart" size={12} /> {p.likes_count}</span>
                      <span className="flex items-center gap-1"><Icon name="MessageCircle" size={12} /> {p.comments_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Grid3X3" size={36} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Нет публикаций</p>
            </div>
          )
        )}

        {tab === 'saved' && (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="Bookmark" size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Нет сохранённых постов</p>
          </div>
        )}
      </div>

      {/* Edit profile modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
          <div className="w-full max-w-md mx-auto glass-dark rounded-t-3xl p-5 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-foreground">Редактировать профиль</h3>
              <button onClick={() => setEditing(false)} className="text-muted-foreground"><Icon name="X" size={20} /></button>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { key: 'display_name', placeholder: 'Имя', icon: 'User' },
                { key: 'bio', placeholder: 'О себе', icon: 'FileText' },
                { key: 'city', placeholder: 'Город', icon: 'MapPin' },
                { key: 'website', placeholder: 'Веб-сайт', icon: 'Link' },
              ].map(({ key, placeholder, icon }) => (
                <div key={key} className="relative">
                  <Icon name={icon} size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    placeholder={placeholder}
                    value={editForm[key as keyof typeof editForm]}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full glass border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              ))}
              <button onClick={saveProfile} disabled={saving} className="btn-gradient text-white py-3 rounded-xl font-semibold disabled:opacity-50">
                {saving ? 'Сохраняю...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
