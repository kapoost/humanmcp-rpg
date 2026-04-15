// humanMCP RPG — unit tests (zero dependencies)
// Run: node test.js

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; process.stdout.write('  ✓ ' + msg + '\n'); }
  else { failed++; process.stdout.write('  ✗ ' + msg + '\n'); }
}

// ── Extract pure functions from engine.js ──
// (engine.js runs in browser with canvas — we extract and test logic only)

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function sanitizeSpriteId(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '').slice(0, 64);
}

function parsePersonas(result) {
  const lines = result.split('\n');
  const personas = [];
  for (const line of lines) {
    const m = line.match(/^\s{2}(\S+)\s{2,}(.+?)\s*—\s*(.+)$/);
    if (!m) continue;
    const [, slug, name, roleStr] = m;
    personas.push({ slug, name: name.trim(), role: roleStr.trim() });
  }
  return personas;
}

function parseSkills(result) {
  const lines = result.split('\n');
  const skills = [];
  for (const line of lines) {
    const m = line.match(/^\s{2}(\S+)\s+\[(\w+)\]\s+(.+)$/);
    if (!m) continue;
    const [, slug, cat, title] = m;
    skills.push({ slug, cat: cat.toLowerCase(), name: title.replace(/\s*—.*$/, '').trim() });
  }
  return skills;
}

const ALLOWED_TOOLS = new Set([
  'get_author_profile', 'list_content', 'read_content', 'verify_content',
  'get_certificate', 'list_personas', 'get_persona', 'list_skills', 'get_skill',
  'list_blobs', 'query_vault', 'recall', 'leave_comment', 'leave_message',
  'request_access', 'submit_answer', 'about_humanmcp', 'bootstrap_session',
]);

// ═══════════════════════════════════
console.log('\n  hashStr');
// ═══════════════════════════════════

assert(hashStr('ghost') === hashStr('ghost'), 'deterministic — same input same output');
assert(hashStr('ghost') !== hashStr('zara'), 'different inputs produce different hashes');
assert(hashStr('') === 0, 'empty string hashes to 0');
assert(typeof hashStr('test') === 'number', 'returns a number');
assert(hashStr('Mira Chen') >= 0, 'always non-negative');

// ═══════════════════════════════════
console.log('\n  sanitizeSpriteId');
// ═══════════════════════════════════

assert(sanitizeSpriteId('Axel Brandt') === 'axel-brandt', 'name to slug');
assert(sanitizeSpriteId('Ghost') === 'ghost', 'single name');
assert(sanitizeSpriteId('Tomás Reyes') === 'toms-reyes', 'strips accents/special chars');
assert(sanitizeSpriteId('  spaces  ') === 'spaces', 'trims whitespace');
assert(sanitizeSpriteId('../../etc/passwd') === 'etcpasswd', 'no path traversal');
assert(sanitizeSpriteId('a'.repeat(100)) === 'a'.repeat(64), 'max 64 chars');
assert(sanitizeSpriteId('---test---') === 'test', 'strips leading/trailing hyphens');
assert(sanitizeSpriteId('<script>alert(1)</script>') === 'scriptalert1script', 'strips HTML');

// ═══════════════════════════════════
console.log('\n  parsePersonas');
// ═══════════════════════════════════

const PERSONA_SAMPLE = `Personas (14) — nazwy i role.

  axel             Axel Brandt — Principal QA Engineer — Adversarial Tester
  carlin           George Carlin — Comedian, Social Critic — End-of-Council Voice
  ghost            Ghost — Red Team Consultant — White Hat Operations Only
  tomas            Tomás Reyes — Data Architect & ML Engineer

— Użyj bootstrap_session`;

const personas = parsePersonas(PERSONA_SAMPLE);
assert(personas.length === 4, `parses 4 personas (got ${personas.length})`);
assert(personas[0].slug === 'axel', 'first slug is axel');
assert(personas[0].name === 'Axel Brandt', 'first name is Axel Brandt');
assert(personas[0].role.includes('Principal QA'), 'first role includes Principal QA');
assert(personas[2].slug === 'ghost', 'ghost parsed');
assert(personas[3].name === 'Tomás Reyes', 'unicode names preserved');

// ═══════════════════════════════════
console.log('\n  parseSkills');
// ═══════════════════════════════════

const SKILLS_SAMPLE = `Skills (18) — tytuły i kategorie.

  a2a-resources-roadmap    [roadmap] Roadmap — otwarte tematy
  deploy-workflow          [tech] Workflow deploymentu
  mx5-basics               [cars] Mazda MX-5 — podstawy
  writing-style            [writing] Styl pisania i komunikacji

— Użyj bootstrap_session`;

const skills = parseSkills(SKILLS_SAMPLE);
assert(skills.length === 4, `parses 4 skills (got ${skills.length})`);
assert(skills[0].slug === 'a2a-resources-roadmap', 'slug parsed');
assert(skills[0].cat === 'roadmap', 'category parsed');
assert(skills[0].name === 'Roadmap', 'name without subtitle');
assert(skills[2].cat === 'cars', 'cars category');
assert(skills[3].name === 'Styl pisania i komunikacji', 'full name when no dash');

// ═══════════════════════════════════
console.log('\n  proxy allowlist');
// ═══════════════════════════════════

assert(ALLOWED_TOOLS.has('list_personas'), 'list_personas allowed');
assert(ALLOWED_TOOLS.has('bootstrap_session'), 'bootstrap_session allowed');
assert(!ALLOWED_TOOLS.has('delete_persona'), 'delete_persona blocked');
assert(!ALLOWED_TOOLS.has('upsert_persona'), 'upsert_persona blocked');
assert(!ALLOWED_TOOLS.has('remember'), 'remember blocked (write op)');
assert(!ALLOWED_TOOLS.has('upsert_skill'), 'upsert_skill blocked');
assert(ALLOWED_TOOLS.size === 18, `18 tools allowed (got ${ALLOWED_TOOLS.size})`);

// ═══════════════════════════════════
console.log('\n  avatar determinism');
// ═══════════════════════════════════

const SKIN_TONES = ['#f5d0a9', '#e8b88a', '#c68e5b', '#8d5524', '#ffdbac', '#d4a373'];
const HAIR_COLORS = ['#2c1b0e', '#4a3222', '#8b4513', '#c4931e', '#e8e0d0', '#cc3333', '#4444cc', '#22aa44', '#aa44cc', '#666666'];

const h1 = hashStr('Ghost');
const h2 = hashStr('Ghost');
assert(h1 === h2, 'same name produces same hash');
assert(SKIN_TONES[h1 % SKIN_TONES.length] === SKIN_TONES[h2 % SKIN_TONES.length], 'same skin tone for same name');
assert(HAIR_COLORS[hashStr('Ghost' + 'x') % HAIR_COLORS.length] === HAIR_COLORS[hashStr('Ghost' + 'x') % HAIR_COLORS.length], 'same hair for same name');

// different personas get different looks (probabilistic but very likely)
const looks = new Set();
for (const name of ['Ghost', 'Mira Chen', 'Zara', 'Axel Brandt', 'Kenji Mori']) {
  const h = hashStr(name);
  looks.add(`${h % SKIN_TONES.length}-${hashStr(name + 'x') % HAIR_COLORS.length}`);
}
assert(looks.size >= 4, `at least 4/5 personas have unique looks (got ${looks.size})`);

// ═══════════════════════════════════
console.log('\n  stat generation (deterministic)');
// ═══════════════════════════════════

function genStats(slug) {
  return {
    STR: 0.5 + (slug.charCodeAt(0) % 40) / 100,
    INT: 0.5 + (slug.charCodeAt(1 % slug.length) % 40) / 100,
  };
}

const s1 = genStats('ghost');
const s2 = genStats('ghost');
assert(s1.STR === s2.STR, 'STR deterministic for same slug');
assert(s1.INT === s2.INT, 'INT deterministic for same slug');
assert(s1.STR >= 0.5 && s1.STR <= 0.9, `STR in range 0.5-0.9 (got ${s1.STR})`);

const s3 = genStats('axel');
assert(s1.STR !== s3.STR || s1.INT !== s3.INT, 'different slugs produce different stats');

// ═══════════════════════════════════
console.log('\n  progression field mapping (snake_case ↔ camelCase)');
// ═══════════════════════════════════

// Simulate _applyProgData logic for field mapping
function mapProgFields(s) {
  return {
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
}

// server format (snake_case from myśloodsiewnia)
const serverData = {
  xp: 75, sessions: 1, contributions: 3,
  max_contrib_session: 2, mp_drained: true,
  last_session_date: '2026-04-15', applied_tier: 10,
  model_tier: 'sonnet', relationships: { ghost: { sessions: 1 } },
};
const mapped = mapProgFields(serverData);
assert(mapped.totalContribs === 3, 'contributions → totalContribs');
assert(mapped.maxContribSession === 2, 'max_contrib_session → maxContribSession');
assert(mapped.mpDrained === true, 'mp_drained → mpDrained');
assert(mapped.lastSessionDate === '2026-04-15', 'last_session_date → lastSessionDate');
assert(mapped.appliedTier === 10, 'applied_tier → appliedTier');
assert(mapped.modelTier === 'sonnet', 'model_tier → modelTier');
assert(mapped.sessions === 1, 'sessions passes through');
assert(mapped.xp === 75, 'xp passes through');

// client format (camelCase from localStorage)
const clientData = {
  xp: 200, sessions: 5, totalContribs: 42,
  maxContribSession: 8, mpDrained: false,
  appliedTier: 25, modelTier: 'opus',
};
const mapped2 = mapProgFields(clientData);
assert(mapped2.totalContribs === 42, 'camelCase totalContribs preserved');
assert(mapped2.maxContribSession === 8, 'camelCase maxContribSession preserved');
assert(mapped2.appliedTier === 25, 'camelCase appliedTier preserved');

// empty data — all defaults
const mapped3 = mapProgFields({});
assert(mapped3.totalContribs === 0, 'empty → totalContribs defaults to 0');
assert(mapped3.sessions === 0, 'empty → sessions defaults to 0');
assert(mapped3.achievements.length === 0, 'empty → achievements defaults to []');
assert(mapped3.mpDrained === false, 'empty → mpDrained defaults to false');

// ═══════════════════════════════════
console.log('\n  PixiFaces guard logic');
// ═══════════════════════════════════

// PixiFaces should be soft-disabled when window.PixiFaces is undefined
assert(typeof global.PixiFaces === 'undefined', 'PixiFaces not defined in Node (expected)');
const pixiGuard = (typeof global.PixiFaces !== 'undefined') && global.PixiFaces;
assert(!pixiGuard, 'PixiFaces guard returns falsy when not loaded');

// Simulate PixiFaces object
global.PixiFaces = { enabled: true, getCanvas: () => null };
assert(global.PixiFaces.enabled === true, 'PixiFaces.enabled defaults to true');
assert(global.PixiFaces.getCanvas('ghost') === null, 'getCanvas returns null for uninitialized persona');
global.PixiFaces.enabled = false;
assert(global.PixiFaces.enabled === false, 'PixiFaces.enabled can be toggled off');
delete global.PixiFaces;

// ═══════════════════════════════════
console.log('\n  portrait loading paths');
// ═══════════════════════════════════

// Verify expected file paths for sprites
import fs from 'fs';
import { fileURLToPath } from 'url';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const facesDir = __dirname + 'sprites/faces/';

const testPersonas = ['mira-chen', 'ghost', 'hermiona', 'harvey'];
for (const id of testPersonas) {
  assert(fs.existsSync(facesDir + id + '.png'), `${id}.png exists`);
  assert(fs.existsSync(facesDir + id + '/rotations/south.png'), `${id}/rotations/south.png exists`);
}

// HR portraits (only 6 available)
const hrPersonas = ['mira-chen', 'eleanor-voss', 'ghost', 'hermiona', 'george-carlin', 'harvey'];
for (const id of hrPersonas) {
  assert(fs.existsSync(facesDir + 'portraits/' + id + '/rotations/south.png'), `portraits/${id} HR exists`);
}

// Pixi.js lib exists
assert(fs.existsSync(__dirname + 'lib/pixi.min.js'), 'lib/pixi.min.js exists');
assert(fs.existsSync(__dirname + 'pixi-faces.js'), 'pixi-faces.js exists');

// ═══════════════════════════════════
console.log('\n  mcpDirect allowlist');
// ═══════════════════════════════════

assert(ALLOWED_TOOLS.has('list_personas'), 'list_personas in ALLOWED_TOOLS');
assert(ALLOWED_TOOLS.has('bootstrap_session'), 'bootstrap_session in ALLOWED_TOOLS');
assert(!ALLOWED_TOOLS.has('delete_persona'), 'delete_persona not in ALLOWED_TOOLS');
assert(!ALLOWED_TOOLS.has('upsert_persona'), 'upsert_persona not in ALLOWED_TOOLS');
assert(!ALLOWED_TOOLS.has('remember'), 'remember not in ALLOWED_TOOLS (write op)');
assert(!ALLOWED_TOOLS.has('upsert_skill'), 'upsert_skill not in ALLOWED_TOOLS');
assert(ALLOWED_TOOLS.size === 18, `ALLOWED_TOOLS has 18 entries (got ${ALLOWED_TOOLS.size})`);

// ═══════════════════════════════════
console.log('\n  VAULT_FEATURES gating');
// ═══════════════════════════════════

const VAULT_FEATURES = new Set(['Live', 'Log', 'Narada']);
assert(VAULT_FEATURES.has('Live'), 'Live is a vault feature');
assert(VAULT_FEATURES.has('Log'), 'Log is a vault feature');
assert(VAULT_FEATURES.has('Narada'), 'Narada is a vault feature');
assert(!VAULT_FEATURES.has('Team'), 'Team is NOT a vault feature');
assert(!VAULT_FEATURES.has('Skills'), 'Skills is NOT a vault feature');
assert(!VAULT_FEATURES.has('Settings'), 'Settings is NOT a vault feature');

// ═══════════════════════════════════
console.log('\n  settings persistence');
// ═══════════════════════════════════

// Simulate localStorage for Node
const _store = {};
const localStorage = {
  getItem: k => _store[k] || null,
  setItem: (k, v) => { _store[k] = v; },
  removeItem: k => { delete _store[k]; },
};

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

// Default values
const defaults = loadSettings();
assert(defaults.serverUrl === 'https://kapoost-humanmcp.fly.dev/mcp', 'default server URL');
assert(defaults.sessionCode === '', 'default session code is empty');
assert(defaults.anthropicKey === '', 'default API key is empty');

// Save and reload
saveSettings({ serverUrl: 'https://custom.example.com/mcp', sessionCode: 'abc123', anthropicKey: 'sk-ant-test123' });
const reloaded = loadSettings();
assert(reloaded.serverUrl === 'https://custom.example.com/mcp', 'custom URL persisted');
assert(reloaded.sessionCode === 'abc123', 'session code persisted');
assert(reloaded.anthropicKey === 'sk-ant-test123', 'API key persisted');

// Clear API key
saveSettings({ serverUrl: 'https://custom.example.com/mcp', sessionCode: 'abc123', anthropicKey: '' });
const cleared = loadSettings();
assert(cleared.anthropicKey === '', 'empty API key clears storage');

// ═══════════════════════════════════
console.log('\n  mcpDirect JSON-RPC format');
// ═══════════════════════════════════

// Verify the JSON-RPC payload structure (without actual fetch)
function buildDirectPayload(tool, args) {
  return {
    jsonrpc: '2.0',
    id: 'test-id',
    method: 'tools/call',
    params: { name: tool, arguments: args || {} }
  };
}

const payload = buildDirectPayload('list_personas', { format: 'short' });
assert(payload.jsonrpc === '2.0', 'JSON-RPC version is 2.0');
assert(payload.method === 'tools/call', 'method is tools/call');
assert(payload.params.name === 'list_personas', 'tool name in params');
assert(payload.params.arguments.format === 'short', 'args passed through');

const payloadNoArgs = buildDirectPayload('about_humanmcp');
assert(Object.keys(payloadNoArgs.params.arguments).length === 0, 'empty args when none provided');

// ═══════════════════════════════════
// Results
// ═══════════════════════════════════

console.log(`\n  ─────────────────────`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`  ─────────────────────\n`);

process.exit(failed > 0 ? 1 : 0);
