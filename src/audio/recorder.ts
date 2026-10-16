/**
 * Enregistrement de sa propre voix, pour la réécouter et la comparer au modèle.
 * Les enregistrements restent en mémoire et ne sont envoyés nulle part.
 */
export const recorderSupported =
  typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

export interface Recording {
  stop(): Promise<Blob>;
}

export async function startRecording(): Promise<Recording> {
  if (!recorderSupported) throw new Error('L’enregistrement audio n’est pas disponible dans ce navigateur.');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const parts: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) parts.push(event.data);
  };
  recorder.start();
  return {
    stop: () =>
      new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          resolve(new Blob(parts, { type: recorder.mimeType || 'audio/webm' }));
        };
        recorder.stop();
      }),
  };
}
