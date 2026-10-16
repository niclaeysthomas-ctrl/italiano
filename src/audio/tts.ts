/**
 * Synthèse vocale (écoute) via l'API Web Speech du navigateur.
 * La qualité dépend des voix italiennes installées sur l'appareil. Plus tard, un champ `audio`
 * dans le contenu pourra pointer vers des enregistrements réels ; `speak` restera le repli.
 */
export interface SpeakOptions {
  rate?: number;
  voiceURI?: string | null;
}

const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

export const ttsSupported = synth !== null;

let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!synth) return Promise.resolve([]);
  voicesReady ??= new Promise((resolve) => {
    const immediate = synth.getVoices();
    if (immediate.length > 0) {
      resolve(immediate);
      return;
    }
    // Chrome charge les voix de façon asynchrone ; certains navigateurs n'émettent jamais l'événement.
    const timer = window.setTimeout(() => resolve(synth.getVoices()), 1500);
    synth.addEventListener(
      'voiceschanged',
      () => {
        window.clearTimeout(timer);
        resolve(synth.getVoices());
      },
      { once: true },
    );
  });
  return voicesReady;
}

/** Voix italiennes disponibles, les voix locales en premier. */
export async function italianVoices(): Promise<SpeechSynthesisVoice[]> {
  const voices = await loadVoices();
  return voices.filter((v) => v.lang.toLowerCase().startsWith('it')).sort((a, b) => Number(b.localService) - Number(a.localService));
}

async function pickVoice(voiceURI?: string | null): Promise<SpeechSynthesisVoice | undefined> {
  const voices = await italianVoices();
  return voices.find((v) => v.voiceURI === voiceURI) ?? voices[0];
}

/** Découpe en phrases : Chrome interrompt parfois les énoncés trop longs. */
function chunks(text: string): string[] {
  return text
    .split(/(?<=[.!?;:…])\s+|\n+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function stopSpeaking() {
  synth?.cancel();
}

/** Lit un texte italien ; la promesse se résout à la fin de la lecture (ou à l'arrêt). */
export async function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  if (!synth) throw new Error('La synthèse vocale n’est pas disponible dans ce navigateur.');
  synth.cancel();
  const voice = await pickVoice(options.voiceURI);
  const parts = chunks(text);
  await new Promise<void>((resolve) => {
    parts.forEach((part, index) => {
      const utterance = new SpeechSynthesisUtterance(part);
      utterance.lang = voice?.lang ?? 'it-IT';
      if (voice) utterance.voice = voice;
      utterance.rate = options.rate ?? 1;
      if (index === parts.length - 1) {
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
      }
      synth.speak(utterance);
    });
    if (parts.length === 0) resolve();
  });
}
