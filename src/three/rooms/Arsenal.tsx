import { content } from '../../content/index.ts';
import { useT } from '../../i18n/useT.ts';
import { useStore } from '../../state/store.ts';
import { Hotspot } from '../Hotspot.tsx';
import { accent, flat, glow, hull } from '../models/materials.ts';
import { Box } from '../objects/Box.tsx';

/** PK-03 · Arsenal : un râtelier par catégorie, un module lumineux par compétence. */
export function Arsenal({ active }: { active: boolean }) {
  const { t } = useT();
  const openPanel = useStore((s) => s.openPanel);
  const count = content.skills.length;

  return (
    <group position={[0, 0, 1]}>
      {content.skills.map((category, i) => {
        const a = -0.7 + (1.4 * i) / Math.max(1, count - 1);
        const position: [number, number, number] = [Math.sin(a) * 4.7, 0, -Math.cos(a) * 4.7];
        return (
          <group key={category.id} position={position} rotation={[0, -a, 0]}>
            <Box size={[0.8, 1.7, 0.2]} position={[0, 0.85, 0]} material={flat(hull.h700)} />
            <Box size={[0.8, 0.03, 0.22]} position={[0, 1.71, 0]} material={glow(accent.pink)} />
            {category.skills.map((skill, j) => {
              const column = j % 2;
              const row = Math.floor(j / 2);
              const lit = (skill.level ?? 3) >= 3;
              return (
                <Box
                  key={j}
                  size={[0.26, 0.11, 0.05]}
                  position={[column ? 0.17 : -0.17, 1.48 - row * 0.2, 0.12]}
                  material={lit ? glow(accent.pink) : flat(hull.h600)}
                />
              );
            })}
            {active && (
              <Hotspot
                position={[0, i % 2 ? 2.05 : 2.45, 0]}
                side={i > (count - 1) / 2 ? 'left' : 'right'}
                code={category.code}
                label={t(category.name)}
                onActivate={() => openPanel({ kind: 'skills', id: category.id })}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}
