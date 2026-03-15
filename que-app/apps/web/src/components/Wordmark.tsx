export default function Wordmark({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'text-3xl font-extrabold' : 'text-xl font-bold';
  return (
    <div>
      <h1 className={`${cls} text-ink tracking-tight`}>
        Que<span className="text-gold">.</span>
      </h1>
      {size === 'lg' && (
        <p className="text-xs font-semibold text-muted uppercase tracking-[0.2em] mt-0.5">
          The Blind Taste Test
        </p>
      )}
    </div>
  );
}
