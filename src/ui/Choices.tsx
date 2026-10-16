import { Icon } from './Icon.tsx';

interface Props {
  options: readonly string[];
  /** Index choisi ; `null` tant que rien n'est choisi. */
  selected: number | null;
  /** Bonne réponse, affichée une fois le choix fait. Omettre pour ne pas corriger (test de niveau). */
  answer?: number;
  onSelect: (index: number) => void;
  lang?: string;
}

export function Choices({ options, selected, answer, onSelect, lang }: Props) {
  const revealed = selected !== null && answer !== undefined;
  return (
    <div className="choices" role="group">
      {options.map((option, index) => {
        let state = '';
        if (revealed && index === answer) state = 'is-correct';
        else if (revealed && index === selected) state = 'is-wrong';
        else if (selected === index) state = 'is-selected';
        return (
          <button
            key={option}
            type="button"
            className={`choice ${state}`}
            onClick={() => onSelect(index)}
            disabled={revealed}
            lang={lang}
            aria-pressed={selected === index}
          >
            <span>{option}</span>
            {state === 'is-correct' && <Icon name="check" label="Bonne réponse" />}
            {state === 'is-wrong' && <Icon name="close" label="Mauvaise réponse" />}
          </button>
        );
      })}
    </div>
  );
}
