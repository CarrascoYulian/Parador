import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Category, Content, Copy, DayHours, Faq, GalleryImage, MenuItem, Site, Testimonial } from '../lib/types';
import { DAY_LABELS } from '../lib/hours';
import { api, uniqueId } from './api';

/* ---------------- Infraestructura común ---------------- */

interface EditorProps<T> {
  value: T;
  onSave: (v: T) => Promise<void>;
}

/** Borrador local + estado de guardado. */
function useDraft<T>(value: T) {
  const [draft, setDraft] = useState<T>(value);
  useEffect(() => setDraft(value), [value]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(value);
  return { draft, setDraft, dirty, reset: () => setDraft(value) };
}

function Panel<T>({
  title,
  intro,
  draft,
  dirty,
  reset,
  onSave,
  children,
}: {
  title: string;
  intro?: ReactNode;
  draft: T;
  dirty: boolean;
  reset: () => void;
  onSave: (v: T) => Promise<void>;
  children: ReactNode;
}) {
  const [state, setState] = useState<{ kind: 'idle' | 'saving' | 'ok' | 'error'; msg?: string }>({ kind: 'idle' });

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function save() {
    setState({ kind: 'saving' });
    try {
      await onSave(draft);
      setState({ kind: 'ok', msg: 'Cambios publicados' });
      window.setTimeout(() => setState((s) => (s.kind === 'ok' ? { kind: 'idle' } : s)), 2600);
    } catch (e) {
      setState({ kind: 'error', msg: e instanceof Error ? e.message : 'No se pudo guardar' });
    }
  }

  return (
    <section className="adm-panel">
      <header className="adm-panel__head">
        <h1>{title}</h1>
        {intro && <div className="adm-panel__intro">{intro}</div>}
      </header>
      <div className="adm-panel__body">{children}</div>
      <div className="adm-savebar" data-visible={dirty || state.kind !== 'idle'}>
        <span role="status" className={`adm-savebar__msg adm-savebar__msg--${state.kind}`}>
          {state.kind === 'error' ? state.msg : state.kind === 'ok' ? state.msg : dirty ? 'Tienes cambios sin guardar' : ''}
        </span>
        <div className="adm-savebar__actions">
          <button className="adm-btn adm-btn--ghost" onClick={reset} disabled={!dirty || state.kind === 'saving'}>
            Descartar
          </button>
          <button className="adm-btn adm-btn--primary" onClick={save} disabled={!dirty || state.kind === 'saving'}>
            {state.kind === 'saving' ? 'Guardando…' : 'Guardar y publicar'}
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({ label, hint, children, wide }: { label: string; hint?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`adm-field${wide ? ' adm-field--wide' : ''}`}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="adm-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="adm-toggle__track" aria-hidden="true" />
      {label}
    </label>
  );
}

function ImagePicker({ value, onChange, label = 'Foto' }: { value: string; onChange: (src: string) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const { src } = await api.upload(file);
      onChange(src);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className="adm-image">
      <div className="adm-image__preview">{value ? <img src={value} alt="" /> : <span>Sin foto</span>}</div>
      <div className="adm-image__actions">
        <span className="adm-image__label">{label}</span>
        <button type="button" className="adm-btn adm-btn--small" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? 'Subiendo…' : value ? 'Cambiar' : 'Subir foto'}
        </button>
        {value && (
          <button type="button" className="adm-btn adm-btn--small adm-btn--ghost" onClick={() => onChange('')}>
            Quitar
          </button>
        )}
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pick(e.target.files?.[0])} />
        {error && <small className="adm-error">{error}</small>}
      </div>
    </div>
  );
}

function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function RowTools({ index, total, onMove, onDelete }: { index: number; total: number; onMove: (to: number) => void; onDelete: () => void }) {
  return (
    <div className="adm-rowtools">
      <button type="button" aria-label="Subir" onClick={() => onMove(index - 1)} disabled={index === 0}>
        ↑
      </button>
      <button type="button" aria-label="Bajar" onClick={() => onMove(index + 1)} disabled={index === total - 1}>
        ↓
      </button>
      <button
        type="button"
        aria-label="Eliminar"
        className="adm-rowtools__del"
        onClick={() => window.confirm('¿Eliminar este elemento?') && onDelete()}
      >
        ✕
      </button>
    </div>
  );
}

/* ---------------- Información ---------------- */

export function InfoEditor({ value, onSave }: EditorProps<Site>) {
  const d = useDraft(value);
  const set = <K extends keyof Site>(k: K, v: Site[K]) => d.setDraft((s) => ({ ...s, [k]: v }));
  const s = d.draft;
  return (
    <Panel title="Información del parador" {...d} onSave={onSave}>
      <div className="adm-grid">
        <Field label="Nombre">
          <input value={s.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Lema">
          <input value={s.slogan} onChange={(e) => set('slogan', e.target.value)} />
        </Field>
        <Field label="Dirección completa" wide>
          <input value={s.address} onChange={(e) => set('address', e.target.value)} />
        </Field>
        <Field label="Dirección corta">
          <input value={s.addressShort} onChange={(e) => set('addressShort', e.target.value)} />
        </Field>
        <Field label="Rango de precios" hint="Opcional. Ej: RD$500–1,000 por persona">
          <input value={s.priceRange} onChange={(e) => set('priceRange', e.target.value)} />
        </Field>
        <Field label="Latitud">
          <input type="number" step="any" value={s.lat} onChange={(e) => set('lat', Number(e.target.value))} />
        </Field>
        <Field label="Longitud">
          <input type="number" step="any" value={s.lng} onChange={(e) => set('lng', Number(e.target.value))} />
        </Field>
      </div>

      <h2 className="adm-h2">Contacto</h2>
      <div className="adm-grid">
        <Field
          label="WhatsApp"
          hint="Solo números con código de país, sin + ni espacios (ej. 1809XXXXXXX). Si lo dejas vacío, los botones usarán el mensaje directo de Instagram."
        >
          <input inputMode="numeric" value={s.whatsapp} onChange={(e) => set('whatsapp', e.target.value.replace(/\D/g, ''))} />
        </Field>
        <Field label="Teléfono" hint="Opcional. Se muestra en Visítanos.">
          <input type="tel" value={s.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="Instagram (URL)">
          <input type="url" value={s.instagram} onChange={(e) => set('instagram', e.target.value)} />
        </Field>
        <Field label="Threads (URL)">
          <input type="url" value={s.threads} onChange={(e) => set('threads', e.target.value)} />
        </Field>
        <Field label="PedidosYa (URL)" wide>
          <input type="url" value={s.pedidosya} onChange={(e) => set('pedidosya', e.target.value)} />
        </Field>
      </div>

      <h2 className="adm-h2">Aviso destacado</h2>
      <Field label="Texto del aviso" hint="Aparece en una franja en la parte superior del sitio. Déjalo vacío para ocultarlo. Ej: «Este domingo abrimos por el Día de las Madres»." wide>
        <input value={s.notice} onChange={(e) => set('notice', e.target.value)} maxLength={240} />
      </Field>

      <h2 className="adm-h2">Valoración pública</h2>
      <div className="adm-grid">
        <Field label="Puntuación">
          <input type="number" step="0.1" min={0} max={5} value={s.rating.value} onChange={(e) => set('rating', { ...s.rating, value: Number(e.target.value) })} />
        </Field>
        <Field label="Número de reseñas">
          <input type="number" min={0} value={s.rating.count} onChange={(e) => set('rating', { ...s.rating, count: Math.round(Number(e.target.value)) })} />
        </Field>
        <Field label="Fuente">
          <input value={s.rating.source} onChange={(e) => set('rating', { ...s.rating, source: e.target.value })} />
        </Field>
        <div className="adm-field">
          <span>Visibilidad</span>
          <Toggle checked={s.rating.show} onChange={(v) => set('rating', { ...s.rating, show: v })} label="Mostrar en la portada" />
          <small>Actualiza la cifra de vez en cuando para que coincida con Google Maps.</small>
        </div>
      </div>
    </Panel>
  );
}

/* ---------------- Horarios ---------------- */

export function HoursEditor({ value, onSave }: EditorProps<DayHours[]>) {
  const d = useDraft(value);
  const update = (day: number, patch: Partial<DayHours>) =>
    d.setDraft((list) => list.map((h) => (h.day === day ? { ...h, ...patch } : h)));
  return (
    <Panel
      title="Horarios"
      intro="El sitio calcula automáticamente si el parador está abierto (hora de República Dominicana)."
      {...d}
      onSave={onSave}
    >
      <table className="adm-hours">
        <thead>
          <tr>
            <th>Día</th>
            <th>Abierto</th>
            <th>Abre</th>
            <th>Cierra</th>
          </tr>
        </thead>
        <tbody>
          {[...d.draft]
            .sort((a, b) => a.day - b.day)
            .map((h) => (
              <tr key={h.day}>
                <th>{DAY_LABELS[h.day]}</th>
                <td>
                  <Toggle checked={!h.closed} onChange={(v) => update(h.day, { closed: !v })} label={h.closed ? 'Cerrado' : 'Abierto'} />
                </td>
                <td>
                  <input type="time" value={h.open} disabled={h.closed} onChange={(e) => update(h.day, { open: e.target.value })} aria-label={`Hora de apertura ${DAY_LABELS[h.day]}`} />
                </td>
                <td>
                  <input type="time" value={h.close} disabled={h.closed} onChange={(e) => update(h.day, { close: e.target.value })} aria-label={`Hora de cierre ${DAY_LABELS[h.day]}`} />
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </Panel>
  );
}

/* ---------------- Textos ---------------- */

const COPY_FIELDS: { key: keyof Copy; label: string; long?: boolean }[] = [
  { key: 'heroEyebrow', label: 'Portada · etiqueta superior' },
  { key: 'heroTitle', label: 'Portada · titular' },
  { key: 'heroText', label: 'Portada · texto', long: true },
  { key: 'placeTitle', label: 'El lugar · titular' },
  { key: 'placeText', label: 'El lugar · texto', long: true },
  { key: 'kitchenTitle', label: 'Cocina · titular' },
  { key: 'kitchenText', label: 'Cocina · texto', long: true },
  { key: 'terraceTitle', label: 'Terraza · titular' },
  { key: 'terraceText', label: 'Terraza · texto', long: true },
  { key: 'marketTitle', label: 'Mini market · titular' },
  { key: 'marketText', label: 'Mini market · texto', long: true },
  { key: 'closingTitle', label: 'Cierre · titular' },
];

export function CopyEditor({ value, onSave }: EditorProps<Copy>) {
  const d = useDraft(value);
  return (
    <Panel title="Textos de las secciones" intro="Frases cortas y naturales funcionan mejor. Los titulares se ven muy grandes." {...d} onSave={onSave}>
      <div className="adm-grid">
        {COPY_FIELDS.map((f) => (
          <Field key={f.key} label={f.label} wide={f.long}>
            {f.long ? (
              <textarea rows={3} value={d.draft[f.key]} onChange={(e) => d.setDraft((c) => ({ ...c, [f.key]: e.target.value }))} />
            ) : (
              <input value={d.draft[f.key]} onChange={(e) => d.setDraft((c) => ({ ...c, [f.key]: e.target.value }))} />
            )}
          </Field>
        ))}
      </div>
    </Panel>
  );
}

/* ---------------- Menú ---------------- */

export function MenuEditor({ value, onSave }: EditorProps<Content['menu']>) {
  const d = useDraft(value);
  const [open, setOpen] = useState<string | null>(null);
  const { categories, items } = d.draft;

  const setItems = (fn: (items: MenuItem[]) => MenuItem[]) => d.setDraft((m) => ({ ...m, items: fn(m.items) }));
  const setCats = (fn: (c: Category[]) => Category[]) => d.setDraft((m) => ({ ...m, categories: fn(m.categories) }));
  const patchItem = (id: string, patch: Partial<MenuItem>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  function addItem(category: string) {
    const id = uniqueId('nuevo-plato', items.map((i) => i.id));
    setItems((list) => [
      ...list,
      { id, name: 'Nuevo plato', description: '', category, price: null, image: '', featured: false, active: false, source: 'Añadido desde el panel' },
    ]);
    setOpen(id);
  }

  function addCategory() {
    const name = window.prompt('Nombre de la nueva categoría');
    if (!name?.trim()) return;
    setCats((c) => [...c, { id: uniqueId(name, c.map((x) => x.id)), name: name.trim(), description: '' }]);
  }

  return (
    <Panel
      title="Menú"
      intro={
        <>
          Los platos <strong>inactivos</strong> no se muestran en el sitio. Si un plato no tiene precio, aparece como «Consultar». Los
          marcados como <strong>destacados</strong> (con foto) aparecen en la sección Cocina.
        </>
      }
      {...d}
      onSave={onSave}
    >
      {categories.map((cat, ci) => {
        const catItems = items.filter((i) => i.category === cat.id);
        return (
          <div key={cat.id} className="adm-cat">
            <div className="adm-cat__head">
              <input
                className="adm-cat__name"
                value={cat.name}
                aria-label="Nombre de la categoría"
                onChange={(e) => setCats((c) => c.map((x) => (x.id === cat.id ? { ...x, name: e.target.value } : x)))}
              />
              <input
                className="adm-cat__desc"
                value={cat.description}
                placeholder="Descripción breve de la categoría"
                aria-label="Descripción de la categoría"
                onChange={(e) => setCats((c) => c.map((x) => (x.id === cat.id ? { ...x, description: e.target.value } : x)))}
              />
              <RowTools
                index={ci}
                total={categories.length}
                onMove={(to) => setCats((c) => move(c, ci, to))}
                onDelete={() => {
                  if (catItems.length) return window.alert('Mueve o elimina primero los platos de esta categoría.');
                  setCats((c) => c.filter((x) => x.id !== cat.id));
                }}
              />
            </div>

            <ul className="adm-items">
              {catItems.map((item) => {
                const idx = items.indexOf(item);
                const isOpen = open === item.id;
                return (
                  <li key={item.id} className="adm-item" data-open={isOpen} data-inactive={!item.active}>
                    <button type="button" className="adm-item__summary" onClick={() => setOpen(isOpen ? null : item.id)} aria-expanded={isOpen}>
                      {item.image ? <img src={item.image} alt="" /> : <span className="adm-item__noimg" />}
                      <strong>{item.name}</strong>
                      <span className="adm-item__meta">
                        {item.featured && <em className="adm-badge">Destacado</em>}
                        {!item.active && <em className="adm-badge adm-badge--muted">Inactivo</em>}
                        <span>{item.price !== null ? `RD$${item.price}` : 'Sin precio'}</span>
                      </span>
                    </button>
                    {isOpen && (
                      <div className="adm-item__body">
                        <div className="adm-grid">
                          <Field label="Nombre">
                            <input value={item.name} onChange={(e) => patchItem(item.id, { name: e.target.value })} />
                          </Field>
                          <Field label="Precio (RD$)" hint="Déjalo vacío para mostrar «Consultar».">
                            <input
                              type="number"
                              min={0}
                              inputMode="numeric"
                              value={item.price ?? ''}
                              onChange={(e) => patchItem(item.id, { price: e.target.value === '' ? null : Number(e.target.value) })}
                            />
                          </Field>
                          <Field label="Descripción" wide>
                            <textarea rows={2} value={item.description} onChange={(e) => patchItem(item.id, { description: e.target.value })} />
                          </Field>
                          <Field label="Categoría">
                            <select value={item.category} onChange={(e) => patchItem(item.id, { category: e.target.value })}>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <div className="adm-field">
                            <span>Visibilidad</span>
                            <Toggle checked={!!item.active} onChange={(v) => patchItem(item.id, { active: v })} label="Visible en el sitio" />
                            <Toggle checked={item.featured} onChange={(v) => patchItem(item.id, { featured: v })} label="Destacado en Cocina" />
                          </div>
                          <div className="adm-field adm-field--wide">
                            <ImagePicker value={item.image} onChange={(src) => patchItem(item.id, { image: src })} />
                          </div>
                          <Field label="Nota interna (no se publica)" wide hint="Úsala para recordar de dónde salió el dato o qué falta confirmar.">
                            <input value={item.source ?? ''} onChange={(e) => patchItem(item.id, { source: e.target.value })} />
                          </Field>
                        </div>
                        <div className="adm-item__tools">
                          <RowTools
                            index={idx}
                            total={items.length}
                            onMove={(to) => setItems((list) => move(list, idx, to))}
                            onDelete={() => setItems((list) => list.filter((i) => i.id !== item.id))}
                          />
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <button type="button" className="adm-btn adm-btn--small adm-btn--ghost" onClick={() => addItem(cat.id)}>
              + Añadir plato a {cat.name}
            </button>
          </div>
        );
      })}
      <button type="button" className="adm-btn" onClick={addCategory}>
        + Nueva categoría
      </button>
    </Panel>
  );
}

/* ---------------- Galería ---------------- */

export function GalleryEditor({ value, onSave }: EditorProps<GalleryImage[]>) {
  const d = useDraft(value);
  const patch = (id: string, p: Partial<GalleryImage>) => d.setDraft((list) => list.map((g) => (g.id === id ? { ...g, ...p } : g)));
  const [adding, setAdding] = useState(false);

  return (
    <Panel
      title="Galería"
      intro="El orden aquí es el orden en el sitio. El texto alternativo describe la foto para personas que usan lectores de pantalla y ayuda al posicionamiento en Google."
      {...d}
      onSave={onSave}
    >
      <ul className="adm-gallery">
        {d.draft.map((g, i) => (
          <li key={g.id} className="adm-gallery__item">
            <ImagePicker value={g.src} onChange={(src) => src && patch(g.id, { src })} />
            <div className="adm-grid">
              <Field label="Texto alternativo (obligatorio)" wide>
                <input value={g.alt} onChange={(e) => patch(g.id, { alt: e.target.value })} />
              </Field>
              <Field label="Pie de foto">
                <input value={g.caption} onChange={(e) => patch(g.id, { caption: e.target.value })} />
              </Field>
              <Field label="Categoría">
                <select value={g.tag} onChange={(e) => patch(g.id, { tag: e.target.value as GalleryImage['tag'] })}>
                  <option value="lugar">El lugar</option>
                  <option value="cocina">Cocina</option>
                  <option value="market">Mini market</option>
                </select>
              </Field>
            </div>
            <RowTools
              index={i}
              total={d.draft.length}
              onMove={(to) => d.setDraft((list) => move(list, i, to))}
              onDelete={() => d.setDraft((list) => list.filter((x) => x.id !== g.id))}
            />
          </li>
        ))}
      </ul>
      {adding ? (
        <div className="adm-gallery__new">
          <ImagePicker
            value=""
            label="Nueva foto"
            onChange={(src) => {
              if (!src) return;
              d.setDraft((list) => [...list, { id: uniqueId('foto', list.map((x) => x.id)), src, alt: '', caption: '', tag: 'lugar' }]);
              setAdding(false);
            }}
          />
        </div>
      ) : (
        <button type="button" className="adm-btn" onClick={() => setAdding(true)}>
          + Añadir foto
        </button>
      )}
    </Panel>
  );
}

/* ---------------- Reseñas y preguntas ---------------- */

export function TestimonialsEditor({ value, onSave }: EditorProps<Testimonial[]>) {
  const d = useDraft(value);
  return (
    <Panel
      title="Reseñas destacadas"
      intro="Frases breves de reseñas públicas reales. No escribas reseñas inventadas: cita la fuente."
      {...d}
      onSave={onSave}
    >
      <ul className="adm-list">
        {d.draft.map((t, i) => (
          <li key={i} className="adm-list__item">
            <div className="adm-grid">
              <Field label="Frase" wide>
                <textarea rows={2} value={t.text} onChange={(e) => d.setDraft((l) => l.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
              </Field>
              <Field label="Fuente">
                <input value={t.source} onChange={(e) => d.setDraft((l) => l.map((x, j) => (j === i ? { ...x, source: e.target.value } : x)))} />
              </Field>
            </div>
            <RowTools index={i} total={d.draft.length} onMove={(to) => d.setDraft((l) => move(l, i, to))} onDelete={() => d.setDraft((l) => l.filter((_, j) => j !== i))} />
          </li>
        ))}
      </ul>
      <button type="button" className="adm-btn" onClick={() => d.setDraft((l) => [...l, { text: '', source: 'Reseña en Google Maps' }])}>
        + Añadir reseña
      </button>
    </Panel>
  );
}

export function FaqEditor({ value, onSave }: EditorProps<Faq[]>) {
  const d = useDraft(value);
  return (
    <Panel title="Preguntas frecuentes" {...d} onSave={onSave}>
      <ul className="adm-list">
        {d.draft.map((f, i) => (
          <li key={i} className="adm-list__item">
            <div className="adm-grid">
              <Field label="Pregunta" wide>
                <input value={f.q} onChange={(e) => d.setDraft((l) => l.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
              </Field>
              <Field label="Respuesta" wide>
                <textarea rows={3} value={f.a} onChange={(e) => d.setDraft((l) => l.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
              </Field>
            </div>
            <RowTools index={i} total={d.draft.length} onMove={(to) => d.setDraft((l) => move(l, i, to))} onDelete={() => d.setDraft((l) => l.filter((_, j) => j !== i))} />
          </li>
        ))}
      </ul>
      <button type="button" className="adm-btn" onClick={() => d.setDraft((l) => [...l, { q: '', a: '' }])}>
        + Añadir pregunta
      </button>
    </Panel>
  );
}
