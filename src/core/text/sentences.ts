/** Découpe un texte en phrases (sur . ! ? … suivis d'un espace). */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function wordCount(text: string): number {
  return text.split(/\s+/u).filter(Boolean).length;
}
