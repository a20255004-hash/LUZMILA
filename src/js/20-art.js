/* =========================================================
   Arte: íconos, Mila (panda), tu foto,
   paisajes de fondo e ilustraciones de estados vacíos
   ========================================================= */
const I = (d, extra="") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const ICON = {
  home: I('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>'),
  cal: I('<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/><circle cx="8.5" cy="14.5" r=".9" fill="currentColor"/><circle cx="12" cy="14.5" r=".9" fill="currentColor"/>'),
  task: I('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="m8 12.2 2.8 2.8L16.2 9"/>'),
  sprout: I('<path d="M12 21v-8"/><path d="M12 13c0-4 3-6.5 7.5-6.5C19.5 10.5 17 13 12 13Z"/><path d="M12 15.5C12 12 9.5 10 5 10c0 3.5 2.5 5.5 7 5.5Z"/>'),
  wallet: I('<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="3.5" y="7.5" width="17" height="12" rx="3"/><path d="M16 13.5h2"/>'),
  memory: I('<path d="M5 4.5h11a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3Z"/><path d="M5 16.5a3 3 0 0 1 3-3h11"/><path d="M12 7.6c-.9-1-2.6-.5-2.6.9 0 1.2 2.6 2.7 2.6 2.7s2.6-1.5 2.6-2.7c0-1.4-1.7-1.9-2.6-.9Z" fill="currentColor" stroke="none"/>'),
  chart: I('<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7" y="11" width="3" height="6" rx="1"/><rect x="12" y="7" width="3" height="10" rx="1"/><rect x="17" y="13" width="3" height="4" rx="1"/>'),
  gear: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>'),
  mic: I('<rect x="9" y="3" width="6" height="11.5" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>'),
  send: I('<path d="M5 12h13"/><path d="m13 6 6 6-6 6"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  x: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  left: I('<path d="m15 5-7 7 7 7"/>'), right: I('<path d="m9 5 7 7-7 7"/>'), down: I('<path d="m5 9 7 7 7-7"/>'), up: I('<path d="m5 15 7-7 7 7"/>'),
  search: I('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'),
  trash: I('<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/><path d="M10 11v5.5M14 11v5.5"/>'),
  edit: I('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
  undo: I('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
  clock: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  pin: I('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>'),
  bell: I('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
  spark: I('<path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.4l-1.9-5.6L4.5 10.9 10.1 9Z"/><path d="M19 16.5l.6 1.6 1.6.6-1.6.6L19 21l-.6-1.7-1.6-.6 1.6-.6Z"/>'),
  sun: I('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
  moon: I('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>'),
  cloud: I('<path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.34 9.3 4 4 0 0 0 7 19z"/><path d="m9 14 2 2 4-4"/>'),
  sheet: I('<path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8Z"/><path d="M14 2.5V8h5.5M8 12.5h8M8 16.5h8M12 10.5v8"/>'),
  link: I('<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>'),
  flame: I('<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.7 3.2-5.6 3.9-9.3 2 1.2 3.2 3 3.4 5 .9-.6 1.5-1.6 1.6-2.8 2 1.6 4.1 4.2 4.1 7.1 0 3.6-2.6 6.2-6.5 6.2Z"/><path d="M12 21c-1.6 0-2.7-1.1-2.7-2.6 0-1.8 1.6-2.6 2-4.2 1.6.9 3.4 2.4 3.4 4.2 0 1.5-1.1 2.6-2.7 2.6Z"/>'),
  heart: I('<path d="M12 20s-7.5-4.6-7.5-10.3A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.7C19.5 15.4 12 20 12 20Z"/>'),
  star: I('<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9Z"/>'),
  drop: I('<path d="M12 3.5s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z"/>'),
  run: I('<circle cx="14.5" cy="4.5" r="1.8"/><path d="m8.5 21 2.3-5 2.7 2.2V22M6 12.5l2.5-3.5 4 .5 2.5 3 3 .8M10.8 16l1.7-6.5"/>'),
  lotus: I('<path d="M12 19c-4 0-8-2-9-5 3-1 6 0 9 3 3-3 6-4 9-3-1 3-5 5-9 5Z"/><path d="M12 17c-2-2-3-5-3-7.5S10.5 5 12 3.5c1.5 1.5 3 3.5 3 6S14 15 12 17Z"/>'),
  cap: I('<path d="m2.5 9 9.5-4.5L21.5 9 12 13.5Z"/><path d="M6.5 11v4.5c1.5 1.5 3.5 2.2 5.5 2.2s4-.7 5.5-2.2V11M21.5 9v5"/>'),
  coin: I('<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.3c-.5-.9-1.6-1.4-2.8-1.4-1.6 0-2.8.9-2.8 2.1 0 2.9 5.8 1.4 5.8 4.2 0 1.2-1.3 2.1-3 2.1-1.3 0-2.4-.6-2.9-1.5M12 6.5v1.4M12 16.8v1.4"/>'),
  leaf: I('<path d="M5 19c0-8 5-13.5 14.5-14 .3 9.5-5 14.5-13 14.5"/><path d="M5 19c3-4 6-6.5 9.5-8.5"/>'),
  book: I('<path d="M4 5.5A2 2 0 0 1 6 3.5h13.5v14H6a2 2 0 0 0-2 2Z"/><path d="M4 19.5a2 2 0 0 0 2 2h13.5v-4"/>'),
  list: I('<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.5" cy="6.5" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="17.5" r="1" fill="currentColor"/>'),
  board: I('<rect x="3.5" y="4" width="5" height="16" rx="1.6"/><rect x="10" y="4" width="5" height="10" rx="1.6"/><rect x="16.5" y="4" width="4" height="13" rx="1.6"/>'),
  more: I('<circle cx="5.5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="18.5" cy="12" r="1.3" fill="currentColor"/>'),
  target: I('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
  flag: I('<path d="M5 21V4.5M5 4.5h11.5l-2 4 2 4H5"/>'),
  repeat: I('<path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H19l-3-3M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H5l3 3"/>'),
  inbox: I('<path d="M3.5 13.5 6 5.5h12l2.5 8V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z"/><path d="M3.5 13.5h5l1.5 2.5h4l1.5-2.5h5"/>'),
  alert: I('<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.5M12 17.2v.1"/>'),
  check: I('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 'stroke-width="2.6"'),
  play: I('<path d="M7.5 5v14l11-7Z" fill="currentColor"/>'), stop: I('<rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor"/>'),
  volume: I('<path d="M11 5 6 9H3v6h3l5 4Z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18.5 6a8.5 8.5 0 0 1 0 12"/>'),
  user: I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  eye: I('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>'),
  download: I('<path d="M12 4v11M7 10.5l5 5 5-5M4.5 20h15"/>'), upload: I('<path d="M12 20V9M7 13.5l5-5 5 5M4.5 4h15"/>'),
  grip: I('<circle cx="9" cy="6" r="1.2" fill="currentColor"/><circle cx="15" cy="6" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="18" r="1.2" fill="currentColor"/><circle cx="15" cy="18" r="1.2" fill="currentColor"/>'),
  expand: I('<path d="M14.5 4H20v5.5M9.5 20H4v-5.5M20 4l-6.5 6.5M4 20l6.5-6.5"/>'), collapse: I('<path d="M20 4l-6.5 6.5M14 10.5h-.5V5M4 20l6.5-6.5M10 13.5h.5V19"/>'),
  keyboard: I('<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M7.5 14h9"/>'),
  sliders: I('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
  zoomin: I('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2M11 8.5v5M8.5 11h5"/>'), zoomout: I('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2M8.5 11h5"/>'),
  copy: I('<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>'),
  google: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1A10 10 0 0 0 2 12c0 1.6.4 3.1 1.1 4.6z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.4 3-4.1 5.6-4.1z"/></svg>'
};
const HAB_IC = {drop:ICON.drop, book:ICON.book, run:ICON.run, lotus:ICON.lotus, moon:ICON.moon, cap:ICON.cap, coin:ICON.coin, spark:ICON.spark, leaf:ICON.leaf, heart:ICON.heart, star:ICON.star};
Object.assign(ICON, {
  quote: I('<path d="M9.5 7.5C6.5 8.3 5 10.6 5 14v2.5h4.5V12H7.3c.2-1.6 1-2.6 2.2-3.1ZM18.5 7.5c-3 .8-4.5 3.1-4.5 6.5v2.5h4.5V12h-2.2c.2-1.6 1-2.6 2.2-3.1Z"/>'),
  lock: I('<rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/><circle cx="12" cy="15.5" r="1.3" fill="currentColor"/>'),
  brain: I('<path d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-1.5 5.5A3 3 0 0 0 7 18a2.5 2.5 0 0 0 5 .5V6a1.5 1.5 0 0 0-3-1.5ZM15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 1.5 5.5A3 3 0 0 1 17 18a2.5 2.5 0 0 1-5 .5"/>'),
  paw: I('<ellipse cx="12" cy="16" rx="4.6" ry="3.8"/><circle cx="6.2" cy="10.6" r="1.9"/><circle cx="9.6" cy="6.8" r="1.9"/><circle cx="14.4" cy="6.8" r="1.9"/><circle cx="17.8" cy="10.6" r="1.9"/>'),
  whistle: I('<circle cx="9" cy="14.5" r="5.5"/><path d="M13 10.5 20.5 7v4.5L14.5 13M4 5l2 2M9 3v2.5"/>'),
  shield: I('<path d="M12 3.5 19 6v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
  camera: I('<path d="M4 8.5A2 2 0 0 1 6 6.5h2l1.5-2h5l1.5 2h2a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><circle cx="12" cy="13" r="3.6"/>'),
  zap: I('<path d="M13 3 5 13.5h6L10 21l8-10.5h-6Z"/>'),
  moon2: I('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/><path d="M15 4.5h3M16.5 3v3"/>'),
  snooze: I('<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.2 1.6M5 4.5 3 6.5M19 4.5l2 2"/>'),
  help: I('<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.7M12 17h.01"/>'),
  grid: I('<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>')
});

/* ---------------- Mila: una panda blanco y negro, con emociones ----------------
   Expresiones: neutral, alegre, animada, orgullosa, carinosa, pensativa, escuchando,
   sorprendida, preocupada, empatica, enojada (juguetona), dormida.
   Estados (animación del cuerpo): idle, escuchando, pensando, hablando, celebra, enojada. */
const PANDA_INK = "#1E1A26";
function milaFace(emo){
  const K = PANDA_INK;
  const ojo = (cx, cy, {dx=0, dy=0, r=6.4, brillo=true}={}) => `<g class="m-eye"><circle cx="${cx+dx}" cy="${cy+dy}" r="${r}" fill="#fff"/><circle cx="${cx+dx+.6}" cy="${cy+dy+.6}" r="${r*.7}" fill="#241C2E"/>${brillo?`<circle cx="${cx+dx+2.4}" cy="${cy+dy-2}" r="${r*.32}" fill="#fff"/>`:""}</g>`;
  const feliz = (cx, cy) => `<path d="M${cx-6.5} ${cy+2.5} Q${cx} ${cy-6} ${cx+6.5} ${cy+2.5}" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  const cerrado = (cx, cy) => `<path d="M${cx-6.5} ${cy-1} Q${cx} ${cy+5} ${cx+6.5} ${cy-1}" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
  const estrella = (cx, cy) => `<g class="m-eye"><circle cx="${cx}" cy="${cy}" r="7" fill="#fff"/><circle cx="${cx+.5}" cy="${cy+.5}" r="5" fill="#241C2E"/><path d="M${cx+2} ${cy-4.6} l1.1 2.3 2.4.4-1.8 1.7.4 2.4-2.1-1.1-2.1 1.1.4-2.4-1.8-1.7 2.4-.4Z" fill="#FFE08A"/></g>`;
  const L=[79,97], R=[121,97];
  const boca = {
    smile:`<path class="m-mouth" d="M92 123 Q96 128 100 124 Q104 128 108 123" stroke="${K}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    open:`<path class="m-mouth" d="M91 122 Q100 136 109 122 Q100 126 91 122Z" fill="#6B2340"/><path d="M95 128 Q100 132 105 128 Q100 127 95 128Z" fill="#FF8FAE"/>`,
    grande:`<path class="m-mouth" d="M88 121 Q100 141 112 121 Q100 125 88 121Z" fill="#6B2340"/><path d="M93 130 Q100 137 107 130 Q100 128 93 130Z" fill="#FF8FAE"/>`,
    o:`<ellipse class="m-mouth" cx="100" cy="126" rx="4.6" ry="5.4" fill="#6B2340"/>`,
    lado:`<path class="m-mouth" d="M94 125 Q101 122 107 125" stroke="${K}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    onda:`<path class="m-mouth" d="M91 126 Q95 122 100 126 Q105 130 109 126" stroke="${K}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    triste:`<path class="m-mouth" d="M93 128 Q100 122 107 128" stroke="${K}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    puchero:`<path class="m-mouth" d="M94 127 Q100 123 106 127 Q100 125.5 94 127Z" stroke="${K}" stroke-width="2.4" fill="${K}" stroke-linejoin="round"/>`,
    dormida:`<path class="m-mouth" d="M96 124 Q100 127 104 124" stroke="${K}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
  };
  let ojos, mouth, cejas="", extra="";
  switch(emo){
    case "alegre": ojos = feliz(...L)+feliz(...R); mouth = boca.open; break;
    case "animada": ojos = estrella(...L)+estrella(...R); mouth = boca.grande; extra = `<g class="m-chispas"><path d="M44 62l2.5-6 2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5Z" fill="#FFD36B"/><path d="M152 58l2-4.5 2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2Z" fill="#C9B8FF"/></g>`; break;
    case "orgullosa": ojos = feliz(...L)+feliz(...R); mouth = boca.smile; extra = `<path class="m-chispas" d="M150 66l2-4.5 2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2Z" fill="#FFD36B"/>`; break;
    case "carinosa": ojos = feliz(...L)+feliz(...R); mouth = boca.smile; extra = `<path class="m-corazon" d="M150 58c-3.2-5.4-11-3.2-11 2.6 0 5.6 11 11.4 11 11.4s11-5.8 11-11.4c0-5.8-7.8-8-11-2.6Z" fill="#FF7FA8"/>`; break;
    case "pensativa": ojos = ojo(...L,{dx:2.4,dy:-2.6})+ojo(...R,{dx:2.4,dy:-2.6}); mouth = boca.lado; extra = `<g class="m-piensa" fill="#CFC4FF"><circle cx="150" cy="70" r="3"/><circle cx="158" cy="60" r="4.4"/><circle cx="168" cy="47" r="6.4"/></g>`; break;
    case "escuchando": ojos = ojo(...L,{r:6.8})+ojo(...R,{r:6.8}); mouth = boca.o; break;
    case "sorprendida": ojos = ojo(...L,{r:7.2})+ojo(...R,{r:7.2}); mouth = boca.o; cejas = `<path d="M70 72 Q78 66 86 70M114 70 Q122 66 130 72" stroke="${K}" stroke-width="3" fill="none" stroke-linecap="round"/>`; break;
    case "preocupada": ojos = ojo(...L)+ojo(...R); mouth = boca.onda; cejas = `<path d="M70 75 Q78 73 86 70M114 70 Q122 73 130 75" stroke="${K}" stroke-width="3" fill="none" stroke-linecap="round"/>`; break;
    case "empatica": ojos = ojo(...L,{r:7,dy:1})+ojo(...R,{r:7,dy:1}); mouth = boca.triste; cejas = `<path d="M70 74 Q78 70 86 68M114 68 Q122 70 130 74" stroke="${K}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`; extra = `<path class="m-lagrima" d="M128 110 q3 5 0 8 q-3-3 0-8Z" fill="#9EC9FF"/>`; break;
    case "enojada": ojos = ojo(...L,{dy:1.6,r:6})+ojo(...R,{dy:1.6,r:6}); mouth = boca.puchero;
      cejas = `<path d="M68 72 L87 80M132 72 L113 80" stroke="${K}" stroke-width="4.4" stroke-linecap="round"/>`;
      extra = `<g class="m-vapor" fill="#fff" stroke="#E4DCF5" stroke-width="1.5"><circle cx="34" cy="42" r="6"/><circle cx="26" cy="34" r="4.4"/><circle cx="166" cy="42" r="6"/><circle cx="174" cy="34" r="4.4"/></g>`; break;
    case "dormida": ojos = cerrado(...L)+cerrado(...R); mouth = boca.dormida; break;
    default: ojos = ojo(...L)+ojo(...R); mouth = boca.smile;
  }
  return `${cejas}<g class="m-eyes">${ojos}</g>${mouth}${extra}`;
}
let SVGN=0;
function milaSVG({emo="neutral", estado="idle", size=null, cls=""}={}){
  const u=(++SVGN).toString(36); const K=PANDA_INK;
  const rubor = emo==="enojada" ? .75 : /alegre|animada|carinosa|orgullosa/.test(emo) ? .6 : .38;
  return `<svg class="mila-svg st-${estado} emo-${emo} ${cls}" viewBox="0 0 200 200" ${size?`width="${size}" height="${size}"`:""} aria-label="Mila, tu panda">
  <defs>
    <radialGradient id="pdHead${u}" cx="42%" cy="34%" r="72%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".72" stop-color="#F6F3FB"/><stop offset="1" stop-color="#E4DEEE"/></radialGradient>
    <radialGradient id="pdBody${u}" cx="45%" cy="30%" r="75%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E6E0F0"/></radialGradient>
    <linearGradient id="pdScarf${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7C5CFF"/><stop offset="1" stop-color="#B49CFF"/></linearGradient>
    <radialGradient id="pdShadow${u}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#2B1650" stop-opacity=".28"/><stop offset="1" stop-color="#2B1650" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse class="m-sombra" cx="100" cy="190" rx="50" ry="7" fill="url(#pdShadow${u})"/>
  <g class="m-float">
    <g class="m-cuerpo">
      <ellipse cx="72" cy="182" rx="17" ry="11" fill="${K}"/><ellipse cx="128" cy="182" rx="17" ry="11" fill="${K}"/>
      <ellipse cx="72" cy="184" rx="8" ry="5" fill="#3A3346"/><ellipse cx="128" cy="184" rx="8" ry="5" fill="#3A3346"/>
      <ellipse cx="100" cy="160" rx="46" ry="34" fill="url(#pdBody${u})"/>
      <ellipse cx="100" cy="166" rx="24" ry="17" fill="#fff" opacity=".7"/>
      <g class="m-brazo m-bl"><ellipse cx="58" cy="156" rx="13" ry="20" fill="${K}" transform="rotate(24 58 156)"/></g>
      <g class="m-brazo m-br"><ellipse cx="142" cy="156" rx="13" ry="20" fill="${K}" transform="rotate(-24 142 156)"/></g>
    </g>
    <g class="m-cabeza">
      <g class="m-orejas">
        <g class="m-oreja m-ol"><circle cx="54" cy="50" r="19" fill="${K}"/><circle cx="55" cy="52" r="9" fill="#3A3346"/></g>
        <g class="m-oreja m-or"><circle cx="146" cy="50" r="19" fill="${K}"/><circle cx="145" cy="52" r="9" fill="#3A3346"/></g>
      </g>
      <g class="m-lazo" transform="rotate(18 150 34)"><ellipse cx="141" cy="34" rx="9" ry="6" fill="#9B7DFF"/><ellipse cx="159" cy="34" rx="9" ry="6" fill="#9B7DFF"/><ellipse cx="141" cy="34" rx="4" ry="2.6" fill="#7C5CFF"/><ellipse cx="159" cy="34" rx="4" ry="2.6" fill="#7C5CFF"/><circle cx="150" cy="34" r="4.4" fill="#6C47FF"/></g>
      <ellipse cx="100" cy="98" rx="58" ry="52" fill="url(#pdHead${u})"/>
      <ellipse cx="80" cy="70" rx="17" ry="9" fill="#fff" opacity=".8" transform="rotate(-20 80 70)"/>
      <g class="m-parches" fill="${K}">
        <ellipse cx="79" cy="98" rx="14" ry="18" transform="rotate(30 79 98)"/>
        <ellipse cx="121" cy="98" rx="14" ry="18" transform="rotate(-30 121 98)"/>
      </g>
      <ellipse class="m-blush" cx="66" cy="120" rx="9" ry="5.5" fill="#FF8FB1" opacity="${rubor}"/><ellipse class="m-blush" cx="134" cy="120" rx="9" ry="5.5" fill="#FF8FB1" opacity="${rubor}"/>
      <ellipse cx="100" cy="122" rx="17" ry="12" fill="#fff" opacity=".85"/>
      <path d="M93.5 112.5 Q100 109.5 106.5 112.5 Q104.5 118.5 100 119.5 Q95.5 118.5 93.5 112.5Z" fill="${K}"/><ellipse cx="98" cy="112.6" rx="2.2" ry="1.1" fill="#fff" opacity=".55"/>
      <g class="m-face">${milaFace(emo)}</g>
    </g>
    <path d="M60 140 Q100 156 140 140 Q138 150 100 158 Q62 150 60 140Z" fill="url(#pdScarf${u})"/>
    <path class="m-punta" d="M122 148 l10 20 l-14 -4Z" fill="#7C5CFF"/>
    <g class="m-zz" opacity="0"><text x="146" y="40" font-size="20" fill="#B9A6FF" font-weight="800">z</text><text x="160" y="24" font-size="14" fill="#B9A6FF" font-weight="800">z</text></g>
  </g>
</svg>`;
}
const Mila = {
  emo:"alegre", estado:"idle", talkT:null,
  els(){ return $$(".mila-host"); },
  pinta(){ for(const h of this.els()){ const big = h.dataset.size; h.innerHTML = milaSVG({emo:this.emo, estado:this.estado, size:big||null}); } },
  set(estado, emo){ if(emo) this.emo=emo; if(estado) this.estado=estado; for(const s of $$(".mila-svg")){ if(s.closest(".mila-fija")) continue; s.setAttribute("class", `mila-svg st-${this.estado} emo-${this.emo}`); const f=s.querySelector(".m-face"); if(f) f.innerHTML = milaFace(this.emo); } },
  momento(emo, ms=2600, estado){ const prev=[this.estado, this.emo]; this.set(estado||this.estado, emo); clearTimeout(this._mt); this._mt=setTimeout(()=>this.set(prev[0]==="celebra"?"idle":prev[0], prev[1]==="enojada"&&emo!=="enojada"?"alegre":prev[1]), ms); },
  talk(on){ for(const s of $$(".mila-svg")) s.classList.toggle("talking", !!on); },
  boca(nivel){ for(const m of $$(".mila-svg .m-mouth")){ m.style.transform = `scaleY(${1+nivel*1.8})`; } },
  celebrar(){ this.set("celebra","animada"); confetti(); setTimeout(()=>this.set("idle","alegre"), 2200); }
};
function confetti(x, y){
  const host = document.body; const n = 28; const cx = x ?? innerWidth/2, cy = y ?? innerHeight/3;
  const colors = ["#7C5CFF","#FFC24B","#FF7FA8","#2CC9A0","#B9A6FF","#1E1A26"];
  for(let i=0;i<n;i++){ const s=document.createElement("i"); s.className="confeti"; s.style.left=cx+"px"; s.style.top=cy+"px"; s.style.background=colors[i%colors.length];
    const a = Math.random()*Math.PI*2, d = 80+Math.random()*140; s.style.setProperty("--dx", Math.cos(a)*d+"px"); s.style.setProperty("--dy", (Math.sin(a)*d-60)+"px"); s.style.setProperty("--r", (Math.random()*720-360)+"deg");
    host.appendChild(s); setTimeout(()=>s.remove(), 1300); }
}

/* ---------------- Tú: tu foto real (privada) o tus iniciales ----------------
   La foto vive solo en tu almacenamiento privado (este navegador + tu copia oculta de Drive);
   nunca se publica en el sitio. */
function fotoYo(){ return (S.media||[]).find(m=>m.id==="foto")?.src || ""; }
function yoAvatar({size=null, cls="", ring=false}={}){
  const src = fotoYo(); const ini = esc((S.profile.nombre||"L").trim().charAt(0).toUpperCase());
  const st = size ? `style="width:${size}px;height:${size}px"` : "";
  return src ? `<span class="yo-av ${ring?"ring":""} ${cls}" ${st}><img src="${src}" alt="${esc(S.profile.nombre)}" draggable="false"></span>`
             : `<span class="yo-av ini ${ring?"ring":""} ${cls}" ${st} title="Sube tu foto en Ajustes"><b>${ini}</b></span>`;
}
const luzSVG = (o={}) => yoAvatar({size:o.size||null, cls:o.cls||""});

function shade(hex, pct){ const n=parseInt(String(hex).replace("#",""),16); if(isNaN(n)) return hex; let r=n>>16, g=(n>>8)&255, b=n&255; const f=pct/100; const t=f<0?0:255, p=Math.abs(f); r=Math.round((t-r)*p+r); g=Math.round((t-g)*p+g); b=Math.round((t-b)*p+b); return "#"+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1); }

/* ---------------- Paisaje de fondo (cambia con la hora) ---------------- */
const CIELOS = {
  madrugada:["#120A26","#2A1856","#4B2F86"], amanecer:["#4C3290","#C978A8","#FFC08A"], "mañana":["#9F8BFF","#D9CFFF","#FFF1DE"],
  tarde:["#8C78F5","#CDC2FF","#FFE4C6"], atardecer:["#3E2477","#B7558F","#FFA765"], noche:["#160C30","#31206A","#5A3D9C"]
};
function escenaSVG(h=new Date().getHours()){
  const mo = momentoDia(h), c = CIELOS[mo]; const u=(++SVGN).toString(36); const noche = mo==="noche"||mo==="madrugada";
  const sol = noche ? `<circle cx="960" cy="90" r="34" fill="#FFF4D6" opacity=".95"/><circle cx="975" cy="80" r="30" fill="${c[0]}" opacity=".9"/>`
                    : `<circle cx="${mo==="amanecer"?240:mo==="atardecer"?980:820}" cy="${mo==="amanecer"||mo==="atardecer"?250:110}" r="${mo==="mañana"?46:56}" fill="#FFE7A8" opacity=".9"/><circle cx="${mo==="amanecer"?240:mo==="atardecer"?980:820}" cy="${mo==="amanecer"||mo==="atardecer"?250:110}" r="90" fill="#FFE7A8" opacity=".18"/>`;
  let estrellas=""; if(noche){ let s=7; const r=()=>{ s=(s*9301+49297)%233280; return s/233280; }; for(let i=0;i<70;i++) estrellas += `<circle cx="${(r()*1200).toFixed(0)}" cy="${(r()*230).toFixed(0)}" r="${(r()*1.6+.4).toFixed(1)}" fill="#fff" opacity="${(r()*.6+.3).toFixed(2)}" class="${i%5===0?"tw":""}"/>`; }
  const m1 = noche?"#3B2775":"#8D78E6", m2 = noche?"#2A1B58":"#6E55CF", m3 = noche?"#1D1240":"#4E37A6";
  return `<svg class="escena" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs><linearGradient id="cielo${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".6" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient>
  <linearGradient id="niebla${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="${noche?.06:.35}"/></linearGradient></defs>
  <rect width="1200" height="400" fill="url(#cielo${u})"/>${estrellas}${sol}
  <path d="M0 260 L120 200 L210 236 L330 150 L410 196 L470 170 L560 230 L660 160 L760 214 L860 140 L960 200 L1060 170 L1200 230 V400 H0Z" fill="${m1}" opacity=".55"/>
  <path d="M330 150 L352 170 L340 168 L330 178 L318 166Z M860 140 L884 162 L870 160 L860 170 L848 160Z" fill="#fff" opacity="${noche?.25:.55}"/>
  <rect y="200" width="1200" height="200" fill="url(#niebla${u})"/>
  <path d="M0 300 C120 260 220 280 330 262 C460 240 560 290 700 270 C820 252 920 286 1040 262 C1110 250 1160 262 1200 270 V400 H0Z" fill="${m2}" opacity=".8"/>
  <path d="M0 350 C160 320 300 340 460 326 C620 312 760 350 920 334 C1040 322 1130 336 1200 330 V400 H0Z" fill="${m3}"/>
  <g fill="${m3}"><path d="M150 330 v-24 a5 5 0 0 1 10 0 v24 M140 318 v-8 a4 4 0 0 1 8 0 v8 M162 314 v-6 a4 4 0 0 1 8 0 v10"/><path d="M1010 334 v-20 a4 4 0 0 1 8 0 v20 M1022 322 v-6 a3 3 0 0 1 6 0 v8"/></g>
  ${noche||mo==="atardecer" ? [...Array(14)].map((_,i)=>`<circle class="ff ff${i%4}" cx="${80+i*82}" cy="${250+((i*37)%90)}" r="${1.6+(i%3)*.8}" fill="#F3EDFF"/>`).join("") : ""}
</svg>`;
}

/* ---------------- Ilustraciones para estados vacíos ---------------- */
function ilus(kind){
  const mini = `<g transform="translate(118 18) scale(.36)">${milaSVG({emo:"alegre"}).replace(/^<svg[^>]*>|<\/svg>$/g,"")}</g>`;
  const piezas = {
    agenda: `<rect x="34" y="44" width="92" height="78" rx="14" fill="#fff" stroke="#CFC4FF" stroke-width="3"/><rect x="34" y="44" width="92" height="22" rx="14" fill="#8E6CFF"/><rect x="34" y="58" width="92" height="8" fill="#8E6CFF"/>${[0,1,2,3].map(i=>`<rect x="${46+i*20}" y="76" width="12" height="10" rx="3" fill="${i===2?"#FFC24B":"#EDE7FF"}"/>`).join("")}${[0,1,2,3].map(i=>`<rect x="${46+i*20}" y="94" width="12" height="10" rx="3" fill="#EDE7FF"/>`).join("")}`,
    tareas: `<rect x="40" y="36" width="80" height="96" rx="12" fill="#fff" stroke="#CFC4FF" stroke-width="3"/>${[0,1,2].map(i=>`<rect x="52" y="${54+i*24}" width="12" height="12" rx="4" fill="${i<2?"#2CC9A0":"#EDE7FF"}"/>${i<2?`<path d="M54.5 ${60+i*24} l3 3 5-6" stroke="#fff" stroke-width="2.4" fill="none"/>`:""}<rect x="70" y="${57+i*24}" width="${38-i*6}" height="6" rx="3" fill="#E2DAFF"/>`).join("")}`,
    dinero: `<ellipse cx="80" cy="96" rx="44" ry="34" fill="#FFB7CF"/><circle cx="66" cy="88" r="3.5" fill="#5B2A44"/><ellipse cx="114" cy="98" rx="10" ry="8" fill="#FF9FBE"/><rect x="66" y="60" width="26" height="6" rx="3" fill="#C76A8D"/><circle cx="79" cy="40" r="11" fill="#FFC24B" stroke="#E8A52E" stroke-width="2.4"/><rect x="58" y="124" width="10" height="12" rx="3" fill="#FF9FBE"/><rect x="94" y="124" width="10" height="12" rx="3" fill="#FF9FBE"/>`,
    recuerdos: `<g transform="rotate(-8 70 86)"><rect x="34" y="44" width="68" height="80" rx="6" fill="#fff" stroke="#E4DCFF" stroke-width="3"/><rect x="42" y="52" width="52" height="46" rx="4" fill="#C9B8FF"/><circle cx="58" cy="66" r="7" fill="#FFE08A"/><path d="M42 98 L62 78 L76 90 L86 82 L94 98Z" fill="#8E6CFF"/></g><path d="M112 70c-3-5-11-3-11 3 0 6 11 12 11 12s11-6 11-12c0-6-8-8-11-3Z" fill="#FF7FA8"/>`,
    habitos: `<path d="M56 108 L104 108 L98 134 L62 134Z" fill="#E8915B"/><rect x="52" y="100" width="56" height="10" rx="4" fill="#F2A877"/><path d="M80 100 V72" stroke="#2CA582" stroke-width="4"/><path d="M80 80 C80 64 92 56 108 56 C108 70 96 80 80 80Z" fill="#2CC9A0"/><path d="M80 88 C80 76 70 70 56 70 C56 82 66 88 80 88Z" fill="#5BDDB8"/>`,
    progreso: `<rect x="36" y="100" width="16" height="30" rx="4" fill="#CFC4FF"/><rect x="60" y="80" width="16" height="50" rx="4" fill="#A88BFF"/><rect x="84" y="62" width="16" height="68" rx="4" fill="#7C5CFF"/><path d="M36 84 L60 70 L84 52 L112 40" stroke="#FFC24B" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="112" cy="40" r="5" fill="#FFC24B"/>`,
    chat: `<rect x="30" y="56" width="74" height="44" rx="16" fill="#fff" stroke="#CFC4FF" stroke-width="3"/><path d="M48 100 L44 114 L60 100" fill="#fff" stroke="#CFC4FF" stroke-width="3" stroke-linejoin="round"/><circle cx="52" cy="78" r="4" fill="#A88BFF"/><circle cx="67" cy="78" r="4" fill="#A88BFF"/><circle cx="82" cy="78" r="4" fill="#A88BFF"/>`,
    memoria: `<circle cx="72" cy="86" r="40" fill="#EDE7FF"/><path d="M58 70c0-10 8-16 16-16s16 6 16 16c0 6-4 9-4 14H62c0-5-4-8-4-14Z" fill="#FFE08A" stroke="#E8A52E" stroke-width="2.4"/><rect x="63" y="88" width="20" height="8" rx="3" fill="#A88BFF"/><rect x="65" y="98" width="16" height="6" rx="3" fill="#A88BFF"/>`
  };
  return `<svg class="ilus" viewBox="0 0 170 150" aria-hidden="true">${piezas[kind]||piezas.chat}${mini}</svg>`;
}
function vacio(kind, titulo, texto, accion=""){
  return `<div class="vacio">${ilus(kind)}<h4>${esc(titulo)}</h4><p>${esc(texto)}</p>${accion}</div>`;
}

