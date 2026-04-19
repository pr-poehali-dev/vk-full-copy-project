import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Icon from '@/components/ui/icon';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ login: '', email: '', username: '', password: '', display_name: '' });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError('');
    setLoading(true);
    let res;
    if (mode === 'login') {
      res = await login(form.login, form.password);
    } else {
      if (!form.display_name || !form.username || !form.email || !form.password) {
        setError('Заполните все поля');
        setLoading(false);
        return;
      }
      res = await register({ username: form.username, email: form.email, password: form.password, display_name: form.display_name });
    }
    if (res.error) setError(res.error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background mesh-bg flex items-center justify-center px-4">
      {/* Background orbs */}
      <div className="fixed top-0 left-0 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--neon-purple)', transform: 'translate(-30%, -30%)' }} />
      <div className="fixed bottom-0 right-0 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: 'var(--neon-cyan)', transform: 'translate(30%, 30%)' }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl btn-gradient neon-glow mb-4">
            <Icon name="Zap" size={32} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl gradient-text">Вспышка</h1>
          <p className="text-muted-foreground text-sm mt-1">Социальная сеть нового поколения</p>
        </div>

        {/* Card */}
        <div className="glass neon-border rounded-3xl p-6">
          {/* Tab switcher */}
          <div className="flex glass rounded-2xl p-1 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${mode === m ? 'btn-gradient text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {m === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {mode === 'register' && (
              <>
                <div className="relative">
                  <Icon name="User" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    placeholder="Ваше имя"
                    value={form.display_name}
                    onChange={(e) => set('display_name', e.target.value)}
                    className="w-full glass border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all"
                  />
                </div>
                <div className="relative">
                  <Icon name="AtSign" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    placeholder="Имя пользователя (без @)"
                    value={form.username}
                    onChange={(e) => set('username', e.target.value.replace(/[^a-zA-Z0-9_.]/g, ''))}
                    className="w-full glass border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all"
                  />
                </div>
                <div className="relative">
                  <Icon name="Mail" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    className="w-full glass border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all"
                  />
                </div>
              </>
            )}

            {mode === 'login' && (
              <div className="relative">
                <Icon name="AtSign" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Логин или Email"
                  value={form.login}
                  onChange={(e) => set('login', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  className="w-full glass border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all"
                />
              </div>
            )}

            <div className="relative">
              <Icon name="Lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="Пароль"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className="w-full glass border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-xl px-3 py-2 border border-red-500/20">
                <Icon name="AlertCircle" size={14} />
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="btn-gradient neon-glow text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Icon name="Loader2" size={18} className="animate-spin" /> Загрузка...</>
              ) : (
                <>{mode === 'login' ? 'Войти' : 'Создать аккаунт'}</>
              )}
            </button>
          </div>

          {mode === 'login' && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              Нет аккаунта?{' '}
              <button onClick={() => setMode('register')} className="gradient-text font-semibold">
                Зарегистрироваться
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
