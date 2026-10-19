/** Sello circular con texto en órbita, inspirado en el logotipo (parrilla). */
export function Stamp({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={`stamp ${className}`} aria-hidden="true">
      <svg viewBox="0 0 200 200" className="stamp__ring">
        <defs>
          <path id="stamp-circle" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <text>
          <textPath href="#stamp-circle" textLength="488">
            {text}
          </textPath>
        </text>
      </svg>
      <svg viewBox="0 0 64 64" className="stamp__grill">
        <circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" strokeWidth="3.5" />
        <path d="M18 26h28M15 32h34M18 38h28M24 15v34M32 12v40M40 15v34" stroke="currentColor" strokeWidth="2.6" />
      </svg>
    </div>
  );
}
