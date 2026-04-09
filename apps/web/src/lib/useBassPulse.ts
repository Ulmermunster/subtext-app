import { useRef, useEffect, useState } from 'react';

/**
 * useBassPulse — connects an HTMLAudioElement to the Web Audio API
 * AnalyserNode and returns a `scale` value (1.0–1.06) driven by
 * bass frequencies. The AudioContext is only created after user
 * interaction (the caller passes the audio element after play).
 *
 * Usage:
 *   const { scale, connectAudio, disconnect } = useBassPulse();
 *   // After user clicks play:
 *   connectAudio(audioElement);
 */
export function useBassPulse() {
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const [scale, setScale] = useState(1);

  function connectAudio(audio: HTMLAudioElement) {
    try {
      // Stop any existing animation loop first
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      // Only create AudioContext once (and only after user interaction)
      if (!ctxRef.current) {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (!AC) return;
        ctxRef.current = new AC();
      }

      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      // Tear down previous source/analyser so we wire up to the NEW audio element
      if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch {}
        sourceRef.current = null;
      }
      if (analyserRef.current) {
        try { analyserRef.current.disconnect(); } catch {}
        analyserRef.current = null;
      }

      // Create fresh source + analyser for this audio element
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      sourceRef.current = source;
      analyserRef.current = analyser;

      // Start the animation loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      function tick() {
        analyser.getByteFrequencyData(dataArray);
        // Average the lowest 8 frequency bins (bass: ~0-350Hz)
        let bassSum = 0;
        for (let i = 0; i < 8; i++) bassSum += dataArray[i];
        const bassAvg = bassSum / 8 / 255; // 0..1
        // Map to subtle scale range: 1.0 to 1.06
        setScale(1 + bassAvg * 0.06);
        rafRef.current = requestAnimationFrame(tick);
      }
      tick();
    } catch {
      // Web Audio not supported — scale stays at 1
    }
  }

  function disconnect() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // Tear down audio graph nodes
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch {}
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      try { analyserRef.current.disconnect(); } catch {}
      analyserRef.current = null;
    }
    setScale(1);
  }

  useEffect(() => {
    return () => {
      disconnect();
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return { scale, connectAudio, disconnect };
}
