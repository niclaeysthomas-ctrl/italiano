import { createContext, useContext } from 'react';
import { DEFAULT_SETTINGS } from '../data/repo.ts';
import type { Profile, Settings } from '../data/repo.ts';

export const ProfileContext = createContext<Profile | null>(null);
export const SettingsContext = createContext<Settings>(DEFAULT_SETTINGS);

/** Profil de la personne ; disponible partout sauf sur l'écran d'accueil initial et le test de niveau. */
export function useProfile(): Profile {
  const profile = useContext(ProfileContext);
  if (!profile) throw new Error('useProfile() appelé sans profil');
  return profile;
}

export function useOptionalProfile(): Profile | null {
  return useContext(ProfileContext);
}

export function useSettings(): Settings {
  return useContext(SettingsContext);
}
