import { content } from '../../content/index.ts';
import { rankProgress } from '../../game/engine.ts';
import { useT } from '../../i18n/useT.ts';
import { useStore } from '../../state/store.ts';

const thresholds = content.ranks.ranks.map((r) => r.xp);
const pad = (n: number) => String(n).padStart(2, '0');

/** Vue lisible de la progression : rang, XP, succès. */
export function useRank() {
  const { lang, t } = useT();
  const progress = useStore((s) => s.progress);
  const rp = rankProgress(progress.xp, thresholds);
  const rank = content.ranks.ranks[rp.index]!;
  const next = content.ranks.ranks[rp.index + 1];
  const number = new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB');
  return {
    index: rp.index,
    code: pad(rp.index + 1),
    name: t(rank.name),
    xp: progress.xp,
    xpLabel: `${number.format(progress.xp)} / ${number.format(rp.next ?? progress.xp)}`,
    ratio: rp.ratio,
    next: next ? { name: t(next.name), xp: number.format(next.xp) } : null,
    count: progress.unlocked.length,
    countLabel: `${pad(progress.unlocked.length)}/${pad(content.achievements.length)}`,
    total: content.achievements.length,
    format: (n: number) => number.format(n),
  };
}
