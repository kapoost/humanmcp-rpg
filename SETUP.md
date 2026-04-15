# humanMCP — Full Stack Setup

Complete guide to running the humanMCP ecosystem locally.

## Architecture

### Full local setup (all features)

```
                                    Internet
                                       │
                              ┌────────┴────────┐
                              │   Fly.io (ams)   │
                              │  humanmcp-go     │
                              │  :8080 /mcp      │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
             ┌──────┴──────┐   ┌──────┴──────┐   ┌──────┴──────┐
             │  RPG Client │   │  RPG Proxy  │   │ mysloodsi-  │
             │  :8080      │   │  :3001      │   │ ewnia :7331 │
             │  (browser)  │   │  (node.js)  │   │ (python)    │
             └─────────────┘   └─────────────┘   └──────┬──────┘
                                                        │
                                                 ┌──────┴──────┐
                                                 │   Ollama    │
                                                 │   :11434    │
                                                 └─────────────┘
```

### GitHub Pages / direct mode (no local services)

```
             ┌─────────────┐              ┌────────────────┐
             │  RPG Client │  JSON-RPC    │   Fly.io       │
             │  (browser)  │ ────────────►│  humanmcp-go   │
             │  GitHub     │  direct      │  /mcp          │
             │  Pages      │ ◄────────────│  CORS: *       │
             └─────────────┘              └────────────────┘
```

In direct mode, the client connects straight to humanMCP via JSON-RPC.
No proxy needed. Live, Log, and Narada are disabled (require mysloodsiewnia).

## Prerequisites

- **Node.js** 18+ (for RPG proxy)
- **Python 3.10+** (for RPG static server + mysloodsiewnia)
- **Go 1.22+** (only if building humanmcp-go locally)
- **Ollama** (only if running mysloodsiewnia vault)

## 1. RPG Client + Proxy (this repo)

```bash
cd humanmcp-rpg

# Option A: both at once
npm run dev

# Option B: separate terminals
node proxy.js --port 3001 --mcp https://kapoost-humanmcp.fly.dev/mcp
python3 -m http.server 8080
```

Open http://localhost:8080, paste the proxy token, press Enter.

## 2. humanmcp-go Server (remote — already running)

The server runs on Fly.io at `https://kapoost-humanmcp.fly.dev/mcp`.
No local setup needed unless you want your own instance.

### Deploy your own:

```bash
cd humanmcp-go
fly launch
fly secrets set EDIT_TOKEN=your-secret AUTHOR_NAME=yourname
fly deploy
```

### Run locally:

```bash
cd humanmcp-go
go build ./cmd/server/
EDIT_TOKEN=secret AUTHOR_NAME=yourname ./server
# Listens on :8080
```

## 3. mysloodsiewnia (Vault / Knowledge Base)

Required for the Vault feature in RPG client.

```bash
cd ~/mysloodsiewnia

# First time setup
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start Ollama (separate terminal)
ollama serve
ollama pull nomic-embed-text
ollama pull llama3.2

# Start vault
source .venv/bin/activate
python main.py
# Listens on :7331
```

Then expose via Cloudflare tunnel (so Fly.io server can reach it):

```bash
brew install cloudflared  # if needed
cloudflared tunnel --url http://localhost:7331
# Copy the https://*.trycloudflare.com URL
# Set it as VAULT_URL in Fly.io secrets:
fly secrets set VAULT_URL=https://your-tunnel.trycloudflare.com
```

## 4. Claude Desktop / Cursor Integration

```bash
curl -sL https://raw.githubusercontent.com/kapoost/humanmcp-connect/main/connect.zsh | zsh
```

Or manually add to `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kapoost": {
      "url": "https://kapoost-humanmcp.fly.dev/mcp"
    }
  }
}
```

## Ports Summary

| Service        | Port  | Required for          |
|----------------|-------|-----------------------|
| RPG Client     | 8080  | always (or GitHub Pages) |
| RPG Proxy      | 3001  | local mode only       |
| humanmcp-go    | 8080  | remote (fly.dev)      |
| mysloodsiewnia | 7331  | Live, Log, Narada     |
| Ollama         | 11434 | mysloodsiewnia        |

### What needs what

| Feature | humanMCP (fly.dev) | Proxy | mysloodsiewnia | Ollama |
|---------|:--:|:--:|:--:|:--:|
| Team, Skills, Library, About | yes | optional | -- | -- |
| Vault Search | yes | optional | optional (local search) | -- |
| Message, Bootstrap | yes | optional | -- | -- |
| Live Transcription | -- | yes | yes | -- |
| Quest Log | -- | yes | yes | -- |
| Narada | -- | yes | yes | yes |

## Quick Health Checks

```bash
# Proxy
curl http://localhost:3001/health

# humanMCP server
curl https://kapoost-humanmcp.fly.dev/mcp -X POST \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":"1","method":"tools/list"}'

# mysloodsiewnia
curl http://localhost:7331/health

# Ollama
curl http://localhost:11434/api/tags
```
