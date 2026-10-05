import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { HotspotButton } from '../ui/Hotspot.tsx';
import { hotspotElements, useHotspots } from './hotspots.ts';
import s from './ShipExperience.module.css';

const v = new Vector3();

/** Dans le Canvas : projette chaque ancre à l'écran et déplace son bouton. */
export function HotspotProjector() {
  const camera = useThree((st) => st.camera);
  const size = useThree((st) => st.size);
  useFrame(() => {
    for (const { id, anchor } of useHotspots.getState().entries) {
      const el = hotspotElements.get(id);
      if (!el) continue;
      v.setFromMatrixPosition(anchor.matrixWorld).project(camera);
      const visible = v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2;
      el.style.visibility = visible ? 'visible' : 'hidden';
      if (visible) {
        const x = ((v.x + 1) / 2) * size.width;
        const y = ((1 - v.y) / 2) * size.height;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }
    }
  });
  return null;
}

/** Hors du Canvas : un bouton DOM par hotspot enregistré. */
export function HotspotLayer() {
  const entries = useHotspots((st) => st.entries);
  return (
    <div className={s.hotspots}>
      {entries.map(({ id, props }) => (
        <div
          key={id}
          className={s.hotspot}
          data-side={props.side ?? 'right'}
          ref={(el) => {
            if (el) hotspotElements.set(id, el);
            else hotspotElements.delete(id);
          }}
        >
          <div className={s.hotspotInner}>
            <HotspotButton {...props} />
          </div>
        </div>
      ))}
    </div>
  );
}
