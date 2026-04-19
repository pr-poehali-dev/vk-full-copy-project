import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

interface Post {
  id: number;
  user_id: number;
  text: string;
  image_url: string;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  created_at: string;
  user_name: string;
  user_avatar: string;
  username: string;
  liked: boolean;
}

function timeAgo(dt: string) {
  const d = new Date(dt);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`;
  return `${Math.floor(diff / 86400)} дн`;
}

export default function FeedSection() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [showComments, setShowComments] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, Array<{ id: number; text: string; user_name: string; user_avatar: string; created_at: string }>>>({});
  const [commentText, setCommentText] = useState('');
  const [recommendations, setRecommendations] = useState<Array<{ id: number; display_name: string; username: string; avatar_url: string }>>([]);
  const [followingIds, setFollowingIds] = useState<number[]>([]);

  useEffect(() => {
    loadFeed();
    api.recommendations().then(r => setRecommendations(r.users || []));
  }, []);

  const loadFeed = async () => {
    setLoading(true);
    const res = await api.getFeed();
    setPosts(res.posts || []);
    setLoading(false);
  };

  const createPost = async () => {
    if (!postText.trim()) return;
    setPosting(true);
    const res = await api.createPost(postText);
    if (res.post) setPosts(prev => [res.post, ...prev]);
    setPostText('');
    setPosting(false);
  };

  const toggleLike = async (postId: number) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, liked: !p.liked, likes_count: p.liked ? p.likes_count - 1 : p.likes_count + 1 } : p
    ));
    await api.likePost(postId);
  };

  const loadComments = async (postId: number) => {
    if (showComments === postId) { setShowComments(null); return; }
    setShowComments(postId);
    const res = await api.getComments(postId);
    setComments(prev => ({ ...prev, [postId]: res.comments || [] }));
  };

  const addComment = async (postId: number) => {
    if (!commentText.trim()) return;
    const res = await api.addComment(postId, commentText);
    if (res.comment) {
      setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), res.comment] }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
      setCommentText('');
    }
  };

  const followUser = async (userId: number) => {
    setFollowingIds(prev => [...prev, userId]);
    await api.follow(userId);
  };

  return (
    <div>
      {/* Create post */}
      <div className="px-4 pt-4 pb-3">
        <div className="glass rounded-2xl p-4">
          <div className="flex gap-3 mb-3">
            <div className="w-9 h-9 rounded-full story-ring p-[1.5px] shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full btn-gradient flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{user?.display_name?.[0]}</span>
                </div>
              )}
            </div>
            <textarea
              placeholder={`Что у вас нового, ${user?.display_name?.split(' ')[0] || ''}?`}
              value={postText}
              onChange={e => setPostText(e.target.value)}
              rows={postText ? 3 : 1}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
            />
          </div>
          {postText && (
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <div className="flex gap-2">
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Icon name="Image" size={16} /> Фото
                </button>
              </div>
              <button
                onClick={createPost}
                disabled={posting || !postText.trim()}
                className="btn-gradient text-white text-sm font-semibold px-4 py-1.5 rounded-full disabled:opacity-50"
              >
                {posting ? 'Публикую...' : 'Опубликовать'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-white/5 mx-4 mb-2" />

      {/* Feed */}
      {loading ? (
        <div className="px-4 flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass rounded-2xl p-4 animate-shimmer">
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="flex-1 flex flex-col gap-2 pt-1">
                  <div className="h-3 bg-white/10 rounded w-1/3" />
                  <div className="h-2 bg-white/5 rounded w-1/4" />
                </div>
              </div>
              <div className="h-4 bg-white/5 rounded mb-2" />
              <div className="h-3 bg-white/5 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground px-8">
          <Icon name="Rss" size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-semibold mb-1">Лента пуста</p>
          <p className="text-sm">Подпишитесь на людей или напишите первый пост!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1 px-2">
          {posts.map((post, i) => (
            <article
              key={post.id}
              className="glass rounded-2xl p-4 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.06}s`, opacity: 0 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden story-ring p-[2px] shrink-0">
                  {post.user_avatar ? (
                    <img src={post.user_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full btn-gradient flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{post.user_name?.[0]}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground">{post.user_name}</div>
                  <div className="text-xs text-muted-foreground">@{post.username} · {timeAgo(post.created_at)}</div>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Icon name="MoreHorizontal" size={18} />
                </button>
              </div>

              <p className="text-sm text-foreground/90 leading-relaxed mb-3 whitespace-pre-wrap">{post.text}</p>

              {post.image_url && (
                <img src={post.image_url} alt="" className="w-full rounded-xl mb-3 object-cover max-h-64" />
              )}

              <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-1.5 text-xs transition-all hover:scale-105 ${post.liked ? 'text-pink-500' : 'text-muted-foreground hover:text-pink-500'}`}
                >
                  <Icon name="Heart" size={16} className={post.liked ? 'fill-pink-500' : ''} />
                  <span>{post.likes_count}</span>
                </button>
                <button
                  onClick={() => loadComments(post.id)}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${showComments === post.id ? 'text-cyan-400' : 'text-muted-foreground hover:text-cyan-400'}`}
                >
                  <Icon name="MessageCircle" size={16} />
                  <span>{post.comments_count}</span>
                </button>
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-purple-400 transition-colors">
                  <Icon name="Repeat2" size={16} />
                  <span>{post.reposts_count}</span>
                </button>
                <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
                  <Icon name="Bookmark" size={16} />
                </button>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Icon name="Share2" size={16} />
                </button>
              </div>

              {showComments === post.id && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex flex-col gap-2 mb-3 max-h-48 overflow-y-auto">
                    {(comments[post.id] || []).map(c => (
                      <div key={c.id} className="flex gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden story-ring p-[1px] shrink-0">
                          {c.user_avatar ? <img src={c.user_avatar} alt="" className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full btn-gradient flex items-center justify-center"><span className="text-white text-[8px] font-bold">{c.user_name?.[0]}</span></div>}
                        </div>
                        <div className="glass rounded-xl px-3 py-1.5 flex-1">
                          <span className="text-xs font-semibold gradient-text">{c.user_name}: </span>
                          <span className="text-xs text-foreground/80">{c.text}</span>
                        </div>
                      </div>
                    ))}
                    {!(comments[post.id]?.length) && (
                      <p className="text-xs text-muted-foreground text-center py-2">Комментариев пока нет</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addComment(post.id)}
                      placeholder="Написать комментарий..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                    />
                    <button onClick={() => addComment(post.id)} className="btn-gradient rounded-full px-3 py-1.5 text-white">
                      <Icon name="Send" size={12} />
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mx-2 my-3 glass rounded-2xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Возможно, вы знакомы</h3>
          <div className="flex flex-col gap-3">
            {recommendations.slice(0, 3).map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden story-ring p-[1.5px] shrink-0">
                  {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full btn-gradient flex items-center justify-center"><span className="text-white text-xs font-bold">{u.display_name?.[0]}</span></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{u.display_name}</div>
                  <div className="text-xs text-muted-foreground">@{u.username}</div>
                </div>
                <button
                  onClick={() => followUser(u.id)}
                  disabled={followingIds.includes(u.id)}
                  className="btn-gradient text-white text-xs font-medium px-3 py-1.5 rounded-full disabled:opacity-60"
                >
                  {followingIds.includes(u.id) ? 'Подписан' : 'Подписаться'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
