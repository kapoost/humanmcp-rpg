# humanMCP RPG

A jRPG-styled client for [humanMCP](https://github.com/kapoost/humanmcp-go) servers.
Explore any human's published content, personas, and skills through a retro FF7-inspired interface — all rendered on Canvas 2D with vanilla JS.

![humanMCP RPG](https://img.shields.io/badge/stack-vanilla%20JS%20%2B%20Canvas-black?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

## What is this?

Every [humanMCP](https://github.com/kapoost/humanmcp-go) server represents one human — their writings, skills, AI personas, and professional profile. This client turns that data into an explorable RPG world:

- **Team Roster** — browse the human's AI persona team with stats, roles, and pixel art portraits
- **Skills** — view skill categories and details
- **Library** — read published poems, essays, and articles with inline images
- **Vault** — query the human's knowledge base
- **Message** — leave a note for the human
- **About** — author profile + agent integration guide with example prompts

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

```
Browser (Canvas 2D)          Proxy (Node.js)           MCP Server
┌─────────────────┐    POST /call + Bearer    ┌──────────────┐    JSON-RPC    ┌──────────┐
│  index.html      │ ──────────────────────── │  proxy.js     │ ────────────── │ humanMCP │
│  engine.js       │    { tool, args }        │  :3001        │  tools/call   │ (remote) │
│  sprites/faces/  │ ◄─────────────────────── │               │ ◄──────────── │          │
└─────────────────┘    { ok, result }         └──────────────┘               └──────────┘
```

The proxy exists because browsers can't call MCP servers directly (CORS). It adds a security layer:

- **Bearer token** — random token generated at startup, required for all requests
- **Tool allowlist** — only safe, read-oriented tools are proxied
- **CORS restriction** — only configured origin allowed
- **Body size limit** — 10KB max request body
- **CSP headers** — Content Security Policy in index.html

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

This client is generic — it works with any humanMCP server. On the Connect screen:

1. Enter the MCP server URL (e.g. `https://your-name-humanmcp.fly.dev/mcp`)
2. Enter the proxy token (shown in proxy.js console output)
3. Press Enter to connect

## Sprites

Character portraits are 48px pixel art in chibi proportions, generated with [PixelLab](https://pixellab.ai). Each persona has a 4-direction sprite sheet stored in `sprites/faces/`.

## Project Structure

```
humanmcp-rpg/
├── index.html        # Entry point with CSP
├── engine.js         # Game engine — all scenes, rendering, input, audio
├── proxy.js          # Node.js MCP proxy with auth
├── package.json
├── sprites/
│   └── faces/        # Persona portrait sprites (48px PNG)
└── content/
    └── ireland.jpg   # Extracted MCP blob
```

## Stack

- **Rendering**: Canvas 2D — no DOM, no frameworks, XSS-safe by design
- **Audio**: Web Audio API oscillators (8-bit square/sawtooth waves)
- **Sprites**: PixelLab-generated pixel art
- **Proxy**: Node.js stdlib only (http, https, crypto) — zero dependencies
- **Style**: FF7 PS1 — dark blue gradient boxes, double borders, typewriter text

## GitHub Pages

The static client (`index.html`, `engine.js`, `sprites/`) can be hosted on GitHub Pages.
The proxy must run separately (e.g. on a VPS, Fly.io, or locally).

To enable: Settings > Pages > Source: Deploy from branch > `main` > `/ (root)`.

## Related

- [humanmcp-go](https://github.com/kapoost/humanmcp-go) — the humanMCP server
- [humanmcp-connect](https://github.com/kapoost/humanmcp-connect) — one-line installer for Claude Desktop / Cursor

## License

MIT
