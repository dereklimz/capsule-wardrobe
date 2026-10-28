/* Garment illustrations v2: one hand-drawn SVG per style, recolored by hex.
   Garments.img(styleId, hex) -> data URI.  Garments.svg(styleId, hex) -> svg string. */
(function () {
  function h2r(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function r2h(r) { return '#' + r.map(function (v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'); }).join(''); }
  function mix(a, b, f) { var x = h2r(a), y = h2r(b); return r2h(x.map(function (v, i) { return v + (y[i] - v) * f; })); }
  function dk(h, f) { return mix(h, '#000000', f); }
  function lt(h, f) { return mix(h, '#ffffff', f); }
  function lum(h) { var c = h2r(h); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }

  var n = 0, C = {};
  function setC(hex) {
    var L = lum(hex);
    C = { hex: hex, L: L, E: L < 0.2 ? lt(hex, 0.3) : dk(hex, 0.52), seam: L > 0.45 ? dk(hex, 0.3) : lt(hex, 0.25),
      fold: dk(hex, L < 0.2 ? 0.5 : 0.3), hi: lt(hex, L < 0.2 ? 0.28 : 0.35), btn: L > 0.5 ? dk(hex, 0.22) : lt(hex, 0.55),
      rib: L > 0.5 ? dk(hex, 0.07) : lt(hex, 0.06), inner: dk(hex, 0.6), dark: dk(hex, 0.18), light: lt(hex, 0.1) };
  }
  var DEFS =
    '<defs>' +
    '<filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.1"/></filter>' +
    '<filter id="bl3" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>' +
    '<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.1 0.9" numOctaves="2" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.5 0 0 0 -0.12"/></filter>' +
    '<linearGradient id="gx" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".35" stop-color="#fff" stop-opacity=".03"/><stop offset=".7" stop-color="#000" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></linearGradient>' +
    '<linearGradient id="gy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>' +
    '<pattern id="knit" width="5" height="6" patternUnits="userSpaceOnUse"><path d="M0 0 L2.5 4.5 L5 0" fill="none" stroke="#000" stroke-opacity=".17" stroke-width="1"/><path d="M0 1.2 L2.5 5.7 L5 1.2" fill="none" stroke="#fff" stroke-opacity=".10" stroke-width=".8"/></pattern>' +
    '<pattern id="rib" width="3.6" height="6" patternUnits="userSpaceOnUse"><rect width="1.6" height="6" fill="#000" fill-opacity=".2"/><rect x="2" width="1" height="6" fill="#fff" fill-opacity=".09"/></pattern>' +
    '<pattern id="twill" width="3.4" height="3.4" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="1.2" height="3.4" fill="#000" fill-opacity=".1"/></pattern>' +
    '<pattern id="denim" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(32)"><rect width="1.1" height="3" fill="#000" fill-opacity=".13"/><rect x="1.6" width=".6" height="3" fill="#fff" fill-opacity=".07"/></pattern>' +
    '<pattern id="cord" width="3.4" height="4" patternUnits="userSpaceOnUse"><rect width="1.5" height="4" fill="#000" fill-opacity=".24"/><rect x="2" width="1" height="4" fill="#fff" fill-opacity=".12"/></pattern>' +
    '<pattern id="weave" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="1.5" height="1.5" fill="#000" fill-opacity=".07"/><rect x="1.5" y="1.5" width="1.5" height="1.5" fill="#000" fill-opacity=".07"/></pattern>' +
    '<pattern id="wool" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="4" fill="#000" fill-opacity=".05"/></pattern>' +
    '</defs>';

  /* shaded part with optional texture, grain and extra clipped content */
  function P(d, fill, o) {
    o = o || {};
    var id = 'c' + (n++), s = '<clipPath id="' + id + '"><path d="' + d + '"/></clipPath><g clip-path="url(#' + id + ')">';
    s += '<path d="' + d + '" fill="' + fill + '"/>';
    if (o.tex) s += '<rect x="-20" y="-20" width="260" height="330" fill="url(#' + o.tex + ')"/>';
    if (o.grain) s += '<rect x="0" y="0" width="240" height="330" fill="#000" filter="url(#grain)" opacity="' + o.grain + '"/>';
    if (o.shade !== false) s += '<rect x="-20" y="-20" width="260" height="330" fill="url(#gx)"/><rect x="-20" y="-20" width="260" height="330" fill="url(#gy)"/>';
    if (o.in) s += o.in;
    s += '</g>';
    if (o.stroke !== false) s += '<path d="' + d + '" fill="none" stroke="' + (o.E || C.E) + '" stroke-width="' + (o.sw || 1.2) + '" stroke-linejoin="round" stroke-linecap="round"/>';
    return s;
  }
  function Ln(d, color, w, o) { o = o || {}; return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + (w || 1) + '" stroke-linecap="round" stroke-linejoin="round"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + (o.op != null ? ' opacity="' + o.op + '"' : '') + (o.blur ? ' filter="url(#bl)"' : '') + '/>'; }
  function Fold(d, op) { return Ln(d, C.fold, 1.6, { op: op == null ? 0.35 : op, blur: true }); }
  function Hi(d, op) { return Ln(d, C.hi, 1.8, { op: op == null ? 0.35 : op, blur: true }); }
  function Stitch(d, color) { return Ln(d, color || C.seam, 0.9, { dash: '2.2 1.8', op: 0.75 }); }
  function Btn(x, y, r) { r = r || 2.6; return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + C.btn + '" stroke="' + dk(C.btn, 0.4) + '" stroke-width=".7"/><circle cx="' + (x - r * 0.25) + '" cy="' + (y - r * 0.25) + '" r="' + (r * 0.22) + '" fill="' + dk(C.btn, 0.45) + '"/><circle cx="' + (x + r * 0.25) + '" cy="' + (y + r * 0.25) + '" r="' + (r * 0.22) + '" fill="' + dk(C.btn, 0.45) + '"/>'; }
  function mir(d) { // mirror a path of absolute M/L/Q/C/Z commands around x=100
    return d.replace(/([MLQCZ])([^MLQCZ]*)/g, function (m, c, rest) {
      var nums = rest.trim().split(/[\s,]+/).filter(Boolean).map(Number);
      return c + nums.map(function (v, i) { return i % 2 === 0 ? 200 - v : v; }).join(' ') + ' ';
    });
  }
  function pair(d, fill, o) { return P(d, fill, o) + P(mir(d), fill, o); }
  function wrap(vb, body) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '">' + DEFS + body + '</svg>'; }

  var VB = '0 -8 200 248';
  var SS = 'M78 24 Q100 38 122 24 L152 33 L188 64 L171 94 L152 80 L152 212 Q100 218 48 212 L48 80 L29 94 L12 64 L48 33 Z';
  var LS = 'M78 24 Q100 38 122 24 L152 33 L190 60 L196 196 L170 200 L152 108 L152 212 Q100 218 48 212 L48 108 L30 200 L4 196 L10 60 L48 33 Z';
  var BODYFOLD = 'M64 96 Q72 150 66 204 M136 96 Q128 150 134 204 M100 70 Q96 140 100 208';
  var SLFOLD = 'M26 70 Q30 130 22 190 M174 70 Q170 130 178 190 M44 112 Q42 150 38 192 M156 112 Q158 150 162 192';

  function hemStitch(y) { return Stitch('M52 ' + (y) + ' Q100 ' + (y + 5) + ' 148 ' + (y)); }
  function innerNeckRound() { return '<path d="M82 22 Q100 12 118 22 Q100 40 82 22 Z" fill="' + C.inner + '"/>'; }

  var T = {};
  /* ---------- TOPS ---------- */
  T.tshirt = function () {
    return innerNeckRound() + P(SS, C.hex, { grain: 0.18, in: Fold(BODYFOLD) + Fold('M30 70 Q40 80 46 90 M170 70 Q160 80 154 90', 0.3) + Hi('M70 70 Q74 130 70 190', 0.2) }) +
      P('M76 24 Q100 46 124 24 L119 20 Q100 36 81 20 Z', C.rib, { tex: 'rib', sw: 1 }) +
      hemStitch(204) + Stitch('M172 92 L154 78 M28 92 L46 78');
  };
  T.vneck = function () {
    return '<path d="M72 18 Q100 6 128 18 L100 68 Z" fill="' + C.inner + '"/>' +
      P('M76 24 L100 62 L124 24 L152 33 L188 64 L171 94 L152 80 L152 212 Q100 218 48 212 L48 80 L29 94 L12 64 L48 33 Z', C.hex, { grain: 0.18, in: Fold(BODYFOLD) + Hi('M70 80 Q74 140 70 190', 0.2) }) +
      P('M71 21 L100 68 L129 21 L124 20 L100 58 L76 20 Z', C.rib, { tex: 'rib', sw: 1 }) + hemStitch(204) + Stitch('M172 92 L154 78 M28 92 L46 78');
  };
  T.polo = function () {
    var cuffR = 'M188 64 L171 94 L164 89 L181 59 Z';
    return '<path d="M78 16 Q100 6 122 16 L112 40 L88 40 Z" fill="' + C.inner + '"/>' +
      P(SS, C.hex, { tex: 'knit', in: Fold(BODYFOLD, 0.25) }) +
      P(cuffR, C.rib, { tex: 'rib', sw: 1 }) + P(mir(cuffR), C.rib, { tex: 'rib', sw: 1 }) +
      P('M96 34 L104 34 L104 100 L96 100 Z', C.light, { sw: 1 }) + Ln('M100 36 L100 98', C.seam, 0.7, { op: 0.6 }) + Btn(100, 54, 2.4) + Btn(100, 72, 2.4) + Btn(100, 90, 2.4) +
      P('M82 18 L66 34 L80 54 L100 44 L99 30 Z', C.light, { tex: 'knit', sw: 1.2 }) + P('M118 18 L134 34 L120 54 L100 44 L101 30 Z', C.light, { tex: 'knit', sw: 1.2 }) +
      hemStitch(205);
  };
  T.henley = function () {
    var cuff = 'M195 184 L169 188 L170 200 L196 196 Z';
    return innerNeckRound() + P(LS, C.hex, { tex: 'knit', in: Fold(BODYFOLD, 0.25) + Fold(SLFOLD, 0.25) }) +
      P(cuff, C.rib, { tex: 'rib', sw: 1 }) + P(mir(cuff), C.rib, { tex: 'rib', sw: 1 }) +
      P('M76 24 Q100 46 124 24 L119 20 Q100 36 81 20 Z', C.rib, { tex: 'rib', sw: 1 }) +
      P('M94 36 L106 36 L106 92 L94 92 Z', C.light, { tex: 'rib', sw: 1 }) + Btn(100, 46, 2.4) + Btn(100, 62, 2.4) + Btn(100, 78, 2.4) +
      P('M48 202 Q100 208 152 202 L152 212 Q100 218 48 212 Z', C.rib, { tex: 'rib', sw: 1 });
  };
  function collarOpen() { return ''; }
  T.camp = function () {
    var body = 'M80 22 Q100 36 120 22 L152 33 L190 62 L172 98 L152 84 L152 206 L48 206 L48 84 L28 98 L10 62 L48 33 Z';
    return '<path d="M84 20 Q100 14 116 20 L100 56 Z" fill="' + C.inner + '"/>' +
      P(body, C.hex, { tex: 'weave', grain: 0.2, in: Fold('M64 90 Q60 150 66 200 M136 90 Q140 150 134 200 M40 70 Q36 80 40 90', 0.3) + Hi('M80 100 Q84 150 80 196', 0.18) }) +
      P('M96 50 L104 50 L104 206 L96 206 Z', C.light, { sw: 1, shade: false }) + Ln('M100 52 L100 204', C.seam, 0.7, { op: 0.6 }) +
      Btn(100, 76) + Btn(100, 104) + Btn(100, 132) + Btn(100, 160) + Btn(100, 188) +
      P('M118 98 L144 98 L144 132 L131 138 L118 132 Z', C.light, { sw: 1, tex: 'weave' }) + Stitch('M121 102 L141 102') +
      P('M82 19 L54 38 L86 74 L100 58 L98 32 Z', C.light, { tex: 'weave', sw: 1.2 }) + P('M118 19 L146 38 L114 74 L100 58 L102 32 Z', C.light, { tex: 'weave', sw: 1.2 }) +
      Stitch('M168 96 L154 84 M32 96 L46 84') + hemStitch(198);
  };
  function shirtCuffs(hexBand) {
    var c = 'M196 184 L169 188 L170 200 L197 196 Z';
    return P(c, hexBand || C.light, { sw: 1, tex: 'weave' }) + P(mir(c), hexBand || C.light, { sw: 1, tex: 'weave' }) + Btn(182, 193, 2) + Btn(18, 193, 2);
  }
  T.oxford = function () {
    var plac = 'M96 38 L104 38 L104 212 L96 212 Z';
    return '<path d="M84 18 Q100 12 116 18 L100 40 Z" fill="' + C.inner + '"/>' +
      P(LS, C.hex, { tex: 'weave', grain: 0.2, in: Fold(BODYFOLD, 0.3) + Fold(SLFOLD, 0.25) + Hi('M80 100 Q84 150 80 196', 0.16) }) + shirtCuffs() +
      P(plac, C.light, { sw: 1, shade: false }) + Ln('M100 40 L100 210', C.seam, 0.7, { op: 0.6 }) +
      Btn(100, 64) + Btn(100, 92) + Btn(100, 120) + Btn(100, 148) + Btn(100, 176) + Btn(100, 202) +
      P('M116 98 L144 98 L144 130 L130 136 L116 130 Z', C.light, { sw: 1, tex: 'weave' }) + Stitch('M119 102 L141 102') +
      P('M80 18 Q100 10 120 18 L122 30 Q100 22 78 30 Z', C.light, { sw: 1, tex: 'weave' }) +
      P('M82 20 L64 33 L82 52 L99 40 Z', C.light, { tex: 'weave', sw: 1.2 }) + P('M118 20 L136 33 L118 52 L101 40 Z', C.light, { tex: 'weave', sw: 1.2 }) +
      '<circle cx="70" cy="36" r="1.6" fill="' + C.btn + '"/><circle cx="130" cy="36" r="1.6" fill="' + C.btn + '"/>' +
      hemStitch(204);
  };
  T.dress = function () {
    var plac = 'M97 40 L103 40 L103 212 L97 212 Z';
    return '<path d="M84 18 Q100 12 116 18 L100 40 Z" fill="' + C.inner + '"/>' +
      P(LS, C.hex, { grain: 0.1, in: Fold('M64 96 Q70 150 66 204 M136 96 Q130 150 134 204', 0.22) + Fold(SLFOLD, 0.2) + Hi('M80 100 Q84 150 80 196', 0.22) }) + shirtCuffs() +
      P(plac, C.light, { sw: 0.8, shade: false }) + Ln('M100 42 L100 210', C.seam, 0.6, { op: 0.5 }) + Btn(100, 60, 1.8) + Btn(100, 90, 1.8) + Btn(100, 120, 1.8) + Btn(100, 150, 1.8) + Btn(100, 180, 1.8) +
      P('M80 20 Q100 12 120 20 L124 31 Q100 24 76 31 Z', C.light, { sw: 1 }) +
      P('M80 22 L60 46 L90 58 L100 38 Z', C.light, { sw: 1.2 }) + P('M120 22 L140 46 L110 58 L100 38 Z', C.light, { sw: 1.2 }) +
      Stitch('M82 26 L66 44 M118 26 L134 44') + hemStitch(205);
  };
  /* ---------- SWEATERS ---------- */
  T.crew = function () {
    var cuff = 'M196 182 L169 186 L170 200 L197 196 Z';
    return innerNeckRound() + P(LS, C.hex, { tex: 'knit', in: Fold(BODYFOLD, 0.2) + Fold(SLFOLD, 0.25) }) +
      P(cuff, C.rib, { tex: 'rib', sw: 1 }) + P(mir(cuff), C.rib, { tex: 'rib', sw: 1 }) +
      P('M48 198 Q100 206 152 198 L152 212 Q100 220 48 212 Z', C.rib, { tex: 'rib', sw: 1 }) +
      P('M74 24 Q100 50 126 24 L120 18 Q100 38 80 18 Z', C.rib, { tex: 'rib', sw: 1 });
  };
  T.vknit = function () {
    var cuff = 'M196 182 L169 186 L170 200 L197 196 Z';
    return '<path d="M72 18 Q100 6 128 18 L100 70 Z" fill="' + C.inner + '"/>' +
      P('M76 24 L100 64 L124 24 L152 33 L190 60 L196 196 L170 200 L152 108 L152 212 Q100 218 48 212 L48 108 L30 200 L4 196 L10 60 L48 33 Z', C.hex, { tex: 'knit', in: Fold(BODYFOLD, 0.2) + Fold(SLFOLD, 0.25) }) +
      P(cuff, C.rib, { tex: 'rib', sw: 1 }) + P(mir(cuff), C.rib, { tex: 'rib', sw: 1 }) +
      P('M48 198 Q100 206 152 198 L152 212 Q100 220 48 212 Z', C.rib, { tex: 'rib', sw: 1 }) +
      P('M70 21 L100 72 L130 21 L124 18 L100 58 L76 18 Z', C.rib, { tex: 'rib', sw: 1 });
  };
  T.turtle = function () {
    var cuff = 'M196 182 L169 186 L170 200 L197 196 Z';
    return P(LS, C.hex, { tex: 'knit', in: Fold(BODYFOLD, 0.2) + Fold(SLFOLD, 0.25) }) +
      P(cuff, C.rib, { tex: 'rib', sw: 1 }) + P(mir(cuff), C.rib, { tex: 'rib', sw: 1 }) +
      P('M48 198 Q100 206 152 198 L152 212 Q100 220 48 212 Z', C.rib, { tex: 'rib', sw: 1 }) +
      P('M72 30 L74 2 Q100 -8 126 2 L128 30 Q100 46 72 30 Z', C.rib, { tex: 'rib', in: Fold('M74 14 Q100 24 126 14 M76 24 Q100 34 124 24', 0.35) + Hi('M80 6 Q100 -2 120 6', 0.3) });
  };
  T.cardigan = function () {
    var cuff = 'M196 182 L169 186 L170 200 L197 196 Z';
    return '<path d="M72 18 Q100 6 128 18 L100 66 Z" fill="' + C.inner + '"/>' +
      P('M76 24 L100 62 L124 24 L152 33 L190 60 L196 196 L170 200 L152 108 L152 212 Q100 218 48 212 L48 108 L30 200 L4 196 L10 60 L48 33 Z', C.hex, { tex: 'knit', in: Fold(BODYFOLD, 0.2) + Fold(SLFOLD, 0.25) }) +
      P(cuff, C.rib, { tex: 'rib', sw: 1 }) + P(mir(cuff), C.rib, { tex: 'rib', sw: 1 }) +
      P('M48 198 Q100 206 152 198 L152 212 Q100 220 48 212 Z', C.rib, { tex: 'rib', sw: 1 }) +
      P('M93 56 L107 56 L107 214 L93 214 Z', C.rib, { tex: 'rib', sw: 1 }) +
      P('M70 21 L100 68 L130 21 L124 18 L100 58 L76 18 Z', C.rib, { tex: 'rib', sw: 1 }) +
      Btn(100, 78, 2.6) + Btn(100, 108, 2.6) + Btn(100, 138, 2.6) + Btn(100, 168, 2.6) + Btn(100, 196, 2.6) +
      P('M58 150 L86 150 L86 184 L58 184 Z', C.hex, { tex: 'knit', sw: 1 }) + P('M114 150 L142 150 L142 184 L114 184 Z', C.hex, { tex: 'knit', sw: 1 }) +
      P('M58 150 L86 150 L86 158 L58 158 Z', C.rib, { tex: 'rib', sw: 1 }) + P('M114 150 L142 150 L142 158 L114 158 Z', C.rib, { tex: 'rib', sw: 1 });
  };
  /* ---------- OUTERWEAR ---------- */
  var JK = 'M72 18 Q100 10 128 18 L154 30 L188 56 L194 186 L168 190 L154 104 L154 204 Q100 212 46 204 L46 104 L32 190 L6 186 L12 56 L46 30 Z';
  function notchLapels(depth, wide) {
    var d = depth || 112, w = wide || 0;
    var L = 'M74 20 L87 15 L99 ' + (d - 6) + ' L92 ' + d + ' L' + (68 - w) + ' 70 L82 60 L' + (70 - w / 2) + ' 44 Z';
    return P(L, C.light, { sw: 1.2, tex: 'wool' }) + P(mir(L), C.light, { sw: 1.2, tex: 'wool' });
  }
  T.blazer = function () {
    return '<path d="M82 16 L100 112 L118 16 Q100 28 82 16Z" fill="' + C.inner + '"/>' +
      P(JK, C.hex, { tex: 'wool', grain: 0.22, in: Fold('M64 110 Q60 160 66 200 M136 110 Q140 160 134 200', 0.3) + Fold('M26 70 Q28 130 20 184 M174 70 Q172 130 180 184', 0.25) + Hi('M82 110 Q80 160 84 200', 0.18) }) +
      Ln('M99 112 Q95 160 88 204', C.seam, 1, { op: 0.8 }) + Ln('M101 112 Q105 160 112 204', C.seam, 1, { op: 0.8 }) +
      notchLapels(112) + Btn(100, 120, 2.8) + Btn(100, 146, 2.8) +
      P('M56 156 L88 156 L88 170 L56 170 Z', C.dark, { sw: 1 }) + P('M112 156 L144 156 L144 170 L112 170 Z', C.dark, { sw: 1 }) +
      P('M114 92 L140 90 L140 97 L114 99 Z', C.dark, { sw: 1 }) +
      Ln('M54 38 Q70 50 80 62 M146 38 Q130 50 120 62', C.seam, 0.8, { op: 0.5 }) +
      Btn(16, 176, 1.5) + Btn(16, 168, 1.5) + Btn(184, 176, 1.5) + Btn(184, 168, 1.5);
  };
  T.overshirt = function () {
    var body = 'M76 20 Q100 34 124 20 L154 32 L190 62 L196 190 L170 194 L152 108 L152 210 Q100 216 48 210 L48 108 L30 194 L4 190 L10 62 L46 32 Z';
    var cuff = 'M196 178 L169 182 L170 194 L197 190 Z';
    var pk = 'M54 94 L88 94 L88 128 L71 134 L54 128 Z', fl = 'M54 94 L88 94 L88 108 L71 114 L54 108 Z';
    return '<path d="M84 20 Q100 14 116 20 L100 44 Z" fill="' + C.inner + '"/>' +
      P(body, C.hex, { tex: 'twill', grain: 0.24, in: Fold(BODYFOLD, 0.3) + Fold(SLFOLD, 0.25) }) +
      P(cuff, C.light, { sw: 1, tex: 'twill' }) + P(mir(cuff), C.light, { sw: 1, tex: 'twill' }) + Btn(182, 187, 2) + Btn(18, 187, 2) +
      P('M95 42 L105 42 L105 210 L95 210 Z', C.light, { sw: 1, shade: false }) + Ln('M100 44 L100 208', C.seam, 0.7, { op: 0.6 }) +
      Btn(100, 62) + Btn(100, 94) + Btn(100, 126) + Btn(100, 158) + Btn(100, 190) +
      P(pk, C.hex, { sw: 1, tex: 'twill' }) + P(mir(pk), C.hex, { sw: 1, tex: 'twill' }) +
      P(fl, C.light, { sw: 1.1, tex: 'twill' }) + P(mir(fl), C.light, { sw: 1.1, tex: 'twill' }) + Btn(71, 108, 2) + Btn(129, 108, 2) +
      P('M82 18 L58 32 L80 56 L99 42 L99 30 Z', C.light, { tex: 'twill', sw: 1.2 }) + P('M118 18 L142 32 L120 56 L101 42 L101 30 Z', C.light, { tex: 'twill', sw: 1.2 }) +
      Stitch('M70 36 L82 50 M130 36 L118 50');
  };
  var COAT = 'M74 18 Q100 10 126 18 L156 30 L190 58 L196 196 L170 200 L156 110 L160 232 Q100 246 40 232 L44 110 L30 200 L4 196 L10 58 L44 30 Z';
  T.trench = function () {
    var ep = 'M52 34 L74 22 L80 30 L58 44 Z';
    return '<path d="M80 16 L100 124 L120 16 Q100 28 80 16Z" fill="' + C.inner + '"/>' +
      P(COAT, C.hex, { tex: 'twill', grain: 0.2, in: Fold('M62 120 Q56 180 62 230 M138 120 Q144 180 138 230 M100 160 Q98 200 100 238', 0.3) + Fold('M26 70 Q28 130 18 186 M174 70 Q172 130 182 186', 0.25) }) +
      Ln('M100 124 L100 238', C.seam, 1, { op: 0.8 }) + Ln('M112 128 L112 236', C.seam, 0.8, { op: 0.5 }) +
      P(ep, C.light, { sw: 1 }) + P(mir(ep), C.light, { sw: 1 }) + Btn(70, 30, 1.8) + Btn(130, 30, 1.8) +
      notchLapels(126, 10) +
      P('M44 138 L156 138 L156 154 L44 154 Z', C.light, { sw: 1.1, tex: 'twill' }) + P('M92 136 L108 136 L108 156 L92 156 Z', C.dark, { sw: 1.2, stroke: true }) + Ln('M96 140 L104 140 L104 152 L96 152 Z', C.btn, 1.2) +
      Btn(88, 100, 2.8) + Btn(112, 100, 2.8) + Btn(88, 176, 2.8) + Btn(112, 176, 2.8) + Btn(88, 206, 2.8) + Btn(112, 206, 2.8) +
      P('M110 74 L148 70 L150 98 L112 102 Z', C.light, { sw: 1, tex: 'twill' }) +
      Ln('M58 168 L50 192 M142 168 L150 192', C.seam, 1) +
      P('M196 176 L170 180 L171 190 L197 186 Z', C.light, { sw: 1 }) + P('M4 176 L30 180 L29 190 L3 186 Z', C.light, { sw: 1 });
  };
  T.denimjacket = function () {
    var body = 'M76 18 Q100 30 124 18 L154 30 L190 60 L196 176 L170 180 L152 104 L152 192 Q100 198 48 192 L48 104 L30 180 L4 176 L10 60 L46 30 Z';
    var cuff = 'M196 166 L169 170 L170 180 L197 176 Z';
    var pk = 'M54 70 L88 70 L88 100 L71 107 L54 100 Z', fl = 'M54 70 L88 70 L88 84 L71 91 L54 84 Z', st = '#d4a14a';
    return '<path d="M84 18 Q100 12 116 18 L100 40 Z" fill="' + C.inner + '"/>' +
      P(body, C.hex, { tex: 'denim', grain: 0.3, in: Hi('M70 110 Q74 150 70 180 M130 110 Q126 150 130 180', 0.3) + Fold('M26 80 Q30 130 22 170', 0.3) + Ln('M30 100 Q36 106 44 108 M170 100 Q164 106 156 108', C.hi, 2, { op: 0.35, blur: true }) }) +
      P(cuff, C.hex, { sw: 1, tex: 'denim' }) + P(mir(cuff), C.hex, { sw: 1, tex: 'denim' }) +
      Ln('M48 34 Q70 48 100 54 Q130 48 152 34', st, 0.9, { dash: '2.2 1.8', op: 0.9 }) + Ln('M68 62 L68 176 M132 62 L132 176', st, 0.9, { dash: '2.2 1.8', op: 0.8 }) +
      P('M95 46 L105 46 L105 192 L95 192 Z', C.hex, { sw: 1, tex: 'denim', shade: false }) + Ln('M100 48 L100 190', st, 0.9, { dash: '2.2 1.8' }) +
      P(pk, C.hex, { sw: 1, tex: 'denim' }) + P(mir(pk), C.hex, { sw: 1, tex: 'denim' }) + P(fl, C.dark, { sw: 1, tex: 'denim' }) + P(mir(fl), C.dark, { sw: 1, tex: 'denim' }) +
      Btn(71, 86, 2.2) + Btn(129, 86, 2.2) +
      '<g>' + [58, 90, 122, 152].map(function (y) { return '<circle cx="100" cy="' + y + '" r="2.8" fill="#c9893c" stroke="#7a4c1b" stroke-width=".7"/>'; }).join('') + '</g>' +
      P('M48 170 Q100 178 152 170 L152 194 Q100 200 48 194 Z', C.hex, { sw: 1.1, tex: 'denim' }) + Ln('M48 176 Q100 184 152 176', st, 0.9, { dash: '2.2 1.8', op: 0.9 }) +
      P('M82 17 L60 28 L80 54 L99 40 L99 28 Z', C.hex, { tex: 'denim', sw: 1.2 }) + P('M118 17 L140 28 L120 54 L101 40 L101 28 Z', C.hex, { tex: 'denim', sw: 1.2 }) +
      Ln('M64 32 L80 48 M136 32 L120 48', st, 0.9, { dash: '2.2 1.8' });
  };
  T.bomber = function () {
    var body = 'M76 20 Q100 28 124 20 L154 30 L190 62 L196 176 L170 180 L154 104 L154 186 Q100 192 46 186 L46 104 L30 180 L4 176 L10 62 L46 30 Z';
    var cuff = 'M196 164 L169 168 L170 182 L197 178 Z';
    return '<path d="M78 20 Q100 10 122 20 L100 40 Z" fill="' + C.inner + '"/>' +
      P(body, C.hex, { grain: 0.12, in: Hi('M40 70 Q60 100 56 150 M160 70 Q140 100 144 150', 0.3) + Hi('M20 76 Q16 120 22 168', 0.3) + Fold('M66 110 Q70 150 64 182 M134 110 Q130 150 136 182', 0.3) + Fold('M26 70 Q30 120 20 168', 0.3) }) +
      P(cuff, C.rib, { tex: 'rib', sw: 1 }) + P(mir(cuff), C.rib, { tex: 'rib', sw: 1 }) +
      P('M46 176 Q100 184 154 176 L154 198 Q100 206 46 198 Z', C.rib, { tex: 'rib', sw: 1 }) +
      P('M96 34 L104 34 L104 178 L96 178 Z', C.dark, { sw: 1, shade: false }) + Ln('M100 36 L100 176', C.btn, 1.4, { dash: '1.4 1.1' }) + P('M97 36 L103 36 L103 52 L97 52 Z', C.btn, { sw: .8, shade: false }) +
      Ln('M58 128 Q64 150 70 172 M142 128 Q136 150 130 172', C.seam, 1.1) +
      P('M18 76 L34 78 L33 100 L17 98 Z', C.dark, { sw: 1 }) + Ln('M19 82 L33 84', C.btn, 1) +
      P('M70 24 Q100 8 130 24 L132 40 Q100 28 68 40 Z', C.rib, { tex: 'rib', sw: 1.1 });
  };
  T.leather = function () {
    var body = 'M72 18 Q100 10 128 18 L154 30 L188 56 L194 184 L168 188 L154 104 L154 196 Q100 204 46 196 L46 104 L32 188 L6 184 L12 56 L46 30 Z';
    return '<path d="M82 16 L112 110 L122 16 Q100 26 82 16Z" fill="' + C.inner + '"/>' +
      P(body, C.hex, { grain: 0.12, in: Hi('M44 40 Q60 70 56 120 M156 40 Q140 70 144 120', 0.45) + Hi('M20 70 Q16 120 22 170 M180 70 Q184 120 178 170', 0.4) + Fold('M26 100 Q36 112 44 108 M174 100 Q164 112 156 108 M66 120 Q70 160 64 192', 0.35) + Ln('M30 108 L42 106 M170 108 L158 106', C.hi, 1.2, { op: 0.4 }) }) +
      Ln('M88 36 L112 190', C.btn, 1.6, { dash: '1.5 1.2', op: 0.95 }) +
      P('M74 20 L86 15 L94 74 L68 62 L74 40 Z', C.light, { sw: 1.2 }) + P('M126 20 L112 15 L108 54 L136 70 L130 40 Z', C.light, { sw: 1.2 }) +
      '<circle cx="80" cy="56" r="2.2" fill="' + C.btn + '"/><circle cx="122" cy="52" r="2.2" fill="' + C.btn + '"/>' +
      P('M46 162 L154 162 L154 174 L46 174 Z', C.dark, { sw: 1.1 }) + P('M92 160 L108 160 L108 176 L92 176 Z', C.btn, { sw: .8, shade: false }) +
      Ln('M54 134 L80 144 M146 134 L120 144', C.btn, 1.4, { dash: '1.5 1.2' }) +
      P('M52 34 L72 22 L78 28 L58 42 Z', C.dark, { sw: 1 }) + P('M148 34 L128 22 L122 28 L142 42 Z', C.dark, { sw: 1 }) + Ln('M10 160 L36 164 M190 160 L164 164', C.btn, 1.3, { dash: '1.5 1.2' });
  };
  T.wool = function () {
    return '<path d="M82 14 L100 120 L118 14 Q100 28 82 14Z" fill="' + C.inner + '"/>' +
      P(COAT, C.hex, { tex: 'wool', grain: 0.26, in: Fold('M62 120 Q56 180 62 230 M138 120 Q144 180 138 230 M100 140 Q98 200 100 240', 0.3) + Fold('M26 70 Q28 130 18 186 M174 70 Q172 130 182 186', 0.25) + Hi('M80 120 Q78 180 82 230', 0.2) }) +
      Ln('M100 124 L100 238', C.seam, 1, { op: 0.8 }) +
      notchLapels(124, 8) +
      Btn(100, 138, 3) + Btn(100, 170, 3) + Btn(100, 202, 3) +
      P('M54 168 L88 168 L88 182 L54 182 Z', C.dark, { sw: 1 }) + P('M112 168 L146 168 L146 182 L112 182 Z', C.dark, { sw: 1 }) +
      P('M114 94 L142 92 L142 99 L114 101 Z', C.dark, { sw: 1 }) +
      Btn(16, 184, 1.6) + Btn(16, 176, 1.6) + Btn(184, 184, 1.6) + Btn(184, 176, 1.6) +
      P('M76 14 Q100 4 124 14 L124 24 Q100 14 76 24 Z', C.light, { sw: 1, tex: 'wool' });
  };
  T.puffer = function () {
    var body = 'M72 22 Q100 12 128 22 L158 34 L192 64 L198 190 L168 196 L156 108 L156 208 Q100 218 44 208 L44 108 L32 196 L2 190 L8 64 L42 34 Z';
    var q = ''; for (var y = 64; y <= 196; y += 24) q += Ln('M40 ' + y + ' Q100 ' + (y + 8) + ' 160 ' + y, C.fold, 1.6, { op: 0.55 });
    for (var yy = 56; yy <= 176; yy += 30) q += Ln('M4 ' + yy + ' Q20 ' + (yy + 8) + ' 42 ' + (yy + 4), C.fold, 1.6, { op: 0.55 }) + Ln('M196 ' + yy + ' Q180 ' + (yy + 8) + ' 158 ' + (yy + 4), C.fold, 1.6, { op: 0.55 });
    var puffs = ''; for (var yp = 76; yp <= 188; yp += 24) puffs += Ln('M60 ' + yp + ' Q100 ' + (yp + 6) + ' 140 ' + yp, C.hi, 3, { op: 0.28, blur: true });
    return '<path d="M80 18 Q100 8 120 18 L100 40 Z" fill="' + C.inner + '"/>' +
      P(body, C.hex, { grain: 0.1, in: q + puffs }) +
      P('M96 36 L104 36 L104 210 L96 210 Z', C.dark, { sw: 1, shade: false }) + Ln('M100 38 L100 208', C.btn, 1.6, { dash: '1.5 1.2' }) +
      P('M68 26 Q100 4 132 26 L134 44 Q100 30 66 44 Z', C.hex, { sw: 1.2, in: Ln('M76 32 Q100 14 124 32', C.fold, 1.4, { op: 0.5 }) + Hi('M80 24 Q100 10 120 24', 0.35) }) +
      Ln('M60 150 L60 184 M140 150 L140 184', C.btn, 1.3, { dash: '1.5 1.2', op: 0.8 });
  };
  T.lightjacket = function () {
    var body = 'M76 22 Q100 30 124 22 L154 32 L190 62 L196 182 L170 186 L154 104 L154 198 Q100 204 46 198 L46 104 L30 186 L4 182 L10 62 L46 32 Z';
    var cuff = 'M196 170 L169 174 L170 186 L197 182 Z';
    return '<path d="M80 22 Q100 12 120 22 L100 40 Z" fill="' + C.inner + '"/>' +
      P(body, C.hex, { tex: 'twill', grain: 0.14, in: Fold('M64 110 Q60 160 66 196 M136 110 Q140 160 134 196', 0.28) + Fold('M26 72 Q30 130 20 176', 0.25) + Hi('M80 110 Q80 160 84 194', 0.2) }) +
      P(cuff, C.rib, { sw: 1 }) + P(mir(cuff), C.rib, { sw: 1 }) + P('M46 188 Q100 194 154 188 L154 200 Q100 206 46 200 Z', C.rib, { sw: 1 }) +
      P('M96 36 L104 36 L104 194 L96 194 Z', C.dark, { sw: 1, shade: false }) + Ln('M100 38 L100 192', C.btn, 1.4, { dash: '1.4 1.1' }) +
      Ln('M58 130 L66 168 M142 130 L134 168', C.seam, 1.1) + Btn(62, 152, 1.8) + Btn(138, 152, 1.8) +
      P('M74 22 Q100 10 126 22 L128 36 Q100 28 72 36 Z', C.light, { sw: 1.1 }) + Ln('M78 30 Q100 22 122 30', C.seam, 0.8, { dash: '2 1.6' });
  };
  /* ---------- BOTTOMS ---------- */
  var PV = '0 -4 200 246';
  var SLIM = 'M50 10 L150 10 L157 44 L160 236 L108 238 L100 90 L92 238 L40 236 L43 44 Z';
  var CH = 'M50 10 L150 10 L157 44 L156 236 L108 238 L100 90 L92 238 L44 236 L43 44 Z';
  function loops(xs) { return xs.map(function (x) { return '<rect x="' + (x - 2.4) + '" y="8" width="4.8" height="17" rx="1" fill="' + C.dark + '" stroke="' + C.E + '" stroke-width=".7"/>'; }).join(''); }
  function waist(tex) { return P('M50 10 L150 10 L151 25 L49 25 Z', C.light, { sw: 1.1, tex: tex }); }
  T.jeans = function () {
    var st = '#d4a14a';
    return P(SLIM, C.hex, { tex: 'denim', grain: 0.3, in: Ln('M46 54 Q62 62 76 70 M154 54 Q138 62 124 70', C.hi, 2.4, { op: 0.4, blur: true }) + Ln('M70 120 Q72 150 68 170 M130 120 Q128 150 132 170', C.hi, 5, { op: 0.16, blur: true }) + Fold('M62 70 Q58 150 56 232 M138 70 Q142 150 144 232', 0.3) }) +
      waist('denim') + loops([58, 78, 122, 142]) + '<circle cx="100" cy="17" r="3.2" fill="#c9893c" stroke="#7a4c1b" stroke-width=".7"/>' +
      Ln('M100 26 L100 84 Q100 96 90 96', st, 0.9, { dash: '2.2 1.8' }) + Ln('M50 26 Q70 30 78 62 L90 62', st, 0.9, { dash: '2.2 1.8' }) + Ln('M150 26 Q130 30 122 62', st, 0.9, { dash: '2.2 1.8' }) +
      Ln('M42 224 L92 224 M108 226 L158 224', st, 0.9, { dash: '2.2 1.8', op: 0.9 });
  };
  T.chinos = function () {
    return P(CH, C.hex, { tex: 'twill', grain: 0.2, in: Fold('M64 70 Q60 150 58 230 M136 70 Q140 150 142 230', 0.25) + Hi('M76 60 Q74 150 74 230', 0.2) }) +
      waist('twill') + loops([60, 80, 120, 140]) + Btn(100, 17, 2.6) + Ln('M100 26 L100 82', C.seam, 0.8, { op: 0.6 }) +
      Ln('M70 26 Q52 40 44 62', C.seam, 1.1, { op: 0.85 }) + Ln('M130 26 Q148 40 156 62', C.seam, 1.1, { op: 0.85 }) + Stitch('M72 28 Q56 42 48 62 M128 28 Q144 42 152 62') +
      Stitch('M46 226 L92 226 M108 228 L154 226');
  };
  T.trousers = function () {
    var tr = 'M50 10 L150 10 L158 44 L162 238 L106 240 L100 90 L94 240 L38 238 L42 44 Z';
    return P(tr, C.hex, { tex: 'wool', grain: 0.22, in: Fold('M62 70 Q58 150 56 232 M138 70 Q142 150 144 232', 0.25) + Ln('M71 40 L66 236 M129 40 L134 236', C.hi, 1.3, { op: 0.4 }) + Ln('M72 40 L67 236 M128 40 L133 236', C.fold, 1, { op: 0.35 }) }) +
      waist('wool') + loops([64, 136]) + Btn(100, 17, 2.6) + Ln('M100 26 L100 82', C.seam, 0.8, { op: 0.6 }) +
      Ln('M64 26 L52 58 M136 26 L148 58', C.seam, 1.1, { op: 0.8 }) + Ln('M92 12 L92 24 M108 12 L108 24', C.seam, 0.7, { op: 0.5 });
  };
  T.linenpants = function () {
    var lp = 'M46 10 L154 10 L166 46 L176 238 L110 240 L100 96 L90 240 L24 238 L34 46 Z';
    return P(lp, C.hex, { tex: 'weave', grain: 0.3, in: Fold('M60 80 Q50 150 44 232 M140 80 Q150 150 156 232 M34 130 Q50 136 64 132 M136 132 Q150 136 166 130 M30 190 Q50 196 70 192 M130 192 Q150 196 170 190', 0.3) + Hi('M76 70 Q70 150 66 230', 0.18) }) +
      P('M46 10 L154 10 L155 26 L45 26 Z', C.light, { sw: 1.1, tex: 'weave' }) +
      Ln('M92 28 Q86 44 82 62 M108 28 Q116 44 120 60', C.seam, 1.6, { op: 0.9 }) + '<circle cx="82" cy="63" r="2" fill="' + C.seam + '"/><circle cx="120" cy="61" r="2" fill="' + C.seam + '"/>' + Ln('M100 28 L100 90', C.seam, 0.8, { op: 0.5 }) + Ln('M44 30 Q40 44 38 52 M156 30 Q160 44 162 52', C.seam, 1, { op: 0.6 });
  };
  T.shorts = function () {
    var sh = 'M50 10 L150 10 L158 44 L168 140 L108 144 L100 70 L92 144 L32 140 L42 44 Z';
    return P(sh, C.hex, { tex: 'twill', grain: 0.2, in: Fold('M62 70 Q56 110 50 136 M138 70 Q144 110 150 136', 0.25) + Hi('M74 60 Q70 110 66 138', 0.2) }) +
      waist('twill') + loops([60, 80, 120, 140]) + Btn(100, 17, 2.6) + Ln('M100 26 L100 66', C.seam, 0.8, { op: 0.6 }) +
      Ln('M70 26 Q52 40 44 62', C.seam, 1.1, { op: 0.85 }) + Ln('M130 26 Q148 40 156 62', C.seam, 1.1, { op: 0.85 }) + Stitch('M36 132 L92 136 M108 138 L164 132');
  };
  T.cords = function () {
    return P(SLIM, C.hex, { tex: 'cord', grain: 0.1, in: Fold('M62 70 Q58 150 56 232 M138 70 Q142 150 144 232', 0.25) + Hi('M76 60 Q74 150 74 230', 0.2) }) +
      waist('cord') + loops([58, 78, 122, 142]) + Btn(100, 17, 2.6) + Ln('M100 26 L100 82', C.seam, 0.8, { op: 0.6 }) +
      Ln('M50 26 Q70 30 78 62', C.seam, 1.1, { op: 0.8 }) + Ln('M150 26 Q130 30 122 62', C.seam, 1.1, { op: 0.8 }) + Stitch('M42 226 L92 226 M108 228 L158 226');
  };
  T.leatherpants = function () {
    var lp = 'M52 10 L148 10 L152 44 L153 238 L106 240 L100 92 L94 240 L47 238 L48 44 Z';
    return P(lp, C.hex, { in: Hi('M66 40 Q64 150 62 236 M134 40 Q136 150 138 236', 0.55) + Hi('M84 100 Q80 160 78 230', 0.3) + Fold('M60 150 Q70 158 80 154 M140 150 Q130 158 120 154', 0.4) + Ln('M70 120 L70 230 M130 120 L130 230', C.fold, 1, { op: 0.3 }) }) +
      P('M52 10 L148 10 L149 24 L51 24 Z', C.dark, { sw: 1.1 }) + Btn(100, 17, 2.4) + Ln('M100 26 L100 80', C.btn, 1.2, { dash: '1.4 1.1', op: 0.9 }) + Stitch('M72 90 Q86 96 90 120 M128 90 Q114 96 110 120');
  };
  /* ---------- SHOES (side view, toe to the right) ---------- */
  var SV = '0 0 230 124';
  function lace(x1, y1, x2, y2) { return Ln('M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2, C.btn, 1.5, { op: 0.95 }); }
  function sole(color, h) { return P('M16 ' + (92 - h) + ' L218 ' + (92 - h) + ' Q222 96 216 100 Q208 106 196 106 L36 106 Q16 106 14 96 Z', color, { sw: 1.2 }); }
  T.sneakers = function () {
    var up = 'M30 90 L30 44 Q30 28 46 28 L64 30 Q78 40 88 42 L102 32 Q116 26 130 40 Q164 50 192 64 Q216 74 216 90 Z';
    var solec = C.L > 0.8 ? '#e6e3d9' : '#f3f1ea';
    return '<path d="M46 30 Q70 28 90 42 L90 58 L46 58 Z" fill="' + C.inner + '"/>' +
      P('M24 88 L218 88 Q222 98 214 104 L34 104 Q20 102 24 88 Z', solec, { sw: 1.2, in: Ln('M26 96 L216 96', dk(solec, 0.2), 1, { op: 0.6 }) }) +
      P(up, C.hex, { grain: 0.18, in: Hi('M136 52 Q176 58 206 72', 0.35) + Fold('M150 54 Q176 62 184 86', 0.28) }) +
      P('M88 42 Q100 18 120 24 L130 42 L108 50 Z', C.light, { sw: 1.1, in: Ln('M100 34 L122 36', C.seam, 0.8, { op: 0.5 }) }) +
      lace(96, 48, 120, 42) + lace(104, 54, 130, 48) + lace(114, 60, 140, 54) + lace(124, 66, 150, 60) +
      '<g fill="#d9d9d9" stroke="#777" stroke-width=".5"><circle cx="96" cy="48" r="1.6"/><circle cx="122" cy="42" r="1.6"/><circle cx="126" cy="66" r="1.6"/><circle cx="152" cy="60" r="1.6"/></g>' +
      P('M180 62 Q216 74 216 90 L178 90 Q186 76 176 66 Z', C.light, { sw: 1, shade: false }) +
      P('M30 40 L46 30 L46 66 L30 70 Z', C.dark, { sw: 1 }) +
      Ln('M62 62 Q100 68 134 86 M70 56 Q106 62 140 82', C.seam, 2.4, { op: 0.5 }) + Stitch('M54 38 Q56 60 52 86');
  };
  T.loafers = function () {
    var up = 'M26 96 L26 48 Q26 36 40 36 L58 40 Q70 50 88 46 Q104 34 124 42 Q160 50 190 66 Q214 76 215 92 L215 96 Z';
    return '<path d="M42 38 Q60 32 84 40 Q92 46 84 52 L50 50 Z" fill="' + C.inner + '"/>' +
      P('M24 94 L216 94 Q218 100 210 102 L70 102 L70 112 L26 112 Z', dk(C.hex, 0.4), { sw: 1, E: dk(C.hex, 0.6) }) +
      P(up, C.hex, { grain: 0.14, in: Hi('M126 46 Q170 54 204 78', 0.5) + Fold('M62 54 Q86 56 100 50', 0.3) + Ln('M70 52 Q74 76 66 96', C.seam, 1, { op: 0.5 }) }) +
      P('M100 46 L146 56 L150 76 L104 64 Z', C.dark, { sw: 1.1, in: Hi('M106 52 L142 62', 0.4) }) + '<path d="M118 55 L134 60 L135 66 L119 61 Z" fill="' + C.inner + '"/>' +
      Ln('M150 60 Q190 62 210 84', C.seam, 1, { dash: '2 1.6', op: 0.85 }) + Ln('M152 74 Q186 74 212 90', C.seam, 0.9, { dash: '2 1.6', op: 0.7 }) +
      P('M26 92 L26 102 L68 102 L70 92 Z', dk(C.hex, 0.35), { sw: 1, E: dk(C.hex, 0.6) });
  };
  T.dressshoes = function () {
    var up = 'M26 94 L26 46 Q26 34 40 34 L56 36 Q66 46 82 46 L98 38 Q112 34 130 44 Q172 54 202 72 Q216 80 215 94 Z';
    return '<path d="M42 34 Q58 28 74 34 Q82 42 72 48 Q56 44 42 34 Z" fill="' + C.inner + '"/>' +
      P('M24 94 L216 94 Q218 100 210 102 L70 102 L70 112 L26 112 Z', dk(C.hex, 0.45), { sw: 1, E: dk(C.hex, 0.6) }) +
      P(up, C.hex, { in: Hi('M128 48 Q172 56 206 80', 0.6) + Hi('M36 42 Q50 40 62 44', 0.3) + Fold('M76 52 Q96 50 120 56', 0.3) + Ln('M70 46 Q76 72 66 94', C.seam, 1, { op: 0.55 }) }) +
      P('M82 46 L98 38 L138 50 L128 66 L96 58 Z', C.dark, { sw: 1.1, in: Ln('M94 46 L116 52 M92 52 L114 58 M96 58 L120 64', C.btn, 1.4, { op: 0.95 }) }) +
      '<g fill="#999" opacity=".8"><circle cx="90" cy="46" r="1.3"/><circle cx="92" cy="54" r="1.3"/><circle cx="108" cy="46" r="1.3"/><circle cx="110" cy="56" r="1.3"/></g>' +
      Ln('M168 56 Q184 72 178 94', C.seam, 1.1, { op: 0.9 }) + Stitch('M172 58 Q188 72 182 94') +
      Ln('M26 92 L214 92', dk(C.hex, 0.5), 1.2) + P('M26 92 L26 102 L68 102 L70 92 Z', dk(C.hex, 0.4), { sw: 1, E: dk(C.hex, 0.6) });
  };
  T.chelsea = function () {
    var up = 'M28 96 L30 12 Q32 4 44 4 L90 4 L94 40 Q106 50 130 52 Q176 58 208 76 Q218 82 215 96 Z';
    return '<path d="M44 6 L90 6 L90 18 L44 18 Z" fill="' + C.inner + '"/>' +
      P('M24 96 L216 96 Q218 102 210 104 L74 104 L74 114 L26 114 Z', dk(C.hex, 0.45), { sw: 1, E: dk(C.hex, 0.6) }) +
      P(up, C.hex, { grain: 0.2, in: Hi('M132 58 Q174 64 206 80', 0.4) + Fold('M94 46 Q112 56 132 58', 0.3) + Hi('M38 18 L40 84', 0.25) }) +
      P('M36 32 L88 32 L88 66 Q62 72 38 66 Z', C.dark, { sw: 1.1, in: Ln('M44 32 L44 70 M52 32 L52 70 M60 32 L60 70 M68 32 L68 70 M76 32 L76 70 M84 32 L84 70', '#000', 1, { op: 0.3 }) }) +
      P('M26 10 L36 2 L38 22 L28 24 Z', C.dark, { sw: 1 }) +
      P('M26 94 L26 104 L72 104 L74 94 Z', dk(C.hex, 0.4), { sw: 1, E: dk(C.hex, 0.6) }) + Ln('M26 94 L214 94', dk(C.hex, 0.5), 1.2) +
      Stitch('M94 42 Q130 54 168 60 L208 78');
  };
  T.sandals = function () {
    var foot = 'M20 92 Q18 102 32 104 L202 104 Q218 102 216 94 Q210 88 192 88 L32 88 Q22 88 20 92 Z';
    var strap = mix(C.hex, '#000000', 0.05);
    return P('M22 100 L214 100 Q216 108 206 110 L32 110 Q20 110 22 100 Z', dk(C.hex, 0.5), { sw: 1 }) +
      P(foot, mix(C.hex, '#7a5a38', 0.6), { grain: 0.2, sw: 1.2 }) +
      P('M60 90 Q74 56 112 56 Q136 56 142 90 L126 90 Q122 74 112 72 Q94 72 80 90 Z', strap, { sw: 1.2, in: Hi('M70 80 Q84 64 112 62', 0.4) }) +
      P('M148 90 Q158 66 186 72 Q200 76 204 90 L188 90 Q186 82 178 82 Q166 82 164 90 Z', strap, { sw: 1.2 }) +
      P('M28 90 Q26 62 50 56 L62 66 Q46 72 46 90 Z', strap, { sw: 1.2 }) + '<rect x="30" y="66" width="12" height="10" rx="1.5" fill="none" stroke="' + C.btn + '" stroke-width="1.8"/>' +
      Stitch('M34 84 Q32 66 50 62 M66 86 Q84 66 112 66');
  };
  T.hiking = function () {
    var up = 'M26 98 L28 10 Q30 2 44 2 L86 4 L96 32 Q110 42 136 46 Q184 52 208 72 Q218 80 216 98 Z';
    var lugs = ''; for (var x = 24; x < 212; x += 12) lugs += '<rect x="' + x + '" y="102" width="7" height="12" fill="#000" opacity=".3"/>';
    return '<path d="M44 4 L86 6 L86 18 L44 18 Z" fill="' + C.inner + '"/>' +
      P('M14 98 L220 98 L220 110 Q216 118 202 118 L28 118 Q14 116 14 106 Z', '#2b2926', { sw: 1.2, E: '#111', in: lugs }) +
      P('M16 94 L220 94 L220 102 L16 102 Z', mix(C.hex, '#e8e4da', 0.65), { sw: 1 }) +
      P(up, C.hex, { grain: 0.3, in: Hi('M140 56 Q182 62 208 78', 0.3) + Fold('M96 38 Q114 48 136 50', 0.3) }) +
      P('M28 8 Q30 0 44 0 L86 2 L87 12 L29 14 Z', C.light, { sw: 1.1 }) +
      P('M170 72 Q198 76 216 96 L190 96 Q186 82 168 78 Z', dk(C.hex, 0.25), { sw: 1.1 }) +
      P('M26 62 L26 96 L48 96 L46 62 Z', dk(C.hex, 0.2), { sw: 1 }) +
      P('M90 26 L142 44 L134 62 L96 48 Z', C.dark, { sw: 1 }) +
      Ln('M96 32 L134 46 M96 40 L130 52 M98 46 L126 58', C.btn, 1.8, { op: 0.95 }) +
      '<g fill="#c9c9c9" stroke="#555" stroke-width=".6">' + [[90, 28], [94, 38], [98, 48], [140, 46], [134, 54], [130, 60]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.2"/>'; }).join('') + '</g>' +
      Stitch('M172 74 Q198 78 214 96');
  };

  var VBS = { tshirt: VB, vneck: VB, polo: VB, henley: VB, camp: VB, oxford: VB, dress: VB, crew: VB, vknit: VB, turtle: VB, cardigan: VB, blazer: VB, overshirt: VB, trench: VB, denimjacket: VB,
    bomber: VB, leather: VB, wool: VB, puffer: VB, lightjacket: VB, jeans: PV, chinos: PV, trousers: PV, linenpants: PV, shorts: PV, cords: PV, leatherpants: PV,
    sneakers: SV, loafers: SV, dressshoes: SV, chelsea: SV, sandals: SV, hiking: SV };
  var ID = { tshirt: 'tshirt', 'vneck-tee': 'vneck', polo: 'polo', henley: 'henley', 'camp-shirt': 'camp', oxford: 'oxford', 'dress-shirt': 'dress', 'crew-knit': 'crew', 'vneck-knit': 'vknit',
    turtleneck: 'turtle', cardigan: 'cardigan', blazer: 'blazer', overshirt: 'overshirt', trench: 'trench', 'denim-jacket': 'denimjacket', bomber: 'bomber', 'leather-jacket': 'leather',
    'wool-coat': 'wool', puffer: 'puffer', 'light-jacket': 'lightjacket', jeans: 'jeans', chinos: 'chinos', trousers: 'trousers', 'linen-pants': 'linenpants', shorts: 'shorts', cords: 'cords',
    'leather-pants': 'leatherpants', sneakers: 'sneakers', loafers: 'loafers', 'dress-shoes': 'dressshoes', 'chelsea-boots': 'chelsea', sandals: 'sandals', 'hiking-boots': 'hiking' };

  function svg(type, hex) {
    var k = ID[type] || type; if (!T[k]) k = 'tshirt';
    n = 0; setC(hex);
    return wrap(VBS[k], T[k]());
  }
  window.Garments = {
    svg: svg,
    img: function (type, hex) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(type, hex)).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29'); },
    types: Object.keys(ID)
  };
})();
