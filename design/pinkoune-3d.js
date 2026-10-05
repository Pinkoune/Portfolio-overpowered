/* Pinkoune — référence 3D low-poly (three.js r158)
   <pk-blackhole scale cx cy tilt time static smooth stars glow>
   <pk-penguin view="front|quart|profile|back|<rad>" pose="idle|salut|pointe" platform static spin dist ty>
   <pk-ship scale ry rx static>
   Un seul WebGLRenderer partagé ; chaque élément copie son rendu dans un <canvas> 2D. */
(function () {
  if (window.__pk3d) return; window.__pk3d = true;
  const THREE_URL = 'https://unpkg.com/three@0.158.0/build/three.min.js';
  let threeP;
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threeP) return threeP;
    threeP = new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = THREE_URL;
      s.onload = () => res(window.THREE); s.onerror = rej; document.head.appendChild(s);
    });
    return threeP;
  }
  let R = null;
  function renderer() {
    if (!R) {
      R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      R.setPixelRatio(1); R.outputColorSpace = THREE.SRGBColorSpace; R.setClearColor(0x000000, 0);
    }
    return R;
  }
  const items = new Set(); let running = false; const t0 = performance.now();
  let softBudget = 2, meshBudget = 2;
  const tick = () => document.hidden ? setTimeout(loop, 150) : requestAnimationFrame(loop);
  function loop() {
    const t = (performance.now() - t0) / 1000; softBudget = 1; meshBudget = 2;
    tick(); window.__pkFrames = (window.__pkFrames || 0) + 1;
    for (const it of items) if (it._visible && (it._dirty || !it.hasAttribute('static'))) { try { it._draw(t); } catch (e) { it._dirty = false; console.warn('pk3d', e); } }
  }

  class PkBase extends HTMLElement {
    connectedCallback() {
      if (this._init) { items.add(this); return; }
      this._init = true;
      if (!this.style.display) this.style.display = 'block';
      if (!this.style.position) this.style.position = 'relative';
      this.cv = document.createElement('canvas');
      Object.assign(this.cv.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', pointerEvents: 'none' });
      this.appendChild(this.cv); this.ctx = this.cv.getContext('2d');
      this._visible = true;
      new IntersectionObserver(e => { this._visible = e[e.length - 1].isIntersecting; if (this._visible) this._dirty = true; }).observe(this);
      new ResizeObserver(() => { this._dirty = true; }).observe(this);
      loadThree().then(() => {
        this.setup(); this._dirty = true; items.add(this);
        if (!running) { running = true; tick(); }
      });
    }
    disconnectedCallback() { items.delete(this); }
    attr(n, d) { const v = this.getAttribute(n); return v == null ? d : v; }
    num(n, d) { const v = parseFloat(this.getAttribute(n)); return isNaN(v) ? d : v; }
    maxDpr() { return 2; }
    _draw(t) {
      if (!this.clientWidth || !this.clientHeight) return;
      const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr());
      const w = Math.round(this.clientWidth * dpr), h = Math.round(this.clientHeight * dpr);
      if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; }
      const tt0 = this.hasAttribute('static') ? this.num('time', 2.4) : t + this.num('time', 0);
      if (!hasGL()) {
        if (this.soft2d) { const now = performance.now(); if (softBudget <= 0 || (!this._dirty && now - (this._last || 0) < 120)) return; softBudget--; this._last = now; this.soft2d(w, h, tt0); }
        else { const now = performance.now(); if (!this._dirty) { if (meshBudget <= 0 || now - (this._last || 0) < 80) return; meshBudget--; } this._last = now; this.frame(tt0, w, h); softMesh(this, w, h); }
        this._dirty = false; return;
      }
      const r = renderer(); const s = r.getSize(new THREE.Vector2());
      if (s.x < w || s.y < h) r.setSize(Math.max(s.x, w), Math.max(s.y, h), false);
      const H = r.domElement.height;
      r.setViewport(0, 0, w, h); r.setScissor(0, 0, w, h); r.setScissorTest(true); r.clear();
      const tt = this.hasAttribute('static') ? this.num('time', 2.4) : t + this.num('time', 0);
      this.frame(tt, w, h);
      r.render(this.scene, this.camera);
      this.ctx.clearRect(0, 0, w, h);
      this.ctx.drawImage(r.domElement, 0, H - h, w, h, 0, 0, w, h);
      this._dirty = false;
    }
  }


  /* ---------- Repli 2D (sans WebGL) : rastériseur logiciel à z-buffer ---------- */
  let GL = null;
  function hasGL() { if (GL === null) { try { const c = document.createElement('canvas'); GL = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { GL = false; } } return GL; }
  const lin2s = x => Math.round(Math.pow(Math.min(1, Math.max(0, x)), 1 / 2.2) * 255);
  function softMesh(el, w, h) {
    const ctx = el.ctx, scene = el.scene, cam = el.camera, T = THREE;
    ctx.clearRect(0, 0, w, h);
    scene.updateMatrixWorld(true); cam.updateMatrixWorld(true);
    const vp = new T.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    if (!el._L) {
      el._L = []; el._H = [];
      scene.traverse(o => {
        if (o.isDirectionalLight) el._L.push({ d: o.position.clone().normalize(), c: o.color.clone().multiplyScalar(o.intensity) });
        if (o.isHemisphereLight) el._H.push({ s: o.color.clone().multiplyScalar(o.intensity), g: o.groundColor.clone().multiplyScalar(o.intensity) });
      });
    }
    const tris = [], cp = cam.position, a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), e1 = new T.Vector3(), e2 = new T.Vector3(), n = new T.Vector3(), p = new T.Vector3();
    scene.traverse(o => {
      if (!o.isMesh) return;
      const g = o.geometry, pos = g.attributes.position, idx = g.index, m = o.material, cnt = idx ? idx.count : pos.count;
      const ds = m.side === T.DoubleSide, bias = o.userData.bias || 0;
      const fwd = bias ? new T.Vector3(0, 0, 1).transformDirection(el.P ? el.P.root.matrixWorld : o.matrixWorld) : null;
      for (let i = 0; i < cnt; i += 3) {
        const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
        a.fromBufferAttribute(pos, i0).applyMatrix4(o.matrixWorld); b.fromBufferAttribute(pos, i1).applyMatrix4(o.matrixWorld); c.fromBufferAttribute(pos, i2).applyMatrix4(o.matrixWorld);
        e1.subVectors(b, a); e2.subVectors(c, a); n.crossVectors(e1, e2); if (n.lengthSq() < 1e-14) continue; n.normalize();
        const dv = n.x * (cp.x - a.x) + n.y * (cp.y - a.y) + n.z * (cp.z - a.z);
        if (dv < 0) { if (!ds) continue; n.negate(); }
        let r, gg, bb;
        if (m.isMeshBasicMaterial) { r = m.color.r; gg = m.color.g; bb = m.color.b; }
        else {
          r = 0; gg = 0; bb = 0; const t = n.y * .5 + .5;
          for (const H of el._H) { r += H.g.r + (H.s.r - H.g.r) * t; gg += H.g.g + (H.s.g - H.g.g) * t; bb += H.g.b + (H.s.b - H.g.b) * t; }
          for (const L of el._L) { const d = Math.max(0, n.dot(L.d)); r += L.c.r * d; gg += L.c.g * d; bb += L.c.b * d; }
          r *= m.color.r; gg *= m.color.g; bb *= m.color.b;
          const ei = m.emissiveIntensity; r += m.emissive.r * ei; gg += m.emissive.g * ei; bb += m.emissive.b * ei;
        }
        const col = (lin2s(r)) | (lin2s(gg) << 8) | (lin2s(bb) << 16) | (255 << 24);
        const out = [];
        for (const v of [a, b, c]) { p.copy(v).applyMatrix4(vp); out.push((p.x * .5 + .5) * w, (1 - (p.y * .5 + .5)) * h, p.z); }
        out.push(col); tris.push(out);
      }
    });
    if (!el._zb || el._zb.length !== w * h) { el._zb = new Float32Array(w * h); el._img = ctx.createImageData(w, h); el._u32 = new Uint32Array(el._img.data.buffer); }
    const Z = el._zb, C = el._u32; Z.fill(1e9); C.fill(0);
    for (const t of tris) {
      const x0 = t[0], y0 = t[1], z0 = t[2], x1 = t[3], y1 = t[4], z1 = t[5], x2 = t[6], y2 = t[7], z2 = t[8], col = t[9];
      const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0); if (Math.abs(area) < 1e-6) continue;
      const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2))), maxX = Math.min(w - 1, Math.ceil(Math.max(x0, x1, x2)));
      const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2))), maxY = Math.min(h - 1, Math.ceil(Math.max(y0, y1, y2)));
      const ia = 1 / area;
      for (let y = minY; y <= maxY; y++) {
        const py = y + .5;
        for (let x = minX; x <= maxX; x++) {
          const px = x + .5;
          const w0 = ((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py)) * ia;
          const w1 = ((x2 - px) * (y0 - py) - (x0 - px) * (y2 - py)) * ia;
          const w2 = 1 - w0 - w1;
          if (w0 < -1e-4 || w1 < -1e-4 || w2 < -1e-4) continue;
          const z = w0 * z0 + w1 * z1 + w2 * z2, k = y * w + x;
          if (z < Z[k]) { Z[k] = z; C[k] = col; }
        }
      }
    }
    ctx.putImageData(el._img, 0, 0);
  }
  const fr = x => x - Math.floor(x);
  function h21(x, y) { x = fr(x * 123.34); y = fr(y * 456.21); const d = x * (x + 45.32) + y * (y + 45.32); x += d; y += d; return fr(x * y); }
  function ramp(t, o) {
    const C = [[1, .95, .86], [1, .71, .28], [1, .37, .64], [.30, .06, .26]];
    let A, B, k;
    if (t < .22) { A = C[0]; B = C[1]; k = t / .22; } else if (t < .55) { A = C[1]; B = C[2]; k = (t - .22) / .33; } else { A = C[2]; B = C[3]; k = Math.min(1, (t - .55) / .45); }
    o[0] = A[0] + (B[0] - A[0]) * k; o[1] = A[1] + (B[1] - A[1]) * k; o[2] = A[2] + (B[2] - A[2]) * k;
  }
  const RC = [0, 0, 0];
  function discJS(qx, qy, rIn, rOut, spin, time, facet, acc, wgt) {
    const r = Math.sqrt(qx * qx + qy * qy), t = (r - rIn) / (rOut - rIn); if (t < 0 || t > 1) return;
    const a = Math.atan2(qy, qx), bands = facet ? 11 : 220, tb = Math.floor(t * bands) / bands;
    const rot = a / 6.28318 + time * spin / (.35 + tb * 1.6), segs = facet ? 60 : 900, sb = Math.floor(fr(rot) * segs);
    const nn = h21(tb * 17.3 + 1, sb);
    const I = Math.pow(1 - t, 1.5) * (.45 + .65 * nn) * Math.min(1, t / .05) * (1 + .8 * (-qx / Math.max(r, 1e-3))) * wgt;
    ramp(facet ? tb : t, RC); acc[0] += RC[0] * I; acc[1] += RC[1] * I; acc[2] += RC[2] * I;
  }

  /* ---------- Trou noir ---------- */
  const FRAG = `
  uniform float uTime,uScale,uTilt,uFacet,uStars,uGlow; uniform vec2 uRes,uCenter;
  float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
  vec3 ramp(float t){
    vec3 c0=vec3(1.,.95,.86),c1=vec3(1.,.71,.28),c2=vec3(1.,.37,.64),c3=vec3(.30,.06,.26);
    return t<.22?mix(c0,c1,t/.22):(t<.55?mix(c1,c2,(t-.22)/.33):mix(c2,c3,clamp((t-.55)/.45,0.,1.)));
  }
  vec3 disc(vec2 q,float rIn,float rOut,float spin){
    float r=length(q); float t=(r-rIn)/(rOut-rIn); if(t<0.||t>1.) return vec3(0.);
    float a=atan(q.y,q.x);
    float bands=mix(220.,11.,uFacet); float tb=floor(t*bands)/bands;
    float rot=a/6.28318+uTime*spin/(.35+tb*1.6);
    float segs=mix(900.,60.,uFacet); float sb=floor(fract(rot)*segs);
    float n=h21(vec2(tb*17.3+1.,sb));
    float I=pow(1.-t,1.5)*(.45+.65*n)*smoothstep(0.,.05,t);
    float dop=1.+.8*(-q.x/max(r,1e-3));
    return ramp(mix(t,tb,uFacet))*I*dop;
  }
  void main(){
    vec2 p=(gl_FragCoord.xy-uCenter*uRes)/(uRes.y*uScale);
    float r=length(p); float rs=.12; float px=1./(uRes.y*uScale);
    vec3 col=vec3(.027,.024,.05);
    vec2 g=floor(gl_FragCoord.xy/2.); float s=h21(g);
    col+=vec3(.86,.86,1.)*step(.9972,s)*uStars*smoothstep(rs*1.3,rs*3.5,r)*(.35+.65*h21(g+3.));
    col+=vec3(1.,.42,.62)*.11*uGlow/(1.+pow(r/rs,2.)*.9);
    if(r<rs) col=vec3(0.);
    else {
      float arc=.45+.55*smoothstep(-.6,.9,p.y/r);
      col+=disc(p,rs*1.06,rs*2.3,.35)*.85*arc;
      col+=vec3(1.,.9,.8)*smoothstep(2.2*px,0.,abs(r-rs*1.035))*1.3;
    }
    vec2 q=vec2(p.x,p.y/uTilt);
    float m=(p.y<0.||r>rs)?1.:0.;
    col+=disc(q,rs*1.65,rs*6.2,.5)*m*1.15;
    col=1.-exp(-col*1.7);
    gl_FragColor=vec4(col,1.);
  }`;
  class PkBlackhole extends PkBase {
    maxDpr() { return 1.25; }
    soft2d(w, h, time) {
      const k = Math.max(2, Math.sqrt(w * h / 45000)), lw = Math.ceil(w / k), lh = Math.ceil(h / k);
      if (!this._oc || this._oc.width !== lw || this._oc.height !== lh) { this._oc = document.createElement('canvas'); this._oc.width = lw; this._oc.height = lh; this._octx = this._oc.getContext('2d'); this._id = this._octx.createImageData(lw, lh); }
      const D = this._id.data, sc = this.num('scale', 1), cx = this.num('cx', .5) * w, cy = this.num('cy', .5) * h, tilt = this.num('tilt', .2);
      const facet = !this.hasAttribute('smooth'), stars = this.num('stars', 1), glow = this.num('glow', 1), rs = .12, px = 1 / (h * sc), acc = [0, 0, 0];
      for (let j = 0; j < lh; j++) {
        const fy = (lh - 1 - j + .5) * k;
        for (let i = 0; i < lw; i++) {
          const fx = (i + .5) * k, X = (fx - cx) / (h * sc), Y = (fy - cy) / (h * sc), r = Math.sqrt(X * X + Y * Y);
          acc[0] = .027; acc[1] = .024; acc[2] = .05;
          const s = h21(i, j);
          if (s > .9972 && stars > 0) { const v = stars * Math.min(1, Math.max(0, (r - rs * 1.3) / (rs * 2.2))) * (.35 + .65 * h21(i + 3, j + 3)); acc[0] += .86 * v; acc[1] += .86 * v; acc[2] += v; }
          const gl = .11 * glow / (1 + Math.pow(r / rs, 2) * .9); acc[0] += gl; acc[1] += .42 * gl; acc[2] += .62 * gl;
          if (r < rs) { acc[0] = acc[1] = acc[2] = 0; }
          else {
            const arc = .45 + .55 * Math.min(1, Math.max(0, (Y / r + .6) / 1.5));
            discJS(X, Y, rs * 1.06, rs * 2.3, .35, time, facet, acc, .85 * arc);
            const pr = Math.max(0, 1 - Math.abs(r - rs * 1.035) / Math.max(2.2 * px, rs * .02)) * 1.3; acc[0] += pr; acc[1] += .9 * pr; acc[2] += .8 * pr;
          }
          if (Y < 0 || r > rs) discJS(X, Y / tilt, rs * 1.65, rs * 6.2, .5, time, facet, acc, 1.15);
          const o = (j * lw + i) * 4;
          D[o] = (1 - Math.exp(-acc[0] * 1.7)) * 255; D[o + 1] = (1 - Math.exp(-acc[1] * 1.7)) * 255; D[o + 2] = (1 - Math.exp(-acc[2] * 1.7)) * 255; D[o + 3] = 255;
        }
      }
      this._octx.putImageData(this._id, 0, 0);
      this.ctx.imageSmoothingEnabled = true; this.ctx.drawImage(this._oc, 0, 0, w, h);
    }
    setup() {
      this.scene = new THREE.Scene(); this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this.u = {
        uTime: { value: 0 }, uRes: { value: new THREE.Vector2() }, uScale: { value: 1 }, uCenter: { value: new THREE.Vector2(.5, .5) },
        uTilt: { value: .2 }, uFacet: { value: 1 }, uStars: { value: 1 }, uGlow: { value: 1 }
      };
      const m = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: 'void main(){gl_Position=vec4(position.xy,0.,1.);}', fragmentShader: FRAG, depthTest: false, depthWrite: false });
      this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m));
    }
    frame(t, w, h) {
      const u = this.u; u.uTime.value = t; u.uRes.value.set(w, h);
      u.uScale.value = this.num('scale', 1); u.uCenter.value.set(this.num('cx', .5), this.num('cy', .5));
      u.uTilt.value = this.num('tilt', .2); u.uFacet.value = this.hasAttribute('smooth') ? 0 : 1;
      u.uStars.value = this.num('stars', 1); u.uGlow.value = this.num('glow', 1);
    }
  }

  /* ---------- Pingouin ---------- */
  function lights(scene, warm) {
    scene.add(new THREE.HemisphereLight(0xb9b6e8, 0x24122a, .85));
    const key = new THREE.DirectionalLight(0xffffff, 1.55); key.position.set(3, 4, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0xff5fa2, 2.6); rim.position.set(-4, 2, -4); scene.add(rim);
    const rim2 = new THREE.DirectionalLight(0xffb547, warm ? 2.2 : 1.2); rim2.position.set(4, 1, -3); scene.add(rim2);
  }
  const M = (c, e, ei) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: .75, metalness: 0, emissive: e || 0x000000, emissiveIntensity: ei || 1 });
  function makePenguin() {
    const T = THREE, root = new T.Group(), body = new T.Group(), head = new T.Group();
    const pink = M(0xff9ccb), deep = M(0xf0679f), plume = M(0xfff4f8), amber = M(0xffb547, 0x3a2000), ink = M(0x14121f), white = M(0xffffff, 0xffffff, .18);
    const prof = [[.001, 0], [.42, .04], [.66, .3], [.74, .7], [.71, 1.1], [.58, 1.46], [.34, 1.76], [.001, 1.86]].map(p => new T.Vector2(p[0], p[1]));
    body.add(new T.Mesh(new T.LatheGeometry(prof, 10), pink));
    const belly = new T.Mesh(new T.IcosahedronGeometry(1, 2), plume); belly.scale.set(.62, .78, .52); belly.position.set(0, .74, .3); belly.userData.bias = .6; body.add(belly);
    [-1, 1].forEach(sx => {
      const w = new T.Mesh(new T.IcosahedronGeometry(.115, 1), white); w.scale.set(1, 1.1, .4); w.position.set(.17 * sx, .14, .53); w.userData.bias = .2; head.add(w);
      const e = new T.Mesh(new T.IcosahedronGeometry(.07, 1), ink); e.scale.set(1, 1.1, .4); e.position.set(.165 * sx, .12, .58); e.userData.bias = .3; head.add(e);
      const hl = new T.Mesh(new T.IcosahedronGeometry(.024, 0), M(0xffffff, 0xffffff, .6)); hl.scale.set(1, 1, .4); hl.position.set(.165 * sx + .025, .155, .61); hl.userData.bias = .4; head.add(hl);
      const ch = new T.Mesh(new T.IcosahedronGeometry(.07, 1), M(0xff7fb6)); ch.scale.set(1.1, .6, .3); ch.position.set(.29 * sx, -.03, .55); ch.userData.bias = .15; head.add(ch);
    });
    const bg = new T.ConeGeometry(.08, .13, 6); bg.rotateX(Math.PI / 2); bg.scale(1.5, .7, 1);
    const beak = new T.Mesh(bg, amber); beak.position.set(0, -.02, .66); beak.userData.bias = .15; head.add(beak);
    head.position.y = 1.4; body.add(head);
    const fl = new T.Group(), fr = new T.Group();
    const fg = new T.ConeGeometry(.16, .85, 4); fg.rotateZ(Math.PI); fg.translate(0, -.42, 0); fg.scale(1, 1, .35);
    fl.add(new T.Mesh(fg, deep)); fr.add(new T.Mesh(fg, deep));
    fl.position.set(.68, 1.18, 0); fr.position.set(-.68, 1.18, 0); body.add(fl, fr);
    root.add(body);
    [-1, 1].forEach(sx => {
      const f = new T.Mesh(new T.BoxGeometry(.26, .07, .36), amber); f.position.set(.24 * sx, .035, .28); f.rotation.y = .25 * sx; root.add(f);
    });
    return { root, body, head, fl, fr };
  }
  function makePlatform() {
    const g = new THREE.Group();
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.95, 1.02, .1, 6), M(0x201f36)); p.position.y = -.05; g.add(p);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.99, .014, 3, 6), new THREE.MeshBasicMaterial({ color: 0xff5fa2 }));
    ring.rotation.x = Math.PI / 2; ring.rotation.z = Math.PI / 6; ring.position.y = .005; g.add(ring);
    g.rotation.y = Math.PI / 6; return g;
  }
  function pose(P, name, t) {
    const s = Math.sin(t * 2.2);
    P.body.position.y = s * .025; P.body.rotation.set(0, 0, 0); P.head.rotation.set(0, 0, 0);
    if (name === 'salut') {
      P.fl.rotation.set(0, 0, .2 + s * .03);
      P.fr.rotation.set(0, 0, -2.55 + Math.sin(t * 9) * .32);
      P.head.rotation.z = .12; P.body.rotation.z = .04;
    } else if (name === 'pointe') {
      P.fl.rotation.set(0, 0, .18);
      P.fr.rotation.set(-.15, 0, -1.48 + s * .03);
      P.head.rotation.y = -.4; P.head.rotation.x = -.05; P.body.rotation.y = -.15;
    } else if (name === 'pointe-d') {
      P.fr.rotation.set(0, 0, -.18);
      P.fl.rotation.set(-.15, 0, 1.48 - s * .03);
      P.head.rotation.y = .4; P.head.rotation.x = -.05; P.body.rotation.y = .15;
    } else {
      P.fl.rotation.set(0, 0, .2 + s * .05); P.fr.rotation.set(0, 0, -.2 - s * .05);
      P.head.rotation.z = Math.sin(t * 1.1) * .05;
    }
  }
  const VIEWS = { front: 0, quart: -.7, profile: -Math.PI / 2, back: Math.PI };
  class PkPenguin extends PkBase {
    setup() {
      this.scene = new THREE.Scene(); this.camera = new THREE.PerspectiveCamera(this.num('fov', 22), 1, .1, 100);
      this.P = makePenguin(); this.scene.add(this.P.root); lights(this.scene, this.hasAttribute('warm'));
      if (this.hasAttribute('platform')) this.scene.add(makePlatform());
    }
    frame(t, w, h) {
      const c = this.camera; c.aspect = w / h;
      const d = this.num('dist', 8.4), ty = this.num('ty', 1.05);
      c.position.set(0, ty + this.num('cy', .35), d); c.lookAt(0, ty, 0); c.updateProjectionMatrix();
      const v = this.attr('view', 'front'); let ry = v in VIEWS ? VIEWS[v] : parseFloat(v) || 0;
      if (this.hasAttribute('spin')) ry += t * .6;
      pose(this.P, this.attr('pose', 'idle'), t);
      this.P.root.rotation.y = ry;
    }
  }

  /* ---------- Vaisseau ---------- */
  function makeShip() {
    const T = THREE, g = new T.Group();
    const hull = M(0x2a2944), plate = M(0x45436a), dark = M(0x151426);
    const glow = new T.MeshBasicMaterial({ color: 0xff5fa2 }), glowA = new T.MeshBasicMaterial({ color: 0xffb547 });
    const h = new T.CylinderGeometry(.3, .38, 2.6, 6); h.rotateZ(Math.PI / 2); g.add(new T.Mesh(h, hull));
    const n = new T.ConeGeometry(.3, .9, 6); n.rotateZ(-Math.PI / 2); const nm = new T.Mesh(n, plate); nm.position.x = 1.75; g.add(nm);
    const e = new T.CylinderGeometry(.42, .3, .45, 6); e.rotateZ(Math.PI / 2); const em = new T.Mesh(e, dark); em.position.x = -1.5; g.add(em);
    const f = new T.ConeGeometry(.26, .5, 6); f.rotateZ(Math.PI / 2); const fm = new T.Mesh(f, glow); fm.position.x = -1.95; g.add(fm);
    [-1, 1].forEach(s => { const w = new T.Mesh(new T.BoxGeometry(1.5, .035, .02), glow); w.position.set(.35, .05, .33 * s); g.add(w); });
    const fin = new T.Mesh(new T.BoxGeometry(.7, .5, .05), plate); fin.position.set(-1.1, .4, 0); fin.rotation.z = -.3; g.add(fin);
    const ring = new T.Group();
    const tr = new T.TorusGeometry(1.2, .1, 4, 10); tr.rotateY(Math.PI / 2); ring.add(new T.Mesh(tr, plate));
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const sp = new T.Mesh(new T.BoxGeometry(.06, 1.0, .06), hull); sp.position.set(0, Math.cos(a) * .7, Math.sin(a) * .7); sp.rotation.x = -a; ring.add(sp);
    }
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2;
      const l = new T.Mesh(new T.BoxGeometry(.12, .05, .05), i % 3 ? glow : glowA); l.position.set(.1, Math.cos(a) * 1.2, Math.sin(a) * 1.2); ring.add(l);
    }
    ring.position.x = -.25; g.add(ring);
    return { g, ring };
  }
  class PkShip extends PkBase {
    setup() {
      this.scene = new THREE.Scene(); this.camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
      this.S = makeShip(); this.scene.add(this.S.g);
      this.scene.add(new THREE.HemisphereLight(0x8d8ac4, 0x10081a, 1.1));
      const k = new THREE.DirectionalLight(0xffb547, 2.6); k.position.set(-2, 1, -4); this.scene.add(k);
      const p = new THREE.DirectionalLight(0xff5fa2, 2.2); p.position.set(3, -1, -2); this.scene.add(p);
      const fill = new THREE.DirectionalLight(0xffffff, .9); fill.position.set(2, 3, 5); this.scene.add(fill);
    }
    frame(t, w, h) {
      const c = this.camera; c.aspect = w / h; c.position.set(0, 0, 9 / this.num('scale', 1)); c.lookAt(0, 0, 0); c.updateProjectionMatrix();
      this.S.ring.rotation.x = t * .5;
      this.S.g.rotation.set(this.num('rx', .35), this.num('ry', -.6) + Math.sin(t * .3) * .05, this.num('rz', .08));
    }
  }

  customElements.define('pk-blackhole', PkBlackhole);
  customElements.define('pk-penguin', PkPenguin);
  customElements.define('pk-ship', PkShip);
})();
