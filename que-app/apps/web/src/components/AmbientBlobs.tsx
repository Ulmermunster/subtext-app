export default function AmbientBlobs({ color1, color2 }: { color1?: string; color2?: string }) {
  return (
    <>
      <div
        className="blob-1"
        style={color1 ? { background: `radial-gradient(circle, ${color1}26 0%, transparent 70%)` } : undefined}
      />
      <div
        className="blob-2"
        style={color2 ? { background: `radial-gradient(circle, ${color2}1F 0%, transparent 70%)` } : undefined}
      />
    </>
  );
}
