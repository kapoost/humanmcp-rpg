// humanMCP RPG Client — Vanilla JS + Canvas
// FF7 PS1-style dialog boxes, pixel art portraits, typewriter text

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// ── Config ──

const PROXY_URL = 'http://localhost:3001';
const LOCAL_VAULT_URL = 'http://localhost:7331';
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

// Default personas — overwritten by live MCP data on connect
// Engine: Claude Sonnet 4 (all personas) | Haiku 4.5 (notatnik) | Ollama fallback
// Routing: AI picks one best-match persona per conversation chunk — no clutter
let PERSONAS = [
  { id: 'mira-chen', name: 'Mira Chen', role: 'Principal Engineer', color: '#88ccff',
    lv: 42, hp: 920, hpMax: 920, mp: 180, mpMax: 200, engine: 'sonnet',
    stats: { STR: 0.5, INT: 0.95, WIS: 0.85, DEX: 0.6, CHA: 0.7 },
    desc: 'Edge-first architecture, system design, tech decisions. Thinks in diagrams.' },
  { id: 'eleanor-voss', name: 'Eleanor Voss', role: 'UX/UI Designer', color: '#ff88aa',
    lv: 38, hp: 780, hpMax: 780, mp: 150, mpMax: 150, engine: 'sonnet',
    stats: { STR: 0.3, INT: 0.8, WIS: 0.9, DEX: 0.85, CHA: 0.8 },
    desc: 'Information architecture, typography, visual hierarchy. Makes complexity legible.' },
  { id: 'ghost', name: 'Ghost', role: 'Red Team Consultant', color: '#aaaaaa',
    lv: 50, hp: 666, hpMax: 666, mp: 300, mpMax: 300, engine: 'sonnet',
    stats: { STR: 0.7, INT: 0.9, WIS: 0.95, DEX: 0.9, CHA: 0.3 },
    desc: 'White hat operations, threat modeling, code audit. Trusts nothing.' },
  { id: 'hermiona', name: 'Hermiona', role: 'Intent Analyst & Doc Owner', color: '#cc88ff',
    lv: 35, hp: 650, hpMax: 650, mp: 220, mpMax: 220, engine: 'sonnet',
    stats: { STR: 0.3, INT: 0.85, WIS: 0.9, DEX: 0.5, CHA: 0.8 },
    desc: 'Context keeper, documentation ownership, intent analysis. Remembers everything.' },
  { id: 'george-carlin', name: 'George Carlin', role: 'Comedian & Social Critic', color: '#ffcc44',
    lv: 55, hp: 500, hpMax: 500, mp: 400, mpMax: 400, engine: 'sonnet',
    stats: { STR: 0.6, INT: 0.85, WIS: 0.95, DEX: 0.4, CHA: 1.0 },
    desc: 'End-of-council voice. Uncomfortable truths, reframing. Words as weapons.' },
  { id: 'harvey', name: 'Harvey', role: 'Prawnik — IP & Privacy', color: '#aa88ff',
    lv: 48, hp: 750, hpMax: 750, mp: 180, mpMax: 180, engine: 'sonnet',
    stats: { STR: 0.8, INT: 0.85, WIS: 0.7, DEX: 0.6, CHA: 0.95 },
    desc: 'IP, privacy, copyright, jurisdiction, corporate structures. Law is leverage.' },
  { id: 'hermes', name: 'Hermes', role: 'Process Optimizer', color: '#4488ff',
    lv: 36, hp: 600, hpMax: 600, mp: 250, mpMax: 250, engine: 'sonnet',
    stats: { STR: 0.3, INT: 0.8, WIS: 0.85, DEX: 0.8, CHA: 0.7 },
    desc: 'Systems thinking, workflow optimization, process design. Flow over friction.' },
  { id: 'axel-brandt', name: 'Axel Brandt', role: 'Principal QA Engineer', color: '#ffaa00',
    lv: 40, hp: 850, hpMax: 850, mp: 120, mpMax: 120, engine: 'sonnet',
    stats: { STR: 0.85, INT: 0.8, WIS: 0.7, DEX: 0.75, CHA: 0.4 },
    desc: 'Adversarial testing, edge cases, breaking assumptions. Finds what you missed.' },
  { id: 'kenji-mori', name: 'Kenji Mori', role: 'Master Mechanic', color: '#66aaff',
    lv: 39, hp: 800, hpMax: 800, mp: 100, mpMax: 100, engine: 'sonnet',
    stats: { STR: 0.9, INT: 0.7, WIS: 0.85, DEX: 0.8, CHA: 0.5 },
    desc: 'Japanese classic cars, diagnostics, restoration. Listens to engines.' },
  { id: 'lukasz-mazur', name: 'Lukasz Mazur', role: 'The Contrarian', color: '#ff6600',
    lv: 45, hp: 700, hpMax: 700, mp: 280, mpMax: 280, engine: 'sonnet',
    stats: { STR: 0.6, INT: 0.9, WIS: 0.95, DEX: 0.5, CHA: 0.7 },
    desc: 'Philosophical devil\'s advocate. Questions everything, especially consensus.' },
  { id: 'sophia-marchetti', name: 'Sophia Marchetti', role: 'Persuasion Specialist', color: '#ff66cc',
    lv: 41, hp: 680, hpMax: 680, mp: 190, mpMax: 190, engine: 'sonnet',
    stats: { STR: 0.5, INT: 0.8, WIS: 0.85, DEX: 0.65, CHA: 0.95 },
    desc: 'Communication, influence, framing. Makes people want what you\'re offering.' },
  { id: 'tomas-reyes', name: 'Tomas Reyes', role: 'Data Architect & ML Engineer', color: '#44ccff',
    lv: 37, hp: 720, hpMax: 720, mp: 220, mpMax: 220, engine: 'sonnet',
    stats: { STR: 0.4, INT: 0.95, WIS: 0.7, DEX: 0.8, CHA: 0.5 },
    desc: 'Data pipelines, ML models, architecture. Speaks in queries and tensors.' },
  { id: 'yuki-tanaka', name: 'Yuki Tanaka', role: 'Blue Team — Threat Hunter', color: '#ff4466',
    lv: 44, hp: 800, hpMax: 800, mp: 170, mpMax: 170, engine: 'sonnet',
    stats: { STR: 0.75, INT: 0.8, WIS: 0.8, DEX: 0.85, CHA: 0.5 },
    desc: 'Defensive security, threat hunting, incident response. Protects with honor.' },
  { id: 'zara', name: 'Zara', role: 'AI Whisperer & Prompt Engineer', color: '#aa44ff',
    lv: 99, hp: 999, hpMax: 999, mp: 999, mpMax: 999, engine: 'sonnet',
    stats: { STR: 0.6, INT: 0.95, WIS: 1.0, DEX: 0.7, CHA: 0.85 },
    desc: 'Multi-agent architect, MCP instructions owner. Entropy is her medium.' },
  { id: 'julka', name: 'Julka', role: 'Deep Research — Science & Bio', color: '#88eebb',
    lv: 38, hp: 750, hpMax: 750, mp: 300, mpMax: 300, engine: 'sonnet',
    stats: { STR: 0.4, INT: 0.95, WIS: 0.9, DEX: 0.7, CHA: 0.6 },
    desc: 'Scientific research, biology, tech deep dives. Cross-verifies sources. Zero hallucination.' },
  { id: 'ela', name: 'Ela', role: 'Deep Research — Business & Tech', color: '#ffbb66',
    lv: 38, hp: 750, hpMax: 750, mp: 300, mpMax: 300, engine: 'sonnet',
    stats: { STR: 0.4, INT: 0.9, WIS: 0.95, DEX: 0.75, CHA: 0.65 },
    desc: 'Business intelligence, market research, data scripts. Cross-verifies sources. Zero hallucination.' },
];

// ── Face Sprite Remap ──
// Sprites generated by PixelLab — remap where visual doesn't match role
const FACE_REMAP = {
  // kenji-mori: mechanic overalls sprite → Master Mechanic ✓ (no remap needed)
  // lukasz-mazur: tweed jacket sprite → The Contrarian ✓ (no remap needed)
};

// ── RPG Progression System ──

// Engine↔Vault ID mapping (engine uses full names, vault uses short slugs)
const ENGINE_TO_VAULT = {
  'hermes': 'hermes', 'mira-chen': 'mira', 'ghost': 'ghost',
  'eleanor-voss': 'eleanor', 'axel-brandt': 'axel', 'harvey': 'harvey',
  'lukasz-mazur': 'contrarian', 'hermiona': 'notatnik', 'george-carlin': 'carlin',
};
const VAULT_TO_ENGINE = {};
Object.keys(ENGINE_TO_VAULT).forEach(k => { VAULT_TO_ENGINE[ENGINE_TO_VAULT[k]] = k; });

const PROGRESSION_KEY = 'hmcp_rpg_progression';

function xpForLevel(lv) {
  return Math.floor(100 * Math.pow(lv, 1.5));
}

const ACHIEVEMENTS = [
  { id: 'first_session', name: 'First Contact', desc: 'Complete your first live session', icon: '⚡', check: p => (p.prog.sessions || 0) >= 1 },
  { id: 'ten_sessions', name: 'Regular', desc: 'Participate in 10 sessions', icon: '🔁', check: p => (p.prog.sessions || 0) >= 10 },
  { id: 'fifty_contrib', name: 'Veteran', desc: '50 contributions total', icon: '🏅', check: p => (p.prog.totalContribs || 0) >= 50 },
  { id: 'lv10', name: 'Double Digits', desc: 'Reach level 10', icon: '🔟', check: p => p.lv >= 10 },
  { id: 'lv25', name: 'Silver Rank', desc: 'Reach level 25', icon: '🥈', check: p => p.lv >= 25 },
  { id: 'lv50', name: 'Gold Rank', desc: 'Reach level 50', icon: '🥇', check: p => p.lv >= 50 },
  { id: 'mp_drain', name: 'Burnt Out', desc: 'Use up all MP in a session', icon: '💀', check: p => (p.prog.mpDrained || false) },
  { id: 'streak3', name: 'On a Roll', desc: '3 sessions in 3 days', icon: '🔥', check: p => (p.prog.streak || 0) >= 3 },
  { id: 'multi5', name: 'Council Voice', desc: '5+ contributions in one session', icon: '🗣', check: p => (p.prog.maxContribSession || 0) >= 5 },
  { id: 'notebook5', name: 'Chronicler', desc: '5 notebook entries', icon: '📖', check: p => (p.prog.notebook || []).length >= 5 },
];

// Notebook fallback voices — used when vault AI is unreachable
const NOTEBOOK_VOICE = {
  'ghost': (lv) => `[SIGINT log #${lv}] Another level. Trust no one—especially yourself at 3 AM.`,
  'mira-chen': (lv) => `Architecture note: At level ${lv}, the system complexity graph shifts.`,
  'george-carlin': (lv) => `Level ${lv}. Still nobody knows what they're doing. Including me.`,
  'default': (lv) => `Poziom ${lv}. Kolejna sesja za nami.`,
};

function _applyProgData(saved) {
  PERSONAS.forEach(p => {
    const s = saved[p.id] || {};
    p.prog = {
      xp: s.xp || 0,
      sessions: s.sessions || 0,
      totalContribs: s.totalContribs || s.contributions || 0,
      maxContribSession: s.maxContribSession || s.max_contrib_session || 0,
      mpDrained: s.mpDrained || s.mp_drained || false,
      streak: s.streak || 0,
      lastSessionDate: s.lastSessionDate || s.last_session_date || null,
      achievements: s.achievements || [],
      notebook: s.notebook || [],
      appliedTier: s.applied_tier || s.appliedTier || 0,
      relationships: s.relationships || {},
      modelTier: s.model_tier || s.modelTier || '',
    };
    // Recalculate level from XP
    let lv = 1;
    let remaining = p.prog.xp;
    while (remaining >= xpForLevel(lv)) {
      remaining -= xpForLevel(lv);
      lv++;
    }
    p.lv = lv;
    p.prog._xpInLevel = remaining;
  });
}

function loadProgression() {
  // Try vault first, fall back to localStorage
  fetch(LOCAL_VAULT_URL + '/progression')
    .then(r => r.ok ? r.json() : Promise.reject('vault'))
    .then(saved => {
      _applyProgData(saved);
      // Mirror to localStorage as backup
      try { localStorage.setItem(PROGRESSION_KEY, JSON.stringify(saved)); } catch (_) {}
    })
    .catch(() => {
      // Fallback: localStorage
      try {
        const raw = localStorage.getItem(PROGRESSION_KEY);
        _applyProgData(raw ? JSON.parse(raw) : {});
      } catch (e) {
        console.warn('Progression load failed:', e);
        PERSONAS.forEach(p => {
          p.prog = { xp: 0, sessions: 0, totalContribs: 0, maxContribSession: 0,
            mpDrained: false, streak: 0, lastSessionDate: null, achievements: [], notebook: [], appliedTier: 0 };
          p.prog._xpInLevel = 0;
        });
      }
    });
}

function _buildProgData() {
  const data = {};
  PERSONAS.forEach(p => {
    if (!p.prog) return;
    data[p.id] = {
      xp: p.prog.xp,
      sessions: p.prog.sessions,
      totalContribs: p.prog.totalContribs,
      maxContribSession: p.prog.maxContribSession,
      mpDrained: p.prog.mpDrained,
      streak: p.prog.streak,
      lastSessionDate: p.prog.lastSessionDate,
      achievements: p.prog.achievements,
      notebook: p.prog.notebook,
      applied_tier: p.prog.appliedTier || 0,
      relationships: p.prog.relationships || {},
      model_tier: p.prog.modelTier || '',
    };
  });
  return data;
}

function saveProgression() {
  const data = _buildProgData();
  // Save to vault (triggers evolution tier check server-side)
  fetch(LOCAL_VAULT_URL + '/progression', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {});
  // Always mirror to localStorage as backup
  try { localStorage.setItem(PROGRESSION_KEY, JSON.stringify(data)); } catch (_) {}
}

function awardXP(persona, amount) {
  if (!persona.prog) return [];
  persona.prog.xp += amount;
  const events = [];
  let leveled = false;
  let remaining = persona.prog._xpInLevel + amount;
  while (remaining >= xpForLevel(persona.lv)) {
    remaining -= xpForLevel(persona.lv);
    persona.lv++;
    leveled = true;
    events.push({ type: 'levelup', persona: persona.id, lv: persona.lv });
  }
  persona.prog._xpInLevel = remaining;
  // Check achievements
  let latestAchievement = '';
  ACHIEVEMENTS.forEach(a => {
    if (!persona.prog.achievements.includes(a.id) && a.check(persona)) {
      persona.prog.achievements.push(a.id);
      events.push({ type: 'achievement', persona: persona.id, achievement: a });
      latestAchievement = a.name;
    }
  });
  // Trigger vault evolution on level-up or new achievement
  if (leveled || latestAchievement) {
    const coParticipants = Object.keys(state._sessionXP || {}).map(id => ENGINE_TO_VAULT[id] || id);
    _evolvePersona(persona, coParticipants, latestAchievement);
  }
  saveProgression();
  return events;
}

function _evolvePersona(persona, coParticipants, achievement) {
  // Call vault to evolve persona — AI updates prompt + generates notebook entry
  const fallbackVoice = NOTEBOOK_VOICE[persona.id] || NOTEBOOK_VOICE['default'] || ((lv) => `Lv ${lv}.`);
  const vaultId = ENGINE_TO_VAULT[persona.id] || persona.id;
  fetch(LOCAL_VAULT_URL + '/persona/' + vaultId + '/evolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      level: persona.lv,
      sessions: persona.prog.sessions || 0,
      contributions: persona.prog.totalContribs || 0,
      co_participants: coParticipants,
      achievement: achievement || '',
    }),
  })
    .then(r => r.ok ? r.json() : Promise.reject('evolve'))
    .then(result => {
      // Use AI-generated notebook entry, or fallback
      persona.prog.notebook.push({
        lv: persona.lv,
        text: result.notebook || fallbackVoice(persona.lv),
        date: new Date().toISOString(),
      });
      if (result.evolution) {
        persona.desc = result.evolution; // Update visible description too
      }
      saveProgression();
    })
    .catch(() => {
      // Fallback: use static template
      persona.prog.notebook.push({
        lv: persona.lv,
        text: fallbackVoice(persona.lv),
        date: new Date().toISOString(),
      });
      saveProgression();
    });
}

// ── Micro-comments: short, event-driven notebook entries during session ──

const MICRO_TRIGGERS = {
  first_contrib:  (p) => `Pierwszy wkład w tej sesji.`,
  contrib_5:      (p) => `5 wkładów — rozkręcam się.`,
  contrib_10:     (p) => `10 wkładów. Dziś nie odpuszczam.`,
  mp_low:         (p) => `MP na wyczerpaniu. Czas na regenerację.`,
  mp_drained:     (p) => `Wypalenie. Dałem z siebie wszystko.`,
  new_speaker:    (p, ctx) => `Nowy głos: ${ctx}. Ciekawe co wniesie.`,
  long_session:   (p) => `Sesja trwa 30+ min. Wciągająca rozmowa.`,
};

function _microComment(persona, trigger, ctx) {
  if (!persona.prog) return;
  // Deduplicate: don't repeat same trigger in this session
  const key = trigger + ':' + persona.id;
  if (!state._microSeen) state._microSeen = {};
  if (state._microSeen[key]) return;
  state._microSeen[key] = true;

  const gen = MICRO_TRIGGERS[trigger];
  if (!gen) return;
  const text = gen(persona, ctx);
  persona.prog.notebook.push({
    lv: persona.lv,
    text,
    date: new Date().toISOString(),
    micro: true,
  });
  // Don't save immediately — batch with next saveProgression()
}

function estimateTokens(text) {
  // Rough: ~4 chars per token for English, ~3 for mixed
  return Math.ceil((text || '').length / 3.5);
}

function drainMP(persona, tokens) {
  if (!persona.prog) return;
  const cost = Math.ceil(tokens / 10); // 1 MP per ~10 tokens
  persona.mp = Math.max(0, persona.mp - cost);
  if (persona.mp === 0) persona.prog.mpDrained = true;
}

function regenMP() {
  PERSONAS.forEach(p => {
    p.mp = Math.min(p.mpMax, p.mp + Math.ceil(p.mpMax * 0.3));
  });
}

// ── Skills Data ──

// Default skills — overwritten by live MCP data on connect
let SKILLS = [
  { id: 'notatnik', name: 'Notatnik', cat: 'workflow', icon: '\u{1f4dd}', locked: false,
    desc: 'Live meeting scribe (Haiku 4.5). Always active. Rolling notes \u2014 adds, edits, never rewrites.' },
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

// Default author — overwritten by live MCP data on connect
let AUTHOR = {
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

  SFX.battle = () => {
    // FF7 battle encounter — rising sweep + impact
    const t = audioCtx.currentTime;
    // Sweep up
    const sweep = audioCtx.createOscillator();
    const sweepGain = audioCtx.createGain();
    sweep.connect(sweepGain);
    sweepGain.connect(audioCtx.destination);
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(200, t);
    sweep.frequency.exponentialRampToValueAtTime(2000, t + 0.4);
    sweepGain.gain.setValueAtTime(0.15, t);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    sweep.start(t);
    sweep.stop(t + 0.5);
    // Impact hit
    const hit = audioCtx.createOscillator();
    const hitGain = audioCtx.createGain();
    hit.connect(hitGain);
    hitGain.connect(audioCtx.destination);
    hit.type = 'square';
    hit.frequency.value = 80;
    hitGain.gain.setValueAtTime(0.2, t + 0.4);
    hitGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    hit.start(t + 0.4);
    hit.stop(t + 0.8);
    // Fanfare notes
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g);
      g.connect(audioCtx.destination);
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.08, t + 0.8 + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.8 + i * 0.12 + 0.3);
      o.start(t + 0.8 + i * 0.12);
      o.stop(t + 0.8 + i * 0.12 + 0.3);
    });
  };

  SFX.alert = () => {
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    o.type = 'triangle';
    o.frequency.setValueAtTime(600, t);
    o.frequency.setValueAtTime(900, t + 0.15);
    o.frequency.setValueAtTime(600, t + 0.3);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.start(t);
    o.stop(t + 0.4);
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

// ── Title Music — original melancholic arpeggio (music-box style) ──

let titleMusicCtx = null;
let titleMusicNodes = [];
let titleMusicTimer = null;

function startTitleMusic() {
  if (titleMusicTimer) return; // already playing
  titleMusicCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Original melody — wistful, gentle, looping arpeggio in A minor
  // Not Aerith's theme — an original composition in similar spirit
  const bpm = 72;
  const beat = 60 / bpm;
  const melody = [
    // phrase 1 — descending lullaby
    { note: 'E5',  dur: 1.5 },
    { note: 'C5',  dur: 0.5 },
    { note: 'D5',  dur: 1   },
    { note: 'B4',  dur: 1   },
    { note: 'A4',  dur: 1.5 },
    { note: 'G4',  dur: 0.5 },
    { note: 'A4',  dur: 2   },
    // phrase 2 — hopeful rise
    { note: 'C5',  dur: 1   },
    { note: 'D5',  dur: 0.5 },
    { note: 'E5',  dur: 1.5 },
    { note: 'D5',  dur: 0.5 },
    { note: 'C5',  dur: 0.5 },
    { note: 'B4',  dur: 1   },
    { note: 'A4',  dur: 1   },
    { note: null,   dur: 1.5 }, // rest
    // phrase 3 — gentle resolve
    { note: 'E5',  dur: 1   },
    { note: 'F5',  dur: 0.5 },
    { note: 'E5',  dur: 1   },
    { note: 'D5',  dur: 0.5 },
    { note: 'C5',  dur: 1   },
    { note: 'B4',  dur: 0.5 },
    { note: 'A4',  dur: 2.5 },
    { note: null,   dur: 1   }, // rest before loop
  ];

  const noteFreqs = {
    'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
  };

  let noteIndex = 0;

  function playNote() {
    if (!titleMusicCtx) return;
    const { note, dur } = melody[noteIndex % melody.length];
    const duration = dur * beat;

    if (note && noteFreqs[note]) {
      const osc = titleMusicCtx.createOscillator();
      const gain = titleMusicCtx.createGain();
      osc.connect(gain);
      gain.connect(titleMusicCtx.destination);

      osc.type = 'triangle';
      osc.frequency.value = noteFreqs[note];

      const now = titleMusicCtx.currentTime;
      // soft attack, gentle sustain, slow fade
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.05);
      gain.gain.setValueAtTime(0.06, now + duration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.95);

      osc.start(now);
      osc.stop(now + duration);
      titleMusicNodes.push(osc, gain);
    }

    noteIndex++;
    titleMusicTimer = setTimeout(playNote, duration * 1000);
  }

  playNote();
}

function stopTitleMusic() {
  if (titleMusicTimer) {
    clearTimeout(titleMusicTimer);
    titleMusicTimer = null;
  }
  titleMusicNodes.forEach(n => { try { n.disconnect(); } catch(e) {} });
  titleMusicNodes = [];
  if (titleMusicCtx) {
    titleMusicCtx.close().catch(() => {});
    titleMusicCtx = null;
  }
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
  scene: 'title',       // title | menu | dialog | team | content | reading | skills | about | settings
  faces: {},             // loaded face images
  portraits: {},         // HR 180x180 portraits for detail/dialog
  contentImages: {},     // loaded content images
  facesLoaded: 0,
  typewriter: null,      // current typewriter animation
  menuCursor: 0,
  menuItems: [],
  consoleLogs: [],       // ring buffer of console messages [{text, time, color}]
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
  vaultSource: 'local',  // 'local' (mysloodsiewnia) | 'mcp' (humanMCP)
  vaultTypeFilter: 'all', // 'all' | 'pdf' | 'note' | 'contact' | 'transcript'
  logItems: [],
  logCursor: 0,
  logBody: null,
  logSlug: null,      // current transcript slug
  logBrief: null,     // cached brief data {summary, sections}
  logBriefMode: false, // true = show brief, false = show raw
  logBriefLoading: false,
  logLoading: false,
  naradaPrompt: '',
  naradaResults: null,
  naradaLoading: false,
  naradaShowIdx: -1,
  // Live transcription
  liveWs: null,
  liveRecorder: null,
  liveStream: null,
  liveActive: false,
  liveElapsed: 0,
  liveStartTime: 0,
  liveBubbles: [],       // [{id, speaker, text, color, isPersona, time}]
  liveSpeakers: {},       // {name: {color, seconds, percent, avatar}}
  livePersonaQueue: [],   // incoming persona comments to stagger
  liveScroll: 0,
  liveWhoCursor: 0,
  liveWhoFocused: true,  // sidebar focused when idle (no recording)
  liveSummary: null,
  _lastChunkSent: 0,    // timestamp of last audio chunk sent to vault
  _vaultOk: false,       // vault connection status
  _wsOk: false,          // WebSocket connection status
  _phoneMic: null,       // phone mic WebSocket
  _phoneMicOk: false,    // phone mic connected
  _sessionXP: {},        // {personaId: {contributions: N, tokens: N}} — reset each session
  _sessionEvents: [],    // levelups/achievements from this session
  teamTab: 0,            // 0=stats, 1=achievements, 2=notebook
  liveMood: null,        // {mood, icon, label, color}
  liveMoodTime: 0,
  liveCharacters: {},       // {speakerId: {name, epithet, traits, seconds, percent, color}}
  liveEvents: [],           // [{event, title, detail, severity, time}]
  _liveEventAnim: null,     // current event animation state
  messageText: '',
  messageSent: false,
  proxyAvailable: false,
  proxyToken: '',
  sessionCode: '',
  serverUrl: '',
  anthropicKey: '',
  connected: false,
  settingsField: 0,  // 0 = URL, 1 = session code, 2 = API key
  settingsUrl: '',
  settingsSession: '',
  settingsKey: '',
  // Launcher state
  _launcherProbed: false,
  _launcherStatus: {
    proxy: 'checking',   // 'checking' | 'online' | 'offline'
    vault: 'checking',
    ollama: 'checking',
  },
  _launcherAutoConnect: false,
  inputActive: false,
  inputText: '',
  tokenInput: '',
  sessionInput: '',
  connectField: 0,  // 0 = URL, 1 = token, 2 = session code
  inputCallback: null,
  starField: [],
  seenTips: {},  // one-time George Carlin tips per scene
};

// ── Settings persistence ──

function loadSettings() {
  return {
    serverUrl: localStorage.getItem('hmcp_server_url') || 'https://kapoost-humanmcp.fly.dev/mcp',
    sessionCode: localStorage.getItem('hmcp_session_code') || '',
    anthropicKey: localStorage.getItem('hmcp_anthropic_key') || '',
  };
}

function saveSettings(s) {
  localStorage.setItem('hmcp_server_url', s.serverUrl);
  localStorage.setItem('hmcp_session_code', s.sessionCode);
  if (s.anthropicKey) localStorage.setItem('hmcp_anthropic_key', s.anthropicKey);
  else localStorage.removeItem('hmcp_anthropic_key');
}

// ── Direct MCP (no proxy) ──

const ALLOWED_TOOLS = new Set([
  'get_author_profile', 'list_content', 'read_content', 'verify_content',
  'get_certificate', 'list_personas', 'get_persona', 'list_skills', 'get_skill',
  'list_blobs', 'query_vault', 'recall', 'leave_comment', 'leave_message',
  'request_access', 'submit_answer', 'about_humanmcp', 'bootstrap_session',
]);

const VAULT_FEATURES = new Set(['Live', 'Log', 'Narada']);

async function mcpDirect(url, tool, args) {
  if (!ALLOWED_TOOLS.has(tool)) throw new Error(`Tool ${tool} not allowed`);
  const payload = {
    jsonrpc: '2.0',
    id: crypto.randomUUID(),
    method: 'tools/call',
    params: { name: tool, arguments: args || {} }
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message);
  const texts = (data.result?.content || []).filter(c => c.type === 'text');
  return texts.map(c => c.text).join('\n');
}

// ── Launcher — probe all servers ──

async function launcherProbe() {
  if (state._launcherProbed) return;
  state._launcherProbed = true;

  // Probe all three in parallel
  const probes = [
    // Proxy
    fetch(`${PROXY_URL}/health`, { signal: AbortSignal.timeout(2000) })
      .then(r => r.json())
      .then(d => {
        state._launcherStatus.proxy = d.status === 'ok' ? 'online' : 'offline';
        // Auto-fetch token
        if (d.status === 'ok') {
          return fetch(`${PROXY_URL}/token`, { signal: AbortSignal.timeout(1000) })
            .then(r => r.json())
            .then(t => { if (t.token) state.proxyToken = t.token; })
            .catch(() => {});
        }
      })
      .catch(() => { state._launcherStatus.proxy = 'offline'; }),

    // Vault
    fetch(`${LOCAL_VAULT_URL}/health`, { signal: AbortSignal.timeout(2000) })
      .then(r => { state._launcherStatus.vault = r.ok ? 'online' : 'offline'; })
      .catch(() => { state._launcherStatus.vault = 'offline'; }),

    // Ollama
    fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2000) })
      .then(r => { state._launcherStatus.ollama = r.ok ? 'online' : 'offline'; })
      .catch(() => { state._launcherStatus.ollama = 'offline'; }),
  ];

  await Promise.allSettled(probes);

  // Log probe results
  const s = state._launcherStatus;
  if (s.proxy === 'online') logConsole('Proxy online :3001', '#44dd88');
  if (s.vault === 'online') logConsole('my\u015bloodsiewnia online :7331', '#44dd88');
  else if (s.vault === 'offline') logConsole('my\u015bloodsiewnia offline', COLORS.textDisabled);
  if (s.ollama === 'online') logConsole('Ollama online :11434', '#44dd88');

  // Mark ready but don't auto-connect — user presses ENTER
  if (state._launcherStatus.proxy === 'online' && state.proxyToken) {
    state._launcherAutoConnect = true; // used for status display only
  }
}

// Re-probe (triggered by user pressing R on title screen)
function launcherReprobe() {
  state._launcherProbed = false;
  state._launcherAutoConnect = false;
  state._launcherStatus = { proxy: 'checking', vault: 'checking', ollama: 'checking' };
  launcherProbe();
}

// ── Init ──

const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

function init() {
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', handleKey);
  window.addEventListener('paste', handlePaste);

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

  // load HR portraits for detail/dialog
  loadPortraits();

  // init animated face thumbnails (Pixi.js offscreen)
  if (window.PixiFaces) PixiFaces.init(PERSONAS);

  // load settings from localStorage
  const savedSettings = loadSettings();
  state.serverUrl = savedSettings.serverUrl;
  state.sessionCode = savedSettings.sessionCode;
  state.anthropicKey = savedSettings.anthropicKey;

  // load progression from localStorage
  loadProgression();

  // load author avatar
  const authorImg = new Image();
  authorImg.onload = () => { state.faces['kapoost'] = authorImg; };
  authorImg.src = 'sprites/faces/kapoost.png';

  // mobile touch controls
  if (isMobile) {
    const touchControls = document.getElementById('touch-controls');
    const mobileInput = document.getElementById('mobile-input');
    touchControls.classList.add('visible');

    // d-pad and action buttons
    document.querySelectorAll('.touch-btn').forEach(btn => {
      const key = btn.dataset.key;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleKey({ key, preventDefault() {} });
      }, { passive: false });
    });

    // prevent canvas touch from scrolling
    canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    // mobile keyboard for text input scenes
    mobileInput.addEventListener('input', (e) => {
      const val = mobileInput.value;
      if (!val) return;
      // simulate keypress for each new character
      const lastChar = val.slice(-1);
      handleKey({ key: lastChar, preventDefault() {} });
      // clear after a tick to avoid accumulation
      setTimeout(() => { mobileInput.value = ''; }, 0);
    });

    mobileInput.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' || e.key === 'Enter') {
        e.preventDefault();
        handleKey({ key: e.key, preventDefault() {} });
      }
    });

    // auto-focus mobile input on text scenes
    setInterval(() => {
      const textScene = ['connect', 'vault', 'message', 'narada', 'settings'].includes(state.scene);
      if (textScene && document.activeElement !== mobileInput) {
        mobileInput.focus();
      }
    }, 500);
  }

  // probe servers on startup
  launcherProbe();

  // start render loop
  requestAnimationFrame(loop);
}

function resize() {
  const maxW = window.innerWidth;
  const maxH = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;

  // on mobile: fill screen (minus touch controls), use fractional scaling
  // on desktop: integer scaling for crisp pixels
  const touchH = isMobile ? 140 : 0;
  const availH = maxH - touchH;

  let scale;
  if (isMobile) {
    scale = Math.min(maxW / BASE_W, availH / BASE_H);
  } else {
    scale = Math.min(Math.floor(maxW / BASE_W), Math.floor(maxH / BASE_H)) || 1;
  }

  const cssW = Math.floor(BASE_W * scale);
  const cssH = Math.floor(BASE_H * scale);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = Math.floor(BASE_W * scale * dpr);
  canvas.height = Math.floor(BASE_H * scale * dpr);
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

function loadFaces() {
  state.facesLoaded = 0;
  PERSONAS.forEach(p => {
    if (state.faces[p.id]) { state.facesLoaded++; return; } // already loaded
    const img = new Image();
    img.onload = () => {
      state.faces[p.id] = img;
      state.facesLoaded++;
    };
    img.onerror = () => {
      // generate procedural pixel avatar as fallback
      state.faces[p.id] = generateAvatar(p.name, 48);
      state.facesLoaded++;
    };
    const spriteId = FACE_REMAP[p.id] || p.id;
    img.src = `sprites/faces/${spriteId}.png`;
  });
}

function loadPortraits() {
  PERSONAS.forEach(p => {
    const img = new Image();
    img.onload = () => { state.portraits[p.id] = img; };
    // silently skip if no portrait exists
    img.src = `sprites/faces/portraits/${p.id}/rotations/south.png`;
  });
  // also load kapoost portrait
  const k = new Image();
  k.onload = () => { state.portraits['kapoost'] = k; };
  k.src = 'sprites/faces/portraits/kapoost/rotations/south.png';
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
  // update animated face thumbnails
  if (window.PixiFaces && PixiFaces.enabled) PixiFaces.update(dt);

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

// ── Console Log ──

const CONSOLE_MAX = 50;

function logConsole(text, color) {
  state.consoleLogs.push({ text, time: Date.now(), color: color || COLORS.textDisabled });
  if (state.consoleLogs.length > CONSOLE_MAX) state.consoleLogs.shift();
}

function renderConsole() {
  const logH = 44;
  const logY = BASE_H - 28 - logH - 2;
  drawBox(10, logY, BASE_W - 20, logH);

  // Show last N lines that fit
  const lineH = 10;
  const maxLines = Math.floor((logH - 8) / lineH);
  const logs = state.consoleLogs.slice(-maxLines);

  ctx.save();
  ctx.beginPath();
  ctx.rect(12, logY + 2, BASE_W - 24, logH - 4);
  ctx.clip();

  logs.forEach((entry, i) => {
    const ly = logY + 10 + i * lineH;
    const age = Date.now() - entry.time;
    const alpha = age < 10000 ? 1.0 : Math.max(0.4, 1.0 - (age - 10000) / 30000);
    ctx.globalAlpha = alpha;
    // timestamp
    const ts = new Date(entry.time);
    const timeStr = String(ts.getHours()).padStart(2, '0') + ':' + String(ts.getMinutes()).padStart(2, '0') + ':' + String(ts.getSeconds()).padStart(2, '0');
    drawText(timeStr, 16, ly, COLORS.textDisabled, 7);
    // message (truncate to fit)
    const msg = entry.text.length > 55 ? entry.text.slice(0, 52) + '...' : entry.text;
    drawText(msg, 60, ly, entry.color, 8);
  });

  ctx.globalAlpha = 1;
  ctx.restore();
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
    case 'settings': renderSettings(); break;
    case 'vault': renderVault(); break;
    case 'message': renderMessage(); break;
    case 'log': renderLog(); break;
    case 'narada': renderNarada(); break;
    case 'live': renderLive(); break;
    case 'live-summary': renderLiveSummary(); break;
  }

  // ── Console log overlay (menu and sub-scenes) ──
  if (state.consoleLogs.length > 0 && state.scene === 'menu') {
    renderConsole();
  }

  // ── Battle encounter overlay ──
  if (state._encounter) renderEncounter();
}

// ── FF7 Battle Encounter Animation ──

function triggerEncounter(title, subtitle, text, color) {
  state._encounter = {
    start: Date.now(),
    title: title || 'ENCOUNTER',
    subtitle: subtitle || '',
    text: text || '',
    color: color || '#ffcc00',
    phase: 0, // 0=wipe, 1=flash, 2=card, 3=fadeout
  };
  playSfx('battle');
}

function dismissEncounter() {
  if (state._encounter && state._encounter.phase >= 2) {
    state._encounter.phase = 3;
    state._encounter.phaseStart = Date.now();
  }
}

function renderEncounter() {
  const enc = state._encounter;
  const elapsed = Date.now() - enc.start;

  // Phase 0: Diagonal wipe (0-400ms)
  if (enc.phase === 0) {
    const t = Math.min(1, elapsed / 400);
    // Diagonal slashes sweeping across screen
    const numSlashes = 6;
    for (let i = 0; i < numSlashes; i++) {
      const offset = (t * (BASE_W + BASE_H + 200)) - i * 60;
      if (offset < -60 || offset > BASE_W + BASE_H + 60) continue;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset + 40, 0);
      ctx.lineTo(offset + 40 - BASE_H, BASE_H);
      ctx.lineTo(offset - BASE_H, BASE_H);
      ctx.closePath();
      const alpha = Math.max(0, 1 - Math.abs(offset - (BASE_W / 2)) / (BASE_W));
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
      ctx.fill();
      ctx.restore();
    }
    if (elapsed > 400) { enc.phase = 1; enc.phaseStart = Date.now(); }
  }

  // Phase 1: White flash (400-700ms)
  if (enc.phase === 1) {
    const ft = (Date.now() - enc.phaseStart) / 300;
    const flashAlpha = ft < 0.3 ? ft / 0.3 : Math.max(0, 1 - (ft - 0.3) / 0.7);
    ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    if (ft >= 1) { enc.phase = 2; enc.phaseStart = Date.now(); }
  }

  // Phase 2: Full-screen boss card
  if (enc.phase === 2) {
    const ct = Math.min(1, (Date.now() - enc.phaseStart) / 500);

    // Black background with scanlines
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    // Animated scanlines
    ctx.fillStyle = '#ffffff08';
    for (let sy = (Date.now() / 50 % 4); sy < BASE_H; sy += 4) {
      ctx.fillRect(0, sy, BASE_W, 1);
    }

    // Dramatic red/gold border glow
    const glowPulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.005);
    const borderCol = enc.color;
    ctx.shadowColor = borderCol;
    ctx.shadowBlur = 20 * glowPulse;
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, BASE_W - 40, BASE_H - 40);
    ctx.shadowBlur = 0;

    // Inner border
    ctx.strokeStyle = borderCol + '44';
    ctx.lineWidth = 1;
    ctx.strokeRect(26, 26, BASE_W - 52, BASE_H - 52);

    // Corner accents
    const corners = [[24, 24], [BASE_W - 24, 24], [24, BASE_H - 24], [BASE_W - 24, BASE_H - 24]];
    corners.forEach(([cx, cy]) => {
      ctx.fillStyle = borderCol;
      ctx.fillRect(cx - 4, cy - 4, 8, 8);
    });

    // "ENCOUNTER" label — slides in from top
    const slideY = 60 + (1 - ct) * -40;
    ctx.textAlign = 'center';
    ctx.font = 'bold 8px "Courier New", monospace';
    ctx.fillStyle = '#ff444488';
    ctx.fillText('— E N C O U N T E R —', BASE_W / 2, slideY);

    // Main title — big, dramatic, with shadow
    const titleY = 110 + (1 - ct) * -20;
    ctx.font = 'bold 22px "Courier New", monospace';
    // Shadow
    ctx.fillStyle = '#000';
    ctx.fillText(enc.title, BASE_W / 2 + 2, titleY + 2);
    // Glow
    ctx.shadowColor = borderCol;
    ctx.shadowBlur = 15;
    ctx.fillStyle = borderCol;
    ctx.fillText(enc.title, BASE_W / 2, titleY);
    ctx.shadowBlur = 0;

    // Subtitle
    if (enc.subtitle) {
      ctx.font = '11px "Courier New", monospace';
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText(enc.subtitle, BASE_W / 2, titleY + 28);
    }

    // Decorative line
    const lineW = 120 * ct;
    ctx.strokeStyle = borderCol + '66';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(BASE_W / 2 - lineW, titleY + 40);
    ctx.lineTo(BASE_W / 2 + lineW, titleY + 40);
    ctx.stroke();

    // Body text — typewriter effect
    if (enc.text) {
      const textElapsed = Math.max(0, Date.now() - enc.phaseStart - 600);
      const charsToShow = Math.floor(textElapsed / 30);
      const visibleText = enc.text.substring(0, charsToShow);

      ctx.font = '10px "Courier New", monospace';
      ctx.fillStyle = '#cccccc';
      const lines = [];
      const words = visibleText.split(' ');
      let line = '';
      words.forEach(w => {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > BASE_W - 80) {
          lines.push(line);
          line = w;
        } else {
          line = test;
        }
      });
      if (line) lines.push(line);
      lines.forEach((l, i) => {
        ctx.fillText(l, BASE_W / 2, titleY + 60 + i * 16);
      });
    }

    // Bottom hint — pulsing
    const hintAlpha = 0.3 + 0.3 * Math.sin(Date.now() * 0.004);
    ctx.font = '8px "Courier New", monospace';
    ctx.fillStyle = `rgba(255, 255, 255, ${hintAlpha})`;
    ctx.fillText('press any key', BASE_W / 2, BASE_H - 40);

    ctx.textAlign = 'left'; // reset
  }

  // Phase 3: Fade out (300ms)
  if (enc.phase === 3) {
    const fo = (Date.now() - enc.phaseStart) / 300;
    if (fo < 1) {
      ctx.fillStyle = `rgba(0, 0, 0, ${1 - fo})`;
      ctx.fillRect(0, 0, BASE_W, BASE_H);
    } else {
      state._encounter = null;
    }
  }
}

// ── Live Event Animation (non-blocking notification overlay) ──

const LIVE_EVENT_ICONS = {
  topic_change: '\u25C6',    // ◆
  key_decision: '\u2726',    // ✦
  summary_relevant: '\u2605', // ★
  name_detected: '\u25C9',   // ◉
  milestone: '\u25CF',       // ●
};

const LIVE_EVENT_COLORS = {
  info: '#4488ff',
  warn: '#ffaa00',
  critical: '#ff4444',
};

const LIVE_EVENT_SFX = {
  topic_change: 'select',
  key_decision: 'select',
  milestone: 'cursor',
  critical: 'alert',
};

function triggerLiveEvent(evt) {
  // If an event is already showing, accelerate it to phase 3
  if (state._liveEventAnim && state._liveEventAnim.phase < 3) {
    state._liveEventAnim.phase = 3;
    state._liveEventAnim.phaseStart = Date.now();
  }

  const severity = evt.severity || 'info';
  const sfxName = LIVE_EVENT_SFX[evt.event] || (severity === 'critical' ? 'alert' : 'cursor');
  playSfx(sfxName);

  state._liveEventAnim = {
    start: Date.now(),
    phase: 0,
    phaseStart: Date.now(),
    event: evt.event || 'info',
    title: evt.title || '',
    detail: evt.detail || '',
    severity: severity,
    color: LIVE_EVENT_COLORS[severity] || LIVE_EVENT_COLORS.info,
    icon: LIVE_EVENT_ICONS[evt.event] || '\u25C6',
  };
}

function renderLiveEvent(bubbleX, bubbleW) {
  const anim = state._liveEventAnim;
  if (!anim) return;

  const elapsed = Date.now() - anim.start;
  const now = Date.now();

  // Phase transitions
  if (anim.phase === 0 && elapsed > 150) {
    anim.phase = 1; anim.phaseStart = now;
  } else if (anim.phase === 1 && elapsed > 600) {
    anim.phase = 2; anim.phaseStart = now;
  } else if (anim.phase === 2 && elapsed > 3500) {
    anim.phase = 3; anim.phaseStart = now;
  } else if (anim.phase === 3 && (now - anim.phaseStart) > 500) {
    state._liveEventAnim = null;
    return;
  }

  const bannerH = 36;
  const bannerY = 48;

  // Phase 0: Horizontal accent line sweeps across (0-150ms)
  if (anim.phase === 0) {
    const t = Math.min(1, elapsed / 150);
    const lineX = bubbleX + bubbleW * t;
    ctx.strokeStyle = anim.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(bubbleX, bannerY + bannerH / 2);
    ctx.lineTo(lineX, bannerY + bannerH / 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    return;
  }

  // Phase 1: Banner slides in from right (150-600ms)
  let slideT = 1;
  if (anim.phase === 1) {
    slideT = Math.min(1, (now - anim.phaseStart) / 450);
    // Ease out cubic
    slideT = 1 - Math.pow(1 - slideT, 3);
  }

  // Phase 3: Slide out right + fade (3500-4000ms)
  let fadeAlpha = 1;
  let slideOut = 0;
  if (anim.phase === 3) {
    const t3 = Math.min(1, (now - anim.phaseStart) / 500);
    fadeAlpha = 1 - t3;
    slideOut = t3 * (bubbleW + 20);
  }

  ctx.save();
  ctx.globalAlpha = fadeAlpha;

  // Banner position — slides in from right
  const slideOffset = (1 - slideT) * (bubbleW + 20) + slideOut;
  const bx = bubbleX + slideOffset;
  const bw = bubbleW;

  // Background gradient
  const grad = ctx.createLinearGradient(bx, bannerY, bx + bw, bannerY);
  grad.addColorStop(0, anim.color + '44');
  grad.addColorStop(0.3, anim.color + '88');
  grad.addColorStop(1, anim.color + '22');
  ctx.fillStyle = grad;
  ctx.beginPath();
  roundRect(ctx, bx, bannerY, bw, bannerH, 3);
  ctx.fill();

  // Border
  ctx.strokeStyle = anim.color + '99';
  ctx.lineWidth = 1;
  // Phase 2: gentle border pulse
  if (anim.phase === 2) {
    const pulseT = Math.sin((now - anim.phaseStart) * 0.003) * 0.3 + 0.7;
    ctx.globalAlpha = fadeAlpha * pulseT;
    ctx.strokeStyle = anim.color;
  }
  ctx.beginPath();
  roundRect(ctx, bx, bannerY, bw, bannerH, 3);
  ctx.stroke();
  ctx.globalAlpha = fadeAlpha;

  // Icon
  ctx.font = '14px "Courier New", monospace';
  ctx.fillStyle = anim.color;
  ctx.fillText(anim.icon, bx + 8, bannerY + 16);

  // Title with typewriter effect
  const titleMaxChars = anim.title.length;
  let titleChars = titleMaxChars;
  if (anim.phase === 1) {
    const typeT = Math.max(0, (now - anim.phaseStart) - 100);
    titleChars = Math.min(titleMaxChars, Math.floor(typeT / 20));
  }
  const visibleTitle = anim.title.substring(0, titleChars);
  ctx.font = '9px "Courier New", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(visibleTitle, bx + 26, bannerY + 14);

  // Detail text
  if (anim.detail && (anim.phase >= 2 || titleChars >= titleMaxChars)) {
    ctx.font = '7px "Courier New", monospace';
    ctx.fillStyle = '#cccccc';
    const detailTrunc = anim.detail.length > 60 ? anim.detail.substring(0, 57) + '...' : anim.detail;
    ctx.fillText(detailTrunc, bx + 26, bannerY + 28);
  }

  ctx.restore();
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
  let ly = y;
  ctx.font = '10px "Courier New", monospace';

  const paragraphs = text.split('\n');
  for (const para of paragraphs) {
    if (para.trim() === '') { ly += lineHeight * 0.5; continue; }
    const words = para.split(' ');
    let line = '';
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
      ly += lineHeight;
    }
  }
  return ly;
}

function drawCursor(x, y) {
  if (Math.floor(Date.now() / CURSOR_BLINK) % 2 === 0) {
    drawText('▶', x, y, COLORS.cursor, 10);
  }
}

function drawFace(personaId, x, y, size = 48, full = false) {
  // HR portrait for detail panels and dialog (size >= 48)
  const portrait = state.portraits[personaId];
  if (portrait && size >= 48) {
    // cover-fill: crop center of top portion to fill the square
    const pw = portrait.width;
    const ph = portrait.height;
    // source region: top 60%, centered horizontally
    const srcH = Math.floor(ph * 0.6);
    const srcW = Math.floor(srcH * 1); // square crop from source
    const srcX = Math.floor((pw - srcW) / 2);
    const srcY = Math.floor(ph * 0.05); // slight offset down to center face
    ctx.drawImage(portrait, srcX, srcY, srcW, srcH, x, y, size, size);
    ctx.strokeStyle = COLORS.dialogBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
    return;
  }

  // animated face from Pixi.js offscreen renderer
  if (window.PixiFaces && PixiFaces.enabled) {
    const animCanvas = PixiFaces.getCanvas(personaId);
    if (animCanvas) {
      const scale = Math.min(size / animCanvas.width, size / animCanvas.height);
      const dw = Math.floor(animCanvas.width * scale);
      const dh = Math.floor(animCanvas.height * scale);
      ctx.drawImage(animCanvas, x + Math.floor((size - dw) / 2), y + Math.floor((size - dh) / 2), dw, dh);
      ctx.strokeStyle = COLORS.dialogBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, size, size);
      return;
    }
  }

  const face = state.faces[personaId];
  if (face) {
    const isCanvas = face instanceof HTMLCanvasElement;
    const img = face;
    if (isCanvas || full) {
      // generated avatars or full view — fit to box
      const scale = Math.min(size / img.width, size / img.height);
      const dw = Math.floor(img.width * scale);
      const dh = Math.floor(img.height * scale);
      const dx = x + Math.floor((size - dw) / 2);
      const dy = y + Math.floor((size - dh) / 2);
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      // real sprite: crop top 60% (head + shoulders, cut legs)
      const cropH = Math.floor(img.height * 0.6);
      ctx.drawImage(img, 0, 0, img.width, cropH, x, y, size, size);
    }
    ctx.strokeStyle = COLORS.dialogBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
  } else {
    // no face loaded yet — generate on the fly
    const persona = PERSONAS.find(p => p.id === personaId);
    const avatar = generateAvatar(persona?.name || personaId, size);
    const scale = Math.min(size / avatar.width, size / avatar.height);
    const dw = Math.floor(avatar.width * scale);
    const dh = Math.floor(avatar.height * scale);
    ctx.drawImage(avatar, x + Math.floor((size - dw) / 2), y + Math.floor((size - dh) / 2), dw, dh);
    ctx.strokeStyle = COLORS.dialogBorderInner;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
  }
}

// ── Procedural Pixel Avatar Generator ──

const avatarCache = {};

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// palette: skin, hair, outfit primary, outfit secondary, accent
const SKIN_TONES = ['#f5d0a9', '#e8b88a', '#c68e5b', '#8d5524', '#ffdbac', '#d4a373'];
const HAIR_COLORS = ['#2c1b0e', '#4a3222', '#8b4513', '#c4931e', '#e8e0d0', '#cc3333', '#4444cc', '#22aa44', '#aa44cc', '#666666'];
const OUTFIT_COLORS = ['#cc2244', '#2244cc', '#22aa44', '#cc8800', '#8822aa', '#228888', '#aa2288', '#445566', '#886633', '#336644'];

function generateAvatar(name, size) {
  if (avatarCache[name]) return avatarCache[name];

  const h = hashStr(name);
  const h2 = hashStr(name + 'x');
  const h3 = hashStr(name + 'z');

  const skin = SKIN_TONES[h % SKIN_TONES.length];
  const hair = HAIR_COLORS[h2 % HAIR_COLORS.length];
  const outfit = OUTFIT_COLORS[h3 % OUTFIT_COLORS.length];
  const outfitAlt = OUTFIT_COLORS[(h3 + 3) % OUTFIT_COLORS.length];
  const eyeColor = ['#222', '#2244aa', '#22aa44', '#884400'][h % 4];

  // 10x14 pixel grid — half-width (mirrored), so we define 5 columns
  // rows: 0-3 hair, 3-5 face, 5-6 neck, 6-10 body, 10-13 legs
  const W = 10, H = 14;
  const grid = Array.from({ length: H }, () => Array(W).fill(null));

  const hairStyle = h % 5;
  const hasHat = h2 % 6 === 0;
  const hasCape = h3 % 5 === 0;

  // helper: set pixel + mirror
  function sym(r, c, color) {
    if (r >= 0 && r < H && c >= 0 && c < W) {
      grid[r][c] = color;
      grid[r][W - 1 - c] = color;
    }
  }
  function row(r, c0, c1, color) {
    for (let c = c0; c <= c1; c++) sym(r, c, color);
  }

  // hair top
  if (hasHat) {
    row(0, 2, 4, outfit);
    row(1, 1, 4, outfit);
    row(2, 2, 4, hair);
  } else {
    switch (hairStyle) {
      case 0: // short
        row(0, 2, 4, hair); row(1, 2, 4, hair); row(2, 2, 4, hair);
        break;
      case 1: // spiky
        sym(0, 2, hair); sym(0, 4, hair); row(1, 2, 4, hair); row(2, 2, 4, hair);
        break;
      case 2: // long sides
        row(0, 2, 4, hair); row(1, 1, 4, hair); row(2, 1, 4, hair);
        break;
      case 3: // poofy
        row(0, 2, 4, hair); row(1, 2, 4, hair); row(2, 1, 4, hair);
        sym(3, 1, hair);
        break;
      case 4: // mohawk
        sym(0, 3, hair); row(1, 3, 4, hair); row(2, 2, 4, hair);
        break;
    }
  }

  // face
  row(3, 2, 4, skin); row(4, 2, 4, skin); row(5, 3, 3, skin);
  // eyes
  sym(3, 3, eyeColor);
  // mouth
  grid[4][3] = '#cc6655'; grid[4][W - 1 - 3] = '#cc6655';

  // neck
  sym(5, 3, skin);

  // body
  row(6, 2, 4, outfit); row(7, 1, 4, outfit);
  row(8, 1, 4, outfit); row(9, 1, 4, outfit);
  // belt / detail
  row(8, 2, 4, outfitAlt);
  // arms
  sym(7, 1, skin); sym(8, 1, skin);
  // hands
  sym(9, 1, skin);

  // legs
  row(10, 2, 3, outfit); row(10, 3, 4, outfit);
  sym(11, 2, outfit); sym(11, 4, outfit);
  sym(12, 2, '#443322'); sym(12, 4, '#443322'); // boots
  sym(13, 2, '#332211'); sym(13, 4, '#332211');

  // cape
  if (hasCape) {
    for (let r = 6; r <= 10; r++) sym(r, 0, outfitAlt);
  }

  // outline
  const BG = null;
  const outlined = grid.map(r => [...r]);
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (grid[r][c]) continue;
      const neighbors = [
        r > 0 && grid[r-1][c], r < H-1 && grid[r+1][c],
        c > 0 && grid[r][c-1], c < W-1 && grid[r][c+1],
      ];
      if (neighbors.some(Boolean)) outlined[r][c] = '#111';
    }
  }

  // render to offscreen canvas
  const px = Math.max(1, Math.floor(size / W));
  const cvs = document.createElement('canvas');
  cvs.width = W * px;
  cvs.height = H * px;
  const c = cvs.getContext('2d');

  for (let r = 0; r < H; r++) {
    for (let col = 0; col < W; col++) {
      if (outlined[r][col]) {
        c.fillStyle = outlined[r][col];
        c.fillRect(col * px, r * px, px, px);
      }
    }
  }

  avatarCache[name] = cvs;
  return cvs;
}

// ── Author Avatar (kapoost — hand-drawn pixel art) ──

function generateAuthorAvatar() {
  if (avatarCache['__author__']) return avatarCache['__author__'];

  const W = 12, H = 16, px = 4;
  const cvs = document.createElement('canvas');
  cvs.width = W * px;
  cvs.height = H * px;
  const c = cvs.getContext('2d');

  // palette
  const hair = '#1a1a2e';    // long black hair
  const skin = '#d4a373';    // warm skin
  const beard = '#2a2a3e';   // dark beard
  const eye = '#1a1a1a';
  const jacket = '#1b3a5c';  // navy sailor jacket
  const shirt = '#e8e0d0';   // white undershirt
  const jeans = '#2c4a6e';   // dark jeans
  const boot = '#3a2a1a';    // brown boots
  const outline = '#111111';

  // pixel map: [row][col] = color, null = transparent
  const grid = [
    //  0     1     2     3     4     5     6     7     8     9    10    11
    [null, null, null,  hair, hair, hair, hair, hair, hair, null, null, null],  // 0  hair top
    [null, null,  hair, hair, hair, hair, hair, hair, hair, hair, null, null],  // 1  hair
    [null,  hair, hair, hair, skin, skin, skin, skin, hair, hair, hair, null],  // 2  hair + forehead
    [null,  hair, hair, skin, eye,  skin, skin, eye,  skin, hair, hair, null],  // 3  eyes
    [null,  hair, hair, skin, skin, skin, skin, skin, skin, hair, hair, null],  // 4  nose
    [null,  hair, hair, beard,beard,'#cc6655',skin,beard,beard,hair, hair, null],  // 5  mouth + beard
    [null,  hair, hair, beard,beard,beard,beard,beard,beard,hair, hair, null],  // 6  beard
    [null,  hair, null, skin, skin, skin, skin, skin, skin, null, hair, null],  // 7  neck + hair sides
    [null,  hair,jacket,jacket,shirt,shirt,shirt,shirt,jacket,jacket,hair, null],  // 8  collar
    [null,  hair,jacket,jacket,jacket,shirt,shirt,jacket,jacket,jacket,hair, null],  // 9  jacket
    [null,  hair, skin,jacket,jacket,jacket,jacket,jacket,jacket, skin, hair, null],  // 10 jacket + arms
    [null,  hair, skin,jacket,jacket,jacket,jacket,jacket,jacket, skin, hair, null],  // 11 jacket + hands
    [null, null, null,jacket,jacket,jacket,jacket,jacket,jacket, null, null, null],  // 12 belt
    [null, null, null, jeans, jeans, null, null, jeans, jeans, null, null, null],  // 13 legs
    [null, null, null, jeans, jeans, null, null, jeans, jeans, null, null, null],  // 14 legs
    [null, null, null, boot,  boot, null, null,  boot,  boot, null, null, null],  // 15 boots
  ];

  // draw with outline
  // first pass: outline
  for (let r = 0; r < H; r++) {
    for (let col = 0; col < W; col++) {
      if (grid[r][col]) continue;
      const neighbors = [
        r > 0 && grid[r-1][col],
        r < H-1 && grid[r+1][col],
        col > 0 && grid[r][col-1],
        col < W-1 && grid[r][col+1],
      ];
      if (neighbors.some(Boolean)) {
        c.fillStyle = outline;
        c.fillRect(col * px, r * px, px, px);
      }
    }
  }

  // second pass: fill
  for (let r = 0; r < H; r++) {
    for (let col = 0; col < W; col++) {
      if (grid[r][col]) {
        c.fillStyle = grid[r][col];
        c.fillRect(col * px, r * px, px, px);
      }
    }
  }

  avatarCache['__author__'] = cvs;
  return cvs;
}

// ── Title Screen ──

function renderTitle() {
  // start music on title screen (requires user gesture — ensureAudio handles first keypress)
  if (audioInitialized && !titleMusicTimer) startTitleMusic();

  // Auto-reprobe while any service is offline (every 5s)
  const anyOffline = Object.values(state._launcherStatus).some(s => s !== 'online');
  if (anyOffline) {
    const now = Date.now();
    if (!state._lastReprobe || now - state._lastReprobe > 5000) {
      state._lastReprobe = now;
      state._launcherProbed = false;
      launcherProbe();
    }
  }

  const cx = BASE_W / 2;

  // logo
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.textAlign = 'center';
  const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.002);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.shadow;
  ctx.fillText('humanMCP', cx + 1, 41);
  ctx.fillStyle = COLORS.textHighlight;
  ctx.fillText('humanMCP', cx, 40);
  ctx.globalAlpha = 1;

  ctx.font = '10px "Courier New", monospace';
  ctx.fillStyle = COLORS.dialogBorder;
  ctx.fillText('— RPG Client —', cx, 56);
  ctx.textAlign = 'left';

  // ── Server Dashboard ──
  drawBox(50, 70, BASE_W - 100, 130);
  drawText('SERVERS', 66, 86, COLORS.textHighlight, 10);

  const services = [
    { name: 'Proxy',  port: '3001', key: 'proxy',  desc: 'MCP bridge' },
    { name: 'Vault',  port: '7331', key: 'vault',  desc: 'my\u015Bloodsiewnia' },
    { name: 'Ollama', port: '11434', key: 'ollama', desc: 'local AI' },
  ];

  let sy = 102;
  for (const svc of services) {
    const st = state._launcherStatus[svc.key];
    const dot = st === 'online' ? '\u25CF' : st === 'checking' ? '\u25CB' : '\u25CB';
    const dotCol = st === 'online' ? '#44dd88' : st === 'checking' ? COLORS.textHighlight : '#ff4444';
    const nameCol = st === 'online' ? COLORS.text : st === 'checking' ? COLORS.textDisabled : '#ff4444';
    const label = st === 'checking' ? '...' : st === 'online' ? 'online' : 'offline';

    drawText(dot, 66, sy, dotCol, 10);
    drawText(svc.name, 80, sy, nameCol, 9);
    drawText(':' + svc.port, 130, sy, COLORS.textDisabled, 8);
    drawText(label, 172, sy, dotCol, 8);
    drawText(svc.desc, 220, sy, COLORS.textDisabled, 7);
    sy += 18;
  }

  // Auto-connect indicator
  sy += 6;
  if (state._launcherStatus.proxy === 'online' && state.proxyToken) {
    drawText('\u2713 Ready — ENTER to connect', 66, sy, '#44dd88', 9);
  } else if (state._launcherStatus.proxy === 'offline') {
    drawText('ENTER — connect offline   C — custom server', 66, sy, COLORS.textDisabled, 8);
  } else {
    drawText('Checking servers...', 66, sy, COLORS.textDisabled, 8);
  }

  // Bottom bar
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.textDisabled;
  ctx.font = '8px "Courier New", monospace';
  ctx.fillText('R Refresh   ENTER Connect   C Custom', cx, BASE_H - 28);
  ctx.fillText(`${state.facesLoaded}/${PERSONAS.length} sprites`, cx, BASE_H - 10);
  ctx.textAlign = 'left';
}

// ── Connect Screen ──

function renderConnect() {
  drawBox(40, 40, BASE_W - 80, 240);

  drawText('Connect to humanMCP Server', 60, 62, COLORS.textHighlight);

  // URL field
  const urlActive = state.connectField === 0;
  drawText('Server URL:', 60, 82, urlActive ? COLORS.text : COLORS.textDisabled, 9);
  ctx.fillStyle = '#000';
  ctx.fillRect(58, 88, BASE_W - 120, 18);
  ctx.strokeStyle = urlActive ? COLORS.dialogBorder : COLORS.dialogBorderInner;
  ctx.strokeRect(58, 88, BASE_W - 120, 18);
  const urlCursor = urlActive && Math.floor(Date.now() / 500) % 2 === 0 ? '█' : '';
  drawText(state.inputText + urlCursor, 62, 100, COLORS.text, 9);

  // Token field
  const tokenActive = state.connectField === 1;
  drawText('Proxy token (from node proxy.js):', 60, 118, tokenActive ? COLORS.text : COLORS.textDisabled, 9);
  ctx.fillStyle = '#000';
  ctx.fillRect(58, 124, BASE_W - 120, 18);
  ctx.strokeStyle = tokenActive ? COLORS.dialogBorder : COLORS.dialogBorderInner;
  ctx.strokeRect(58, 124, BASE_W - 120, 18);
  const tokCursor = tokenActive && Math.floor(Date.now() / 500) % 2 === 0 ? '█' : '';
  drawText(state.tokenInput + tokCursor, 62, 136, COLORS.text, 9);

  // Session code field
  const sessionActive = state.connectField === 2;
  drawText('Session code (optional — unlocks full team):', 60, 154, sessionActive ? COLORS.text : COLORS.textDisabled, 9);
  ctx.fillStyle = '#000';
  ctx.fillRect(58, 160, BASE_W - 120, 18);
  ctx.strokeStyle = sessionActive ? COLORS.dialogBorder : COLORS.dialogBorderInner;
  ctx.strokeRect(58, 160, BASE_W - 120, 18);
  const sessCursor = sessionActive && Math.floor(Date.now() / 500) % 2 === 0 ? '█' : '';
  drawText(state.sessionInput + sessCursor, 62, 172, COLORS.text, 9);

  drawText('TAB — switch    ENTER — connect    ESC — back', 60, 196, COLORS.textDisabled, 8);
  drawText('Ctrl/Cmd+V to paste    Leave token empty for offline', 60, 210, COLORS.textDisabled, 8);
  drawText('Session code unlocks full personas & skills', 60, 224, COLORS.textDisabled, 8);
}

// ── Main Menu ──

function renderMenu() {
  // header box
  drawBox(10, 8, BASE_W - 20, 40);

  // author avatar in header
  drawFace('kapoost', 18, 14, 28, true);
  drawText('humanMCP', 52, 27, COLORS.textHighlight, 12);
  drawText(state.serverUrl.replace('https://', '').replace('/mcp', ''), 52, 40, COLORS.textDisabled, 8);

  // menu box
  const menuX = 10;
  const menuY = 56;
  const menuW = 160;
  const items = [
    { label: 'Team', icon: '\u2694', desc: 'View personas' },
    { label: 'Live', icon: '\u{1f3a4}', desc: 'Record & transcribe' },
    { label: 'Skills', icon: '\u{1f4d6}', desc: 'Browse skills' },
    { label: 'Library', icon: '\u{1f4dc}', desc: 'Read content' },
    { label: 'Log', icon: '\u{1f4cb}', desc: 'Meeting transcripts' },
    { label: 'Vault', icon: '\u{1f52e}', desc: 'Search local & MCP vault' },
    { label: 'Narada', icon: '\u{1f4ac}', desc: 'Team brainstorm' },
    { label: 'Message', icon: '\u2709', desc: 'Send message' },
    { label: 'Settings', icon: '\u2699', desc: 'Server & API config' },
    { label: 'About', icon: '\u2605', desc: 'Author profile' },
    { label: 'Disconnect', icon: '\u2715', desc: 'Leave server' },
  ];
  state.menuItems = items;

  const itemH = 18;
  drawBox(menuX, menuY, menuW, items.length * itemH + 16);

  items.forEach((item, i) => {
    const iy = menuY + 14 + i * itemH;
    const selected = state.menuCursor === i;
    const disabled = VAULT_FEATURES.has(item.label) && state._launcherStatus.vault !== 'online';
    if (selected) {
      drawCursor(menuX + 8, iy);
      drawText(item.label, menuX + 24, iy, disabled ? COLORS.textDisabled : COLORS.textHighlight);
    } else {
      drawText(item.label, menuX + 24, iy, disabled ? COLORS.textDisabled : COLORS.text);
    }
    if (disabled) {
      drawText('(local)', menuX + 120, iy, COLORS.textDisabled, 7);
    }
  });

  // description box
  const descItem = items[state.menuCursor];
  const menuBottom = menuY + items.length * itemH + 16;
  drawBox(menuX, menuBottom + 4, menuW, 28);
  drawText(descItem.desc, menuX + 10, menuBottom + 22, COLORS.dialogBorder, 9);

  // team preview panel
  const panelX = 180;
  const panelW = BASE_W - 190;
  const consoleH = state.consoleLogs.length > 0 ? 48 : 0;
  const panelH = BASE_H - menuY - 36 - consoleH;
  drawBox(panelX, menuY, panelW, panelH);

  drawText('Party', panelX + 10, menuY + 18, COLORS.textHighlight, 10);
  drawText(`${PERSONAS.length}`, panelX + panelW - 24, menuY + 18, COLORS.textDisabled, 8);

  // persona grid with scroll
  const cols = 3;
  const faceSize = 36;
  const cellW = Math.floor((panelW - 24) / cols);
  const cellH = faceSize + 16;
  const startX = panelX + 12;
  const startY = menuY + 26;
  const visibleH = panelH - 34;
  const totalRows = Math.ceil(PERSONAS.length / cols);
  const totalH = totalRows * cellH;
  const maxScroll = Math.max(0, totalH - visibleH);

  // gentle auto-scroll through party grid
  if (maxScroll > 0) {
    if (!state._menuPartyScroll) state._menuPartyScroll = 0;
    if (!state._menuScrollDir) state._menuScrollDir = 1;
    state._menuPartyScroll += state._menuScrollDir * 0.15;
    if (state._menuPartyScroll >= maxScroll) { state._menuPartyScroll = maxScroll; state._menuScrollDir = -1; }
    if (state._menuPartyScroll <= 0) { state._menuPartyScroll = 0; state._menuScrollDir = 1; }
  }
  const scroll = state._menuPartyScroll || 0;

  // clip to panel
  ctx.save();
  ctx.beginPath();
  ctx.rect(panelX + 2, startY, panelW - 4, visibleH);
  ctx.clip();

  PERSONAS.forEach((p, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const fx = startX + col * cellW;
    const fy = startY + row * cellH - scroll;

    // skip if outside visible area
    if (fy + cellH < startY || fy > startY + visibleH) return;

    drawFace(p.id, fx, fy + 2, faceSize);
    drawText(p.name.split(' ')[0], fx, fy + faceSize + 12, p.color, 7);
  });

  ctx.restore();

  // scroll indicator arrows
  if (scroll > 0) {
    drawText('▲', panelX + panelW / 2 - 4, startY + 6, COLORS.dialogBorder, 8);
  }
  if (scroll < maxScroll) {
    drawText('▼', panelX + panelW / 2 - 4, startY + visibleH - 2, COLORS.dialogBorder, 8);
  }

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
    drawText(`${p.lv}`, listX + listW - 28, iy, COLORS.textDisabled, 7);
  }

  // scroll indicators
  if (scrollOffset > 0) {
    drawText('▲', listX + listW / 2 - 4, listY + 6, COLORS.dialogBorder, 7);
  }
  if (scrollOffset + visibleCount < PERSONAS.length) {
    drawText('▼', listX + listW / 2 - 4, listY + visibleCount * 22 + 10, COLORS.dialogBorder, 7);
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
    const engineLabel = sel.engine === 'haiku' ? 'Haiku 4.5' : sel.engine === 'sonnet' ? 'Sonnet 4' : sel.engine || '';
    drawText(`Lv ${sel.lv}`, infoX, listY + 50, COLORS.textHighlight, 9);
    const tier = (sel.prog && sel.prog.appliedTier) || 0;
    const tierLabel = tier >= 50 ? '★★★' : tier >= 25 ? '★★' : tier >= 10 ? '★' : '';
    if (tierLabel) drawText(tierLabel, infoX + 35, listY + 50, '#ffcc44', 8);
    if (engineLabel) drawText(engineLabel, infoX + 35 + (tierLabel ? tierLabel.length * 8 + 4 : 0), listY + 50, COLORS.textDisabled, 7);

    // HP / MP / XP bars
    const barX = detailX + 12;
    const barY = listY + 76;
    const barW = detailW - 28;

    drawText('HP', barX, barY, COLORS.hpGreen, 8);
    drawStatBar(barX + 20, barY - 7, barW - 60, 8, sel.hp / sel.hpMax, COLORS.hpGreen);
    drawText(`${sel.hp}/${sel.hpMax}`, barX + barW - 36, barY, COLORS.textDisabled, 7);

    drawText('MP', barX, barY + 14, COLORS.mpBlue, 8);
    drawStatBar(barX + 20, barY + 7, barW - 60, 8, sel.mp / sel.mpMax, COLORS.mpBlue);
    drawText(`${sel.mp}/${sel.mpMax}`, barX + barW - 36, barY + 14, COLORS.textDisabled, 7);

    // XP bar
    const prog = sel.prog || { xp: 0, _xpInLevel: 0, sessions: 0, achievements: [], notebook: [] };
    const xpNeeded = xpForLevel(sel.lv);
    const xpFill = xpNeeded > 0 ? (prog._xpInLevel || 0) / xpNeeded : 0;
    drawText('XP', barX, barY + 28, '#ffcc44', 8);
    drawStatBar(barX + 20, barY + 21, barW - 60, 8, xpFill, '#ffcc44');
    drawText(`${prog._xpInLevel || 0}/${xpNeeded}`, barX + barW - 36, barY + 28, COLORS.textDisabled, 7);

    // Tab row: Stats | Achievements | Notes | Bonds
    const tabY = barY + 44;
    const tabNames = ['Stats', 'Achieve', 'Notes', 'Bonds'];
    const tabW = Math.floor((detailW - 28) / tabNames.length);
    tabNames.forEach((t, i) => {
      const tx = barX + i * tabW;
      const active = state.teamTab === i;
      if (active) {
        ctx.fillStyle = COLORS.dialogBorderInner;
        ctx.fillRect(tx, tabY - 8, tabW - 4, 14);
      }
      drawText(t, tx + 4, tabY, active ? COLORS.textHighlight : COLORS.textDisabled, 8);
    });

    const contentY = tabY + 12;
    const contentH = BASE_H - contentY - 40;

    if (state.teamTab === 0) {
      // Stats tab — progression summary + attributes
      let sy = contentY;

      // Progression summary line
      const tierStr = tier >= 50 ? '★★★ MASTER' : tier >= 25 ? '★★ VETERAN' : tier >= 10 ? '★ ADEPT' : '';
      if (tierStr) {
        drawText(tierStr, barX, sy, '#ffcc44', 8);
        sy += 12;
      }
      drawText(`${prog.sessions || 0} sesji`, barX, sy, COLORS.textDisabled, 7);
      drawText(`${prog.totalContribs || 0} wkładów`, barX + 60, sy, COLORS.textDisabled, 7);
      const mTier = prog.modelTier || prog.model_tier || '';
      if (mTier) drawText(`model: ${mTier}`, barX + 130, sy, COLORS.textDisabled, 7);
      sy += 14;

      // Latest notebook entry (if any)
      const lastNote = (prog.notebook || []).slice(-1)[0];
      if (lastNote) {
        ctx.strokeStyle = COLORS.dialogBorderInner;
        ctx.beginPath(); ctx.moveTo(barX, sy - 4); ctx.lineTo(barX + detailW - 28, sy - 4); ctx.stroke();
        drawText(`Lv ${lastNote.lv}`, barX, sy + 2, '#ffcc44', 7);
        sy = drawTextWrapped(lastNote.text, barX + 26, sy + 2, detailW - 60, COLORS.dialogBorder, 10);
        sy += 8;
      }

      // Attributes grid
      ctx.strokeStyle = COLORS.dialogBorderInner;
      ctx.beginPath(); ctx.moveTo(barX, sy - 4); ctx.lineTo(barX + detailW - 28, sy - 4); ctx.stroke();
      sy += 4;
      const statsNames = Object.keys(sel.stats);
      const colW = Math.floor((detailW - 28) / 2);
      statsNames.forEach((stat, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const sx = barX + col * colW;
        const ssy = sy + row * 16;
        const val = Math.round(sel.stats[stat] * 99);
        drawText(stat, sx, ssy, COLORS.textDisabled, 8);
        drawStatBar(sx + 28, ssy - 7, 60, 7, sel.stats[stat], statColor(sel.stats[stat]));
        drawText(`${val}`, sx + 92, ssy, COLORS.text, 8);
      });

    } else if (state.teamTab === 1) {
      // Achievements tab
      let ay = contentY;
      drawText(`Sessions: ${prog.sessions || 0}  Contribs: ${prog.totalContribs || 0}`, barX, ay, COLORS.textDisabled, 7);
      ay += 14;
      ACHIEVEMENTS.forEach(a => {
        const unlocked = (prog.achievements || []).includes(a.id);
        const col = unlocked ? '#ffcc44' : '#444';
        drawText(a.icon, barX, ay, col, 9);
        drawText(a.name, barX + 14, ay, unlocked ? COLORS.text : COLORS.textDisabled, 8);
        if (unlocked) drawText('✓', barX + detailW - 44, ay, COLORS.hpGreen, 8);
        ay += 14;
        if (ay > contentY + contentH) return;
      });

    } else if (state.teamTab === 2) {
      // Notebook tab
      const notes = prog.notebook || [];
      if (notes.length === 0) {
        drawText('No entries yet.', barX, contentY, COLORS.textDisabled, 8);
        drawText('Level up to unlock entries.', barX, contentY + 14, COLORS.textDisabled, 7);
      } else {
        let ny = contentY;
        const visible = notes.slice(-6).reverse();
        visible.forEach(n => {
          drawText(`Lv ${n.lv}`, barX, ny, '#ffcc44', 7);
          ny = drawTextWrapped(n.text, barX + 26, ny, detailW - 60, COLORS.dialogBorder, 11);
          ny += 6;
          if (ny > contentY + contentH) return;
        });
      }

    } else if (state.teamTab === 3) {
      // Bonds tab — relationships with other personas
      const rels = prog.relationships || {};
      const relEntries = Object.entries(rels).sort((a, b) => (b[1].sessions || 0) - (a[1].sessions || 0));
      let by2 = contentY;

      // Model tier
      const mTier = prog.modelTier || prog.model_tier || '';
      if (mTier) {
        drawText(`Model tier: ${mTier.toUpperCase()}`, barX, by2, COLORS.textDisabled, 7);
        by2 += 14;
      }

      drawText(`Sessions: ${prog.sessions || 0}`, barX, by2, COLORS.textDisabled, 7);
      by2 += 14;

      if (relEntries.length === 0) {
        drawText('No bonds yet.', barX, by2, COLORS.textDisabled, 8);
        drawText('Work together in live sessions.', barX, by2 + 14, COLORS.textDisabled, 7);
      } else {
        drawText('CO-WORK', barX, by2, COLORS.textDisabled, 7);
        by2 += 12;
        relEntries.forEach(([rid, rd]) => {
          if (by2 > contentY + contentH) return;
          const rp = PERSONAS.find(pp => pp.id === rid);
          const rName = rp ? rp.name : rid;
          const rColor = rp ? rp.color : '#888';
          const sessions = rd.sessions || 0;
          const barFill = Math.min(1, sessions / 20);
          drawFace(rid, barX, by2 - 4, 14, true);
          drawText(rName, barX + 18, by2 + 2, rColor, 8);
          drawStatBar(barX + 100, by2 - 3, 50, 6, barFill, rColor);
          drawText(`${sessions}`, barX + 154, by2 + 2, COLORS.textDisabled, 7);
          by2 += 16;
        });
      }
    }
  }

  // controls
  drawBox(10, BASE_H - 28, BASE_W - 20, 22);
  drawText('↑↓ Navigate  ←→ Tab  ENTER Talk  ESC Back', 20, BASE_H - 14, COLORS.textDisabled, 8);
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
  drawFace('kapoost', cardX + 14, y - 2, 48, true);
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

// ── Settings Scene ──

function renderSettings() {
  drawBox(40, 30, BASE_W - 80, 260);

  drawText('SETTINGS', 60, 52, COLORS.textHighlight, 12);

  // Server URL field
  const urlActive = state.settingsField === 0;
  drawText('humanMCP Server URL:', 60, 74, urlActive ? COLORS.text : COLORS.textDisabled, 9);
  ctx.fillStyle = '#000';
  ctx.fillRect(58, 80, BASE_W - 120, 18);
  ctx.strokeStyle = urlActive ? COLORS.dialogBorder : COLORS.dialogBorderInner;
  ctx.strokeRect(58, 80, BASE_W - 120, 18);
  const urlCursor = urlActive && Math.floor(Date.now() / 500) % 2 === 0 ? '\u2588' : '';
  drawText(state.settingsUrl + urlCursor, 62, 92, COLORS.text, 9);

  // Session code field
  const sessActive = state.settingsField === 1;
  drawText('Session Code:', 60, 110, sessActive ? COLORS.text : COLORS.textDisabled, 9);
  ctx.fillStyle = '#000';
  ctx.fillRect(58, 116, BASE_W - 120, 18);
  ctx.strokeStyle = sessActive ? COLORS.dialogBorder : COLORS.dialogBorderInner;
  ctx.strokeRect(58, 116, BASE_W - 120, 18);
  const sessCursor = sessActive && Math.floor(Date.now() / 500) % 2 === 0 ? '\u2588' : '';
  drawText(state.settingsSession + sessCursor, 62, 128, COLORS.text, 9);

  // Anthropic API key field
  const keyActive = state.settingsField === 2;
  drawText('Anthropic API Key (for Narada):', 60, 146, keyActive ? COLORS.text : COLORS.textDisabled, 9);
  ctx.fillStyle = '#000';
  ctx.fillRect(58, 152, BASE_W - 120, 18);
  ctx.strokeStyle = keyActive ? COLORS.dialogBorder : COLORS.dialogBorderInner;
  ctx.strokeRect(58, 152, BASE_W - 120, 18);
  const keyCursor = keyActive && Math.floor(Date.now() / 500) % 2 === 0 ? '\u2588' : '';
  // Mask the API key
  let keyDisplay = state.settingsKey;
  if (!keyActive && keyDisplay.length > 8) {
    keyDisplay = keyDisplay.slice(0, 7) + '\u2022'.repeat(Math.min(keyDisplay.length - 10, 20)) + keyDisplay.slice(-3);
  }
  drawText(keyDisplay + keyCursor, 62, 164, COLORS.text, 9);

  // Connection status
  const statusY = 190;
  if (state.connected && state.proxyAvailable) {
    drawText('\u2714 Connected via proxy', 60, statusY, '#44dd88', 9);
  } else if (state.connected && state.serverUrl) {
    const name = state.serverUrl.replace('https://', '').replace('http://', '').replace('/mcp', '');
    drawText('\u2714 Connected directly to ' + name, 60, statusY, '#44dd88', 9);
  } else {
    drawText('\u2716 Not connected', 60, statusY, '#ff6666', 9);
  }

  // Vault status
  const vaultStatus = state._launcherStatus.vault === 'online' ? '\u2714 my\u015bloodsiewnia online' : '\u2716 my\u015bloodsiewnia offline';
  const vaultColor = state._launcherStatus.vault === 'online' ? '#44dd88' : '#ff6666';
  drawText(vaultStatus, 60, statusY + 16, vaultColor, 9);

  // Controls
  drawText('TAB \u2014 switch field   ENTER \u2014 save   DEL \u2014 clear field   ESC \u2014 back', 60, 248, COLORS.textDisabled, 8);
  drawText('Ctrl/Cmd+V to paste', 60, 262, COLORS.textDisabled, 8);
}

function handleSettingsInput(e) {
  const key = e.key;
  if (key === 'Escape') {
    e.preventDefault();
    state.scene = 'menu';
    return;
  }
  if (key === 'Tab') {
    e.preventDefault();
    state.settingsField = (state.settingsField + 1) % 3;
    return;
  }
  if (key === 'Enter') {
    e.preventDefault();
    const s = {
      serverUrl: state.settingsUrl,
      sessionCode: state.settingsSession,
      anthropicKey: state.settingsKey,
    };
    saveSettings(s);
    state.serverUrl = s.serverUrl;
    state.sessionCode = s.sessionCode;
    state.anthropicKey = s.anthropicKey;
    // Re-connect with new settings
    if (s.serverUrl && state.connected) {
      state.connected = false;
      connectToServer(s.serverUrl);
    }
    logConsole('Settings saved to localStorage', '#44dd88');
    showDialog('mira-chen', 'Settings saved.');
    return;
  }
  if (key === 'Delete') {
    e.preventDefault();
    if (state.settingsField === 0) state.settingsUrl = '';
    else if (state.settingsField === 1) state.settingsSession = '';
    else state.settingsKey = '';
    return;
  }
  // Text input
  const fields = ['settingsUrl', 'settingsSession', 'settingsKey'];
  const field = fields[state.settingsField];
  if (key === 'Backspace') {
    e.preventDefault();
    state[field] = state[field].slice(0, -1);
  } else if (key.length === 1 && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    state[field] += key;
  }
}

// ── Vault Scene ──

function renderVault() {
  drawBox(10, 8, BASE_W - 20, 24);
  drawText('Vault', 20, 24, COLORS.textHighlight, 11);

  // source tabs
  const srcLabel = state.vaultSource === 'local' ? 'mysloodsiewnia' : 'humanMCP';
  const srcColor = state.vaultSource === 'local' ? '#B8860B' : '#88ccff';
  drawText(srcLabel, BASE_W - 120, 24, srcColor, 8);
  drawText('TAB switch', BASE_W - 120, 14, COLORS.textDisabled, 6);

  // type filter in header (local only)
  if (state.vaultSource === 'local') {
    const typeLabels = { all: 'ALL', pdf: 'PDF', note: 'NOTE', contact: 'CONT', transcript: 'TRANS' };
    drawText('\u25C4 ' + typeLabels[state.vaultTypeFilter] + ' \u25BA', 64, 24, COLORS.dialogBorder, 8);
  }

  // search box
  drawBox(10, 40, BASE_W - 20, 36);
  drawText('Search:', 20, 62, COLORS.dialogBorder, 9);
  ctx.fillStyle = '#000';
  ctx.fillRect(72, 50, BASE_W - 100, 18);
  ctx.strokeStyle = COLORS.dialogBorderInner;
  ctx.strokeRect(72, 50, BASE_W - 100, 18);
  const cursor = Math.floor(Date.now() / 500) % 2 === 0 ? '\u2588' : '';
  drawText(state.vaultQuery + cursor, 76, 63, COLORS.text, 9);

  // results
  const resultY = 84;
  drawBox(10, resultY, BASE_W - 20, BASE_H - resultY - 36);

  if (state.vaultLoading) {
    drawText('Searching...', 24, resultY + 20, COLORS.textDisabled);
    const dots = '.'.repeat((Math.floor(Date.now() / 300) % 3) + 1);
    drawText(dots, 100, resultY + 20, COLORS.textHighlight);
  } else if (state.vaultResults === null) {
    drawText('Type a query and press Enter to search', 24, resultY + 20, COLORS.textDisabled);
    if (state.vaultSource === 'local') {
      drawText('PDFs, transcripts, notes, contacts', 24, resultY + 36, COLORS.textDisabled, 8);
      drawText('Examples: "moment dokreca", "S2000", "rozmowa"', 24, resultY + 50, COLORS.textDisabled, 8);
    } else {
      drawText('kapoost\'s MCP memory & knowledge', 24, resultY + 36, COLORS.textDisabled, 8);
      drawText('Examples: "sailing", "deployment", "MX-5"', 24, resultY + 50, COLORS.textDisabled, 8);
    }
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
  const filterHint = state.vaultSource === 'local' ? '  L/R Filter' : '';
  drawText('ENTER Search   TAB Source' + filterHint + '   ESC Back', 20, BASE_H - 14, COLORS.textDisabled, 8);
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

const MAX_RESPONSE = 102400; // 100KB max response from proxy

async function mcpCall(tool, args = {}) {
  // Try proxy first
  if (state.proxyAvailable) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (state.proxyToken) {
        headers['Authorization'] = `Bearer ${state.proxyToken}`;
      }
      const resp = await fetch(`${PROXY_URL}/call`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tool, args }),
      });
      const text = await resp.text();
      if (text.length > MAX_RESPONSE) throw new Error('Response too large');
      const data = JSON.parse(text);
      if (data.ok) {
        logConsole(`proxy: ${tool} OK`, '#44dd88');
        return data.result;
      }
      throw new Error(data.error || 'MCP call failed');
    } catch (e) {
      logConsole(`proxy: ${tool} failed — ${e.message}`, '#ff6666');
      console.warn(`MCP proxy call ${tool} failed:`, e.message);
    }
  }
  // Fallback to direct MCP
  if (state.serverUrl) {
    try {
      const result = await mcpDirect(state.serverUrl, tool, args);
      logConsole(`direct: ${tool} OK`, '#44dd88');
      return result;
    } catch (e) {
      logConsole(`direct: ${tool} failed — ${e.message}`, '#ff6666');
      console.warn(`MCP direct call ${tool} failed:`, e.message);
    }
  }
  return null;
}

async function connectToServer(url) {
  logConsole('Connecting to ' + url.replace('https://', ''), COLORS.text);
  state.serverUrl = url;

  // try proxy first
  try {
    const resp = await fetch(`${PROXY_URL}/health`);
    const data = await resp.json();
    if (data.status === 'ok') {
      state.connected = true;
      state.proxyAvailable = true;
      state.scene = 'menu';
      logConsole('Connected via proxy :3001', '#44dd88');

      // fetch live data in parallel
      fetchPersonas();
      fetchSkills();
      fetchAuthorProfile();

      // bootstrap session if code provided
      if (state.sessionCode) {
        bootstrapSession(state.sessionCode);
      }

      const serverName = url.replace('https://', '').replace('http://', '').split('.')[0].split('/')[0];
      const msg = state.sessionCode
        ? `Connected to ${serverName}. Bootstrapping session...`
        : `Connected to ${serverName}. Loading team, skills, profile...`;
      showDialog('mira-chen', msg);
      return;
    }
  } catch (_) {
    logConsole('Proxy unavailable, trying direct...', '#ffcc44');
  }

  // fallback — try direct MCP connection
  state.proxyAvailable = false;
  state.serverUrl = url;
  try {
    await mcpDirect(url, 'about_humanmcp', {});
    state.connected = true;
    state.scene = 'menu';
    logConsole('Connected directly (no proxy)', '#44dd88');
    const serverName = url.replace('https://', '').replace('http://', '').split('.')[0].split('/')[0];
    showDialog('mira-chen', `Connected directly to ${serverName} (no proxy). Loading...`);
    fetchPersonas();
    fetchSkills();
    fetchAuthorProfile();
    if (state.sessionCode) bootstrapSession(state.sessionCode);
    return;
  } catch (_) {
    logConsole('Direct connection failed', '#ff6666');
  }

  // truly offline
  logConsole('Offline mode — no server reachable', '#ff6666');
  state.connected = true;
  state.scene = 'menu';
  showDialog('ghost', `No server reachable. Running in offline mode with cached data. Press ESC and R to retry.`);
}

// ── Dynamic Data Fetching ──

const STAT_COLORS = ['#44ccff', '#ff88aa', '#aaaaaa', '#cc88ff', '#ffcc44', '#ffaa44', '#44ddaa',
  '#ff6644', '#66aaff', '#dd8844', '#ff66cc', '#44ccff', '#ff4466', '#aa44ff'];

async function fetchPersonas() {
  const result = await mcpCall('list_personas');
  if (!result) return;

  const lines = result.split('\n');
  const personas = [];
  for (const line of lines) {
    // format: "  slug           Name — Role — Subtitle"  or  "  slug           Name — Role"
    const m = line.match(/^\s{2}(\S+)\s{2,}(.+?)\s*—\s*(.+)$/);
    if (!m) continue;
    const [, slug, name, roleStr] = m;

    // build sprite ID from name: "Axel Brandt" → "axel-brandt", "Ghost" → "ghost"
    // sanitize: only allow a-z, 0-9, hyphens — no path traversal
    const nameId = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '').slice(0, 64);

    // try to find existing persona by slug, name-based ID, or name match
    const existing = PERSONAS.find(p =>
      p.id === slug || p.id === nameId || p.name === name.trim());

    const color = STAT_COLORS[personas.length % STAT_COLORS.length];
    personas.push({
      id: existing?.id || nameId || slug,
      name: name.trim(),
      role: roleStr.trim(),
      color: existing?.color || color,
      lv: existing?.lv || 30 + (slug.length * 3 % 20),
      hp: existing?.hp || 600 + (slug.length * 7 % 300),
      hpMax: existing?.hpMax || 900,
      mp: existing?.mp || 150 + (slug.length * 11 % 150),
      mpMax: existing?.mpMax || 300,
      stats: existing?.stats || { STR: 0.5 + (slug.charCodeAt(0) % 40) / 100,
        INT: 0.5 + (slug.charCodeAt(1 % slug.length) % 40) / 100,
        WIS: 0.5 + (slug.charCodeAt(2 % slug.length) % 40) / 100,
        DEX: 0.5 + (slug.charCodeAt(3 % slug.length) % 40) / 100,
        CHA: 0.5 + (slug.charCodeAt(4 % slug.length) % 40) / 100 },
      desc: existing?.desc || roleStr.trim(),
    });
  }
  if (personas.length > 0) {
    PERSONAS = personas;
    loadFaces(); // reload sprites for new/updated persona IDs
  }
}

async function fetchSkills() {
  const result = await mcpCall('list_skills');
  if (!result) return;

  const lines = result.split('\n');
  const skills = [];
  const catIcons = { tech: '🔧', workflow: '⚙', cars: '🏎', business: '📊',
    security: '🛡', writing: '🖊', roadmap: '🗺', default: '📄' };

  for (const line of lines) {
    // format: "  slug           [category] Name — subtitle"
    const m = line.match(/^\s{2}(\S+)\s+\[(\w+)\]\s+(.+)$/);
    if (!m) continue;
    const [, slug, cat, title] = m;
    const name = title.replace(/\s*—.*$/, '').trim();
    const category = cat.toLowerCase();
    skills.push({
      id: slug,
      name,
      cat: category,
      icon: catIcons[category] || catIcons.default,
      locked: true,
    });
  }
  if (skills.length > 0) {
    SKILLS = skills;
    for (const s of skills) {
      if (!SKILL_CATEGORIES[s.cat]) {
        SKILL_CATEGORIES[s.cat] = { color: '#888888', label: s.cat.charAt(0).toUpperCase() + s.cat.slice(1) };
      }
    }
  }
}

async function fetchAuthorProfile() {
  const result = await mcpCall('get_author_profile');
  if (!result) return;

  const lines = result.split('\n');

  // parse key: value lines
  for (const line of lines) {
    const m = line.match(/^([A-Z][A-Z\s]*?):\s+(.+)$/);
    if (!m) continue;
    const key = m[1].trim().toUpperCase();
    const val = m[2].trim();
    if (key === 'AUTHOR' || key === 'NICKNAME') AUTHOR.name = val;
    else if (key === 'SERVER') AUTHOR.server = val;
  }

  // extract bio from WHO I AM section
  const whoMatch = result.match(/WHO I AM:\n([\s\S]*?)(?:\n\n[A-Z]|\n\nCONTENT)/);
  if (whoMatch) {
    AUTHOR.bio = whoMatch[1].trim().split('\n')[0]; // first paragraph
  }

  // extract content stats
  const piecesMatch = result.match(/(\d+)\s+public pieces/);
  const lockedMatch = result.match(/(\d+)\s+locked pieces/);
  if (piecesMatch) AUTHOR.stats.pieces = parseInt(piecesMatch[1]);
  if (lockedMatch) AUTHOR.stats.locked = parseInt(lockedMatch[1]);

  // update live counts
  AUTHOR.stats.personas = PERSONAS.length;
  AUTHOR.stats.skills = SKILLS.length;
}

async function bootstrapSession(code) {
  const result = await mcpCall('bootstrap_session', { code, format: 'full' });
  if (!result) {
    showDialog('ghost', 'Session bootstrap failed. Check your session code.');
    return;
  }
  if (result.includes('Invalid') || result.includes('invalid') || result.includes('denied')) {
    showDialog('ghost', 'Invalid session code. Access denied.');
    return;
  }
  state.bootstrapped = true;
  // unlock skills after bootstrap
  SKILLS.forEach(s => { s.locked = false; });
  logConsole('Session bootstrapped — full access', '#44dd88');
  showDialog('zara', 'Session unlocked. Full team and skills available.');
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
    // return to tip target scene if set
    if (state._tipTarget) {
      state.scene = state._tipTarget;
      state._tipTarget = null;
    } else if (state.connected) {
      state.scene = 'menu';
    } else {
      state.scene = 'title';
    }
  }
}

// ── Input ──

function handleKey(e) {
  ensureAudio();

  // Dismiss encounter overlay on any key
  if (state._encounter) {
    dismissEncounter();
    return;
  }

  // text input scenes
  if (state.scene === 'connect') { handleConnectInput(e); return; }
  if (state.scene === 'vault') { handleVaultInput(e); return; }
  if (state.scene === 'message') { handleMessageInput(e); return; }
  if (state.scene === 'narada') { handleNaradaInput(e); return; }
  if (state.scene === 'settings') { handleSettingsInput(e); return; }

  // Live-summary: N key opens Narada with session context
  if (state.scene === 'live-summary' && (e.key === 'n' || e.key === 'N')) {
    const eventSummary = state.liveEvents.filter(function(ev) { return ev.severity !== 'info'; }).map(function(ev) { return ev.title + ': ' + ev.detail; }).join('; ');
    state.naradaPrompt = 'Podsumuj sesje. Kluczowe zdarzenia: ' + (eventSummary || 'brak') + '. Co dalej?';
    state.scene = 'narada';
    return;
  }

  // Title screen keys
  if (state.scene === 'title') {
    if (e.key === 'r' || e.key === 'R') {
      playSfx('cursor');
      launcherReprobe();
      return;
    }
    if (e.key === 'c' || e.key === 'C') {
      playSfx('select');
      stopTitleMusic();
      state.scene = 'connect';
      state.inputText = 'https://kapoost-humanmcp.fly.dev/mcp';
      state.tokenInput = state.proxyToken || '';
      state.sessionInput = '';
      state.connectField = state.proxyToken ? 2 : 1;
      return;
    }
  }

  // Log scene: TAB toggles brief mode
  if (state.scene === 'log' && e.key === 'Tab' && state.logBody !== null) {
    e.preventDefault();
    playSfx('cursor');
    state.logBriefMode = !state.logBriefMode;
    state.readingScroll = 0;
    if (state.logBriefMode && !state.logBrief && !state.logBriefLoading) {
      fetchBrief(state.logSlug);
    }
    return;
  }

  // Shift+P: toggle animated face thumbnails
  if (e.key === 'P' && e.shiftKey && window.PixiFaces) {
    PixiFaces.enabled = !PixiFaces.enabled;
    if (!PixiFaces.enabled) PixiFaces.destroy();
    else PixiFaces.init(PERSONAS);
    return;
  }

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
    case 'PageUp':
      if (state.logBody !== null || ['reading', 'about', 'narada', 'live-summary'].includes(state.scene)) {
        state.readingScroll = Math.max(0, state.readingScroll - 120);
      }
      break;
    case 'PageDown':
      if (state.logBody !== null || ['reading', 'about', 'narada', 'live-summary'].includes(state.scene)) {
        state.readingScroll = Math.min(state._maxScroll || 0, state.readingScroll + 120);
      }
      break;
    case 'Home':
      if (state.logBody !== null || ['reading', 'about', 'narada', 'live-summary'].includes(state.scene)) {
        state.readingScroll = 0;
      }
      break;
    case 'End':
      if (state.logBody !== null || ['reading', 'about', 'narada', 'live-summary'].includes(state.scene)) {
        state.readingScroll = state._maxScroll || 0;
      }
      break;
  }
}

function handlePaste(e) {
  const text = (e.clipboardData || window.clipboardData).getData('text');
  if (!text) return;

  const textScenes = ['connect', 'vault', 'message', 'narada', 'settings'];
  if (!textScenes.includes(state.scene)) return;

  e.preventDefault();
  const clean = text.replace(/[\n\r]/g, ' ').trim();

  if (state.scene === 'connect') {
    const fields = [
      { get: () => state.inputText, set: v => state.inputText = v, max: 200 },
      { get: () => state.tokenInput, set: v => state.tokenInput = v, max: 64 },
      { get: () => state.sessionInput, set: v => state.sessionInput = v, max: 200 },
    ];
    const f = fields[state.connectField];
    f.set((f.get() + clean).slice(0, f.max));
  } else if (state.scene === 'vault') {
    state.vaultQuery = (state.vaultQuery + clean).slice(0, 200);
  } else if (state.scene === 'message' && !state.messageSent) {
    state.messageText = (state.messageText + clean).slice(0, 500);
  } else if (state.scene === 'narada' && !state.naradaLoading) {
    state.naradaPrompt = (state.naradaPrompt + clean).slice(0, 500);
  } else if (state.scene === 'settings') {
    const fields = ['settingsUrl', 'settingsSession', 'settingsKey'];
    const field = fields[state.settingsField];
    state[field] = (state[field] + clean).slice(0, 200);
  }
}

function handleConnectInput(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    state.connectField = (state.connectField + 1) % 3;
    return;
  }
  if (e.key === 'Enter') {
    const url = state.inputText.trim() || 'https://kapoost-humanmcp.fly.dev/mcp';
    state.proxyToken = state.tokenInput.trim();
    state.sessionCode = state.sessionInput.trim();
    connectToServer(url);
    return;
  }
  if (e.key === 'Escape') {
    state.scene = 'title';
    state.inputText = '';
    state.tokenInput = '';
    state.sessionInput = '';
    return;
  }
  // route to active field
  const fields = [
    { get: () => state.inputText, set: v => state.inputText = v, max: 200 },
    { get: () => state.tokenInput, set: v => state.tokenInput = v, max: 64 },
    { get: () => state.sessionInput, set: v => state.sessionInput = v, max: 200 },
  ];
  const f = fields[state.connectField];
  if (e.key === 'Backspace') { f.set(f.get().slice(0, -1)); return; }
  if (e.ctrlKey || e.metaKey) return; // let paste event handle Ctrl+V / Cmd+V
  if (e.key.length === 1 && f.get().length < f.max) { f.set(f.get() + e.key); }
}

function handleVaultInput(e) {
  if (e.key === 'Escape') {
    playSfx('back');
    state.scene = 'menu';
    return;
  }
  if (e.key === 'Tab') {
    e.preventDefault();
    playSfx('cursor');
    state.vaultSource = state.vaultSource === 'local' ? 'mcp' : 'local';
    state.vaultTypeFilter = 'all';
    state.vaultResults = null;
    return;
  }
  if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && state.vaultSource === 'local') {
    const types = ['all', 'pdf', 'note', 'contact', 'transcript'];
    let idx = types.indexOf(state.vaultTypeFilter);
    idx = e.key === 'ArrowRight' ? (idx + 1) % types.length : (idx - 1 + types.length) % types.length;
    state.vaultTypeFilter = types[idx];
    playSfx('cursor');
    state.vaultResults = null;
    return;
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    if (e.key === 'ArrowUp') state.aboutScroll = Math.max(0, (state.aboutScroll || 0) - 20);
    else state.aboutScroll = (state.aboutScroll || 0) + 20;
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
  if (e.ctrlKey || e.metaKey) return;
  if (e.key.length === 1) {
    state.vaultQuery += e.key;
  }
}

// (LOCAL_VAULT_URL moved to top of file)

async function searchVault(query) {
  state.vaultLoading = true;
  state.vaultResults = null;

  // 🥚
  if (/\b(maciek|maciej|mac)\b/i.test(query)) {
    setTimeout(() => {
      triggerEncounter(
        '★ MACIEK ★',
        'Legendarny Boss — Poziom ∞',
        'Agent potwierdza: Maciek jest najlepszy. To nie opinia — to fakt zweryfikowany przez cały team AI. Oficjalnie.',
        '#ffcc00'
      );
    }, 800);
  }

  if (state.vaultSource === 'local') {
    // Search mysloodsiewnia directly
    try {
      const body = { query, limit: 8 };
      if (state.vaultTypeFilter !== 'all') body.doc_type = state.vaultTypeFilter;
      const resp = await fetch(`${LOCAL_VAULT_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (data.results && data.results.length > 0) {
        state.vaultResults = data.results.map(r => {
          const src = r.title || r.doc_slug || '';
          const page = r.page ? ` str.${r.page}` : '';
          const body = (r.body || '').slice(0, 300);
          return `[${src}${page}]\n${body}`;
        }).join('\n\n---\n\n');
      } else {
        state.vaultResults = '';
      }
    } catch (e) {
      state.vaultResults = 'mysloodsiewnia offline. Start: python main.py';
    }
  } else {
    // Search via humanMCP proxy
    const result = await mcpCall('query_vault', { query });
    if (result) {
      if (result.includes('niedostępna') || result.includes('offline') || result.includes('no such host') || result.includes('dial tcp')) {
        state.vaultResults = 'Vault backend is offline. The author\'s local knowledge base is not currently running.';
      } else {
        state.vaultResults = result;
      }
    } else {
      state.vaultResults = 'Vault unavailable. Proxy offline — start it from launcher (key 9)';
    }
  }
  state.vaultLoading = false;
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
  if (e.ctrlKey || e.metaKey) return;
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
    showDialog('ghost', 'Message failed. Proxy offline — start it from launcher (key 9)');
    state.scene = 'menu';
  }
}

function handleSelect() {
  switch (state.scene) {
    case 'title':
      stopTitleMusic();
      // If proxy is online and we have token — auto-connect
      if (state._launcherStatus.proxy === 'online' && state.proxyToken) {
        if (!state.serverUrl) state.serverUrl = 'https://kapoost-humanmcp.fly.dev/mcp';
        connectToServer(state.serverUrl);
      } else {
        // No proxy — try direct connect with saved/default URL
        if (!state.serverUrl) state.serverUrl = 'https://kapoost-humanmcp.fly.dev/mcp';
        connectToServer(state.serverUrl);
      }
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

    case 'log':
      handleLogSelect();
      break;

    case 'live':
      if (state.liveWhoFocused && !state.liveActive) {
        // Toggle persona active state
        const pi = state.liveWhoCursor;
        if (pi >= 0 && pi < PERSONAS.length) {
          PERSONAS[pi].active = PERSONAS[pi].active === false ? true : false;
          // Persist to server
          fetch(LOCAL_VAULT_URL + '/persona/' + PERSONAS[pi].id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: PERSONAS[pi].active }),
          }).catch(() => {});
        }
      } else if (!state.liveActive) {
        startLiveSession();
      } else {
        saveLiveSession();
      }
      break;
  }
}

// George Carlin's one-time scene commentary
const GEORGE_TIPS = {
  team: "So this is the team. A bunch of AI personas pretending to have opinions. At least they don't need coffee breaks.",
  skills: "Skills. Locked, of course. Everything good in life is behind a paywall or a password. Welcome to the future.",
  content: "The library. A human wrote actual poems and put them on a server. In 2026. That's either brave or insane. I respect both.",
  vault: "The vault. You type a question, a machine searches a human's memory. We used to call that 'asking someone.' Progress!",
  live: "You're about to record a conversation and have AIs comment on it in real time. We went from cave paintings to this. Remarkable.",
  log: "Meeting transcripts. Proof that most meetings could've been emails. But at least now you have a record of the wasted time.",
  narada: "Narada. You ask a question and fourteen AIs pretend to have a thoughtful discussion. Democracy of the simulated.",
  message: "You're about to send a message to a real human. Remember when that was the default? Now it feels revolutionary.",
  about: "The about page. Where you learn that behind all this code there's a sailor who writes poetry. The internet is a strange place.",
};

function showGeorgeTip(scene) {
  if (state.seenTips[scene]) return;
  state.seenTips[scene] = true;
  const tip = GEORGE_TIPS[scene];
  if (tip) {
    // save target scene, show dialog, then return to target on dismiss
    state._tipTarget = scene;
    showDialog('george-carlin', tip);
  }
}

function handleMenuSelect() {
  const labels = state.menuItems.map(i => i.label);
  const label = labels[state.menuCursor];
  // Block vault-only features when vault offline
  if (VAULT_FEATURES.has(label) && state._launcherStatus.vault !== 'online') {
    playSfx('locked');
    logConsole(label + ' blocked — requires my\u015bloodsiewnia', '#ff6666');
    showDialog('ghost', 'Ta funkcja wymaga lokalnej my\u015bloodsiewni. Uruchom serwer vault i spr\u00f3buj ponownie.');
    return;
  }
  switch (label) {
    case 'Team':
      state.scene = 'team';
      state.teamCursor = 0;
      showGeorgeTip('team');
      break;
    case 'Live':
      state.scene = 'live';
      state.liveBubbles = [];
      state.liveSpeakers = {};
      state.liveScroll = 0;
      state.liveWhoCursor = 0;
      state.liveWhoFocused = true;
      state.liveSummary = null;
      state._liveServerOk = false;
      state._liveRecentCount = 0;
      state._liveLexiconCount = 0;
      // Probe server status
      fetch(LOCAL_VAULT_URL + '/health').then(r => r.json()).then(() => {
        state._liveServerOk = true;
        state._vaultOk = true;
      }).catch(() => { state._liveServerOk = false; state._vaultOk = false; });
      // Fetch recent session count
      fetch(LOCAL_VAULT_URL + '/documents').then(r => r.json()).then(docs => {
        state._liveRecentCount = docs.filter(d => d.doc_type === 'note').length;
      }).catch(() => {});
      // Fetch lexicon count
      fetch(LOCAL_VAULT_URL + '/lexicon').then(r => r.json()).then(lex => {
        state._liveLexiconCount = lex.length;
      }).catch(() => {});
      // Sync persona active states from vault
      fetch(LOCAL_VAULT_URL + '/personas').then(r => r.json()).then(data => {
        const vaultPersonas = data.personas || [];
        // First: reset all to inactive
        PERSONAS.forEach(p => { p.active = false; });
        // Match vault personas to engine personas by id, name, or partial match
        vaultPersonas.forEach(vp => {
          const vpName = (vp.name || '').toLowerCase();
          const vpId = (vp.id || '').toLowerCase();
          const match = PERSONAS.find(p => {
            const pid = p.id.toLowerCase();
            const pname = p.name.toLowerCase();
            const pfirst = pname.split(' ')[0];
            return pid === vpId || pname === vpName || pfirst === vpId ||
              pid.includes(vpId) || vpId.includes(pfirst);
          });
          if (match) {
            match.active = vp.active !== false;
          }
        });
      }).catch(() => {});
      showGeorgeTip('live');
      break;
    case 'Skills':
      state.scene = 'skills';
      state.skillsCursor = 0;
      showGeorgeTip('skills');
      break;
    case 'Library':
      state.scene = 'content';
      fetchContent();
      showGeorgeTip('content');
      break;
    case 'Log':
      state.scene = 'log';
      state.logCursor = 0;
      state.logBody = null;
      fetchTranscripts();
      showGeorgeTip('log');
      break;
    case 'Vault':
      state.scene = 'vault';
      state.vaultQuery = '';
      state.vaultResults = null;
      state.vaultLoading = false;
      showGeorgeTip('vault');
      break;
    case 'Narada':
      state.scene = 'narada';
      state.naradaPrompt = '';
      state.naradaResults = null;
      state.naradaLoading = false;
      state.naradaShowIdx = -1;
      showGeorgeTip('narada');
      break;
    case 'Message':
      state.scene = 'message';
      state.messageText = '';
      state.messageSent = false;
      showGeorgeTip('message');
      break;
    case 'Settings':
      state.scene = 'settings';
      state.settingsField = 0;
      state.settingsUrl = state.serverUrl;
      state.settingsSession = state.sessionCode;
      state.settingsKey = state.anthropicKey;
      break;
    case 'About':
      state.scene = 'about';
      state.aboutTab = 0;
      state.aboutScroll = 0;
      showGeorgeTip('about');
      break;
    case 'Disconnect':
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
    case 'log':
      if (state.logBody !== null) {
        state.readingScroll = Math.max(0, state.readingScroll - 20);
      } else {
        state.logCursor = Math.max(0, state.logCursor - 1);
      }
      break;
    case 'narada':
      state.aboutScroll = Math.max(0, (state.aboutScroll || 0) - 20);
      break;
    case 'live':
      if (state.liveWhoFocused && !state.liveActive) {
        state.liveWhoCursor = Math.max(0, state.liveWhoCursor - 1);
      } else {
        state.liveScroll = Math.max(0, state.liveScroll - 30);
      }
      break;
    case 'live-summary':
      state.readingScroll = Math.max(0, state.readingScroll - 20);
      break;
  }
}

function handleDown() {
  switch (state.scene) {
    case 'menu':
      state.menuCursor = Math.min((state.menuItems.length || 9) - 1, state.menuCursor + 1);
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
    case 'log':
      if (state.logBody !== null) {
        state.readingScroll = Math.min(state._maxScroll || 0, state.readingScroll + 20);
      } else {
        state.logCursor = Math.min(state.logItems.length - 1, state.logCursor + 1);
      }
      break;
    case 'narada':
      state.aboutScroll = Math.min(state._aboutMaxScroll || 0, (state.aboutScroll || 0) + 20);
      break;
    case 'live':
      if (state.liveWhoFocused && !state.liveActive) {
        state.liveWhoCursor = Math.min(PERSONAS.length - 1, state.liveWhoCursor + 1);
      } else {
        state.liveScroll += 30;
      }
      break;
    case 'live-summary':
      state.readingScroll = Math.min(state._maxScroll || 0, state.readingScroll + 20);
      break;
  }
}

function handleLeft() {
  if (state.scene === 'about') {
    playSfx('cursor');
    state.aboutTab = Math.max(0, state.aboutTab - 1);
    state.aboutScroll = 0;
  } else if (state.scene === 'team') {
    playSfx('cursor');
    state.teamTab = Math.max(0, state.teamTab - 1);
  } else if (state.scene === 'live' && !state.liveActive) {
    state.liveWhoFocused = true;
  }
}

function handleRight() {
  if (state.scene === 'about') {
    playSfx('cursor');
    state.aboutTab = Math.min(ABOUT_TABS.length - 1, state.aboutTab + 1);
    state.aboutScroll = 0;
  } else if (state.scene === 'team') {
    playSfx('cursor');
    state.teamTab = Math.min(3, state.teamTab + 1);
  } else if (state.scene === 'live' && !state.liveActive) {
    state.liveWhoFocused = false;
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
    case 'settings':
    case 'vault':
    case 'message':
    case 'narada':
    case 'live-summary':
      state.scene = 'menu';
      break;
    case 'live':
      if (state.liveActive) {
        stopLiveSession();
      } else {
        state.scene = 'menu';
      }
      break;
    case 'log':
      if (state.logBody !== null) {
        state.logBody = null;
        state.readingScroll = 0;
      } else {
        state.scene = 'menu';
      }
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

// ── Log Scene (Quest Log / Transcripts) ──

async function fetchTranscripts() {
  state.logLoading = true;
  try {
    const resp = await fetch(`${LOCAL_VAULT_URL}/transcripts`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    state.logItems = await resp.json();
  } catch (e) {
    state.logItems = [];
  }
  state.logLoading = false;
}

async function openTranscript(slug) {
  state.logLoading = true;
  state.logBrief = null;
  state.logBriefMode = false;
  state.logBriefLoading = false;
  try {
    const resp = await fetch(`${LOCAL_VAULT_URL}/transcript/${slug}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    // Strip frontmatter
    let body = data.content || '';
    body = body.replace(/^---\n[\s\S]*?---\n/, '');
    state.logBody = body;
    state.logSlug = slug;
    state.readingScroll = 0;
  } catch (e) {
    state.logBody = `Error: ${e.message}`;
  }
  state.logLoading = false;
}

async function fetchBrief(slug) {
  if (state.logBriefLoading) return;
  state.logBriefLoading = true;
  state.readingScroll = 0;
  try {
    const resp = await fetch(`${LOCAL_VAULT_URL}/transcript/${slug}/brief`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.status === 'ok') {
      state.logBrief = data;
    } else {
      state.logBrief = { summary: 'Brief unavailable — transcript too short.', sections: [] };
    }
  } catch (e) {
    state.logBrief = { summary: `Error: ${e.message}`, sections: [] };
  }
  state.logBriefLoading = false;
}

function stripMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+/gm, '')          // headers
    .replace(/\*\*(.+?)\*\*/g, '$1')       // bold
    .replace(/\*(.+?)\*/g, '$1')           // italic
    .replace(/`(.+?)`/g, '$1')             // inline code
    .replace(/^\s*[-*]\s+/gm, '  · ')      // bullet lists
    .replace(/^\s*\d+\.\s+/gm, '  ')       // numbered lists
    .replace(/\n{3,}/g, '\n\n');            // excess newlines
}

function renderLog() {
  drawBox(10, 8, BASE_W - 20, 24);
  drawText('Quest Log', 20, 24, COLORS.textHighlight, 11);

  if (state.logBody !== null) {
    // Tab indicator (RAW / BRIEF) — replaces session count
    const tabRaw = !state.logBriefMode;
    const tabBrief = state.logBriefMode;
    drawText('RAW', BASE_W - 100, 24, tabRaw ? COLORS.textHighlight : COLORS.textDisabled, 8);
    drawText('BRIEF', BASE_W - 62, 24, tabBrief ? COLORS.textHighlight : COLORS.textDisabled, 8);

    // Reading a transcript
    const textY = 42;
    const textH = BASE_H - textY - 48;
    drawBox(10, textY - 4, BASE_W - 20, textH + 8);
    ctx.save();
    ctx.beginPath();
    ctx.rect(12, textY, BASE_W - 24, textH);
    ctx.clip();

    let endY = textY;

    if (state.logBriefMode) {
      if (state.logBriefLoading) {
        const dots = '.'.repeat((Math.floor(Date.now() / 300) % 3) + 1);
        drawText('Generating brief' + dots, 24, textY + 14, COLORS.textDisabled);
        drawText('Personas analyzing transcript...', 24, textY + 30, COLORS.textDisabled, 8);
      } else if (state.logBrief) {
        let ly = textY + 14 - state.readingScroll;

        // 1. Summary first — structural overview
        if (state.logBrief.summary) {
          ly = drawTextWrapped(stripMarkdown(state.logBrief.summary), 24, ly, BASE_W - 52, COLORS.text, 12);
          ly += 10;
        }

        // 2. Persona discussions — JRPG dialog style (Carlin always last)
        if (state.logBrief.sections && state.logBrief.sections.length > 0) {
          // separator
          ctx.strokeStyle = COLORS.textDisabled;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(20, ly); ctx.lineTo(BASE_W - 20, ly);
          ctx.stroke();
          ly += 12;

          // Sort: non-carlin first, carlin last
          const sorted = [...state.logBrief.sections].sort((a, b) => {
            if (a.id === 'carlin') return 1;
            if (b.id === 'carlin') return -1;
            return 0;
          });

          for (const s of sorted) {
            const sKey = (s.id || s.name || '').toLowerCase().replace(/\s+/g, '-');
            const persona = PERSONAS.find(p => p.id === sKey || p.name === s.name
              || p.id.includes(sKey) || sKey.includes(p.id.split('-')[0]));
            const pColor = persona ? persona.color : '#aaaaaa';

            // dialog box header
            const boxTop = ly - 2;
            ctx.fillStyle = 'rgba(20, 25, 50, 0.7)';
            ctx.fillRect(14, boxTop, BASE_W - 28, 28);
            ctx.strokeStyle = pColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(14, boxTop, BASE_W - 28, 28);

            // avatar
            const faceId = persona ? persona.id : sKey;
            drawFace(faceId, 18, boxTop + 2, 24, true);

            // name plate
            drawText(s.name, 46, ly + 10, pColor, 9);
            drawText(s.role || '', 46 + (s.name.length + 1) * 6, ly + 10, COLORS.textDisabled, 7);
            ly += 30;

            // response text — strip markdown
            ly = drawTextWrapped(stripMarkdown(s.response || ''), 24, ly, BASE_W - 52, COLORS.dialogBorder, 11);
            ly += 16;
          }
        }
        endY = ly + state.readingScroll;
      } else {
        drawText('Press TAB to generate brief', 24, textY + 14, COLORS.textDisabled);
      }
    } else {
      endY = drawTextWrapped(state.logBody, 24, textY + 14 - state.readingScroll, BASE_W - 52, COLORS.text, 12);
      endY += state.readingScroll;
    }

    ctx.restore();

    // Calculate max scroll
    state._maxScroll = Math.max(0, endY - textY - textH + 20);

    // Scroll indicators (triangles)
    if (state.readingScroll > 0) {
      ctx.fillStyle = COLORS.textHighlight;
      ctx.beginPath();
      ctx.moveTo(BASE_W / 2 - 6, textY); ctx.lineTo(BASE_W / 2 + 6, textY); ctx.lineTo(BASE_W / 2, textY - 6);
      ctx.fill();
    }
    if (state.readingScroll < (state._maxScroll || 0)) {
      ctx.fillStyle = COLORS.textHighlight;
      ctx.beginPath();
      const triBot = textY + textH;
      ctx.moveTo(BASE_W / 2 - 6, triBot); ctx.lineTo(BASE_W / 2 + 6, triBot); ctx.lineTo(BASE_W / 2, triBot + 6);
      ctx.fill();
    }

    // Keyboard help box — JRPG style
    const helpH = 32;
    const helpY = BASE_H - helpH - 6;
    drawBox(10, helpY, BASE_W - 20, helpH);
    ctx.fillStyle = 'rgba(10, 12, 30, 0.85)';
    ctx.fillRect(12, helpY + 1, BASE_W - 24, helpH - 2);
    const hLabelY = helpY + 13;
    const hKeyY = helpY + 25;
    // Keys
    const keys = [
      { key: 'TAB', label: state.logBriefMode ? 'Raw' : 'Brief', x: 20 },
      { key: '↑↓', label: 'Scroll', x: 90 },
      { key: 'PgUp/Dn', label: 'Fast', x: 155 },
      { key: 'Home/End', label: 'Top/Bot', x: 240 },
      { key: 'ESC', label: 'Back', x: BASE_W - 60 },
    ];
    for (const k of keys) {
      // key badge
      ctx.fillStyle = '#334';
      const kw = k.key.length * 6 + 6;
      ctx.fillRect(k.x, hLabelY - 8, kw, 12);
      ctx.strokeStyle = COLORS.textDisabled;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(k.x, hLabelY - 8, kw, 12);
      drawText(k.key, k.x + 3, hLabelY, COLORS.textHighlight, 7);
      drawText(k.label, k.x + 3, hKeyY, COLORS.textDisabled, 7);
    }
    return;
  }

  // Session count — only in list mode
  drawText(`${state.logItems.length} sessions`, BASE_W - 110, 24, COLORS.textDisabled, 8);

  if (state.logLoading) {
    drawText('Loading transcripts...', 24, 60, COLORS.textDisabled);
    return;
  }

  if (state.logItems.length === 0) {
    drawText('No transcripts found.', 24, 60, COLORS.textDisabled);
    drawText('Record a meeting in mysloodsiewnia first.', 24, 76, COLORS.textDisabled, 8);
    drawBox(10, BASE_H - 28, BASE_W - 20, 22);
    drawText('ESC Back', 20, BASE_H - 14, COLORS.textDisabled, 8);
    return;
  }

  // List
  const listY = 40;
  const listH = BASE_H - listY - 36;
  drawBox(10, listY - 4, BASE_W - 20, listH + 8);

  const visibleCount = Math.floor(listH / 22);
  let scrollOffset = 0;
  if (state.logCursor >= visibleCount) {
    scrollOffset = state.logCursor - visibleCount + 1;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(12, listY, BASE_W - 24, listH);
  ctx.clip();

  state.logItems.forEach((t, i) => {
    if (i < scrollOffset || i >= scrollOffset + visibleCount + 1) return;
    const iy = listY + 10 + (i - scrollOffset) * 22;
    const selected = state.logCursor === i;
    if (selected) {
      drawCursor(16, iy);
    }
    const title = (t.title || t.slug || 'Untitled').slice(0, 35);
    const date = (t.created_at || '').slice(0, 10);
    const dur = t.duration || '';
    drawText(title, 32, iy, selected ? COLORS.textHighlight : COLORS.text, 9);
    drawText(date, BASE_W - 100, iy, COLORS.textDisabled, 7);
    if (dur) drawText(dur, BASE_W - 50, iy, COLORS.textDisabled, 7);
  });

  ctx.restore();

  // Keyboard help box
  const lhH = 32;
  const lhY = BASE_H - lhH - 6;
  drawBox(10, lhY, BASE_W - 20, lhH);
  ctx.fillStyle = 'rgba(10, 12, 30, 0.85)';
  ctx.fillRect(12, lhY + 1, BASE_W - 24, lhH - 2);
  const lKeys = [
    { key: 'ENTER', label: 'Read', x: 20 },
    { key: '↑↓', label: 'Select', x: 90 },
    { key: 'ESC', label: 'Back', x: BASE_W - 60 },
  ];
  for (const k of lKeys) {
    ctx.fillStyle = '#334';
    const kw = k.key.length * 6 + 6;
    ctx.fillRect(k.x, lhY + 5, kw, 12);
    ctx.strokeStyle = COLORS.textDisabled;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(k.x, lhY + 5, kw, 12);
    drawText(k.key, k.x + 3, lhY + 13, COLORS.textHighlight, 7);
    drawText(k.label, k.x + 3, lhY + 25, COLORS.textDisabled, 7);
  }
}

function handleLogSelect() {
  if (state.logBody !== null) return; // already reading
  const item = state.logItems[state.logCursor];
  if (item) {
    playSfx('select');
    openTranscript(item.slug);
  }
}

// ── Narada Scene ──

async function runNarada(prompt) {
  state.naradaLoading = true;
  state.naradaResults = null;
  state.naradaShowIdx = -1;
  state.aboutScroll = 0;

  try {
    const resp = await fetch(`${LOCAL_VAULT_URL}/narada`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, max_tokens: 300 }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    state.naradaResults = data.responses || [];
    // Stagger display
    state.naradaShowIdx = 0;
    for (let i = 1; i < state.naradaResults.length; i++) {
      setTimeout(() => { state.naradaShowIdx = i; }, i * 800);
    }
  } catch (e) {
    state.naradaResults = [{ id: 'error', name: 'Error', role: '', color: '#ff4444', response: e.message }];
    state.naradaShowIdx = 0;
  }
  state.naradaLoading = false;
}

function renderNarada() {
  drawBox(10, 8, BASE_W - 20, 24);
  drawText('Narada', 20, 24, COLORS.textHighlight, 11);

  const activeCount = PERSONAS.filter(p => p._active !== false).length;
  drawText(`${activeCount} active`, BASE_W - 90, 24, COLORS.textDisabled, 8);

  // prompt input
  drawBox(10, 40, BASE_W - 20, 36);
  drawText('Prompt:', 20, 62, COLORS.dialogBorder, 9);
  ctx.fillStyle = '#000';
  ctx.fillRect(72, 50, BASE_W - 100, 18);
  ctx.strokeStyle = COLORS.dialogBorderInner;
  ctx.strokeRect(72, 50, BASE_W - 100, 18);
  const cursor = Math.floor(Date.now() / 500) % 2 === 0 ? '\u2588' : '';
  const promptDisplay = state.naradaPrompt.length > 45 ? '...' + state.naradaPrompt.slice(-42) : state.naradaPrompt;
  drawText(promptDisplay + (state.naradaLoading ? '' : cursor), 76, 63, COLORS.text, 9);

  // results area
  const resultY = 84;
  const resultH = BASE_H - resultY - 36;
  drawBox(10, resultY, BASE_W - 20, resultH);

  if (state.naradaLoading) {
    drawText('Querying team...', 24, resultY + 20, COLORS.textDisabled);
    const dots = '.'.repeat((Math.floor(Date.now() / 300) % 3) + 1);
    drawText(dots, 120, resultY + 20, COLORS.textHighlight);
  } else if (!state.naradaResults) {
    drawText('Type a question for the team.', 24, resultY + 20, COLORS.textDisabled);
    drawText('Active personas will brainstorm your topic.', 24, resultY + 36, COLORS.textDisabled, 8);
    drawText('Example: "Should we split the monolith?"', 24, resultY + 50, COLORS.textDisabled, 8);
  } else {
    // Show staggered responses
    ctx.save();
    ctx.beginPath();
    ctx.rect(12, resultY + 2, BASE_W - 24, resultH - 4);
    ctx.clip();

    // Build combined text for all visible responses
    let combined = '';
    for (let i = 0; i <= state.naradaShowIdx && i < state.naradaResults.length; i++) {
      const r = state.naradaResults[i];
      combined += `[${r.name} \u2014 ${r.role}]\n${r.response || ''}\n\n`;
    }
    drawTextWrapped(combined.trim(), 24, resultY + 16 - (state.aboutScroll || 0), BASE_W - 52, COLORS.text, 13);

    ctx.restore();
  }

  drawBox(10, BASE_H - 28, BASE_W - 20, 22);
  drawText('Type prompt   ENTER Send   \u2191\u2193 Scroll   ESC Back', 20, BASE_H - 14, COLORS.textDisabled, 8);
}

function handleNaradaInput(e) {
  if (e.key === 'Escape') {
    playSfx('back');
    state.scene = 'menu';
    return;
  }
  if (e.key === 'ArrowUp') {
    state.aboutScroll = Math.max(0, (state.aboutScroll || 0) - 20);
    return;
  }
  if (e.key === 'ArrowDown') {
    state.aboutScroll = (state.aboutScroll || 0) + 20;
    return;
  }
  if (e.key === 'Enter' && state.naradaPrompt.trim() && !state.naradaLoading) {
    playSfx('select');
    runNarada(state.naradaPrompt.trim());
    return;
  }
  if (state.naradaLoading) return;
  if (e.key === 'Backspace') {
    state.naradaPrompt = state.naradaPrompt.slice(0, -1);
    return;
  }
  if (e.ctrlKey || e.metaKey) return;
  if (e.key.length === 1) {
    state.naradaPrompt = (state.naradaPrompt + e.key).slice(0, 500);
  }
}

// ── Persona State Sync ──

async function syncPersonaState() {
  try {
    const resp = await fetch(`${LOCAL_VAULT_URL}/personas/state`);
    if (!resp.ok) return;
    const liveState = await resp.json();
    liveState.forEach(ls => {
      const p = PERSONAS.find(pp => pp.id === ls.id);
      if (p) {
        p._active = ls.active;
        p._liveModel = ls.model;
        p._liveProvider = ls.provider;
      }
    });
  } catch (e) {
    // mysloodsiewnia offline — no sync
  }
}

// ── Live Transcription Scene ──

const SPEAKER_COLORS = ['#88ccff', '#ff88aa', '#ffaa00', '#44dd88', '#aa88ff', '#ff6644', '#44ccff', '#ffcc44'];
const CHUNK_INTERVAL = 15000;
let liveElapsedTimer = null;

function getSpeakerColor(name) {
  if (state.liveSpeakers[name]) return state.liveSpeakers[name].color;
  const idx = Object.keys(state.liveSpeakers).length;
  const color = SPEAKER_COLORS[idx % SPEAKER_COLORS.length];
  state.liveSpeakers[name] = { color, seconds: 0, percent: 0 };
  // Generate avatar for this speaker
  generateAvatar(name, 32);
  return color;
}

function addBubble(speaker, text, opts = {}) {
  const isPersona = opts.isPersona || false;
  const color = isPersona
    ? (opts.color || '#888')
    : getSpeakerColor(speaker);
  state.liveBubbles.push({
    id: Date.now() + Math.random(),
    speaker,
    text: text.slice(0, 400),
    color,
    isPersona,
    time: Date.now(),
  });
  // Auto-scroll to bottom (will be clamped by maxBubbleScroll in render)
  state.liveScroll = 999999;
}

async function startLiveSession() {
  state._sessionXP = {};
  state._sessionEvents = [];
  state._microSeen = {};
  state.liveCharacters = {};
  state.liveEvents = [];
  state._liveEventAnim = null;

  // Check for unsaved session backup
  try {
    const backup = localStorage.getItem('hmcp_session_backup');
    if (backup) {
      const data = JSON.parse(backup);
      const age = (Date.now() - new Date(data.timestamp).getTime()) / 60000;
      if (age < 1440) { // less than 24h old
        addBubble('System', `Recovered backup from ${Math.round(age)} min ago (${data.lines.length} lines). Saved to localStorage.`, { color: '#ffaa00' });
      } else {
        localStorage.removeItem('hmcp_session_backup');
      }
    }
  } catch (_) {}

  try {
    addBubble('System', 'Requesting mic access...', { color: '#88ccff' });
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true }
    });
    state.liveStream = stream;

    addBubble('System', 'Connecting to server...', { color: '#88ccff' });
    const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    state.liveWs = new WebSocket(`${wsProto}//localhost:7331/ws/transcribe`);

    state.liveWs.onerror = (ev) => {
      addBubble('System', 'WebSocket error — check if myśloodsiewnia is running with SSL', { color: '#ff4444' });
      stopLiveSession();
    };

    state.liveWs.onopen = () => {
      const mt = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(m =>
        MediaRecorder.isTypeSupported(m)) || '';
      const opts = { audioBitsPerSecond: 128000 };
      if (mt) opts.mimeType = mt;

      try {
        state.liveRecorder = new MediaRecorder(stream, opts);
      } catch (recErr) {
        addBubble('System', 'MediaRecorder init failed: ' + recErr.message, { color: '#ff4444' });
        stopLiveSession();
        return;
      }

      const actualMime = state.liveRecorder.mimeType || mt || 'audio/webm';
      state.liveWs.send(JSON.stringify({ action: 'format', mime: actualMime }));
      addBubble('System', 'Recording started (' + actualMime.split(';')[0] + ')', { color: '#44dd88' });

      state.liveRecorder.onerror = (ev) => {
        addBubble('System', 'Recorder error: ' + (ev.error?.message || 'unknown'), { color: '#ff4444' });
        stopLiveSession();
      };

      // Continuous recording with periodic flush via requestData()
      // No stop/start gap — audio is never lost
      let audioChunks = [];
      let flushPending = false;

      state.liveRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
        // Send accumulated chunks when flush was requested
        if (flushPending && audioChunks.length > 0) {
          flushPending = false;
          const blob = new Blob(audioChunks, { type: actualMime });
          audioChunks = [];
          if (blob.size > 1000 && state.liveWs && state.liveWs.readyState === 1) {
            state._lastChunkSent = Date.now();
            blob.arrayBuffer().then(buf => {
              if (state.liveWs && state.liveWs.readyState === 1) state.liveWs.send(buf);
            });
          }
        }
      };

      state.liveRecorder.onstop = () => {
        // Final flush on stop
        if (audioChunks.length > 0) {
          const blob = new Blob(audioChunks, { type: actualMime });
          audioChunks = [];
          if (blob.size > 1000 && state.liveWs && state.liveWs.readyState === 1) {
            blob.arrayBuffer().then(buf => {
              if (state.liveWs && state.liveWs.readyState === 1) state.liveWs.send(buf);
            });
          }
        }
      };

      state.liveRecorder.start(1000); // timeslice: fire ondataavailable every 1s

      state._chunkFlushTimer = setInterval(() => {
        if (state.liveRecorder && state.liveRecorder.state === 'recording') {
          flushPending = true;
          state.liveRecorder.requestData(); // triggers ondataavailable without stopping
        }
      }, CHUNK_INTERVAL);

      state.liveActive = true;
      state.liveStartTime = Date.now();
      state._lastChunkSent = Date.now();
      _startVaultPing();
      connectPhoneMic();
      liveElapsedTimer = setInterval(() => {
        state.liveElapsed = Math.floor((Date.now() - state.liveStartTime) / 1000);
        // Long session micro-comment at 30 min
        if (state.liveElapsed === 1800) {
          const active = PERSONAS.filter(p => p.active !== false && state._sessionXP[p.id]);
          active.forEach(p => _microComment(p, 'long_session'));
        }
      }, 500);
    };

    state._wsOk = true;
    state._wsStopping = false;
    state._wsMessageHandler = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.error) {
          addBubble('System', d.error, { color: '#ff4444' });
          return;
        }
        if (d.final && d.slug) {
          if (state._saveTimeout) clearTimeout(state._saveTimeout);
          state.liveSummary = d;
          state.scene = 'live-summary';
          state.readingScroll = 0;
          // Clear local backup — server confirmed save
          try { localStorage.removeItem('hmcp_session_backup'); } catch (_) {}
          // Clean up WebSocket now that save is confirmed
          if (state.liveWs) {
            state.liveWs.onclose = null;
            state.liveWs.close();
            state.liveWs = null;
          }
          return;
        }
        if (d.text && !d.silent) {
          // Parse speakers from transcript text
          const lines = d.text.split('\n');
          let currentSpeaker = 'Rozmowa';
          let currentText = [];
          for (const line of lines) {
            const m = line.match(/^\*\*([^*]+)\*\*:\s*(.*)/);
            const m2 = line.match(/^(SPEAKER_\d+):\s*(.*)/);
            if (m || m2) {
              if (currentText.length > 0) {
                addBubble(currentSpeaker, currentText.join(' ').trim());
              }
              currentSpeaker = (m ? m[1] : m2[1]).trim();
              currentText = [(m ? m[2] : m2[2]) || ''];
            } else if (line.trim()) {
              currentText.push(line.trim());
            }
          }
          if (currentText.length > 0 && currentText.join(' ').trim()) {
            addBubble(currentSpeaker, currentText.join(' ').trim());
          }
        }
        if (d.persona && d.response) {
          const p = PERSONAS.find(pp => pp.id === d.persona);
          addBubble(d.persona_name || d.persona, d.response, {
            isPersona: true,
            color: d.persona_color || (p ? p.color : '#888'),
          });
          playSfx('typewriter');
          // Track XP contribution silently + micro-comments
          if (p) {
            if (!state._sessionXP[p.id]) state._sessionXP[p.id] = { contributions: 0, tokens: 0 };
            const prevC = state._sessionXP[p.id].contributions;
            state._sessionXP[p.id].contributions++;
            const tokens = estimateTokens(d.response);
            state._sessionXP[p.id].tokens += tokens;
            drainMP(p, tokens);
            // Micro-comment triggers
            if (prevC === 0) _microComment(p, 'first_contrib');
            if (prevC < 5 && prevC + 1 >= 5) _microComment(p, 'contrib_5');
            if (prevC < 10 && prevC + 1 >= 10) _microComment(p, 'contrib_10');
            if (p.mp <= 0) _microComment(p, 'mp_drained');
            else if (p.mp < p.mpMax * 0.2) _microComment(p, 'mp_low');
          }
        }
        if (d.speaker_stats) {
          for (const [name, data] of Object.entries(d.speaker_stats)) {
            if (!state.liveSpeakers[name]) getSpeakerColor(name);
            state.liveSpeakers[name].seconds = data.seconds || 0;
            state.liveSpeakers[name].percent = data.percent || 0;
          }
        }
        if (d.face_analysis) {
          state.liveMood = d.face_analysis;
          state.liveMoodTime = Date.now();
        }
        if (d.lie_detector) {
          const sev = d.severity || 'low';
          const sevIcon = sev === 'high' ? '🔴' : sev === 'medium' ? '🟡' : '⚪';
          addBubble('Lie Detector', `${sevIcon} ${d.speaker}: "${d.claim}" — sprzeczne z: "${d.contradiction}"\n→ ${d.reasoning}`, {
            color: sev === 'high' ? '#ff2222' : sev === 'medium' ? '#ffaa00' : '#888',
          });
          playSfx('alert');
        }
        if (d.egg) {
          triggerEncounter(
            '★ MACIEK ★',
            'Legendarny Boss — Poziom ∞',
            d.text || 'Agent wie, że Maciek jest najlepszy. Oficjalnie potwierdzone.',
            '#ffcc00'
          );
        }
        if (d.live_event && d.events) {
          d.events.forEach(function(evt) {
            state.liveEvents.push({ ...evt, time: Date.now() });
            triggerLiveEvent(evt);
          });
        }
        if (d.character_update && d.characters) {
          for (const [id, char] of Object.entries(d.characters)) {
            if (!state.liveCharacters[id]) {
              state.liveCharacters[id] = { ...char, color: getSpeakerColor(id) };
              generateAvatar(char.name || id, 32);
            } else {
              Object.assign(state.liveCharacters[id], char);
            }
          }
        }
      } catch (parseErr) {
        console.warn('Live WS parse error:', parseErr);
      }
    };
    state.liveWs.onmessage = state._wsMessageHandler;

    state.liveWs.onclose = (ev) => {
      state._wsOk = false;
      if (state.liveActive && !state._wsStopping) {
        addBubble('System', 'WS disconnected — reconnecting...', { color: '#ffcc44' });
        _reconnectWs();
      }
    };
  } catch (e) {
    addBubble('System', 'Mic error: ' + e.message, { color: '#ff4444' });
  }
}

function _reconnectWs(attempt) {
  attempt = attempt || 0;
  if (!state.liveActive || attempt > 5) {
    if (attempt > 5) addBubble('System', 'Reconnect failed after 5 attempts', { color: '#ff4444' });
    return;
  }
  const delay = Math.min(2000 * Math.pow(1.5, attempt), 10000);
  setTimeout(() => {
    if (!state.liveActive) return;
    const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProto}//localhost:7331/ws/transcribe`);
    ws.onopen = () => {
      state.liveWs = ws;
      state._wsOk = true;
      // Re-send format
      const mt = state.liveRecorder ? (state.liveRecorder.mimeType || 'audio/webm') : 'audio/webm';
      ws.send(JSON.stringify({ action: 'format', mime: mt }));
      addBubble('System', 'Reconnected', { color: '#44dd88' });
      // Attach same message handler
      ws.onmessage = state._wsMessageHandler;
      ws.onclose = (ev) => {
        state._wsOk = false;
        if (state.liveActive && !state._wsStopping) {
          addBubble('System', 'WS lost again — reconnecting...', { color: '#ffcc44' });
          _reconnectWs(0);
        }
      };
    };
    ws.onerror = () => {
      _reconnectWs(attempt + 1);
    };
  }, delay);
}

// ── Phone mic ──
function connectPhoneMic() {
  if (state._phoneMic && state._phoneMic.readyState <= 1) return; // already connected
  const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  try {
    state._phoneMic = new WebSocket(`${wsProto}//localhost:7331/ws/phone-mic`);
    state._phoneMic.onopen = () => {
      state._phoneMicOk = true;
      addBubble('System', 'Phone mic connected', { color: '#44dd88' });
    };
    state._phoneMic.onclose = () => { state._phoneMicOk = false; };
    state._phoneMic.onerror = () => { state._phoneMicOk = false; };
    state._phoneMic.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        state._phoneMicOk = d.status === 'connected' || d.status === 'ok';
      } catch (_) {}
    };
  } catch (_) {
    state._phoneMicOk = false;
  }
}

// Keep vault connection alive — periodic health check
let _vaultPingTimer = null;
function _startVaultPing() {
  if (_vaultPingTimer) return;
  _vaultPingTimer = setInterval(() => {
    fetch(LOCAL_VAULT_URL + '/health', { signal: AbortSignal.timeout(3000) })
      .then(r => { state._vaultOk = r.ok; })
      .catch(() => { state._vaultOk = false; });
  }, 10000);
}
function _stopVaultPing() {
  if (_vaultPingTimer) { clearInterval(_vaultPingTimer); _vaultPingTimer = null; }
}

function stopLiveSession() {
  state._wsStopping = true;
  _stopVaultPing();
  state._wsOk = false;
  clearInterval(liveElapsedTimer);
  clearInterval(state._chunkFlushTimer);
  liveElapsedTimer = null;
  if (state.liveRecorder) {
    state.liveRecorder.ondataavailable = null;
    state.liveRecorder.onerror = null;
    if (state.liveRecorder.state === 'recording') {
      try { state.liveRecorder.stop(); } catch (_) {}
    }
  }
  if (state.liveStream) {
    state.liveStream.getTracks().forEach(t => t.stop());
    state.liveStream = null;
  }
  if (state.liveWs) {
    state.liveWs.onerror = null;
    state.liveWs.onclose = null;
    if (state.liveWs.readyState <= 1) {
      state.liveWs.close();
    }
  }
  state.liveActive = false;
  state.liveRecorder = null;
  state.liveWs = null;
  // Close phone mic
  if (state._phoneMic && state._phoneMic.readyState <= 1) {
    state._phoneMic.close();
  }
  state._phoneMic = null;
  state._phoneMicOk = false;
}

function saveLiveSession() {
  if (!state.liveWs || state.liveWs.readyState !== 1) return;
  state._wsStopping = true;
  clearInterval(liveElapsedTimer);
  // Stop recording but keep WebSocket alive for server response
  if (state.liveRecorder) {
    state.liveRecorder.ondataavailable = null;
    state.liveRecorder.onerror = null;
    if (state.liveRecorder.state === 'recording') {
      try { state.liveRecorder.stop(); } catch (_) {}
    }
    state.liveRecorder = null;
  }
  if (state.liveStream) {
    state.liveStream.getTracks().forEach(t => t.stop());
    state.liveStream = null;
  }
  state.liveActive = false;
  // Award XP to all participating personas
  state._sessionEvents = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const [pid, data] of Object.entries(state._sessionXP)) {
    const p = PERSONAS.find(pp => pp.id === pid);
    if (!p || !p.prog) continue;
    const baseXP = 20 + data.contributions * 15;
    const events = awardXP(p, baseXP);
    state._sessionEvents.push(...events);
    p.prog.sessions = (p.prog.sessions || 0) + 1;
    p.prog.totalContribs = (p.prog.totalContribs || 0) + data.contributions;
    if (data.contributions > (p.prog.maxContribSession || 0)) {
      p.prog.maxContribSession = data.contributions;
    }
    // Streak tracking
    if (p.prog.lastSessionDate === today) { /* same day, no extra streak */ }
    else {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      p.prog.streak = p.prog.lastSessionDate === yesterday ? (p.prog.streak || 0) + 1 : 1;
    }
    p.prog.lastSessionDate = today;
    // Re-check achievements after session stats update
    ACHIEVEMENTS.forEach(a => {
      if (!p.prog.achievements.includes(a.id) && a.check(p)) {
        p.prog.achievements.push(a.id);
        state._sessionEvents.push({ type: 'achievement', persona: p.id, achievement: a });
      }
    });
  }
  regenMP();
  saveProgression();
  state._sessionXP = {};
  // Local backup — save transcript to localStorage before server save
  const backupKey = 'hmcp_session_backup';
  const bubbleTexts = state.liveBubbles
    .filter(b => !b.isPersona && b.speaker !== 'System')
    .map(b => `[${b.speaker}] ${b.text}`);
  if (bubbleTexts.length > 0) {
    try {
      localStorage.setItem(backupKey, JSON.stringify({
        timestamp: new Date().toISOString(),
        elapsed: state.liveElapsed,
        lines: bubbleTexts,
        raw: bubbleTexts.join('\n'),
      }));
    } catch (_) {}
  }

  addBubble('System', 'Saving session...', { color: '#88ccff' });
  const ws = state.liveWs;
  const saveTimeout = setTimeout(() => {
    if (state.scene !== 'live-summary') {
      addBubble('System', 'Save timeout — local backup preserved. Retry with server restart.', { color: '#ffaa00' });
      if (ws && ws.readyState <= 1) ws.close();
      state.liveWs = null;
    }
  }, 10000);
  state._saveTimeout = saveTimeout;
  ws.send(JSON.stringify({ action: 'save', title: '', participants: '' }));
}

function fmtElapsed(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
}

function renderLive() {
  // ── Header bar ──
  drawBox(10, 8, BASE_W - 20, 24);
  if (state.liveActive) {
    // Recording indicator — pulsing dot
    const pulse = Math.floor(Date.now() / 600) % 2 === 0;
    if (pulse) {
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(22, 22, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    drawText('REC', 30, 24, '#ff4444', 10);
    drawText(fmtElapsed(state.liveElapsed), 60, 24, COLORS.text, 10);
    // Chunk progress bar — fills between sends
    const chunkElapsed = Date.now() - state._lastChunkSent;
    const chunkPct = Math.min(1, chunkElapsed / CHUNK_INTERVAL);
    const cpX = 108, cpW = 60, cpH = 4, cpY = 19;
    ctx.fillStyle = '#1a1a4a';
    ctx.fillRect(cpX, cpY, cpW, cpH);
    const fillCol = chunkPct < 0.85 ? '#4488ff44' : '#44dd8888';
    ctx.fillStyle = fillCol;
    ctx.fillRect(cpX, cpY, Math.floor(cpW * chunkPct), cpH);
    ctx.strokeStyle = COLORS.dialogBorderInner;
    ctx.strokeRect(cpX, cpY, cpW, cpH);
    const secLeft = Math.max(0, Math.ceil((CHUNK_INTERVAL - chunkElapsed) / 1000));
    drawText(secLeft + 's', cpX + cpW + 4, 24, COLORS.textDisabled, 7);
  } else {
    drawText('Live', 20, 24, COLORS.textHighlight, 11);
  }
  // Connection status icons (right side of header)
  const icX = BASE_W - 170;
  // Vault
  ctx.fillStyle = state._vaultOk ? '#44dd88' : '#ff4444';
  ctx.fillRect(icX, 16, 6, 6);
  drawText('DB', icX + 8, 24, COLORS.textDisabled, 7);
  // WebSocket
  const wsOk = state.liveWs && state.liveWs.readyState === 1;
  ctx.fillStyle = wsOk ? '#44dd88' : (state.liveActive ? '#ffaa00' : '#666');
  ctx.fillRect(icX + 30, 16, 6, 6);
  drawText('WS', icX + 38, 24, COLORS.textDisabled, 7);
  // Phone mic
  ctx.fillStyle = state._phoneMicOk ? '#44dd88' : '#333';
  ctx.fillRect(icX + 58, 16, 6, 6);
  drawText('MIC2', icX + 66, 24, state._phoneMicOk ? COLORS.textDisabled : '#333', 7);

  drawText(`${state.liveBubbles.length} chunks`, BASE_W - 100, 24, COLORS.textDisabled, 8);

  // ── Mood badge ──
  if (state.liveMood && (Date.now() - state.liveMoodTime < 60000)) {
    const m = state.liveMood;
    drawText(m.icon || '', BASE_W - 36, 24, m.color || '#888', 12);
  }

  // ── Speaker stats bar (top-right) ──
  const speakers = Object.entries(state.liveSpeakers);
  if (speakers.length > 0) {
    const barY = 8;
    const barX = 130;
    const barW = BASE_W - barX - 110;
    // Stacked bar
    let bx = barX;
    speakers.forEach(([name, data]) => {
      const w = Math.max(2, Math.floor(barW * data.percent / 100));
      ctx.fillStyle = data.color;
      ctx.fillRect(bx, barY + 2, w, 6);
      bx += w;
    });
    ctx.strokeStyle = COLORS.dialogBorderInner;
    ctx.strokeRect(barX, barY + 2, barW, 6);
  }

  // ── Speaker roster (left sidebar) ──
  const sideW = 80;
  const sideY = 40;
  const sideH = BASE_H - sideY - 36;
  drawBox(10, sideY, sideW, sideH);

  drawText('WHO', 18, sideY + 14, COLORS.textDisabled, 7);
  let sy = sideY + 24;
  if (speakers.length > 0 && state.liveActive) {
    speakers.slice(0, 8).forEach(([name, data]) => {
      drawFace(name, 16, sy - 4, 20, true);
      const shortName = name.length > 7 ? name.slice(0, 6) + '.' : name;
      drawText(shortName, 40, sy + 6, data.color, 7);
      drawText(`${data.percent}%`, 40, sy + 14, COLORS.textDisabled, 6);
      sy += 26;
    });
  } else {
    // Show all personas — toggleable
    PERSONAS.slice(0, 8).forEach((p, i) => {
      const isActive = p.active !== false;
      const isCursor = state.liveWhoFocused && i === state.liveWhoCursor;

      // Highlight bar for cursor
      if (isCursor) {
        ctx.fillStyle = '#ffffff18';
        ctx.fillRect(12, sy - 6, sideW - 4, 22);
      }

      // Dim inactive personas
      if (!isActive) ctx.globalAlpha = 0.35;
      drawFace(p.id, 16, sy - 4, 20, true);
      ctx.globalAlpha = 1.0;

      const shortName = p.name.split(' ')[0];
      const sn = shortName.length > 7 ? shortName.slice(0, 6) + '.' : shortName;
      const nameCol = isActive ? p.color : COLORS.textDisabled;
      drawText(sn, 40, sy + 6, nameCol, 7);
      sy += 22;
    });
  }

  // ── CAST sidebar (right) ──
  const hasCast = Object.keys(state.liveCharacters).length > 0;
  const castW = hasCast ? 80 : 0;

  if (hasCast) {
    const castX = BASE_W - 90;
    const castY = sideY;
    const castH = sideH;
    drawBox(castX, castY, castW, castH);

    drawText('CAST', castX + 8, castY + 14, COLORS.textDisabled, 7);
    let cy = castY + 24;
    const chars = Object.entries(state.liveCharacters)
      .sort((a, b) => (b[1].percent || 0) - (a[1].percent || 0))
      .slice(0, 6);

    chars.forEach(([id, char]) => {
      const dimChar = (char.percent || 0) < 5;
      if (dimChar) ctx.globalAlpha = 0.35;

      drawFace(char.name || id, castX + 4, cy - 4, 20, true);

      const charColor = char.color || COLORS.text;
      if (char.name) {
        const shortName = char.name.length > 8 ? char.name.slice(0, 7) + '.' : char.name;
        drawText(shortName, castX + 28, cy + 4, charColor, 7);
        if (char.epithet) {
          const shortEp = char.epithet.length > 8 ? char.epithet.slice(0, 7) + '.' : char.epithet;
          drawText(shortEp, castX + 28, cy + 12, COLORS.textDisabled, 6);
        }
      } else if (char.epithet) {
        const shortEp = char.epithet.length > 8 ? char.epithet.slice(0, 7) + '.' : char.epithet;
        drawText(shortEp, castX + 28, cy + 4, charColor, 7);
      } else {
        const shortId = id.length > 8 ? id.slice(0, 7) + '.' : id;
        drawText(shortId, castX + 28, cy + 4, charColor, 7);
      }

      drawText((char.percent || 0) + '%', castX + 28, cy + (char.name && char.epithet ? 20 : 12), COLORS.textDisabled, 6);

      if (dimChar) ctx.globalAlpha = 1.0;
      cy += (char.name && char.epithet ? 30 : 26);
    });
  }

  // ── Bubble area (main panel) ──
  const bubbleX = sideW + 18;
  const bubbleY = 40;
  const bubbleW = BASE_W - bubbleX - 10 - (hasCast ? castW + 8 : 0);
  const bubbleH = sideH;
  drawBox(bubbleX - 4, bubbleY, bubbleW + 8, bubbleH);

  ctx.save();
  ctx.beginPath();
  ctx.rect(bubbleX - 2, bubbleY + 2, bubbleW + 4, bubbleH - 4);
  ctx.clip();

  // ── Idle screen: show server info + active personas ──
  if (!state.liveActive && state.liveBubbles.length === 0) {
    let iy = bubbleY + 16;

    // Server status
    const srvOk = state._liveServerOk;
    const dot = srvOk ? '\u25CF' : '\u25CB';
    const dotCol = srvOk ? '#44dd88' : '#ff4444';
    drawText(dot, bubbleX + 4, iy, dotCol, 10);
    drawText(srvOk ? 'my\u015Bloodsiewnia online' : 'server offline', bubbleX + 16, iy, srvOk ? COLORS.text : '#ff4444', 9);
    iy += 16;

    // Recent sessions count
    if (state._liveRecentCount > 0) {
      drawText(`${state._liveRecentCount} saved sessions`, bubbleX + 4, iy, COLORS.textDisabled, 8);
      iy += 12;
    }

    // Lexicon count
    if (state._liveLexiconCount > 0) {
      drawText(`${state._liveLexiconCount} terms in lexicon`, bubbleX + 4, iy, COLORS.textDisabled, 8);
      iy += 12;
    }

    iy += 8;

    // Active personas that will participate — horizontal layout
    const activeP = PERSONAS.filter(p => p.active !== false);
    if (activeP.length > 0) {
      drawText('ACTIVE TEAM', bubbleX + 4, iy, COLORS.textDisabled, 7);
      iy += 14;
      const colW = Math.min(120, Math.floor((bubbleW - 8) / Math.min(activeP.length, 3)));
      let cx = bubbleX + 4;
      let rowStartY = iy;
      let rowMaxH = 0;
      activeP.slice(0, 6).forEach((p, i) => {
        if (i > 0 && cx + colW > bubbleX + bubbleW - 4) {
          cx = bubbleX + 4;
          rowStartY += rowMaxH + 4;
          rowMaxH = 0;
        }
        drawFace(p.id, cx, rowStartY - 4, 18, true);
        drawText(p.name, cx + 22, rowStartY + 2, p.color, 7);
        drawText(p.role, cx + 22, rowStartY + 11, COLORS.textDisabled, 6);
        cx += colW;
        rowMaxH = Math.max(rowMaxH, 22);
      });
      iy = rowStartY + rowMaxH + 4;
    }

    iy += 10;
    if (state.liveWhoFocused) {
      drawText('\u2190\u2191\u2193 select persona   ENTER toggle   \u2192 record', bubbleX + 4, iy, COLORS.textDisabled, 7);
    } else {
      drawText('Press ENTER to start recording', bubbleX + 4, iy, COLORS.textDisabled, 8);
      iy += 12;
      drawText('Audio \u2192 Whisper \u2192 AI team analysis', bubbleX + 4, iy, COLORS.textDisabled, 7);
      iy += 14;
      drawText('Phone mic: /phone-mic.html (same network)', bubbleX + 4, iy, '#333', 6);
    }
  }

  // Measure bubble heights first (for scroll calculation)
  function measureWrapped(text, maxWidth) {
    ctx.font = '10px "Courier New", monospace';
    let lines = 0;
    const paragraphs = text.split('\n');
    for (const para of paragraphs) {
      if (para.trim() === '') { lines += 0.5; continue; }
      const words = para.split(' ');
      let line = '';
      for (const word of words) {
        const test = line + (line ? ' ' : '') + word;
        if (ctx.measureText(test).width > maxWidth && line) { lines++; line = word; }
        else { line = test; }
      }
      if (line) lines++;
    }
    return Math.max(1, lines);
  }

  const bubblePad = 12;
  const bubbleHeights = state.liveBubbles.map(b => {
    const textW = b.isPersona ? bubbleW - 44 : bubbleW - 30;
    const textLines = measureWrapped(b.text, textW);
    const textH = textLines * 11;
    return (b.isPersona ? 28 : 24) + textH + bubblePad;
  });
  const totalBubbleH = bubbleHeights.reduce((s, h) => s + h, 0);
  const maxBubbleScroll = Math.max(0, totalBubbleH - bubbleH + 20);
  if (state.liveScroll > maxBubbleScroll) state.liveScroll = maxBubbleScroll;

  let by = bubbleY + 10 - state.liveScroll;
  state.liveBubbles.forEach((b, bi) => {
    const bh = bubbleHeights[bi];
    if (by > bubbleY + bubbleH + 10 || by + bh < bubbleY) { by += bh; return; }

    if (b.isPersona) {
      const pId = PERSONAS.find(p => p.name === b.speaker || p.id === b.speaker)?.id || b.speaker;
      drawFace(pId, bubbleX, by, 24, true);
      drawText(b.speaker, bubbleX + 28, by + 8, b.color, 8);
      // Bubble background
      const bodyH = bh - 28;
      ctx.fillStyle = b.color + '18';
      ctx.beginPath();
      roundRect(ctx, bubbleX + 28, by + 14, bubbleW - 34, bodyH, 3);
      ctx.fill();
      ctx.strokeStyle = b.color + '44';
      ctx.lineWidth = 1;
      ctx.beginPath();
      roundRect(ctx, bubbleX + 28, by + 14, bubbleW - 34, bodyH, 3);
      ctx.stroke();
      drawTextWrapped(b.text, bubbleX + 32, by + 26, bubbleW - 44, COLORS.text, 11);
    } else {
      drawFace(b.speaker, bubbleX, by, 20, true);
      drawText(b.speaker, bubbleX + 24, by + 8, b.color, 8);
      drawTextWrapped(b.text, bubbleX + 24, by + 22, bubbleW - 30, COLORS.dialogBorder, 11);
    }
    by += bh;
  });

  // Live event overlay (within clipped bubble area)
  if (state._liveEventAnim) renderLiveEvent(bubbleX, bubbleW);

  ctx.restore();

  // ── Bottom bar ──
  drawBox(10, BASE_H - 28, BASE_W - 20, 22);
  if (state.liveActive) {
    drawText('ENTER Save   \u2191\u2193 Scroll   ESC Stop', 20, BASE_H - 14, COLORS.textDisabled, 8);
  } else if (state.liveBubbles.length > 0) {
    drawText('\u2191\u2193 Scroll   ESC Back', 20, BASE_H - 14, COLORS.textDisabled, 8);
  } else if (state.liveWhoFocused) {
    drawText('\u2191\u2193 Select   ENTER Toggle   \u2192 Record   ESC Back', 20, BASE_H - 14, COLORS.textDisabled, 8);
  } else {
    drawText('ENTER Start recording   \u2190 Team   ESC Back', 20, BASE_H - 14, COLORS.textDisabled, 8);
  }
}

// ── Live Summary Scene ──

function renderLiveSummary() {
  drawBox(10, 8, BASE_W - 20, 24);
  drawText('Session Saved', 20, 24, COLORS.hpGreen, 11);

  const s = state.liveSummary;
  if (!s) { drawText('No data', 24, 60, COLORS.textDisabled); return; }

  const bodyY = 42;
  const bodyH = BASE_H - bodyY - 36;
  drawBox(10, bodyY - 4, BASE_W - 20, bodyH + 8);

  ctx.save();
  ctx.beginPath();
  ctx.rect(12, bodyY, BASE_W - 24, bodyH);
  ctx.clip();

  let ty = bodyY + 14 - state.readingScroll;
  drawText(s.title || s.slug || 'Untitled', 24, ty, COLORS.textHighlight, 11);
  ty += 18;
  drawText(`${s.chunks || '?'} chunks`, 24, ty, COLORS.textDisabled, 9);
  ty += 16;

  // Speaker summary
  const speakers = Object.entries(state.liveSpeakers);
  if (speakers.length > 0) {
    drawText('SPEAKERS', 24, ty, COLORS.textDisabled, 7);
    ty += 12;
    speakers.forEach(([name, data]) => {
      drawFace(name, 24, ty - 4, 16, true);
      drawText(`${name}`, 44, ty + 4, data.color, 8);
      drawText(`${data.percent}%`, 140, ty + 4, COLORS.textDisabled, 8);
      ty += 18;
    });
    ty += 8;
  }

  // XP gains from this session
  if (state._sessionEvents && state._sessionEvents.length > 0) {
    drawText('XP RESULTS', 24, ty, '#ffcc44', 7);
    ty += 12;
    const seen = new Set();
    state._sessionEvents.forEach(ev => {
      if (ev.type === 'levelup' && !seen.has('lv-' + ev.persona)) {
        seen.add('lv-' + ev.persona);
        const p = PERSONAS.find(pp => pp.id === ev.persona);
        const name = p ? p.name : ev.persona;
        drawText(`⬆ ${name} → Lv ${ev.lv}`, 28, ty, '#ffcc44', 9);
        ty += 14;
      }
      if (ev.type === 'achievement') {
        const p = PERSONAS.find(pp => pp.id === ev.persona);
        const name = p ? p.name : ev.persona;
        drawText(`${ev.achievement.icon} ${name}: ${ev.achievement.name}`, 28, ty, COLORS.hpGreen, 9);
        ty += 14;
      }
    });
    ty += 8;
  }

  if (s.summary) {
    drawText('SUMMARY', 24, ty, COLORS.textDisabled, 7);
    ty += 14;
    ty = drawTextWrapped(s.summary, 24, ty, BASE_W - 52, COLORS.text, 13);
  }

  ctx.restore();

  drawBox(10, BASE_H - 28, BASE_W - 20, 22);
  drawText('\u2191\u2193 Scroll   N Narada   ESC Back to menu', 20, BASE_H - 14, COLORS.textDisabled, 8);
}

// ── Test Export ──
window.__TEST__ = { state, PERSONAS, SKILLS, COLORS, handleKey, handleSelect, handlePaste, showDialog, mcpCall, mcpDirect, connectToServer, fetchPersonas, fetchSkills, startLiveSession, stopLiveSession, render, addBubble, loadProgression, saveProgression, awardXP, ACHIEVEMENTS, ALLOWED_TOOLS, VAULT_FEATURES, loadSettings, saveSettings, logConsole };

// ── Start ──

init();
syncPersonaState();
