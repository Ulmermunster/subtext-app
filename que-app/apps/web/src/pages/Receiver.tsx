import { useParams } from 'react-router-dom';

/**
 * Renders the receiver page inside a full-viewport iframe.
 * The receiver.html is a static file in public/ served by @fastify/static.
 * The vibeId is passed via query parameter so the receiver JS can fetch the vibe data.
 */
export default function Receiver() {
  const { id } = useParams<{ id: string }>();

  return (
    <iframe
      src={`/receiver.html?id=${id}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        border: 'none',
        zIndex: 9999,
      }}
      allow="autoplay; encrypted-media"
      title="Que. Receiver"
    />
  );
}
