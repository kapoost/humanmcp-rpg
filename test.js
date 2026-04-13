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
// Results
// ═══════════════════════════════════

console.log(`\n  ─────────────────────`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`  ─────────────────────\n`);

process.exit(failed > 0 ? 1 : 0);
