/* Pinkoune — démos motion en boucle : <pk-demo type="panel|toast|rank">  (clic = pause) */
(function () {
  if (window.__pkm) return; window.__pkm = 1;
  const E = {
    out: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
    io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    lin: t => t
  };
  const seg = (t, a, b, e) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return E[e || 'out'](x); };
  const lerp = (a, b, k) => a + (b - a) * k;
  function h(tag, css, parent, txt) { const el = document.createElement(tag); el.style.cssText = css; if (txt != null) el.textContent = txt; if (parent) parent.appendChild(el); return el; }
  const MONO = "font-family:'Martian Mono',monospace;", DISP = "font-family:Archivo,sans-serif;font-stretch:125%;font-weight:500;text-transform:uppercase;", BODY = "font-family:'Instrument Sans',sans-serif;";
  const AB = 'position:absolute;';
  function miniHud(st, xpPct) {
    const r = h('div', AB + 'left:22px;top:22px;width:26px;height:26px;display:grid;place-items:center', st);
    h('div', 'width:17px;height:17px;background:#FF5FA2;transform:rotate(45deg)', r);
    const lab = h('div', AB + 'left:62px;top:22px;width:200px;display:flex;justify-content:space-between;' + MONO + 'font-size:9px;letter-spacing:.16em;color:#EEECF5;text-transform:uppercase', st);
    h('span', '', lab, 'Pilote'); const xpt = h('span', 'color:#A29FBD', lab, '1 240 / 1 400');
    const track = h('div', AB + 'left:62px;top:40px;width:200px;height:3px;background:#2E2C4A', st);
    const gain = h('div', AB + 'left:0;top:0;bottom:0;width:' + xpPct + '%;background:#FFB8D5', track);
    const fill = h('div', AB + 'left:0;top:0;bottom:0;width:' + xpPct + '%;background:#FF5FA2', track);
    return { xpt, gain, fill };
  }
  function ach(st) {
    const a = h('div', AB + 'right:22px;top:18px;height:30px;padding:0 10px;border:1px solid #3B3960;display:flex;align-items:center;gap:8px;' + MONO + 'font-size:10px;color:#EEECF5', st);
    h('span', 'width:7px;height:7px;background:#FFB547;transform:rotate(45deg);display:block', a);
    return h('span', '', a, '07/24');
  }

  const DEMOS = {};
  DEMOS.panel = function (st) {
    st.style.background = 'radial-gradient(120% 90% at 10% 50%,#151426,#0B0A14)';
    const dia = h('div', AB + 'left:61px;top:161px;width:16px;height:16px;display:grid;place-items:center', st);
    const diaIn = h('div', 'width:12px;height:12px;border:1px solid #5CE1E6;transform:rotate(45deg);display:grid;place-items:center;box-sizing:border-box', dia);
    h('div', 'width:4px;height:4px;background:#5CE1E6', diaIn);
    const line = h('div', AB + 'left:84px;top:169px;width:476px;height:1px;background:#5CE1E6;transform-origin:left', st);
    const fr = h('div', AB + 'left:140px;top:34px;width:440px;height:268px;background:rgba(13,12,23,.92);border:1px solid rgba(92,225,230,.4);box-sizing:border-box;padding:18px 20px;overflow:hidden', st);
    const br = [];
    [['left', 'top'], ['right', 'top'], ['left', 'bottom'], ['right', 'bottom']].forEach(([x, y]) => br.push(h('div', AB + x + ':-1px;' + y + ':-1px;width:14px;height:14px;border-' + x + ':2px solid #5CE1E6;border-' + y + ':2px solid #5CE1E6', fr)));
    const items = [];
    const hd = h('div', 'display:flex;justify-content:space-between;' + MONO + 'font-size:9px;letter-spacing:.2em;text-transform:uppercase', fr);
    h('span', 'color:#5CE1E6', hd, '◆ PK-02 · Labo'); h('span', 'color:#A29FBD', hd, 'Échap'); items.push(hd);
    items.push(h('div', 'height:1px;background:rgba(92,225,230,.35);margin:12px 0 14px', fr));
    const ti = h('div', DISP + 'font-size:26px;letter-spacing:.06em;color:#EEECF5;height:30px', fr, ''); items.push(ti);
    items.push(h('div', MONO + 'font-size:9px;letter-spacing:.16em;color:#A29FBD;text-transform:uppercase;margin:4px 0 12px', fr, 'Plateforme de déploiement GitOps'));
    items.push(h('div', BODY + 'font-size:13px;line-height:1.55;color:#C9C6DC', fr, 'Un service en prod en une merge request. ArgoCD synchronise, Terraform provisionne.'));
    const tg = h('div', 'display:flex;gap:6px;margin-top:14px;' + MONO + 'font-size:9px;letter-spacing:.12em;color:#EEECF5;text-transform:uppercase', fr);
    ['Kubernetes', 'ArgoCD', 'Terraform'].forEach(x => h('span', 'border:1px solid #3B3960;padding:4px 7px', tg, x)); items.push(tg);
    const scan = h('div', AB + 'left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#5CE1E6,transparent)', fr);
    const TITLE = 'ORBITAL';
    return {
      L: 4400, marks: [[0, 'Point'], [160, 'Ligne'], [400, 'Cadre'], [680, 'Contenu'], [3300, 'Fermeture']],
      update(t) {
        const c = seg(t, 3300, 3560, 'io'), lr = seg(t, 3560, 3760, 'io'), dOut = seg(t, 3760, 3900);
        const a = seg(t, 0, 160, 'back') * (1 - dOut);
        dia.style.transform = 'scale(' + a + ')'; dia.style.opacity = a > 0.01 ? 1 : 0;
        const l = seg(t, 160, 400) * (1 - lr);
        line.style.transform = 'scaleX(' + l + ')';
        const f = seg(t, 400, 680) * (1 - c);
        line.style.opacity = (t > 680 && t < 3300) ? lerp(1, .25, seg(t, 680, 900)) : 1;
        const ins = (1 - f) * 50;
        fr.style.clipPath = 'inset(' + ins + '% 0 ' + ins + '% 0)'; fr.style.opacity = f > .001 ? 1 : 0;
        const bo = seg(t, 600, 760) * (1 - c); br.forEach(b => b.style.opacity = bo);
        items.forEach((el, i) => { const k = seg(t, 680 + i * 70, 980 + i * 70) * (1 - c); el.style.opacity = k; el.style.transform = 'translateY(' + (1 - k) * 8 + 'px)'; });
        const n = Math.floor(seg(t, 760, 1060, 'lin') * TITLE.length);
        ti.textContent = TITLE.slice(0, n) + (t > 760 && t < 1300 && Math.floor(t / 120) % 2 ? '_' : '');
        const s = seg(t, 700, 1400, 'lin'); scan.style.top = (s * 100) + '%'; scan.style.opacity = s > 0 && s < 1 ? .7 : 0;
      }
    };
  };

  DEMOS.toast = function (st) {
    st.style.background = 'radial-gradient(90% 70% at 50% 110%,#3A1E3A,#0B0A14 70%)';
    const hud = miniHud(st, 65), ac = ach(st);
    const to = h('div', AB + 'right:22px;top:62px;width:330px;background:rgba(13,12,23,.94);border:1px solid #3B3960;box-sizing:border-box', st);
    const topl = h('div', 'height:2px;background:#FFB547;transform-origin:left', to);
    const row = h('div', 'display:flex;gap:14px;padding:14px 16px;align-items:center', to);
    const ic = h('div', 'width:40px;height:40px;flex:none;display:grid;place-items:center', row);
    const icd = h('div', 'width:28px;height:28px;border:1px solid #FFB547;display:grid;place-items:center;box-sizing:border-box', ic);
    h('div', 'width:14px;height:14px;background:#FFB547', icd);
    const col = h('div', 'flex:1;display:flex;flex-direction:column;gap:5px', row);
    const l1 = h('div', 'display:flex;justify-content:space-between;' + MONO + 'font-size:9px;letter-spacing:.2em;color:#FFB547;text-transform:uppercase', col);
    h('span', '', l1, 'Succès débloqué'); const chip = h('span', 'display:inline-block', l1, '+100 XP');
    const l2 = h('div', DISP + 'font-size:14px;letter-spacing:.08em;color:#EEECF5', col, 'Horizon des événements');
    const l3 = h('div', BODY + 'font-size:12px;line-height:1.4;color:#A29FBD', col, 'Tu as fixé la Pupille 10 s. Elle t’a fixé aussi.');
    const parts = [l1, l2, l3];
    const fly = h('div', AB + 'left:0;top:0;' + MONO + 'font-size:11px;color:#FF5FA2;letter-spacing:.1em;white-space:nowrap', st, '+100 XP');
    return {
      L: 5800, marks: [[300, 'Entrée'], [1000, 'Compteur'], [1200, '+XP'], [1900, 'Barre'], [4800, 'Sortie']],
      update(t) {
        const i = seg(t, 300, 750), x = seg(t, 4800, 5100, 'io');
        to.style.transform = 'translateX(' + ((1 - i) * 48 + x * 30) + 'px)';
        to.style.clipPath = 'inset(0 0 0 ' + (1 - i) * 100 + '%)'; to.style.opacity = Math.min(1, i * 2) * (1 - x);
        topl.style.transform = 'scaleX(' + seg(t, 500, 850) + ')';
        const k = seg(t, 450, 900, 'back'); icd.style.transform = 'rotate(' + lerp(225, 45, k) + 'deg) scale(' + Math.max(0, k) + ')';
        parts.forEach((p, j) => { const q = seg(t, 600 + j * 80, 900 + j * 80); p.style.opacity = q; p.style.transform = 'translateX(' + (1 - q) * 10 + 'px)'; });
        const pc = seg(t, 900, 1000, 'lin') - seg(t, 1000, 1150, 'lin'); chip.style.transform = 'scale(' + (1 + pc * .25) + ')';
        ac.textContent = t >= 1000 ? '08/24' : '07/24'; ac.style.color = (t >= 1000 && t < 1300) ? '#FFB547' : '#EEECF5';
        const p = seg(t, 1200, 1750, 'io');
        const x0 = 520, y0 = 82, x1 = 62 + 200 * .72, y1 = 32, cx = 380, cy = -10;
        const fx = (1 - p) * (1 - p) * x0 + 2 * (1 - p) * p * cx + p * p * x1, fy = (1 - p) * (1 - p) * y0 + 2 * (1 - p) * p * cy + p * p * y1;
        fly.style.transform = 'translate(' + fx + 'px,' + fy + 'px) scale(' + lerp(1, .7, p) + ')';
        fly.style.opacity = t > 1200 && t < 1780 ? 1 : 0;
        const g = seg(t, 1700, 1800); hud.gain.style.width = lerp(65, 72, g) + '%';
        const f = seg(t, 1900, 2400); hud.fill.style.width = lerp(65, 72, f) + '%';
        hud.xpt.textContent = Math.round(lerp(1240, 1340, f)).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ') + ' / 1 400';
      }
    };
  };

  DEMOS.rank = function (st) {
    st.style.background = 'radial-gradient(80% 70% at 50% 60%,#2A1A33,#0B0A14 70%)';
    miniHud(st, 98); ach(st);
    const veil = h('div', AB + 'inset:0;background:#07060D', st);
    const ctr = h('div', AB + 'left:50%;top:110px;width:0;height:0', st);
    const mk = (s, css) => h('div', AB + 'left:' + (-s / 2) + 'px;top:' + (-s / 2) + 'px;width:' + s + 'px;height:' + s + 'px;box-sizing:border-box;' + css, ctr);
    const burst = mk(56, 'border:1px solid #FFB547');
    const ds = [mk(112, 'border:1px solid rgba(255,181,71,.35)'), mk(84, 'border:1px solid #FFB547'), mk(56, 'background:#FFB547')];
    const num = h('div', AB + 'left:-20px;top:-9px;width:40px;text-align:center;' + MONO + 'font-size:15px;font-weight:500;color:#07060D', ctr, '06');
    const lab = h('div', AB + 'left:0;right:0;top:186px;text-align:center;' + MONO + 'font-size:9px;letter-spacing:.3em;color:#FFB547;text-transform:uppercase', st, 'Nouveau rang');
    const ti = h('div', AB + 'left:0;right:0;top:204px;text-align:center;' + DISP + 'font-size:44px;line-height:1;color:#EEECF5', st, 'Capitaine');
    const rw = h('div', AB + 'left:0;right:0;top:262px;display:flex;justify-content:center;gap:22px;' + MONO + 'font-size:9px;letter-spacing:.16em;color:#A29FBD;text-transform:uppercase', st);
    const rws = ['◆ Salle des trophées', '◆ Pinkoune gagne une cape'].map(x => h('span', '', rw, x));
    const bt = h('div', AB + 'left:50%;top:290px;transform:translateX(-50%);background:#FF5FA2;color:#07060D;' + MONO + 'font-size:10px;font-weight:500;letter-spacing:.2em;padding:9px 16px;text-transform:uppercase;clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)', st, 'Continuer');
    return {
      L: 5300, marks: [[0, 'Voile'], [400, 'Losange'], [950, 'Onde'], [1100, 'Titre'], [1700, 'Récomp.'], [4300, 'Sortie']],
      update(t) {
        const o = 1 - seg(t, 4300, 4700, 'io');
        veil.style.opacity = seg(t, 0, 400, 'io') * .86 * o;
        ds.forEach((d, i) => { const k = seg(t, 400 + i * 120, 900 + i * 120, 'back'); d.style.transform = 'rotate(' + lerp(135, 45, k) + 'deg) scale(' + Math.max(0, k) + ')'; d.style.opacity = o; });
        num.style.opacity = seg(t, 900, 1100) * o;
        const b = seg(t, 950, 1500); burst.style.transform = 'rotate(45deg) scale(' + (1 + b * 3) + ')'; burst.style.opacity = t > 950 && t < 1500 ? (1 - b) * o : 0;
        lab.style.opacity = seg(t, 1000, 1300) * o;
        const k = seg(t, 1100, 1800); ti.style.letterSpacing = lerp(.7, .12, k) + 'em'; ti.style.opacity = k * o;
        rws.forEach((r, i) => { const q = seg(t, 1700 + i * 120, 2000 + i * 120); r.style.opacity = q * o; r.style.transform = 'translateY(' + (1 - q) * 6 + 'px)'; });
        const q = seg(t, 2200, 2450); bt.style.opacity = q * o; bt.style.transform = 'translateX(-50%) translateY(' + (1 - q) * 6 + 'px)';
      }
    };
  };

  class PkDemo extends HTMLElement {
    connectedCallback() {
      if (this._i) return; this._i = 1;
      Object.assign(this.style, { display: 'block', position: 'relative', overflow: 'hidden', background: '#0B0A14', cursor: 'pointer' });
      const stage = h('div', AB + 'left:0;top:0;right:0;bottom:46px;overflow:hidden', this);
      const bar = h('div', AB + 'left:0;right:0;bottom:0;height:46px;border-top:1px solid #22213A;' + MONO + 'font-size:9px;letter-spacing:.12em;color:#A29FBD;text-transform:uppercase', this);
      const D = DEMOS[this.getAttribute('type') || 'panel'](stage);
      const track = h('div', AB + 'left:16px;right:96px;top:31px;height:1px;background:#3B3960', bar);
      D.marks.forEach(([m, label], i) => {
        const p = m / D.L * 100;
        h('div', AB + 'left:' + p + '%;top:-3px;width:1px;height:7px;background:#A29FBD', track);
        h('div', AB + 'left:' + p + '%;top:' + (i % 2 ? 6 : -20) + 'px;white-space:nowrap', track, label);
      });
      const head = h('div', AB + 'top:-5px;width:2px;height:11px;background:#FF5FA2', track);
      const rd = h('div', AB + 'right:16px;top:24px;color:#EEECF5;font-size:10px', bar);
      let t0 = performance.now(), paused = false, tp = 0;
      this.addEventListener('click', () => { paused = !paused; if (!paused) t0 = performance.now() - tp; });
      const loop = () => {
        if (!this.isConnected) return;
        if (!paused) tp = (performance.now() - t0) % D.L;
        D.update(tp); head.style.left = (tp / D.L * 100) + '%'; rd.textContent = (tp / 1000).toFixed(2) + ' s' + (paused ? ' ❚❚' : '');
        requestAnimationFrame(loop);
      };
      loop();
    }
  }
  customElements.define('pk-demo', PkDemo);
})();
