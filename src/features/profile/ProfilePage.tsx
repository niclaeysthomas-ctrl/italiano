import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { italianVoices, speak, ttsSupported } from '../../audio/tts.ts';
import { LEVELS, LEVEL_NAMES } from '../../core/cefr.ts';
import type { Level } from '../../core/cefr.ts';
import { computeStreak, lastDays, studyDay } from '../../core/dates.ts';
import { repo } from '../../data/repo.ts';
import type { ExportFile, Settings } from '../../data/repo.ts';
import { useProfile, useSettings } from '../../app/context.ts';
import { useLive } from '../../lib/live.ts';
import { GOAL_OPTIONS } from '../../core/progress/progress.ts';
import { loadProgress } from '../progress/progressData.ts';
import { ActivityCalendar, LevelCriteria } from '../progress/ProgressWidgets.tsx';
import { LevelLine } from '../../ui/LevelLine.tsx';
import { Page } from '../../ui/Page.tsx';

export function ProfilePage() {
  const profile = useProfile();
  const settings = useSettings();
  const today = studyDay();

  const stats = useLive(async () => {
    const [states, reviews, attempts, activeDays] = await Promise.all([
      repo.getCardStates(),
      repo.getReviewsSince(lastDays(today, 7)[0]),
      repo.getAttempts(),
      repo.getActiveDays(),
    ]);
    return {
      learned: [...states.values()].filter((s) => s.phase === 'review').length,
      started: states.size,
      reviewsWeek: reviews.length,
      exercises: attempts.length,
      streak: computeStreak(activeDays, today),
      activeDays: activeDays.length,
    };
  }, [today]);

  const progress = useLive(() => loadProgress(profile.level, today), [profile.level, today]);

  const changeLevel = (level: Level) => repo.saveProfile({ ...profile, level });
  const updateSettings = (patch: Partial<Settings>) => repo.saveSettings({ ...settings, ...patch });

  return (
    <Page title="Profil">
      <section className="section" aria-labelledby="parcours">
        <h2 id="parcours">Parcours</h2>
        <LevelLine current={profile.level} />
        <label className="field field--inline">
          <span>Niveau travaillé</span>
          <select value={profile.level} onChange={(e) => changeLevel(e.target.value as Level)}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}, {LEVEL_NAMES[l].toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        {profile.placement && (
          <p className="muted small">
            Test passé le {new Date(profile.placement.at).toLocaleDateString('fr-FR')} : niveau conseillé {profile.placement.recommended}.
          </p>
        )}
        <a className="btn btn--block" href="#/test">
          Refaire le test de niveau
        </a>
      </section>

      <section className="section" aria-labelledby="stats">
        <h2 id="stats">Progression</h2>
        {progress && (
          <>
            <ActivityCalendar activity={progress.activity} today={today} goal={settings.dailyGoal} />
            <LevelCriteria level={profile.level} readiness={progress.readiness} />
          </>
        )}
        {stats && (
          <dl className="stats stats--grid">
            <div>
              <dt>Jours d’affilée</dt>
              <dd>{stats.streak}</dd>
            </div>
            <div>
              <dt>Jours de pratique</dt>
              <dd>{stats.activeDays}</dd>
            </div>
            <div>
              <dt>Cartes acquises</dt>
              <dd>
                {stats.learned}
                <small> sur {stats.started} commencées</small>
              </dd>
            </div>
            <div>
              <dt>Réponses aux cartes, 7 jours</dt>
              <dd>{stats.reviewsWeek}</dd>
            </div>
            <div>
              <dt>Exercices faits</dt>
              <dd>{stats.exercises}</dd>
            </div>
          </dl>
        )}
      </section>

      <section className="section" aria-labelledby="reglages">
        <h2 id="reglages">Réglages</h2>
        <fieldset className="segmented">
          <legend>Objectif quotidien</legend>
          {GOAL_OPTIONS.map((goal) => (
            <label key={goal} className={settings.dailyGoal === goal ? 'is-active' : undefined}>
              <input type="radio" name="goal" checked={settings.dailyGoal === goal} onChange={() => updateSettings({ dailyGoal: goal })} />
              {goal}
            </label>
          ))}
        </fieldset>
        <p className="muted small">En points : 1 par carte révisée, 5 par exercice terminé (leçon, lecture, dictée, traduction, conjugaison, oral).</p>
        <VoiceSettings settings={settings} onChange={updateSettings} />
        <label className="field field--inline">
          <span>Nouvelles cartes par jour</span>
          <input
            type="number"
            min={0}
            max={100}
            inputMode="numeric"
            value={settings.newPerDay}
            onChange={(e) => updateSettings({ newPerDay: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
          />
        </label>
      </section>

      <DataSection />

      <p className="muted small about">
        Tes données restent dans ce navigateur, sur cet appareil. Exporte-les de temps en temps pour les garder en lieu sûr ou les transférer.
      </p>
    </Page>
  );
}

function VoiceSettings({ settings, onChange }: { settings: Settings; onChange: (patch: Partial<Settings>) => void }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    void italianVoices().then(setVoices);
  }, []);

  if (!ttsSupported) return <p className="muted">La synthèse vocale n’est pas disponible dans ce navigateur.</p>;

  return (
    <>
      <label className="field field--inline">
        <span>Voix italienne</span>
        <select value={settings.voiceURI ?? ''} onChange={(e) => onChange({ voiceURI: e.target.value || null })}>
          <option value="">Automatique</option>
          {voices.map((voice) => (
            <option key={voice.voiceURI} value={voice.voiceURI}>
              {voice.name}
            </option>
          ))}
        </select>
      </label>
      {voices.length === 0 && (
        <p className="muted small">Aucune voix italienne trouvée sur cet appareil. Tu peux en installer une dans les réglages de synthèse vocale du système.</p>
      )}
      <label className="field field--inline">
        <span>Vitesse de lecture : {settings.rate.toFixed(2).replace('.', ',')}</span>
        <input type="range" min={0.6} max={1.2} step={0.05} value={settings.rate} onChange={(e) => onChange({ rate: Number(e.target.value) })} />
      </label>
      <button
        type="button"
        className="btn btn--small"
        onClick={() => void speak('Ciao! Questa è la voce che userai per esercitarti.', { rate: settings.rate, voiceURI: settings.voiceURI })}
      >
        Tester la voix
      </button>
    </>
  );
}

function DataSection() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const exportData = async () => {
    const data = await repo.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `italiano-progression-${studyDay()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Export téléchargé.');
  };

  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!window.confirm('Importer ce fichier remplacera ta progression actuelle sur cet appareil. Continuer ?')) return;
    try {
      await repo.importAll(JSON.parse(await file.text()) as ExportFile);
      setMessage('Progression importée.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Ce fichier est illisible.');
    }
  };

  const reset = async () => {
    if (!window.confirm('Tout effacer : profil, cartes, historique et réglages ? Cette action est définitive.')) return;
    await repo.resetAll();
  };

  return (
    <section className="section" aria-labelledby="donnees">
      <h2 id="donnees">Données</h2>
      <div className="stack">
        <button type="button" className="btn btn--block" onClick={exportData}>
          Exporter ma progression
        </button>
        <button type="button" className="btn btn--block" onClick={() => fileInput.current?.click()}>
          Importer une progression
        </button>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={importData} />
        <button type="button" className="btn btn--danger btn--block" onClick={reset}>
          Tout effacer
        </button>
      </div>
      {message && (
        <p className="muted small" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
