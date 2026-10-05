import { useEffect, useState } from 'react';
import { useT } from '../../i18n/useT.ts';
import { useStore } from '../../state/store.ts';
import { ui } from '../styles.ts';
import s from './ShipTerminal.module.css';

/*
 * Terminal de la salle des machines : le vrai commit déployé (injecté au build), un faux
 * `terraform apply` et l'historique du vaisseau jusqu'au tout premier commit.
 * Deux succès s'y cachent : « Infra as Code » et « git blame ».
 */

const APPLY_OUTPUT = [
  'Plan: 1 to add, 0 to change, 0 to destroy.',
  'pk01_portfolio.visitor: Creating...',
  'pk01_portfolio.visitor: Creation complete after 0s',
  'Apply complete! Resources: 1 added, 0 changed, 0 destroyed.',
];

export function ShipTerminal() {
  const { lang, ui: u } = useT();
  const emit = useStore((st) => st.emit);
  const [lines, setLines] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (lines >= APPLY_OUTPUT.length) {
      emit('machines.apply');
      return;
    }
    const timer = window.setTimeout(() => setLines((n) => n + 1), 350);
    return () => window.clearTimeout(timer);
  }, [running, lines, emit]);

  const date = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    dateStyle: 'medium',
  }).format(new Date(__BUILD__.date));

  return (
    <section className={s.terminal} aria-label={u('machines.terminal')}>
      <p className={`${ui.label} ${s.build}`}>
        {u('machines.build', { commit: __BUILD__.commit, date })}
      </p>

      <button
        type="button"
        className={s.command}
        onClick={() => {
          setLines(0);
          setRunning(true);
        }}
      >
        $ terraform apply -auto-approve
      </button>
      {running && (
        <output className={s.output} aria-live="polite">
          {APPLY_OUTPUT.slice(0, lines).map((line) => (
            <span key={line} data-ok={line.startsWith('Apply complete')}>
              {line}
            </span>
          ))}
        </output>
      )}

      <details className={s.log}>
        <summary className={s.command}>$ git log --oneline</summary>
        <ol aria-label={u('machines.gitlog')}>
          <li>
            <span className={s.hash}>{__BUILD__.commit}</span> (HEAD → main) · {date}
          </li>
          <li aria-hidden="true">⋮</li>
          <li>
            <button type="button" className={s.root} onClick={() => emit('machines.oldest-commit')}>
              <span className={s.hash}>{__BUILD__.root}</span> {__BUILD__.rootMessage}
            </button>
          </li>
        </ol>
      </details>
    </section>
  );
}
