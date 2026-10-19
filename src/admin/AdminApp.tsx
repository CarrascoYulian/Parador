import { useCallback, useEffect, useState, type FormEvent } from 'react';
import './admin.css';
import type { Content } from '../lib/types';
import { api, ApiError } from './api';
import {
  CopyEditor,
  FaqEditor,
  GalleryEditor,
  HoursEditor,
  InfoEditor,
  MenuEditor,
  TestimonialsEditor,
} from './editors';

const TABS = [
  { id: 'site', label: 'Información', hint: 'Contacto, enlaces y aviso' },
  { id: 'hours', label: 'Horarios', hint: 'Apertura por día' },
  { id: 'menu', label: 'Menú', hint: 'Platos, precios y categorías' },
  { id: 'gallery', label: 'Galería', hint: 'Fotos y textos alternativos' },
  { id: 'copy', label: 'Textos', hint: 'Titulares de cada sección' },
  { id: 'testimonials', label: 'Reseñas', hint: 'Frases destacadas' },
  { id: 'faq', label: 'Preguntas', hint: 'Preguntas frecuentes' },
] as const;
type Tab = (typeof TABS)[number]['id'];

export default function AdminApp() {
  const [user, setUser] = useState<string | null | undefined>(undefined);
  const handleLogout = useCallback(() => setUser(null), []);

  useEffect(() => {
    document.title = 'Panel · Parador Familiar Las Américas';
    api
      .me()
      .then((u) => setUser(u.email))
      .catch(() => setUser(null));
  }, []);

  if (user === undefined) return <div className="adm-loading">Cargando…</div>;
  if (user === null) return <Login onLogin={setUser} />;
  return <Dashboard email={user} onLogout={handleLogout} />;
}

function Login({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api.login(email, password);
      onLogin(res.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="adm-login">
      <form className="adm-login__card" onSubmit={submit}>
        <img src="/images/logo.webp" alt="" width={64} height={64} />
        <h1>Panel del parador</h1>
        <p>Acceso solo para el equipo autorizado.</p>
        <label className="adm-field">
          <span>Email</span>
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="adm-field">
          <span>Contraseña</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p className="adm-error" role="alert">
            {error}
          </p>
        )}
        <button className="adm-btn adm-btn--primary" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
        <a href="/" className="adm-link">
          ← Volver al sitio
        </a>
      </form>
    </main>
  );
}

function Dashboard({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [content, setContent] = useState<Content | null>(null);
  const [tab, setTab] = useState<Tab>('site');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api
      .content()
      .then(setContent)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) onLogout();
        else setLoadError(e.message);
      });
  }, [onLogout]);

  async function save<K extends keyof Content>(section: K, value: Content[K]) {
    try {
      const saved = await api.save(section, value);
      setContent((c) => (c ? { ...c, [section]: saved } : c));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) onLogout();
      throw e;
    }
  }

  async function logout() {
    await api.logout().catch(() => {});
    onLogout();
  }

  return (
    <div className="adm">
      <aside className="adm-side">
        <a href="/" className="adm-brand" target="_blank" rel="noopener">
          <img src="/images/logo.webp" alt="" width={40} height={40} />
          <span>
            Parador
            <strong>Panel</strong>
          </span>
        </a>
        <nav className="adm-tabs" aria-label="Secciones del panel">
          {TABS.map((t) => (
            <button key={t.id} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
              <strong>{t.label}</strong>
              <span>{t.hint}</span>
            </button>
          ))}
        </nav>
        <div className="adm-side__foot">
          <span title={email}>{email}</span>
          <button className="adm-btn adm-btn--ghost" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="adm-main">
        {loadError && <p className="adm-error">{loadError}</p>}
        {!content ? (
          !loadError && <p className="adm-loading">Cargando contenido…</p>
        ) : (
          <>
            {tab === 'site' && <InfoEditor value={content.site} onSave={(v) => save('site', v)} />}
            {tab === 'hours' && <HoursEditor value={content.hours} onSave={(v) => save('hours', v)} />}
            {tab === 'menu' && <MenuEditor value={content.menu} onSave={(v) => save('menu', v)} />}
            {tab === 'gallery' && <GalleryEditor value={content.gallery} onSave={(v) => save('gallery', v)} />}
            {tab === 'copy' && <CopyEditor value={content.copy} onSave={(v) => save('copy', v)} />}
            {tab === 'testimonials' && (
              <TestimonialsEditor value={content.testimonials} onSave={(v) => save('testimonials', v)} />
            )}
            {tab === 'faq' && <FaqEditor value={content.faq} onSave={(v) => save('faq', v)} />}
          </>
        )}
      </main>
    </div>
  );
}
