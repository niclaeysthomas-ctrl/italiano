/**
 * Reconnaissance vocale (expression orale) via l'API Web Speech.
 * Disponible dans Chrome, Edge et Safari ; absente de Firefox.
 * Attention : dans Chrome, l'audio est envoyé aux serveurs de Google pour être transcrit.
 */

interface RecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<RecognitionAlternative> & { isFinal: boolean }>;
}

interface RecognitionErrorEvent {
  error: string;
}

interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionConstructor = new () => Recognition;

function getConstructor(): RecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const sttSupported = getConstructor() !== null;

export interface RecognitionOutcome {
  transcript: string;
  confidence: number;
  alternatives: string[];
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'L’accès au micro a été refusé. Autorise-le dans les réglages du navigateur.',
  'service-not-allowed': 'La reconnaissance vocale est bloquée dans ce navigateur.',
  'no-speech': 'Aucune parole détectée. Rapproche-toi du micro et réessaie.',
  'audio-capture': 'Aucun micro n’a été trouvé.',
  network: 'Le service de reconnaissance vocale est injoignable. Vérifie ta connexion.',
};

export interface Listening {
  result: Promise<RecognitionOutcome>;
  stop(): void;
}

/** Écoute une phrase en italien et renvoie sa transcription. */
export function listen(lang = 'it-IT'): Listening {
  const Ctor = getConstructor();
  if (!Ctor) {
    return { result: Promise.reject(new Error('La reconnaissance vocale n’est pas disponible dans ce navigateur.')), stop: () => {} };
  }
  const recognition = new Ctor();
  recognition.lang = lang;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;
  recognition.continuous = false;

  const result = new Promise<RecognitionOutcome>((resolve, reject) => {
    let settled = false;
    recognition.onresult = (event) => {
      const first = event.results[0];
      if (!first) return;
      const alternatives = Array.from({ length: first.length }, (_, i) => first[i]);
      settled = true;
      resolve({
        transcript: alternatives[0]?.transcript ?? '',
        confidence: alternatives[0]?.confidence ?? 0,
        alternatives: alternatives.map((a) => a.transcript),
      });
    };
    recognition.onerror = (event) => {
      settled = true;
      reject(new Error(ERROR_MESSAGES[event.error] ?? `Erreur de reconnaissance vocale (${event.error}).`));
    };
    recognition.onend = () => {
      if (!settled) reject(new Error(ERROR_MESSAGES['no-speech']));
    };
  });
  recognition.start();
  return { result, stop: () => recognition.stop() };
}
