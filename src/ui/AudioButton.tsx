import { useEffect, useState } from 'react';
import { speak, stopSpeaking, ttsSupported } from '../audio/tts.ts';
import { useSettings } from '../app/context.ts';
import { Icon } from './Icon.tsx';

interface Props {
  text: string;
  label?: string;
  /** Multiplie le débit choisi dans les réglages (0,7 = plus lent). */
  speed?: number;
  variant?: 'pill' | 'icon' | 'large';
}

/** Bouton « Écouter » : lit un texte italien avec la voix et le débit choisis. */
export function AudioButton({ text, label = 'Écouter', speed = 1, variant = 'pill' }: Props) {
  const settings = useSettings();
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => stopSpeaking(), []);

  if (!ttsSupported) {
    return (
      <button type="button" className={`audio audio--${variant}`} disabled title="La synthèse vocale n’est pas disponible dans ce navigateur.">
        <Icon name="speaker" /> {variant !== 'icon' && <span>Audio indisponible</span>}
      </button>
    );
  }

  const toggle = async () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    try {
      await speak(text, { rate: settings.rate * speed, voiceURI: settings.voiceURI });
    } finally {
      setPlaying(false);
    }
  };

  return (
    <button type="button" className={`audio audio--${variant}${playing ? ' is-playing' : ''}`} onClick={toggle} aria-label={variant === 'icon' ? label : undefined}>
      <Icon name={playing ? 'stop' : 'speaker'} />
      {variant !== 'icon' && <span>{playing ? 'Arrêter' : label}</span>}
    </button>
  );
}
