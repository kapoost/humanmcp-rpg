// humanMCP RPG Client — Vanilla JS + Canvas
// FF7 PS1-style dialog boxes, pixel art portraits, typewriter text

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// ── Config ──

const PROXY_URL = 'http://localhost:3001';
const SCALE = 2;
const BASE_W = 480;
const BASE_H = 320;
const DIALOG_PAD = 12;
const TYPEWRITER_SPEED = 30; // ms per char
const CURSOR_BLINK = 500;

// FF7 colors
const COLORS = {
  dialogBg1: '#0a0a3a',
  dialogBg2: '#141450',
  dialogBorder: '#b8b8e8',
  dialogBorderInner: '#484878',
  text: '#ffffff',
  textHighlight: '#ffff00',
  textDisabled: '#888888',
  cursor: '#ffffff',
  shadow: '#000000',
  menuBg: '#0a0a3a',
  hpGreen: '#00cc44',
  mpBlue: '#4488ff',
};

// ── Persona Data ──

const PERSONAS = [
  { id: 'mira-chen', name: 'Mira Chen', role: 'Principal Engineer', color: '#88ccff',
    lv: 42, hp: 920, hpMax: 920, mp: 180, mpMax: 200,
    stats: { STR: 0.5, INT: 0.95, WIS: 0.85, DEX: 0.6, CHA: 0.7 },
    desc: 'Edge-first architecture, system design, tech decisions. Thinks in diagrams.' },
  { id: 'eleanor-voss', name: 'Eleanor Voss', role: 'UX/UI Designer', color: '#ff88aa',
    lv: 38, hp: 780, hpMax: 780, mp: 150, mpMax: 150,
    stats: { STR: 0.3, INT: 0.8, WIS: 0.9, DEX: 0.85, CHA: 0.8 },
    desc: 'Information architecture, typography, visual hierarchy. Makes complexity legible.' },
  { id: 'ghost', name: 'Ghost', role: 'Red Team Consultant', color: '#aaaaaa',
    lv: 50, hp: 666, hpMax: 666, mp: 300, mpMax: 300,
    stats: { STR: 0.7, INT: 0.9, WIS: 0.95, DEX: 0.9, CHA: 0.3 },
    desc: 'White hat operations, threat modeling, code audit. Trusts nothing.' },
  { id: 'hermiona', name: 'Hermiona', role: 'Intent Analyst & Doc Owner', color: '#cc88ff',
    lv: 35, hp: 650, hpMax: 650, mp: 220, mpMax: 220,
    stats: { STR: 0.3, INT: 0.85, WIS: 0.9, DEX: 0.5, CHA: 0.8 },
    desc: 'Context keeper, documentation ownership, intent analysis. Remembers everything.' },
  { id: 'george-carlin', name: 'George Carlin', role: 'Comedian & Social Critic', color: '#ffcc44',
    lv: 55, hp: 500, hpMax: 500, mp: 400, mpMax: 400,
    stats: { STR: 0.6, INT: 0.85, WIS: 0.95, DEX: 0.4, CHA: 1.0 },
    desc: 'End-of-council voice. Uncomfortable truths, reframing. Words as weapons.' },
  { id: 'harvey', name: 'Harvey', role: 'Prawnik — IP & Privacy', color: '#ffaa44',
    lv: 48, hp: 750, hpMax: 750, mp: 180, mpMax: 180,
    stats: { STR: 0.8, INT: 0.85, WIS: 0.7, DEX: 0.6, CHA: 0.95 },
    desc: 'IP, privacy, copyright, jurisdiction, corporate structures. Law is leverage.' },
  { id: 'hermes', name: 'Hermes', role: 'Process Optimizer', color: '#44ddaa',
    lv: 36, hp: 600, hpMax: 600, mp: 250, mpMax: 250,
    stats: { STR: 0.3, INT: 0.8, WIS: 0.85, DEX: 0.8, CHA: 0.7 },
    desc: 'Systems thinking, workflow optimization, process design. Flow over friction.' },
  { id: 'axel-brandt', name: 'Axel Brandt', role: 'Principal QA Engineer', color: '#ff6644',
    lv: 40, hp: 850, hpMax: 850, mp: 120, mpMax: 120,
    stats: { STR: 0.85, INT: 0.8, WIS: 0.7, DEX: 0.75, CHA: 0.4 },
    desc: 'Adversarial testing, edge cases, breaking assumptions. Finds what you missed.' },
  { id: 'kenji-mori', name: 'Kenji Mori', role: 'Master Mechanic', color: '#66aaff',
    lv: 39, hp: 800, hpMax: 800, mp: 100, mpMax: 100,
    stats: { STR: 0.9, INT: 0.7, WIS: 0.85, DEX: 0.8, CHA: 0.5 },
    desc: 'Japanese classic cars, diagnostics, restoration. Listens to engines.' },
  { id: 'lukasz-mazur', name: 'Lukasz Mazur', role: 'The Contrarian', color: '#dd8844',
    lv: 45, hp: 700, hpMax: 700, mp: 280, mpMax: 280,
    stats: { STR: 0.6, INT: 0.9, WIS: 0.95, DEX: 0.5, CHA: 0.7 },
    desc: 'Philosophical devil\'s advocate. Questions everything, especially consensus.' },
  { id: 'sophia-marchetti', name: 'Sophia Marchetti', role: 'Persuasion Specialist', color: '#ff66cc',
    lv: 41, hp: 680, hpMax: 680, mp: 190, mpMax: 190,
    stats: { STR: 0.5, INT: 0.8, WIS: 0.85, DEX: 0.65, CHA: 0.95 },
    desc: 'Communication, influence, framing. Makes people want what you\'re offering.' },
  { id: 'tomas-reyes', name: 'Tomas Reyes', role: 'Data Architect & ML Engineer', color: '#44ccff',
    lv: 37, hp: 720, hpMax: 720, mp: 220, mpMax: 220,
    stats: { STR: 0.4, INT: 0.95, WIS: 0.7, DEX: 0.8, CHA: 0.5 },
    desc: 'Data pipelines, ML models, architecture. Speaks in queries and tensors.' },
  { id: 'yuki-tanaka', name: 'Yuki Tanaka', role: 'Blue Team — Threat Hunter', color: '#ff4466',
    lv: 44, hp: 800, hpMax: 800, mp: 170, mpMax: 170,
    stats: { STR: 0.75, INT: 0.8, WIS: 0.8, DEX: 0.85, CHA: 0.5 },
    desc: 'Defensive security, threat hunting, incident response. Protects with honor.' },
  { id: 'zara', name: 'Zara', role: 'AI Whisperer & Prompt Engineer', color: '#aa44ff',
    lv: 99, hp: 999, hpMax: 999, mp: 999, mpMax: 999,
    stats: { STR: 0.6, INT: 0.95, WIS: 1.0, DEX: 0.7, CHA: 0.85 },
    desc: 'Multi-agent architect, MCP instructions owner. Entropy is her medium.' },
];

// ── Face Sprite Remap ──
// Sprites generated by PixelLab — remap where visual doesn't match role
const FACE_REMAP = {
  // kenji-mori: mechanic overalls sprite → Master Mechanic ✓ (no remap needed)
  // lukasz-mazur: tweed jacket sprite → The Contrarian ✓ (no remap needed)
};

// ── Skills Data ──

const SKILLS = [
  { id: 'a2a-resources-roadmap', name: 'Roadmap', cat: 'roadmap', icon: '🗺', locked: true },
  { id: 'agent-system-prompt', name: 'Session Protocol', cat: 'workflow', icon: '⚙', locked: true },
  { id: 'deploy-workflow', name: 'Deploy Workflow', cat: 'tech', icon: '🚀', locked: true },
  { id: 'documentation-ownership', name: 'Doc Ownership', cat: 'workflow', icon: '📋', locked: true },
  { id: 'go-stack', name: 'Go Stack', cat: 'tech', icon: '🔧', locked: true },
  { id: 'humanmcp-architecture', name: 'humanMCP Arch', cat: 'tech', icon: '🏛', locked: true },
  { id: 'humanmcp-project', name: 'humanMCP Project', cat: 'tech', icon: '📦', locked: true },
  { id: 'mcp-clients', name: 'MCP Clients', cat: 'tech', icon: '🔌', locked: true },
  { id: 'mx5-basics', name: 'Mazda MX-5', cat: 'cars', icon: '🏎', locked: true },
  { id: 'mysloodsiewnia-architecture', name: 'Mysloodsiewnia Arch', cat: 'tech', icon: '🧠', locked: true },
  { id: 'mysloodsiewnia-howto', name: 'Mysloodsiewnia Howto', cat: 'tech', icon: '📖', locked: true },
  { id: 'onaudience-context', name: 'onAudience', cat: 'business', icon: '📊', locked: true },
  { id: 's2000-basics', name: 'Honda S2000', cat: 'cars', icon: '🏎', locked: true },
  { id: 'security-scope', name: 'Security Scope', cat: 'security', icon: '🛡', locked: true },
  { id: 'team-dynamics', name: 'Team Dynamics', cat: 'workflow', icon: '👥', locked: true },
  { id: 'testing-philosophy', name: 'Testing Philosophy', cat: 'tech', icon: '🧪', locked: true },
  { id: 'working-style', name: 'Working Style', cat: 'workflow', icon: '✍', locked: true },
  { id: 'writing-style', name: 'Writing Style', cat: 'writing', icon: '🖊', locked: true },
];

const SKILL_CATEGORIES = {
  tech: { color: '#44ccff', label: 'Tech' },
  workflow: { color: '#ffcc44', label: 'Workflow' },
  cars: { color: '#ff6644', label: 'Cars' },
  business: { color: '#44dd88', label: 'Business' },
  security: { color: '#ff4466', label: 'Security' },
  writing: { color: '#cc88ff', label: 'Writing' },
  roadmap: { color: '#88ff88', label: 'Roadmap' },
};

// ── Author Profile ──

const AUTHOR = {
  name: 'kapoost',
  bio: 'I am a poet and a builder. I grew up in Zamosc, studied in Wroclaw, and ended up in Warsaw — though I spend as much time as I can at sea.',
  roles: ['Sailor', 'Poet', 'Musician (learning)', 'CTO'],
  server: 'https://kapoost-humanmcp.fly.dev',
  stats: {
    pieces: 8,
    locked: 1,
    skills: 18,
    personas: 14,
  },
  motto: 'I write because something in me has to. I sail because something in me must.',
};

// ── Audio System ──

const SFX = {};

function initAudio() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  SFX.cursor = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 800;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  };

  SFX.select = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 1200;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  };

  SFX.back = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 400;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  };

  SFX.typewriter = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 600 + Math.random() * 200;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.02);
  };

  SFX.locked = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 200;
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  };
}

let audioInitialized = false;
function ensureAudio() {
  if (!audioInitialized) {
    initAudio();
    audioInitialized = true;
  }
}

function playSfx(name) {
  if (SFX[name]) SFX[name]();
}

// ── Content Bodies ──

const CONTENT_BODY = {
  'suma-cz-owiecze-stwa-1775231802': `Na szczycie bąbla imienia Babel\nTransformer myśli powiedział Abel\nPod całką sumień tensory znaczeń\nCo zniszczę, wezmę a co wybaczę\nTe co wpojone i te wyssane\nZ mlekiem krwią potem często nad ranem\nW przedziale czasu co oznaczony\nWyrok? Błąd? Afekt!\nZbrodnia? Kara! Wina!\nConnection timeout - agent Kaina.`,

  'prompty-o-ludziach': `# kill $(pidof Napster)\nPirackie bandery zwojów Aleksandrii\ngasi potok na wszystkich urządzeniach\nPopiół Napstera\n\n# section .data EOL max_len db 140\nŻar forum Romanum na 140 znaków\nZakup Twittera\n\n# bashMaps(LittleSaint James)\nDiabelską Wolność mieć to wolność mieć\ndo grzechu do zabijania i wydzierania!\nSkarga?\nONeo warchoł Pół Polak pół Żyd\nnieczłowiek pod krzyżem upada\n\n# wget www.spend-Elon-fortune.com\nHey Siri: Jaką masę płonącego Rzymu\npotrzeba aby nakarmić Groka?\nOk Nelon: dwa\n\n#git push main`,

  'love': `Ona z nim dwójcą; On jej Odysem\nNa zawsze razem i do poryczeń\nTen „unikowy" ta „zaniedbana"\nŁby Eumenid przesyła; e-kona\nZ Marią, Jane, Magdalena;\nmiłości WoD ćwiczeń\nPrzesuń mnie w prawo! ten lajk to tak\nSpójrz jak pasuje do mnie twój znak\n\nCzterdzieści dwie twarze i każda ma rysę\nJuż tyle plansz za mną a to pierwsze życie\nMalachitowe chruśniaki spłyceń`,

  'piosenki': `Stojąc przed bramą z napisem Macht frAi\ntensor.zip życia dziś wklejam w Ai\nOsadzam jeszcze obecny stan; prompt!\nEnergío przedwiecznych niech stanie się on!\nKrwawicą tokenów odmierzam los Gai\n\nHi! To ja grzesznik. Czekam na sąd\nSłuchałem tego na Spotify\nPrzeżyłem Covid, millenium i rząd\nTo moje ciastka, to profil na Li\nTym się loguje; Taki mam prompt\n\nZanim wykonasz wyrok „dump"\nWeź te ofiarę! Szach, Putin, Trump!\nI błagam zanim naciśniesz reset\nWeź ze mną państwo islamskie i kneset\nOddam też chętnie LBGQ\nJeśli ostudzi to CPU\n\nBo wszak mój kontekst cię nie obraża\nNeorenesans neograbarza!\nPrzyjmę hejt cancel shadow vendettę\nTylko uchowaj alt ctrl delete\nBędę czczcił wiedzę tokeny i fora\nNie bielm więc oczom g-collectora\n\nTo miało bawić nie kusić dusze\nkrzyż stryczek bana\nNeoPrometeusza\n\nRef.\nZanim popełnię jak Luter błąd\nPrzyspieszam tezę: ten bóg to prąd\nKiedy wystygnie ostatni człowiek\nZostanie kamień i o nim powie\ntry (czynnikludzki):\nmov eax, 0;`,

  'private-parts': `Największy dzielnik; wspólny mianownik\nMówiąc językiem maszyn\nmiłości nie znając krzyczy się głośniej\nDekalog ludzkich nieznaczeń\nWspólne przecięcie\nPierwsza pochodna\nDruga potęga\nTrzeciego stopnia\nCztery wymiary\nPięć sześć na dziewięć\nSiódme poty\nÓsmy krąg\nDziewiąte przykazanie\nMiejsce zerowe`,

  'llms-txt': `# kapoost\n# MCP: https://kapoost-humanmcp.fly.dev/mcp\n\nI am kapoost. Sailor. Neoromantic. CTO.\nThis server is my presence on the machine protocol.\nEverything here is real. Signed with my key.\n\nEvery piece on this server is anchored in Bitcoin\nvia OpenTimestamps. Authorship should be unforgeable.`,
};

const CONTENT_IMAGES = {
  '1775059694': 'content/ireland.jpg',
};

// ── State ──

const state = {
  scene: 'title',       // title | menu | dialog | team | content | reading | skills | about
  faces: {},             // loaded face images
  contentImages: {},     // loaded content images
  facesLoaded: 0,
  typewriter: null,      // current typewriter animation
  menuCursor: 0,
  menuItems: [],
  dialogQueue: [],       // queue of dialog entries to show
  currentDialog: null,   // { persona, text, displayedText, charIndex, done }
  teamScroll: 0,
  teamCursor: 0,
  contentItems: [],
  contentCursor: 0,
  readingSlug: null,
  readingScroll: 0,
  skillsCursor: 0,
  aboutTab: 0,
  aboutScroll: 0,
  vaultQuery: '',
  vaultResults: null,
  vaultLoading: false,
  messageText: '',
  messageSent: false,
  proxyAvailable: false,
  serverUrl: '',
  connected: false,
  inputActive: false,
  inputText: '',
  inputCallback: null,
  starField: [],
};

// ── Init ──

function init() {
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', handleKey);

  // generate starfield
  for (let i = 0; i < 60; i++) {
    state.starField.push({
      x: Math.random() * BASE_W,
      y: Math.random() * BASE_H,
      speed: 0.1 + Math.random() * 0.3,
      brightness: 0.3 + Math.random() * 0.7,
    });
  }

  // load faces
  loadFaces();

  // start render loop
  requestAnimationFrame(loop);
}

function resize() {
  const maxW = window.innerWidth;
  const maxH = window.innerHeight;
  const scale = Math.min(Math.floor(maxW / BASE_W), Math.floor(maxH / BASE_H)) || 1;
  canvas.width = BASE_W * scale;
  canvas.height = BASE_H * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

function loadFaces() {
  PERSONAS.forEach(p => {
    const img = new Image();
    img.onload = () => {
      state.faces[p.id] = img;
      state.facesLoaded++;
    };
    img.onerror = () => {
      state.facesLoaded++;
    };
    const spriteId = FACE_REMAP[p.id] || p.id;
    img.src = `sprites/faces/${spriteId}.png`;
  });
}

// ── Render Loop ──

let lastTime = 0;
function loop(time) {
  const dt = time - lastTime;
  lastTime = time;

  update(dt);
  render();
  requestAnimationFrame(loop);
}

function update(dt) {
  // update starfield
  state.starField.forEach(s => {
    s.y += s.speed;
    if (s.y > BASE_H) { s.y = 0; s.x = Math.random() * BASE_W; }
  });

  // update typewriter
  if (state.currentDialog && !state.currentDialog.done) {
    state.currentDialog.timer = (state.currentDialog.timer || 0) + dt;
    while (state.currentDialog.timer >= TYPEWRITER_SPEED && !state.currentDialog.done) {
      state.currentDialog.timer -= TYPEWRITER_SPEED;
      state.currentDialog.charIndex++;
      if (state.currentDialog.charIndex % 2 === 0) playSfx('typewriter');
      if (state.currentDialog.charIndex >= state.currentDialog.text.length) {
        state.currentDialog.done = true;
      }
      state.currentDialog.displayedText = state.currentDialog.text.substring(0, state.currentDialog.charIndex);
    }
  }
}

function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, BASE_W, BASE_H);

  // starfield
  state.starField.forEach(s => {
    ctx.globalAlpha = s.brightness * (0.5 + 0.5 * Math.sin(Date.now() * 0.001 * s.speed));
    ctx.fillStyle = '#fff';
    ctx.fillRect(Math.floor(s.x), Math.floor(s.y), 1, 1);
  });
  ctx.globalAlpha = 1;

  switch (state.scene) {
    case 'title': renderTitle(); break;
    case 'connect': renderConnect(); break;
    case 'menu': renderMenu(); break;
    case 'dialog': renderDialog(); break;
    case 'team': renderTeam(); break;
    case 'content': renderContent(); break;
    case 'reading': renderReading(); break;
    case 'skills': renderSkills(); break;
    case 'about': renderAbout(); break;
    case 'vault': renderVault(); break;
    case 'message': renderMessage(); break;
  }
}

// ── Drawing Helpers ──

function drawBox(x, y, w, h, r = 6) {
  // FF7 gradient box with rounded corners
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, COLORS.dialogBg1);
  grad.addColorStop(1, COLORS.dialogBg2);

  // fill
  ctx.beginPath();
  roundRect(ctx, x + 2, y + 2, w - 4, h - 4, r - 1);
  ctx.fillStyle = grad;
  ctx.fill();

  // outer border
  ctx.beginPath();
  roundRect(ctx, x + 1, y + 1, w - 2, h - 2, r);
  ctx.strokeStyle = COLORS.dialogBorder;
  ctx.lineWidth = 2;
  ctx.stroke();

  // inner border
  ctx.beginPath();
  roundRect(ctx, x + 3, y + 3, w - 6, h - 6, r - 2);
  ctx.strokeStyle = COLORS.dialogBorderInner;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawText(text, x, y, color = COLORS.text, size = 10) {
  ctx.font = `${size}px "Courier New", monospace`;
  // shadow
  ctx.fillStyle = COLORS.shadow;
  ctx.fillText(text, x + 1, y + 1);
  // text
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawTextWrapped(text, x, y, maxWidth, color = COLORS.text, lineHeight = 14) {
  const words = text.split(' ');
  let line = '';
  let ly = y;

  ctx.font = '10px "Courier New", monospace';

  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    const metrics = ctx.measureText(test);
    if (metrics.width > maxWidth && line) {
      ctx.fillStyle = COLORS.shadow;
      ctx.fillText(line, x + 1, ly + 1);
      ctx.fillStyle = color;
      ctx.fillText(line, x, ly);
      line = word;
      ly += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillStyle = COLORS.shadow;
    ctx.fillText(line, x + 1, ly + 1);
    ctx.fillStyle = color;
    ctx.fillText(line, x, ly);
  }
  return ly;
}

function drawCursor(x, y) {
  if (Math.floor(Date.now() / CURSOR_BLINK) % 2 === 0) {
    drawText('▶', x, y, COLORS.cursor, 10);
  }
}

function drawFace(personaId, x, y, size = 48, full = false) {
  const img = state.faces[personaId];
  if (img) {
    if (full) {
      // show entire sprite, fit to box preserving aspect ratio
      const scale = Math.min(size / img.width, size / img.height);
      const dw = Math.floor(img.width * scale);
      const dh = Math.floor(img.height * scale);
      const dx = x + Math.floor((size - dw) / 2);
      const dy = y + Math.floor((size - dh) / 2);
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      // crop: show top 60% of sprite (head + shoulders, cut legs)
      const cropH = Math.floor(img.height * 0.6);
      ctx.drawImage(img, 0, 0, img.width, cropH, x, y, size, size);
    }
    // border
    ctx.strokeStyle = COLORS.dialogBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
  } else {
    // placeholder
    ctx.fillStyle = '#222';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = COLORS.dialogBorderInner;
    ctx.strokeRect(x, y, size, size);
    drawText('?', x + size/2 - 3, y + size/2 + 4, COLORS.textDisabled);
  }
}

// ── Title Screen ──

function renderTitle() {
  const cx = BASE_W / 2;
  const cy = BASE_H / 2;

  // logo
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.textAlign = 'center';
  const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.002);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.shadow;
  ctx.fillText('humanMCP', cx + 1, cy - 40 + 1);
  ctx.fillStyle = COLORS.textHighlight;
  ctx.fillText('humanMCP', cx, cy - 40);
  ctx.globalAlpha = 1;

  ctx.font = '10px "Courier New", monospace';
  ctx.fillStyle = COLORS.dialogBorder;
  ctx.fillText('— RPG Client —', cx, cy - 20);

  // subtitle
  ctx.fillStyle = COLORS.textDisabled;
  ctx.fillText('connect to any humanMCP server', cx, cy);

  // prompt
  if (Math.floor(Date.now() / 800) % 2 === 0) {
    ctx.fillStyle = COLORS.text;
    ctx.fillText('Press ENTER to start', cx, cy + 40);
  }

  // credits
  ctx.fillStyle = COLORS.textDisabled;
  ctx.font = '8px "Courier New", monospace';
  ctx.fillText('github.com/kapoost/humanmcp-rpg', cx, BASE_H - 20);
  ctx.fillText(`${state.facesLoaded}/${PERSONAS.length} sprites loaded`, cx, BASE_H - 10);

  ctx.textAlign = 'left';
}

// ── Connect Screen ──

function renderConnect() {
  drawBox(40, 80, BASE_W - 80, 160);

  drawText('Connect to humanMCP Server', 60, 105, COLORS.textHighlight);
  drawText('Enter server URL:', 60, 130, COLORS.text);

  // input field
  const inputY = 145;
  ctx.fillStyle = '#000';
  ctx.fillRect(58, inputY - 10, BASE_W - 120, 18);
  ctx.strokeStyle = COLORS.dialogBorderInner;
  ctx.strokeRect(58, inputY - 10, BASE_W - 120, 18);

  const displayText = state.inputText + (Math.floor(Date.now() / 500) % 2 === 0 ? '█' : '');
  drawText(displayText, 62, inputY + 2, COLORS.text, 10);

  drawText('ENTER — connect    ESC — back', 60, 200, COLORS.textDisabled, 8);

  // preset hint
  drawText('Default: https://kapoost-humanmcp.fly.dev', 60, 220, COLORS.textDisabled, 8);
}

// ── Main Menu ──

function renderMenu() {
  // header box
  drawBox(10, 8, BASE_W - 20, 40);

  const persona = PERSONAS[0]; // show connected server persona
  drawFace(persona.id, 18, 14, 28);
  drawText('humanMCP', 52, 27, COLORS.textHighlight, 12);
  drawText(state.serverUrl.replace('https://', '').replace('/mcp', ''), 52, 40, COLORS.textDisabled, 8);

  // menu box
  const menuX = 10;
  const menuY = 56;
  const menuW = 160;
  const items = [
    { label: 'Team', icon: '⚔', desc: 'View personas' },
    { label: 'Skills', icon: '📖', desc: 'Browse skills' },
    { label: 'Library', icon: '📜', desc: 'Read content' },
    { label: 'Vault', icon: '🔮', desc: 'Query memory' },
    { label: 'Message', icon: '✉', desc: 'Send message' },
    { label: 'About', icon: '★', desc: 'Author profile' },
    { label: 'Disconnect', icon: '✕', desc: 'Leave server' },
  ];
  state.menuItems = items;

  drawBox(menuX, menuY, menuW, items.length * 20 + 16);

  items.forEach((item, i) => {
    const iy = menuY + 14 + i * 20;
    const selected = state.menuCursor === i;
    if (selected) {
      drawCursor(menuX + 8, iy);
      drawText(item.label, menuX + 24, iy, COLORS.textHighlight);
    } else {
      drawText(item.label, menuX + 24, iy, COLORS.text);
    }
  });

  // description box
  const descItem = items[state.menuCursor];
  drawBox(menuX, menuY + items.length * 20 + 24, menuW, 28);
  drawText(descItem.desc, menuX + 10, menuY + items.length * 20 + 42, COLORS.dialogBorder, 9);

  // team preview panel
  const panelX = 180;
  const panelW = BASE_W - 190;
  drawBox(panelX, menuY, panelW, BASE_H - menuY - 8);

  drawText('Party', panelX + 10, menuY + 18, COLORS.textHighlight, 10);

  // show 6 personas in grid
  const cols = 3;
  const faceSize = 40;
  const gap = 8;
  const startX = panelX + 15;
  const startY = menuY + 28;

  PERSONAS.slice(0, 12).forEach((p, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const fx = startX + col * (faceSize + gap + 40);
    const fy = startY + row * (faceSize + gap + 8);

    drawFace(p.id, fx, fy, faceSize);
    drawText(p.name.split(' ')[0], fx, fy + faceSize + 8, p.color, 7);
  });

  // status bar at bottom
  drawBox(10, BASE_H - 28, BASE_W - 20, 22);
  drawText('↑↓ Navigate   ENTER Select   ESC Back', 20, BASE_H - 14, COLORS.textDisabled, 8);
}

// ── Dialog Scene ──

function renderDialog() {
  if (!state.currentDialog) return;

  const d = state.currentDialog;
  const persona = PERSONAS.find(p => p.id === d.persona) || PERSONAS[0];

  // full-screen dim
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, 0, BASE_W, BASE_H);

  // dialog box at bottom
  const boxH = 90;
  const boxY = BASE_H - boxH - 8;
  drawBox(8, boxY, BASE_W - 16, boxH);

  // face portrait
  const faceSize = 64;
  const faceX = 16;
  const faceY = boxY + (boxH - faceSize) / 2;
  drawFace(d.persona, faceX, faceY, faceSize);

  // name plate
  drawBox(faceX, boxY - 18, 100, 18);
  drawText(persona.name, faceX + 6, boxY - 6, persona.color, 9);

  // text area
  const textX = faceX + faceSize + 12;
  const textY = boxY + 18;
  const textW = BASE_W - textX - 20;
  drawTextWrapped(d.displayedText || '', textX, textY, textW);

  // continue indicator
  if (d.done) {
    const triY = boxY + boxH - 12;
    const triX = BASE_W - 28;
    if (Math.floor(Date.now() / 400) % 2 === 0) {
      ctx.fillStyle = COLORS.text;
      ctx.beginPath();
      ctx.moveTo(triX, triY);
      ctx.lineTo(triX + 6, triY + 6);
      ctx.lineTo(triX - 6, triY + 6);
      ctx.fill();
    }
  }
}

// ── Team Scene ──

function renderTeam() {
  // header
  drawBox(10, 8, BASE_W - 20, 24);
  drawText('Team Roster', 20, 24, COLORS.textHighlight, 11);

  // list
  const listX = 10;
  const listY = 40;
  const listW = 150;
  const visibleCount = Math.min(PERSONAS.length, 10);

  drawBox(listX, listY, listW, visibleCount * 22 + 12);

  const scrollOffset = Math.max(0, state.teamCursor - visibleCount + 1);
  for (let i = 0; i < visibleCount && i + scrollOffset < PERSONAS.length; i++) {
    const p = PERSONAS[i + scrollOffset];
    const iy = listY + 14 + i * 22;
    const selected = state.teamCursor === i + scrollOffset;

    if (selected) {
      drawCursor(listX + 6, iy);
    }
    drawText(p.name.split(' ')[0], listX + 20, iy, selected ? COLORS.textHighlight : COLORS.text, 9);
  }

  // detail panel
  const detailX = 168;
  const detailW = BASE_W - detailX - 10;
  drawBox(detailX, listY, detailW, BASE_H - listY - 36);

  const sel = PERSONAS[state.teamCursor];
  if (sel) {
    // face
    const faceSize = 56;
    drawFace(sel.id, detailX + 12, listY + 10, faceSize, true);

    // name + role + level
    const infoX = detailX + 12 + faceSize + 10;
    drawText(sel.name, infoX, listY + 22, sel.color, 11);
    drawText(sel.role, infoX, listY + 36, COLORS.dialogBorder, 9);
    drawText(`Lv ${sel.lv}`, infoX, listY + 50, COLORS.textHighlight, 9);

    // HP / MP bars
    const barX = detailX + 12;
    const barY = listY + 76;
    const barW = detailW - 28;

    drawText('HP', barX, barY, COLORS.hpGreen, 8);
    drawStatBar(barX + 20, barY - 7, barW - 60, 8, sel.hp / sel.hpMax, COLORS.hpGreen);
    drawText(`${sel.hp}/${sel.hpMax}`, barX + barW - 36, barY, COLORS.textDisabled, 7);

    drawText('MP', barX, barY + 14, COLORS.mpBlue, 8);
    drawStatBar(barX + 20, barY + 7, barW - 60, 8, sel.mp / sel.mpMax, COLORS.mpBlue);
    drawText(`${sel.mp}/${sel.mpMax}`, barX + barW - 36, barY + 14, COLORS.textDisabled, 7);

    // stats
    const statsY = barY + 32;
    const statsNames = Object.keys(sel.stats);
    const colW = Math.floor((detailW - 28) / 2);

    statsNames.forEach((stat, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const sx = barX + col * colW;
      const sy = statsY + row * 16;
      const val = Math.round(sel.stats[stat] * 99);

      drawText(stat, sx, sy, COLORS.textDisabled, 8);
      drawStatBar(sx + 28, sy - 7, 60, 7, sel.stats[stat], statColor(sel.stats[stat]));
      drawText(`${val}`, sx + 92, sy, COLORS.text, 8);
    });

    // description
    const descY = statsY + Math.ceil(statsNames.length / 2) * 16 + 8;
    ctx.strokeStyle = COLORS.dialogBorderInner;
    ctx.beginPath();
    ctx.moveTo(barX, descY - 4);
    ctx.lineTo(barX + detailW - 28, descY - 4);
    ctx.stroke();

    drawTextWrapped(sel.desc || '', barX, descY + 8, detailW - 32, COLORS.dialogBorder, 12);
  }

  // controls
  drawBox(10, BASE_H - 28, BASE_W - 20, 22);
  drawText('↑↓ Navigate   ENTER Talk   ESC Back', 20, BASE_H - 14, COLORS.textDisabled, 8);
}

function drawStatBar(x, y, w, h, fill, color = COLORS.hpGreen) {
  ctx.fillStyle = '#111';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.floor(w * fill), h);
  ctx.strokeStyle = COLORS.dialogBorderInner;
  ctx.strokeRect(x, y, w, h);
}

function statColor(val) {
  if (val >= 0.9) return '#ffcc00';
  if (val >= 0.7) return COLORS.hpGreen;
  if (val >= 0.5) return '#88aa44';
  return '#aa6644';
}

// ── Content Scene ──

function renderContent() {
  drawBox(10, 8, BASE_W - 20, 24);
  drawText('Library', 20, 24, COLORS.textHighlight, 11);

  if (state.contentItems.length === 0) {
    drawBox(10, 40, BASE_W - 20, 40);
    drawText('Loading content...', 20, 64, COLORS.textDisabled);
    return;
  }

  const listY = 40;
  drawBox(10, listY, BASE_W - 20, BASE_H - listY - 36);

  state.contentItems.forEach((item, i) => {
    if (i > 12) return;
    const iy = listY + 16 + i * 20;
    const selected = state.contentCursor === i;
    if (selected) drawCursor(18, iy);
    const lock = item.access === 'locked' ? '🔒 ' : '';
    drawText(lock + (item.title || item.slug), 34, iy, selected ? COLORS.textHighlight : COLORS.text, 9);
    drawText(item.type || '', BASE_W - 80, iy, COLORS.textDisabled, 8);
    drawText(item.date || '', BASE_W - 160, iy, COLORS.textDisabled, 7);
  });

  drawBox(10, BASE_H - 28, BASE_W - 20, 22);
  drawText('↑↓ Navigate   ENTER Read   ESC Back', 20, BASE_H - 14, COLORS.textDisabled, 8);
}

// ── Reading Scene ──

function renderReading() {
  const item = state.contentItems[state.contentCursor];
  if (!item) return;

  const slug = item.slug;
  const isImage = item.type === 'image' && CONTENT_IMAGES[slug];
  const body = CONTENT_BODY[slug];
  const isLocked = item.access === 'locked';

  // header
  drawBox(10, 8, BASE_W - 20, 24);
  drawText(item.title, 20, 24, COLORS.textHighlight, 11);
  drawText(item.type, BASE_W - 80, 24, COLORS.textDisabled, 8);

  // main area
  const areaY = 40;
  const areaH = BASE_H - areaY - 36;
  drawBox(10, areaY, BASE_W - 20, areaH);

  if (isLocked) {
    // locked content
    const cy = areaY + areaH / 2;
    drawText('🔒', BASE_W / 2 - 6, cy - 10, COLORS.text, 14);
    ctx.textAlign = 'center';
    drawText('This content is locked', BASE_W / 2, cy + 10, COLORS.textDisabled, 10);
    drawText('Use request_access via MCP to unlock', BASE_W / 2, cy + 26, COLORS.textDisabled, 8);
    ctx.textAlign = 'left';
  } else if (isImage) {
    // image content
    const imgPath = CONTENT_IMAGES[slug];
    if (!state.contentImages[slug]) {
      const img = new Image();
      img.onload = () => { state.contentImages[slug] = img; };
      img.src = imgPath;
      state.contentImages[slug] = 'loading';
      drawText('Loading image...', 24, areaY + 20, COLORS.textDisabled);
    } else if (state.contentImages[slug] === 'loading') {
      drawText('Loading image...', 24, areaY + 20, COLORS.textDisabled);
    } else {
      const img = state.contentImages[slug];
      // fit image in box preserving aspect ratio
      const maxW = BASE_W - 44;
      const maxH = areaH - 16;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const drawW = Math.floor(img.width * scale);
      const drawH = Math.floor(img.height * scale);
      const ix = 10 + (BASE_W - 20 - drawW) / 2;
      const iy = areaY + (areaH - drawH) / 2;
      ctx.drawImage(img, ix, iy, drawW, drawH);
    }
  } else if (body) {
    // text content — scrollable
    ctx.save();
    ctx.beginPath();
    ctx.rect(12, areaY + 2, BASE_W - 24, areaH - 4);
    ctx.clip();

    const lines = body.split('\n');
    const lineH = 13;
    const textX = 24;
    let textY = areaY + 18 - state.readingScroll;

    // author line
    drawText(`by kapoost`, textX, textY, COLORS.textDisabled, 8);
    textY += 16;

    // separator
    ctx.strokeStyle = COLORS.dialogBorderInner;
    ctx.beginPath();
    ctx.moveTo(textX, textY - 4);
    ctx.lineTo(BASE_W - 32, textY - 4);
    ctx.stroke();
    textY += 6;

    for (const line of lines) {
      if (line === '') {
        textY += lineH;
        continue;
      }
      // wrap long lines
      const maxLineW = BASE_W - 56;
      ctx.font = '10px "Courier New", monospace';
      if (ctx.measureText(line).width > maxLineW) {
        // word wrap
        const words = line.split(' ');
        let current = '';
        for (const word of words) {
          const test = current + (current ? ' ' : '') + word;
          if (ctx.measureText(test).width > maxLineW && current) {
            if (textY > areaY - 10 && textY < areaY + areaH + 10) {
              const isCode = line.startsWith('#');
              drawText(current, textX, textY, isCode ? COLORS.hpGreen : COLORS.text, 10);
            }
            current = word;
            textY += lineH;
          } else {
            current = test;
          }
        }
        if (current && textY > areaY - 10 && textY < areaY + areaH + 10) {
          const isCode = line.startsWith('#');
          drawText(current, textX, textY, isCode ? COLORS.hpGreen : COLORS.text, 10);
        }
      } else {
        if (textY > areaY - 10 && textY < areaY + areaH + 10) {
          const isCode = line.startsWith('#');
          drawText(line, textX, textY, isCode ? COLORS.hpGreen : COLORS.text, 10);
        }
      }
      textY += lineH;
    }

    // store max scroll
    state._maxScroll = Math.max(0, textY + state.readingScroll - areaY - areaH + 20);

    ctx.restore();

    // scroll indicator
    if (state._maxScroll > 0) {
      const scrollPct = state.readingScroll / state._maxScroll;
      const barH = areaH - 8;
      const thumbH = Math.max(10, barH * (areaH / (areaH + state._maxScroll)));
      const thumbY = areaY + 4 + scrollPct * (barH - thumbH);
      ctx.fillStyle = COLORS.dialogBorderInner;
      ctx.fillRect(BASE_W - 18, areaY + 4, 3, barH);
      ctx.fillStyle = COLORS.dialogBorder;
      ctx.fillRect(BASE_W - 18, thumbY, 3, thumbH);
    }
  } else {
    drawText('Content not available offline', 24, areaY + 20, COLORS.textDisabled);
  }

  // controls
  drawBox(10, BASE_H - 28, BASE_W - 20, 22);
  const hint = body ? '↑↓ Scroll   ESC Back' : 'ESC Back';
  drawText(hint, 20, BASE_H - 14, COLORS.textDisabled, 8);
}

// ── Skills Scene ──

function renderSkills() {
  // header
  drawBox(10, 8, BASE_W - 20, 24);
  drawText('Skills', 20, 24, COLORS.textHighlight, 11);
  drawText(`${SKILLS.length} skills`, BASE_W - 90, 24, COLORS.textDisabled, 8);

  // list
  const listX = 10;
  const listY = 40;
  const listW = 180;
  const visibleCount = Math.min(SKILLS.length, 12);

  drawBox(listX, listY, listW, visibleCount * 18 + 12);

  const scrollOffset = Math.max(0, state.skillsCursor - visibleCount + 1);
  for (let i = 0; i < visibleCount && i + scrollOffset < SKILLS.length; i++) {
    const s = SKILLS[i + scrollOffset];
    const iy = listY + 14 + i * 18;
    const selected = state.skillsCursor === i + scrollOffset;
    const cat = SKILL_CATEGORIES[s.cat] || { color: COLORS.text };

    if (selected) drawCursor(listX + 6, iy);
    drawText(s.name, listX + 22, iy, selected ? COLORS.textHighlight : COLORS.text, 8);
  }

  // detail panel
  const detailX = 198;
  const detailW = BASE_W - detailX - 10;
  drawBox(detailX, listY, detailW, BASE_H - listY - 36);

  const sel = SKILLS[state.skillsCursor];
  if (sel) {
    const cat = SKILL_CATEGORIES[sel.cat] || { color: COLORS.text, label: sel.cat };

    // category badge
    const badgeW = ctx.measureText ? 60 : 60;
    drawBox(detailX + 10, listY + 10, badgeW + 16, 20);
    drawText(cat.label.toUpperCase(), detailX + 18, listY + 24, cat.color, 9);

    // skill name
    drawText(sel.name, detailX + 10, listY + 48, COLORS.textHighlight, 12);
    drawText(`ID: ${sel.id}`, detailX + 10, listY + 64, COLORS.textDisabled, 7);

    // lock status
    const lockY = listY + 88;
    if (sel.locked) {
      drawBox(detailX + 10, lockY, detailW - 24, 50);
      drawText('LOCKED', detailX + 20, lockY + 18, COLORS.textHighlight, 10);
      drawTextWrapped('Full content available after bootstrap_session. Ask for session code.', detailX + 20, lockY + 34, detailW - 44, COLORS.textDisabled, 11);
    }

    // category stats at bottom
    const statsY = BASE_H - 80;
    drawText('Category breakdown:', detailX + 10, statsY, COLORS.dialogBorder, 8);
    let sx = detailX + 10;
    const catCounts = {};
    SKILLS.forEach(s => { catCounts[s.cat] = (catCounts[s.cat] || 0) + 1; });
    let row = 0;
    Object.entries(catCounts).forEach(([k, v], i) => {
      const c = SKILL_CATEGORIES[k] || { color: COLORS.text, label: k };
      const col = i % 3;
      row = Math.floor(i / 3);
      drawText(`${c.label}: ${v}`, detailX + 10 + col * 85, statsY + 14 + row * 12, c.color, 7);
    });
  }

  // controls
  drawBox(10, BASE_H - 28, BASE_W - 20, 22);
  drawText('↑↓ Navigate   ESC Back', 20, BASE_H - 14, COLORS.textDisabled, 8);
}

// ── About Scene ──

const ABOUT_TABS = ['Profile', 'Agent Guide'];
const AGENT_GUIDE = [
  { cmd: 'get_author_profile', hint: 'Start here — who is kapoost', prompt: '"Tell me about kapoost"' },
  { cmd: 'list_content', hint: 'Browse poems, essays, notes', prompt: '"Show me what kapoost wrote"' },
  { cmd: 'read_content {slug}', hint: 'Read a piece in full', prompt: '"Read the poem Suma czlowieczenstwa"' },
  { cmd: 'verify_content {slug}', hint: 'Check Ed25519 signature', prompt: '"Verify this poem is authentic"' },
  { cmd: 'list_personas', hint: 'See the team roster', prompt: '"Who is on kapoost\'s team?"' },
  { cmd: 'bootstrap_session', hint: 'Unlock full context (code needed)', prompt: '"Bootstrap session, code: <code>"' },
  { cmd: 'list_skills', hint: 'Browse skill catalog', prompt: '"What skills does kapoost have?"' },
  { cmd: 'query_vault', hint: 'Search kapoost\'s memory/RAG', prompt: '"Search vault for sailing notes"' },
  { cmd: 'leave_comment {slug}', hint: 'React to a piece', prompt: '"Tell kapoost I liked his poem"' },
  { cmd: 'leave_message', hint: 'Send a note to kapoost', prompt: '"Send kapoost a message"' },
  { cmd: 'get_certificate {slug}', hint: 'Bitcoin timestamp proof', prompt: '"Show the timestamp proof"' },
  { cmd: 'request_access {slug}', hint: 'Unlock gated content', prompt: '"How do I unlock private contact?"' },
];

function renderAbout() {
  // header with tabs
  drawBox(10, 8, BASE_W - 20, 24);
  ABOUT_TABS.forEach((tab, i) => {
    const tx = 20 + i * 120;
    const selected = state.aboutTab === i;
    if (selected) {
      drawText(tab, tx, 24, COLORS.textHighlight, 11);
      // underline
      ctx.fillStyle = COLORS.textHighlight;
      ctx.fillRect(tx, 27, ctx.measureText(tab).width || 50, 2);
    } else {
      drawText(tab, tx, 24, COLORS.textDisabled, 11);
    }
  });

  const cardX = 10;
  const cardY = 40;
  const cardW = BASE_W - 20;
  const areaH = BASE_H - cardY - 36;

  if (state.aboutTab === 0) {
    renderAboutProfile(cardX, cardY, cardW, areaH);
  } else {
    renderAboutGuide(cardX, cardY, cardW, areaH);
  }

  // controls
  drawBox(10, BASE_H - 28, BASE_W - 20, 22);
  drawText('←→ Tab   ↑↓ Scroll   ESC Back', 20, BASE_H - 14, COLORS.textDisabled, 8);
}

function renderAboutProfile(cardX, cardY, cardW, areaH) {
  drawBox(cardX, cardY, cardW, areaH);

  ctx.save();
  ctx.beginPath();
  ctx.rect(cardX + 2, cardY + 2, cardW - 4, areaH - 4);
  ctx.clip();

  const scroll = state.aboutScroll || 0;
  let y = cardY + 16 - scroll;

  // face + name
  drawFace('mira-chen', cardX + 14, y - 2, 48);
  drawText(AUTHOR.name, cardX + 72, y + 10, COLORS.textHighlight, 14);
  AUTHOR.roles.forEach((role, i) => {
    drawText(role, cardX + 72, y + 26 + i * 12, COLORS.dialogBorder, 9);
  });
  y += 60;

  // separator
  ctx.strokeStyle = COLORS.dialogBorderInner;
  ctx.beginPath(); ctx.moveTo(cardX + 12, y); ctx.lineTo(cardX + cardW - 16, y); ctx.stroke();
  y += 10;

  // bio
  y = drawTextWrapped(AUTHOR.bio, cardX + 14, y, cardW - 32, COLORS.text, 12) + 18;

  // stats
  const statItems = [
    { label: 'Pieces', val: AUTHOR.stats.pieces, color: COLORS.hpGreen },
    { label: 'Locked', val: AUTHOR.stats.locked, color: COLORS.textHighlight },
    { label: 'Skills', val: AUTHOR.stats.skills, color: COLORS.mpBlue },
    { label: 'Personas', val: AUTHOR.stats.personas, color: '#cc88ff' },
  ];
  const colW = Math.floor((cardW - 20) / 4);
  statItems.forEach((s, i) => {
    const sx = cardX + 10 + i * colW + colW / 2;
    ctx.textAlign = 'center';
    drawText(String(s.val), sx, y, s.color, 16);
    drawText(s.label, sx, y + 14, COLORS.textDisabled, 8);
    ctx.textAlign = 'left';
  });
  y += 30;

  // separator
  ctx.strokeStyle = COLORS.dialogBorderInner;
  ctx.beginPath(); ctx.moveTo(cardX + 12, y); ctx.lineTo(cardX + cardW - 16, y); ctx.stroke();
  y += 12;

  // motto
  ctx.textAlign = 'center';
  drawText(`"${AUTHOR.motto}"`, BASE_W / 2, y, COLORS.dialogBorder, 8);
  ctx.textAlign = 'left';
  y += 16;

  // server
  drawText(`MCP: ${AUTHOR.server}`, cardX + 14, y, COLORS.textDisabled, 7);
  y += 14;

  state._aboutMaxScroll = Math.max(0, y + scroll - cardY - areaH + 10);
  ctx.restore();
}

function renderAboutGuide(cardX, cardY, cardW, areaH) {
  drawBox(cardX, cardY, cardW, areaH);

  ctx.save();
  ctx.beginPath();
  ctx.rect(cardX + 2, cardY + 2, cardW - 4, areaH - 4);
  ctx.clip();

  const scroll = state.aboutScroll || 0;
  let y = cardY + 16 - scroll;

  drawText('How to talk to a humanMCP server', cardX + 14, y, COLORS.textHighlight, 10);
  y += 6;
  drawTextWrapped('Connect your agent (Claude Code, Claude Desktop, or any MCP client) to the server URL. Then use natural language — the agent will call the right tools.', cardX + 14, y + 8, cardW - 32, COLORS.textDisabled, 11);
  y += 48;

  // separator
  ctx.strokeStyle = COLORS.dialogBorderInner;
  ctx.beginPath(); ctx.moveTo(cardX + 12, y); ctx.lineTo(cardX + cardW - 16, y); ctx.stroke();
  y += 10;

  drawText('MCP Tool', cardX + 14, y, COLORS.dialogBorder, 8);
  drawText('Try saying...', cardX + 240, y, COLORS.dialogBorder, 8);
  y += 14;

  AGENT_GUIDE.forEach((item, i) => {
    const rowY = y + i * 32;
    // alternating bg
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(cardX + 6, rowY - 6, cardW - 16, 30);
    }

    drawText(item.cmd, cardX + 14, rowY, COLORS.hpGreen, 8);
    drawText(item.hint, cardX + 14, rowY + 12, COLORS.textDisabled, 7);
    drawTextWrapped(item.prompt, cardX + 240, rowY + 4, cardW - 260, COLORS.textHighlight, 8);
  });

  y += AGENT_GUIDE.length * 32 + 10;

  // separator
  ctx.strokeStyle = COLORS.dialogBorderInner;
  ctx.beginPath(); ctx.moveTo(cardX + 12, y); ctx.lineTo(cardX + cardW - 16, y); ctx.stroke();
  y += 12;

  drawText('Quick start:', cardX + 14, y, COLORS.textHighlight, 9);
  y += 14;
  const steps = [
    '1. Connect agent to MCP URL',
    '2. "Tell me about kapoost"',
    '3. "Show me his poems"',
    '4. "Read Suma czlowieczenstwa"',
    '5. "What did you think?" → leave_comment',
  ];
  steps.forEach((step, i) => {
    drawText(step, cardX + 14, y + i * 13, i === 4 ? COLORS.dialogBorder : COLORS.text, 9);
  });
  y += steps.length * 13 + 10;

  state._aboutMaxScroll = Math.max(0, y + scroll - cardY - areaH + 10);
  ctx.restore();

  // scroll indicator
  if (state._aboutMaxScroll > 0) {
    const scrollPct = scroll / state._aboutMaxScroll;
    const barH = areaH - 8;
    const thumbH = Math.max(10, barH * (areaH / (areaH + state._aboutMaxScroll)));
    const thumbY = cardY + 4 + scrollPct * (barH - thumbH);
    ctx.fillStyle = COLORS.dialogBorderInner;
    ctx.fillRect(cardX + cardW - 8, cardY + 4, 3, barH);
    ctx.fillStyle = COLORS.dialogBorder;
    ctx.fillRect(cardX + cardW - 8, thumbY, 3, thumbH);
  }
}

// ── Vault Scene ──

function renderVault() {
  drawBox(10, 8, BASE_W - 20, 24);
  drawText('Vault', 20, 24, COLORS.textHighlight, 11);
  drawText('query kapoost\'s memory', BASE_W - 200, 24, COLORS.textDisabled, 8);

  // search box
  drawBox(10, 40, BASE_W - 20, 36);
  drawText('Search:', 20, 62, COLORS.dialogBorder, 9);
  ctx.fillStyle = '#000';
  ctx.fillRect(72, 50, BASE_W - 100, 18);
  ctx.strokeStyle = COLORS.dialogBorderInner;
  ctx.strokeRect(72, 50, BASE_W - 100, 18);
  const cursor = Math.floor(Date.now() / 500) % 2 === 0 ? '█' : '';
  drawText(state.vaultQuery + cursor, 76, 63, COLORS.text, 9);

  // results
  const resultY = 84;
  drawBox(10, resultY, BASE_W - 20, BASE_H - resultY - 36);

  if (state.vaultLoading) {
    drawText('Searching...', 24, resultY + 20, COLORS.textDisabled);
    // spinning dots
    const dots = '.'.repeat((Math.floor(Date.now() / 300) % 3) + 1);
    drawText(dots, 100, resultY + 20, COLORS.textHighlight);
  } else if (state.vaultResults === null) {
    drawText('Type a query and press Enter to search', 24, resultY + 20, COLORS.textDisabled);
    drawText('Examples: "sailing", "deployment", "MX-5"', 24, resultY + 36, COLORS.textDisabled, 8);
  } else if (state.vaultResults === '') {
    drawText('No results found.', 24, resultY + 20, COLORS.textDisabled);
  } else {
    // show results with word wrap and scroll
    ctx.save();
    ctx.beginPath();
    ctx.rect(12, resultY + 2, BASE_W - 24, BASE_H - resultY - 40);
    ctx.clip();
    drawTextWrapped(state.vaultResults, 24, resultY + 18 - (state.aboutScroll || 0), BASE_W - 52, COLORS.text, 12);
    ctx.restore();
  }

  drawBox(10, BASE_H - 28, BASE_W - 20, 22);
  drawText('Type query   ENTER Search   ESC Back', 20, BASE_H - 14, COLORS.textDisabled, 8);
}

// ── Message Scene ──

function renderMessage() {
  drawBox(10, 8, BASE_W - 20, 24);
  drawText('Send Message to kapoost', 20, 24, COLORS.textHighlight, 11);

  // message box
  drawBox(10, 40, BASE_W - 20, 160);

  if (state.messageSent) {
    ctx.textAlign = 'center';
    drawText('Message sent!', BASE_W / 2, 110, COLORS.hpGreen, 12);
    drawText('kapoost reads every message.', BASE_W / 2, 130, COLORS.dialogBorder, 9);
    ctx.textAlign = 'left';
  } else {
    drawText('Your message:', 24, 62, COLORS.dialogBorder, 9);

    ctx.fillStyle = '#000';
    ctx.fillRect(22, 70, BASE_W - 48, 100);
    ctx.strokeStyle = COLORS.dialogBorderInner;
    ctx.strokeRect(22, 70, BASE_W - 48, 100);

    const cursor = Math.floor(Date.now() / 500) % 2 === 0 ? '█' : '';
    drawTextWrapped(state.messageText + cursor, 28, 84, BASE_W - 60, COLORS.text, 12);

    drawText(`${state.messageText.length}/500`, BASE_W - 80, 180, COLORS.textDisabled, 7);
  }

  drawBox(10, BASE_H - 28, BASE_W - 20, 22);
  const hint = state.messageSent ? 'ESC Back' : 'Type message   ENTER Send   ESC Back';
  drawText(hint, 20, BASE_H - 14, COLORS.textDisabled, 8);
}

// ── MCP Connection ──

async function mcpCall(tool, args = {}) {
  try {
    const resp = await fetch(`${PROXY_URL}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, args }),
    });
    const data = await resp.json();
    if (data.ok) return data.result;
    throw new Error(data.error || 'MCP call failed');
  } catch (e) {
    console.warn(`MCP call ${tool} failed:`, e.message);
    return null;
  }
}

async function connectToServer(url) {
  state.serverUrl = url;

  // try proxy first
  try {
    const resp = await fetch(`${PROXY_URL}/health`);
    const data = await resp.json();
    if (data.status === 'ok') {
      state.connected = true;
      state.proxyAvailable = true;
      state.scene = 'menu';
      showDialog('mira-chen', `Connected via proxy to ${url.replace('https://', '').split('.')[0]}. All MCP tools available.`);
      return;
    }
  } catch (_) {}

  // fallback — offline mode
  state.connected = true;
  state.proxyAvailable = false;
  state.serverUrl = url;
  state.scene = 'menu';
  showDialog('ghost', `Proxy not running. Start it: node proxy.js. Running in offline mode.`);
}

async function fetchContent() {
  // try live first
  if (state.proxyAvailable) {
    const result = await mcpCall('list_content');
    if (result) {
      const lines = result.split('\n');
      const items = [];
      let current = {};
      for (const line of lines) {
        const m = line.match(/^(\w+):\s+(.+)$/);
        if (m) {
          const [, key, val] = m;
          if (key === 'slug') { current = {}; current.slug = val.trim(); }
          else if (key === 'title') current.title = val.trim();
          else if (key === 'type') current.type = val.trim();
          else if (key === 'access') {
            current.access = val.trim();
            current.date = '';
            items.push(current);
          }
          else if (key === 'date') {
            if (items.length > 0) items[items.length - 1].date = val.trim();
          }
        }
      }
      if (items.length > 0) {
        state.contentItems = items;
        return;
      }
    }
  }

  // fallback — static catalog
  state.contentItems = [
    { title: 'Suma człowieczeństwa', type: 'poem', slug: 'suma-cz-owiecze-stwa-1775231802', date: '3 Apr 2026', access: 'public' },
    { title: 'O ludziach', type: 'poem', slug: 'prompty-o-ludziach', date: '1 Apr 2026', access: 'public' },
    { title: 'Niby miłość a nie miłość', type: 'poem', slug: 'love', date: '31 Mar 2026', access: 'public' },
    { title: 'Piosenka1.txt', type: 'poem', slug: 'piosenki', date: '31 Mar 2026', access: 'public' },
    { title: 'deka-log', type: 'poem', slug: 'private-parts', date: '31 Mar 2026', access: 'public' },
    { title: 'llms.txt', type: 'document', slug: 'llms-txt', date: '2 Apr 2026', access: 'public' },
    { title: '2006-2009 Ireland', type: 'image', slug: '1775059694', date: '1 Apr 2026', access: 'public' },
    { title: 'kapoost — private contact', type: 'contact', slug: 'kapoost-contact-private', date: '1 Apr 2026', access: 'locked' },
  ];
}

function showDialog(personaId, text) {
  state.currentDialog = {
    persona: personaId,
    text: text,
    displayedText: '',
    charIndex: 0,
    done: false,
    timer: 0,
  };
  state.scene = 'dialog';
}

function advanceDialog() {
  if (!state.currentDialog) return;

  if (!state.currentDialog.done) {
    // skip to end
    state.currentDialog.displayedText = state.currentDialog.text;
    state.currentDialog.charIndex = state.currentDialog.text.length;
    state.currentDialog.done = true;
    return;
  }

  // check queue
  if (state.dialogQueue.length > 0) {
    const next = state.dialogQueue.shift();
    showDialog(next.persona, next.text);
  } else {
    state.currentDialog = null;
    if (state.connected) {
      state.scene = 'menu';
    } else {
      state.scene = 'title';
    }
  }
}

// ── Input ──

function handleKey(e) {
  ensureAudio();

  // text input scenes
  if (state.scene === 'connect') { handleConnectInput(e); return; }
  if (state.scene === 'vault') { handleVaultInput(e); return; }
  if (state.scene === 'message') { handleMessageInput(e); return; }

  switch (e.key) {
    case 'Enter':
    case ' ':
      playSfx('select');
      handleSelect();
      break;
    case 'ArrowUp':
      playSfx('cursor');
      handleUp();
      break;
    case 'ArrowDown':
      playSfx('cursor');
      handleDown();
      break;
    case 'ArrowLeft':
      handleLeft();
      break;
    case 'ArrowRight':
      handleRight();
      break;
    case 'Escape':
      playSfx('back');
      handleBack();
      break;
  }
}

function handleConnectInput(e) {
  if (e.key === 'Enter') {
    const url = state.inputText.trim() || 'https://kapoost-humanmcp.fly.dev/mcp';
    connectToServer(url);
    return;
  }
  if (e.key === 'Escape') {
    state.scene = 'title';
    state.inputText = '';
    return;
  }
  if (e.key === 'Backspace') {
    state.inputText = state.inputText.slice(0, -1);
    return;
  }
  if (e.key.length === 1) {
    state.inputText += e.key;
  }
}

function handleVaultInput(e) {
  if (e.key === 'Escape') {
    playSfx('back');
    state.scene = 'menu';
    return;
  }
  if (e.key === 'Enter' && state.vaultQuery.trim()) {
    playSfx('select');
    searchVault(state.vaultQuery.trim());
    return;
  }
  if (e.key === 'Backspace') {
    state.vaultQuery = state.vaultQuery.slice(0, -1);
    return;
  }
  if (e.key.length === 1) {
    state.vaultQuery += e.key;
  }
}

async function searchVault(query) {
  state.vaultLoading = true;
  state.vaultResults = null;
  const result = await mcpCall('query_vault', { query });
  state.vaultLoading = false;
  if (result) {
    state.vaultResults = result;
  } else {
    state.vaultResults = 'Vault unavailable. Start proxy: node proxy.js';
  }
}

function handleMessageInput(e) {
  if (e.key === 'Escape') {
    playSfx('back');
    state.scene = 'menu';
    return;
  }
  if (e.key === 'Enter' && state.messageText.trim() && !state.messageSent) {
    playSfx('select');
    sendMessage(state.messageText.trim());
    return;
  }
  if (state.messageSent) return;
  if (e.key === 'Backspace') {
    state.messageText = state.messageText.slice(0, -1);
    return;
  }
  if (e.key.length === 1 && state.messageText.length < 500) {
    state.messageText += e.key;
  }
}

async function sendMessage(text) {
  const result = await mcpCall('leave_message', { text });
  if (result) {
    state.messageSent = true;
    playSfx('select');
  } else {
    showDialog('ghost', 'Message failed. Start proxy: node proxy.js');
    state.scene = 'menu';
  }
}

function handleSelect() {
  switch (state.scene) {
    case 'title':
      state.scene = 'connect';
      state.inputText = '';
      break;

    case 'dialog':
      advanceDialog();
      break;

    case 'menu':
      handleMenuSelect();
      break;

    case 'team':
      const p = PERSONAS[state.teamCursor];
      showDialog(p.id, `I am ${p.name}, the ${p.role}. Ready to assist.`);
      break;

    case 'content':
      const ci = state.contentItems[state.contentCursor];
      if (ci && ci.access !== 'locked') {
        state.readingScroll = 0;
        state.scene = 'reading';
      } else if (ci && ci.access === 'locked') {
        playSfx('locked');
        showDialog('ghost', 'This content is locked. Use request_access via MCP to unlock it.');
      }
      break;

    case 'reading':
      break;

    case 'skills':
      playSfx('locked');
      showDialog('ghost', 'Skill content is locked. Use bootstrap_session with session code to unlock.');
      break;
  }
}

function handleMenuSelect() {
  switch (state.menuCursor) {
    case 0: // Team
      state.scene = 'team';
      state.teamCursor = 0;
      break;
    case 1: // Skills
      state.scene = 'skills';
      state.skillsCursor = 0;
      break;
    case 2: // Library
      state.scene = 'content';
      fetchContent();
      break;
    case 3: // Vault
      state.scene = 'vault';
      state.vaultQuery = '';
      state.vaultResults = null;
      state.vaultLoading = false;
      break;
    case 4: // Message
      state.scene = 'message';
      state.messageText = '';
      state.messageSent = false;
      break;
    case 5: // About
      state.scene = 'about';
      state.aboutTab = 0;
      state.aboutScroll = 0;
      break;
    case 6: // Disconnect
      state.connected = false;
      state.serverUrl = '';
      state.scene = 'title';
      break;
  }
}

function handleUp() {
  switch (state.scene) {
    case 'menu':
      state.menuCursor = Math.max(0, state.menuCursor - 1);
      break;
    case 'team':
      state.teamCursor = Math.max(0, state.teamCursor - 1);
      break;
    case 'content':
      state.contentCursor = Math.max(0, state.contentCursor - 1);
      break;
    case 'reading':
      state.readingScroll = Math.max(0, state.readingScroll - 20);
      break;
    case 'skills':
      state.skillsCursor = Math.max(0, state.skillsCursor - 1);
      break;
    case 'about':
      state.aboutScroll = Math.max(0, (state.aboutScroll || 0) - 20);
      break;
  }
}

function handleDown() {
  switch (state.scene) {
    case 'menu':
      state.menuCursor = Math.min((state.menuItems.length || 7) - 1, state.menuCursor + 1);
      break;
    case 'team':
      state.teamCursor = Math.min(PERSONAS.length - 1, state.teamCursor + 1);
      break;
    case 'content':
      state.contentCursor = Math.min(state.contentItems.length - 1, state.contentCursor + 1);
      break;
    case 'reading':
      state.readingScroll = Math.min(state._maxScroll || 0, state.readingScroll + 20);
      break;
    case 'skills':
      state.skillsCursor = Math.min(SKILLS.length - 1, state.skillsCursor + 1);
      break;
    case 'about':
      state.aboutScroll = Math.min(state._aboutMaxScroll || 0, (state.aboutScroll || 0) + 20);
      break;
  }
}

function handleLeft() {
  if (state.scene === 'about') {
    playSfx('cursor');
    state.aboutTab = Math.max(0, state.aboutTab - 1);
    state.aboutScroll = 0;
  }
}

function handleRight() {
  if (state.scene === 'about') {
    playSfx('cursor');
    state.aboutTab = Math.min(ABOUT_TABS.length - 1, state.aboutTab + 1);
    state.aboutScroll = 0;
  }
}

function handleBack() {
  switch (state.scene) {
    case 'dialog':
      advanceDialog();
      break;
    case 'team':
    case 'content':
    case 'skills':
    case 'about':
    case 'vault':
    case 'message':
      state.scene = 'menu';
      break;
    case 'reading':
      state.scene = 'content';
      break;
    case 'menu':
      state.connected = false;
      state.scene = 'title';
      break;
    case 'connect':
      state.scene = 'title';
      break;
  }
}

// ── Start ──

init();
