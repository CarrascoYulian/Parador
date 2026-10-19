const ITEMS = ['Desayuno', 'Almuerzo', 'Comida típica dominicana', 'Parrilla', 'Terraza', 'Mini market', 'Para llevar', 'Delivery por PedidosYa'];

export function Marquee() {
  const row = (hidden: boolean) => (
    <ul className="marquee__row" aria-hidden={hidden || undefined}>
      {ITEMS.map((t) => (
        <li key={t}>
          {t}
          <span className="marquee__sep" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="marquee" role="region" aria-label="Lo que encuentras en el parador">
      <div className="marquee__track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
