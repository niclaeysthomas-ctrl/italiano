/**
 * Le parcours A1 → C1 dessiné comme une ligne de métro : chaque niveau est une station.
 * La ligne est rouge jusqu'à la station actuelle, grise au-delà.
 */
import { LEVELS, LEVEL_NAMES, levelIndex } from '../core/cefr.ts';
import type { Level } from '../core/cefr.ts';

const WIDTH = 340;
const MARGIN = 26;
const Y = 26;
const STEP = (WIDTH - MARGIN * 2) / (LEVELS.length - 1);

export function LevelLine({ current, caption }: { current?: Level; caption?: string }) {
  const currentIndex = current ? levelIndex(current) : LEVELS.length - 1;
  const xCurrent = MARGIN + currentIndex * STEP;
  const label = current ? `Parcours de A1 à C1. Niveau actuel : ${current}, ${LEVEL_NAMES[current]}.` : 'Parcours de A1 à C1.';

  return (
    <figure className="level-line">
      <svg viewBox={`0 0 ${WIDTH} 80`} role="img" aria-label={label}>
        <line x1={MARGIN} y1={Y} x2={WIDTH - MARGIN} y2={Y} className="level-line__track" />
        <line x1={MARGIN} y1={Y} x2={xCurrent} y2={Y} className="level-line__done" />
        {LEVELS.map((level, i) => {
          const x = MARGIN + i * STEP;
          const state = !current ? 'open' : i < currentIndex ? 'passed' : i === currentIndex ? 'here' : 'ahead';
          return (
            <g key={level} className={`level-line__station is-${state}`}>
              {state === 'here' ? (
                <>
                  <circle cx={x} cy={Y} r={13} className="level-line__ring" />
                  <circle cx={x} cy={Y} r={5} className="level-line__dot" />
                </>
              ) : (
                <circle cx={x} cy={Y} r={8} className="level-line__stop" />
              )}
              <text x={x} y={Y + 32} textAnchor="middle" className="level-line__code">
                {level}
              </text>
              <text x={x} y={Y + 48} textAnchor="middle" className="level-line__name">
                {LEVEL_NAMES[level]}
              </text>
            </g>
          );
        })}
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
