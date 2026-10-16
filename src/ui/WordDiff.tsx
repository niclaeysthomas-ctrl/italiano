import type { DiffOp } from '../core/text/compare.ts';

/**
 * Correction mot à mot : on affiche la phrase attendue, chaque mot coloré selon ce qui a été écrit ou dit.
 * Les mots en trop apparaissent barrés, à leur place.
 */
export function WordDiff({ ops }: { ops: readonly DiffOp[] }) {
  const errors = ops.filter((op) => op.kind !== 'ok').length;
  return (
    <div className="diff-block">
      <p className="diff it" lang="it">
        {ops.map((op, i) => {
          switch (op.kind) {
            case 'ok':
              return <span key={i}>{op.expected} </span>;
            case 'accent':
              return (
                <span key={i} className="diff__accent" title={`Accent : « ${op.actual} »`}>
                  {op.expected}{' '}
                </span>
              );
            case 'sub':
              return (
                <span key={i} className="diff__sub" title={`Tu as écrit « ${op.actual} »`}>
                  {op.expected}{' '}
                </span>
              );
            case 'missing':
              return (
                <span key={i} className="diff__missing" title="Mot manquant">
                  {op.expected}{' '}
                </span>
              );
            case 'extra':
              return (
                <del key={i} className="diff__extra" title="Mot en trop">
                  {op.actual}{' '}
                </del>
              );
          }
        })}
      </p>
      {errors > 0 && (
        <p className="diff-legend small muted">
          <span className="diff__sub">mot erroné</span> <span className="diff__missing">mot manquant</span>{' '}
          <span className="diff__accent">accent</span> <del className="diff__extra">en trop</del>
        </p>
      )}
    </div>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 90 ? 'great' : score >= 60 ? 'ok' : 'low';
  return <span className={`score score--${tone}`}>{score} / 100</span>;
}
