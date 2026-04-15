# humanMCP RPG

A jRPG-styled client for [humanMCP](https://github.com/kapoost/humanmcp-go) servers.
Explore any human's published content, personas, and skills through a retro FF7-inspired interface — all rendered on Canvas 2D with vanilla JS.

**Play now:** [kapoost.github.io/humanmcp-rpg](https://kapoost.github.io/humanmcp-rpg) — no install needed, connects directly to the MCP server.

![humanMCP RPG](https://img.shields.io/badge/stack-vanilla%20JS%20%2B%20Canvas-black?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

## What is this?

Every [humanMCP](https://github.com/kapoost/humanmcp-go) server represents one human — their writings, skills, AI personas, and professional profile. This client turns that data into an explorable RPG world:

- **Team Roster** — browse the human's 14-persona AI team with stats, roles, and pixel art portraits
- **Skills** — view 18 skill instructions and categories
- **Library** — read published poems, essays, and articles with inline images
- **Vault** — query the human's knowledge base (humanMCP + myśloodsiewnia)
- **Message** — leave a note for the human
- **Settings** — configure server URL, session code, API key (persisted in localStorage)
- **About** — author profile + agent integration guide with example prompts
- **Console Log** — live activity feed showing MCP calls, connections, and events

With [myśloodsiewnia](https://github.com/kapoost/mysloodsiewnia) running locally:
- **Live Transcription** — record meetings with Whisper, persona commentary, mood analysis
- **Quest Log** — browse past meeting transcripts with AI-generated briefs
- **Narada** — team brainstorm sessions using all 14 personas via local Ollama

## Quick Start

```bash
# 1. Serve the static client
python3 -m http.server 8080

# 2. Start the proxy (bridges browser to MCP server)
node proxy.js

# 3. Open http://localhost:8080
#    Enter the proxy token (printed at proxy startup) in the Connect screen
```

Or use the combined dev script:

```bash
npm run dev
```

## Architecture

The client supports two connection modes:

```
Mode A — Local (with proxy)
Browser ──► proxy.js (:3001) ──► humanMCP (fly.dev)
                │
                └──► mysloodsiewnia (:7331)  ← optional, unlocks Live/Log/Narada

Mode B — Direct (GitHub Pages)
Browser ──► humanMCP (fly.dev)   ← JSON-RPC over CORS
```

**Mode A** uses a local Node.js proxy for security (bearer token, tool allowlist, body size limit). When available, it also connects to mysloodsiewnia for local-only features.

**Mode B** connects directly to the MCP server via JSON-RPC. No proxy needed — humanMCP-go has CORS enabled (`Access-Control-Allow-Origin: *`). This is what GitHub Pages uses.

The client auto-detects which mode to use: it probes the proxy first, and falls back to direct connection if the proxy is offline.

## Proxy Options

```bash
node proxy.js [--port 3001] [--mcp https://your-server.fly.dev/mcp] [--origin http://localhost:8080]
```

| Flag       | Default                                  | Description              |
|------------|------------------------------------------|--------------------------|
| `--port`   | `3001`                                   | Proxy listen port        |
| `--mcp`    | `https://kapoost-humanmcp.fly.dev/mcp`  | MCP server URL           |
| `--origin` | `http://localhost:8080`                  | Allowed CORS origin      |

## Controls

| Key        | Action                       |
|------------|------------------------------|
| `Arrow ↑↓` | Navigate menus / scroll text |
| `Arrow ←→` | Switch tabs                  |
| `Enter`    | Select / advance text        |
| `Escape`   | Back                         |
| `Tab`      | Switch input fields          |

Pressing Enter while text is typing completes it instantly. Next Enter advances to the next page.

## Connecting to Any humanMCP Server

This client is generic — it works with any humanMCP server.

**With proxy (local):**
1. Start `node proxy.js`
2. Enter the proxy token on the Connect screen
3. Press Enter

**Without proxy (GitHub Pages / direct):**
1. Open Settings from the menu (or press S)
2. Enter the MCP server URL (e.g. `https://your-name-humanmcp.fly.dev/mcp`)
3. Enter a session code (optional — unlocks full team and skills)
4. Press Enter to save — the client connects directly via JSON-RPC

## Sprites

Character portraits are 48px pixel art in chibi proportions, generated with [PixelLab](https://pixellab.ai). Each persona has a 4-direction sprite sheet stored in `sprites/faces/`.

## Testing

```bash
# Node tests (pure functions — no browser needed)
npm test

# Browser tests (rendering, input, network, live session)
npm start
npm run test:browser
# or: open http://localhost:8080/test-browser.html
```

Node tests cover pure logic (hashing, parsing, allowlist). Browser tests cover all 15 scenes, keyboard/touch input, fetch/WebSocket mocks, MediaRecorder lifecycle, state bounds, paste handling, error paths, and CSP compliance.

## Project Structure

```
humanmcp-rpg/
├── index.html         # Entry point with CSP
├── engine.js          # Game engine — all scenes, rendering, input, audio
├── proxy.js           # Node.js MCP proxy with auth
├── test.js            # Node unit tests (pure functions)
├── test-browser.html  # Browser test runner
├── test-browser.js    # Browser test assertions (~90 tests)
├── test-mocks.js      # Browser API mocks (fetch, WS, MediaRecorder, etc.)
├── package.json
├── sprites/
│   └── faces/         # Persona portrait sprites (48px PNG)
└── content/
    └── ireland.jpg    # Extracted MCP blob
```

## Stack

- **Rendering**: Canvas 2D — no DOM, no frameworks, XSS-safe by design
- **Audio**: Web Audio API oscillators (8-bit square/sawtooth waves)
- **Sprites**: PixelLab-generated pixel art
- **Proxy**: Node.js stdlib only (http, https, crypto) — zero dependencies
- **Style**: FF7 PS1 — dark blue gradient boxes, double borders, typewriter text

## GitHub Pages

The static client works on GitHub Pages without any backend. It connects directly to the humanMCP server via JSON-RPC.

To enable: Settings > Pages > Source: Deploy from branch > `main` > `/ (root)`.

### What works on GitHub Pages

| Feature | GitHub Pages | Local (with proxy + mysloodsiewnia) |
|---------|:-----------:|:-----------------------------------:|
| Team (personas) | works | works |
| Skills | works | works |
| Library (poems) | works | works |
| About (author profile) | works | works |
| Vault Search | works (via humanMCP) | works (local + humanMCP) |
| Message | works | works |
| Bootstrap Session | works | works |
| Settings | works | works |
| Quest Log | -- | works (requires mysloodsiewnia) |
| Live Transcription | -- | works (requires mysloodsiewnia) |
| Narada (team brainstorm) | -- | works (requires mysloodsiewnia) |

Features marked `--` are greyed out in the menu with a "(local)" label. Selecting them shows a message explaining they require mysloodsiewnia.

### Settings panel

The Settings scene (accessible from the menu) lets users configure:

- **Server URL** — which humanMCP server to connect to (default: `kapoost-humanmcp.fly.dev/mcp`)
- **Session code** — unlocks full personas and skills
- **Anthropic API key** — stored for future Narada-via-API support

All settings persist in `localStorage` across sessions.

### How it works for visitors

A visitor on GitHub Pages:
1. Opens the page — client probes for local proxy (fails) and connects directly to fly.dev
2. Browses Team, Skills, Library, Vault, About — all work via direct JSON-RPC
3. Opens Settings to enter a session code — unlocks full team prompts and skills
4. Live/Log/Narada are greyed out — these need mysloodsiewnia running locally

### mysloodsiewnia integration

[mysloodsiewnia](https://github.com/kapoost/mysloodsiewnia) is the local knowledge base / vault server. It provides:

- **Live Transcription** — real-time meeting recording with Whisper, persona commentary, mood analysis, speaker identification
- **Quest Log** — browse past meeting transcripts and AI-generated briefs
- **Narada** — team brainstorm sessions where all personas discuss a topic using local Ollama models
- **Local Vault** — search documents, notes, lexicon entries with embeddings (Ollama + nomic-embed-text)
- **Persona state sync** — active/inactive persona toggles persist to vault
- **Progression sync** — XP, achievements, and session stats sync between localStorage and vault

These features require mysloodsiewnia running on `localhost:7331` with Ollama on `:11434`. They are only available when running the client locally with the proxy.

## Related

- [humanmcp-go](https://github.com/kapoost/humanmcp-go) — the humanMCP server (Go, zero deps, Fly.io)
- [myśloodsiewnia](https://github.com/kapoost/mysloodsiewnia) — local knowledge base, Whisper transcription, Ollama embeddings
- [humanmcp-connect](https://github.com/kapoost/humanmcp-connect) — one-line installer for Claude Desktop / Cursor
- [MCP Registry](https://registry.modelcontextprotocol.io/?search=kapoost) — `io.github.kapoost/humanmcp`

## License

MIT
