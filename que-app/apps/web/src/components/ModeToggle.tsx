interface Props {
  mode: 'AUTO' | 'PICK';
  onModeChange: (mode: 'AUTO' | 'PICK') => void;
  hasPreview?: boolean;
}

export default function ModeToggle({ mode, onModeChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => onModeChange('AUTO')}
        className={`card p-4 text-left transition-all cursor-pointer ${
          mode === 'AUTO' ? 'border-gold ring-2 ring-gold/20' : ''
        }`}
      >
        <div className="text-lg mb-1">✨ Let Spotify pick</div>
        <div className="text-muted text-xs">Plays from the start</div>
      </button>
      <button
        onClick={() => onModeChange('PICK')}
        className={`card p-4 text-left transition-all cursor-pointer ${
          mode === 'PICK' ? 'border-gold ring-2 ring-gold/20' : ''
        }`}
      >
        <div className="text-lg mb-1">✂️ I'll choose</div>
        <div className="text-muted text-xs">Drag to the best moment</div>
      </button>
    </div>
  );
}
