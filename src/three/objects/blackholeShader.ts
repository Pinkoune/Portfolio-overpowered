/*
 * La Pupille — shader de design/pinkoune-3d.js, conservé tel quel (disque facetté 11 anneaux × 60
 * secteurs, Doppler, anneau de photons, arc arrière). Seuls changements :
 * - le quad est dessiné en fond d'écran (profondeur maximale), centré sur la projection d'un point
 *   du monde, pour que le trou noir reste à sa place quand la caméra bouge ;
 * - uSpin ralentit le disque (×0,25 avec « réduire les animations ») ;
 * - les étoiles du shader sont coupées (uStars = 0) au profit d'un champ d'étoiles en 3D ;
 * - sortie convertie en linéaire (le post-traitement réencode en sRGB) ;
 * - uReveal (0 → 1) allume le disque anneau par anneau, de l'intérieur vers l'extérieur (intro).
 */
export const blackholeVertex = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.99999, 1.0);
}`;

export const blackholeFragment = /* glsl */ `
uniform float uTime, uSpin, uScale, uTilt, uFacet, uStars, uGlow, uReveal;
uniform vec2 uRes, uCenter;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
vec3 ramp(float t){
  vec3 c0=vec3(1.,.95,.86),c1=vec3(1.,.71,.28),c2=vec3(1.,.37,.64),c3=vec3(.30,.06,.26);
  return t<.22?mix(c0,c1,t/.22):(t<.55?mix(c1,c2,(t-.22)/.33):mix(c2,c3,clamp((t-.55)/.45,0.,1.)));
}
vec3 disc(vec2 q,float rIn,float rOut,float spin){
  float r=length(q); float t=(r-rIn)/(rOut-rIn); if(t<0.||t>1.) return vec3(0.);
  float a=atan(q.y,q.x);
  float bands=mix(220.,11.,uFacet); float tb=floor(t*bands)/bands;
  float rot=a/6.28318+uTime*uSpin*spin/(.35+tb*1.6);
  float segs=mix(900.,60.,uFacet); float sb=floor(fract(rot)*segs);
  float n=h21(vec2(tb*17.3+1.,sb));
  float I=pow(1.-t,1.5)*(.45+.65*n)*smoothstep(0.,.05,t)*step(tb,uReveal*1.02-.02);
  float dop=1.+.8*(-q.x/max(r,1e-3));
  return ramp(mix(t,tb,uFacet))*I*dop;
}
void main(){
  vec2 p=(gl_FragCoord.xy-uCenter*uRes)/(uRes.y*uScale);
  float r=length(p); float rs=.12; float px=1./(uRes.y*uScale);
  vec3 col=vec3(.027,.024,.05);
  vec2 g=floor(gl_FragCoord.xy/2.); float s=h21(g);
  col+=vec3(.86,.86,1.)*step(.9972,s)*uStars*smoothstep(rs*1.3,rs*3.5,r)*(.35+.65*h21(g+3.));
  col+=vec3(1.,.42,.62)*.11*uGlow*uReveal/(1.+pow(r/rs,2.)*.9);
  if(r<rs) col=vec3(0.);
  else {
    float arc=.45+.55*smoothstep(-.6,.9,p.y/r);
    col+=disc(p,rs*1.06,rs*2.3,.35)*.85*arc;
    col+=vec3(1.,.9,.8)*smoothstep(2.2*px,0.,abs(r-rs*1.035))*1.3*smoothstep(0.,.15,uReveal);
  }
  vec2 q=vec2(p.x,p.y/uTilt);
  float m=(p.y<0.||r>rs)?1.:0.;
  col+=disc(q,rs*1.65,rs*6.2,.5)*m*1.15;
  col=1.-exp(-col*1.7);
  // Couleurs pensées pour l'écran : on repasse en linéaire, le post-traitement réencode en sRGB.
  gl_FragColor=vec4(pow(col,vec3(2.2)),1.);
}`;
