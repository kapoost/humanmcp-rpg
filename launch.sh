#!/usr/bin/env bash
# humanMCP — Local Stack Launcher
# Usage: ./launch.sh

set -e

# ── Colors ──
R='\033[0;31m' G='\033[0;32m' Y='\033[0;33m' B='\033[0;34m'
M='\033[0;35m' C='\033[0;36m' W='\033[1;37m' D='\033[0;90m' N='\033[0m'

# ── Paths ──
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RPG_DIR="$SCRIPT_DIR"
VAULT_DIR="$HOME/mysloodsiewnia"
MCP_URL="${MCP_URL:-https://kapoost-humanmcp.fly.dev/mcp}"
RPG_PORT="${RPG_PORT:-8080}"
PROXY_PORT="${PROXY_PORT:-3001}"

# ── PIDs ──
PIDS=()

cleanup() {
  echo ""
  echo -e "${Y}Shutting down...${N}"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null && echo -e "  ${D}stopped PID $pid${N}"
  done
  wait 2>/dev/null
  echo -e "${G}All stopped.${N}"
  exit 0
}
trap cleanup SIGINT SIGTERM

header() {
  clear
  echo -e "${B}"
  echo "  ╔══════════════════════════════════════╗"
  echo "  ║       humanMCP — Stack Launcher      ║"
  echo "  ╚══════════════════════════════════════╝"
  echo -e "${N}"
}

status_line() {
  local name="$1" port="$2" status="$3"
  if [ "$status" = "ok" ]; then
    echo -e "  ${G}●${N} ${W}$name${N}${D} :$port${N}"
  elif [ "$status" = "starting" ]; then
    echo -e "  ${Y}○${N} ${W}$name${N}${D} :$port starting...${N}"
  else
    echo -e "  ${R}○${N} ${D}$name :$port (not running)${N}"
  fi
}

check_port() {
  curl -s --max-time 1 "http://localhost:$1" > /dev/null 2>&1
}

check_health() {
  local url="$1"
  curl -s --max-time 2 "$url" 2>/dev/null | grep -q "ok" 2>/dev/null
}

# ═══════════════════════════════════
header
echo -e "  ${D}MCP Server: $MCP_URL${N}"
echo ""

# ── Check dependencies ──
echo -e "  ${C}Checking dependencies...${N}"
MISSING=""
command -v node   >/dev/null 2>&1 || MISSING="$MISSING node"
command -v python3 >/dev/null 2>&1 || MISSING="$MISSING python3"

if [ -n "$MISSING" ]; then
  echo -e "  ${R}Missing:$MISSING${N}"
  echo -e "  ${D}Install them and try again.${N}"
  exit 1
fi
echo -e "  ${G}node$(node -v) python$(python3 --version | cut -d' ' -f2)${N}"
echo ""

# ═══════════════════════════════════
echo -e "  ${C}What do you want to launch?${N}"
echo ""
echo -e "  ${W}1${N}  RPG Client + Proxy       ${D}(play the game)${N}"
echo -e "  ${W}2${N}  RPG + Vault + Ollama      ${D}(full stack)${N}"
echo -e "  ${W}3${N}  Vault only                ${D}(knowledge base)${N}"
echo -e "  ${W}4${N}  Status check              ${D}(what's running?)${N}"
echo -e "  ${W}q${N}  Quit"
echo ""
echo -ne "  ${W}>${N} "
read -r choice

case "$choice" in

# ── 1: RPG Only ──
1)
  header
  echo -e "  ${C}Starting RPG Client + Proxy...${N}"
  echo ""

  # Start proxy
  cd "$RPG_DIR"
  node proxy.js --port "$PROXY_PORT" --mcp "$MCP_URL" --origin "http://localhost:$RPG_PORT" &
  PIDS+=($!)
  sleep 1

  # Extract token from proxy output (it prints to stdout)
  PROXY_TOKEN=$(node -e "
    const http = require('http');
    http.get('http://localhost:$PROXY_PORT/health', r => {
      r.on('data', () => {});
      r.on('end', () => process.exit(0));
    }).on('error', () => process.exit(1));
  " 2>/dev/null && echo "proxy running" || echo "")

  # Start static server
  python3 -m http.server "$RPG_PORT" --directory "$RPG_DIR" &
  PIDS+=($!)
  sleep 1

  header
  echo -e "  ${C}Services:${N}"
  echo ""

  if check_health "http://localhost:$PROXY_PORT/health"; then
    status_line "RPG Proxy" "$PROXY_PORT" "ok"
  else
    status_line "RPG Proxy" "$PROXY_PORT" "starting"
  fi

  if check_port "$RPG_PORT"; then
    status_line "RPG Client" "$RPG_PORT" "ok"
  else
    status_line "RPG Client" "$RPG_PORT" "starting"
  fi

  echo ""
  echo -e "  ${G}Open: ${W}http://localhost:$RPG_PORT${N}"
  echo -e "  ${D}Proxy token printed above — paste it in the Connect screen${N}"
  echo ""
  echo -e "  ${D}Press Ctrl+C to stop all services${N}"
  echo ""

  wait
  ;;

# ── 2: Full Stack ──
2)
  header
  echo -e "  ${C}Starting full stack...${N}"
  echo ""

  # Check Ollama
  if command -v ollama >/dev/null 2>&1; then
    if ! check_port 11434; then
      echo -e "  ${Y}Starting Ollama...${N}"
      ollama serve &
      PIDS+=($!)
      sleep 2
    fi
    status_line "Ollama" "11434" "ok"
  else
    echo -e "  ${R}Ollama not installed — vault search will be limited${N}"
    echo -e "  ${D}Install: brew install ollama${N}"
  fi

  # Start vault
  if [ -d "$VAULT_DIR" ]; then
    echo -e "  ${Y}Starting mysloodsiewnia...${N}"
    cd "$VAULT_DIR"
    if [ -d ".venv" ]; then
      source .venv/bin/activate
    fi
    python main.py &
    PIDS+=($!)
    sleep 2
    status_line "Vault" "7331" "ok"
  else
    echo -e "  ${R}mysloodsiewnia not found at $VAULT_DIR${N}"
  fi

  # Start proxy
  cd "$RPG_DIR"
  echo -e "  ${Y}Starting proxy...${N}"
  node proxy.js --port "$PROXY_PORT" --mcp "$MCP_URL" --origin "http://localhost:$RPG_PORT" &
  PIDS+=($!)
  sleep 1

  # Start client
  echo -e "  ${Y}Starting RPG client...${N}"
  python3 -m http.server "$RPG_PORT" --directory "$RPG_DIR" &
  PIDS+=($!)
  sleep 1

  header
  echo -e "  ${C}Services:${N}"
  echo ""

  check_port 11434 && status_line "Ollama" "11434" "ok" || status_line "Ollama" "11434" "off"
  check_health "http://localhost:7331/health" && status_line "Vault" "7331" "ok" || status_line "Vault" "7331" "off"
  check_health "http://localhost:$PROXY_PORT/health" && status_line "RPG Proxy" "$PROXY_PORT" "ok" || status_line "RPG Proxy" "$PROXY_PORT" "off"
  check_port "$RPG_PORT" && status_line "RPG Client" "$RPG_PORT" "ok" || status_line "RPG Client" "$RPG_PORT" "off"

  echo ""
  echo -e "  ${G}Open: ${W}http://localhost:$RPG_PORT${N}"
  echo -e "  ${D}Proxy token printed above — paste it in the Connect screen${N}"
  echo ""
  echo -e "  ${D}Press Ctrl+C to stop all services${N}"
  echo ""

  wait
  ;;

# ── 3: Vault Only ──
3)
  header
  echo -e "  ${C}Starting Vault...${N}"
  echo ""

  # Ollama
  if command -v ollama >/dev/null 2>&1; then
    if ! check_port 11434; then
      ollama serve &
      PIDS+=($!)
      sleep 2
    fi
    status_line "Ollama" "11434" "ok"
  fi

  # Vault
  if [ -d "$VAULT_DIR" ]; then
    cd "$VAULT_DIR"
    [ -d ".venv" ] && source .venv/bin/activate
    python main.py &
    PIDS+=($!)
    sleep 2

    header
    echo -e "  ${C}Services:${N}"
    echo ""
    check_port 11434 && status_line "Ollama" "11434" "ok" || status_line "Ollama" "11434" "off"
    check_health "http://localhost:7331/health" && status_line "Vault" "7331" "ok" || status_line "Vault" "7331" "off"

    echo ""
    echo -e "  ${D}Vault ready. Expose with:${N}"
    echo -e "  ${W}cloudflared tunnel --url http://localhost:7331${N}"
    echo ""
    echo -e "  ${D}Press Ctrl+C to stop${N}"
    echo ""
  else
    echo -e "  ${R}mysloodsiewnia not found at $VAULT_DIR${N}"
    exit 1
  fi

  wait
  ;;

# ── 4: Status ──
4)
  header
  echo -e "  ${C}Status:${N}"
  echo ""

  check_port 11434 && status_line "Ollama" "11434" "ok" || status_line "Ollama" "11434" "off"
  check_health "http://localhost:7331/health" && status_line "Vault" "7331" "ok" || status_line "Vault" "7331" "off"
  check_health "http://localhost:$PROXY_PORT/health" && status_line "RPG Proxy" "$PROXY_PORT" "ok" || status_line "RPG Proxy" "$PROXY_PORT" "off"
  check_port "$RPG_PORT" && status_line "RPG Client" "$RPG_PORT" "ok" || status_line "RPG Client" "$RPG_PORT" "off"

  # Remote
  echo ""
  echo -e "  ${C}Remote:${N}"
  echo ""
  if curl -s --max-time 3 "$MCP_URL" -X POST -H 'Content-Type: application/json' \
    -d '{"jsonrpc":"2.0","id":"1","method":"tools/list"}' 2>/dev/null | grep -q "tools" 2>/dev/null; then
    echo -e "  ${G}●${N} ${W}humanMCP Server${N} ${D}$MCP_URL${N}"
  else
    echo -e "  ${R}○${N} ${D}humanMCP Server $MCP_URL (unreachable)${N}"
  fi
  echo ""
  ;;

q|Q|"")
  echo -e "  ${D}Bye.${N}"
  exit 0
  ;;

*)
  echo -e "  ${R}Unknown option: $choice${N}"
  exit 1
  ;;

esac
