export default function Wordmark({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'text-3xl font-extrabold' : 'text-xl font-bold';
  return <h1 className={`${cls} text-violet tracking-tight`}>just vibes.</h1>;
}
