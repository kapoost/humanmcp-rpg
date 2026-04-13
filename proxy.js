#!/usr/bin/env node
// humanMCP RPG Proxy — bridges browser client to MCP server
// Usage: node proxy.js [--port 3001] [--mcp https://kapoost-humanmcp.fly.dev/mcp]

import http from 'http';
import https from 'https';
import crypto from 'crypto';

const args = process.argv.slice(2);
const PORT = parseInt(args[args.indexOf('--port') + 1]) || 3001;
const MCP_URL = args[args.indexOf('--mcp') + 1] || 'https://kapoost-humanmcp.fly.dev/mcp';
const ORIGIN = args[args.indexOf('--origin') + 1] || 'http://localhost:8080';
const MAX_BODY = 10240; // 10KB max request body

// Session token — printed at startup, required for all /call requests
const TOKEN = crypto.randomBytes(16).toString('hex');

// Tool allowlist — only safe, read-oriented + comment/message tools
const ALLOWED_TOOLS = new Set([
  'get_author_profile',
  'list_content',
  'read_content',
  'verify_content',
  'get_certificate',
  'list_personas',
  'get_persona',
  'list_skills',
  'get_skill',
  'list_blobs',
  'query_vault',
  'recall',
  'leave_comment',
  'leave_message',
  'request_access',
  'submit_answer',
  'about_humanmcp',
]);

const server = http.createServer(async (req, res) => {
  // CORS — restricted to configured origin
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check (no auth required — doesn't expose sensitive data)
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // Proxy MCP tool call: POST /call { tool, args }
  if (req.method === 'POST' && req.url === '/call') {
    // Auth check
    const authHeader = req.headers['authorization'] || '';
    if (authHeader !== `Bearer ${TOKEN}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Unauthorized. Pass token as Bearer header.' }));
      return;
    }

    // Body size limit
    let body = '';
    let bodySize = 0;
    let aborted = false;

    req.on('data', chunk => {
      bodySize += chunk.length;
      if (bodySize > MAX_BODY) {
        aborted = true;
        req.destroy();
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Request too large' }));
        return;
      }
      body += chunk;
    });

    req.on('end', async () => {
      if (aborted) return;
      try {
        const { tool, args: toolArgs } = JSON.parse(body);

        // Tool allowlist check
        if (!ALLOWED_TOOLS.has(tool)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: `Tool '${tool}' not allowed` }));
          return;
        }

        const result = await callMcp(tool, toolArgs || {});
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, result }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// JSON-RPC over HTTP to MCP server
function callMcp(tool, args) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method: 'tools/call',
      params: { name: tool, arguments: args },
    });

    const url = new URL(MCP_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const client = url.protocol === 'https:' ? https : http;
    const request = client.request(options, (response) => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error.message || 'MCP error'));
          } else {
            // extract text from MCP response
            const content = json.result?.content || [];
            const text = content
              .filter(c => c.type === 'text')
              .map(c => c.text)
              .join('\n');
            resolve(text || JSON.stringify(json.result));
          }
        } catch (e) {
          // might be SSE or non-JSON — return raw
          resolve(data);
        }
      });
    });

    request.on('error', reject);
    request.setTimeout(15000, () => {
      request.destroy();
      reject(new Error('MCP request timeout'));
    });
    request.write(payload);
    request.end();
  });
}

server.listen(PORT, () => {
  console.log(`\n  humanMCP RPG Proxy`);
  console.log(`  ──────────────────`);
  console.log(`  Port:   http://localhost:${PORT}`);
  console.log(`  MCP:    ${MCP_URL}`);
  console.log(`  Origin: ${ORIGIN}`);
  console.log(`  Token:  ${TOKEN}`);
  console.log(`\n  ⚠ Pass this token to the client to authorize requests.`);
  console.log(`  Allowed tools: ${[...ALLOWED_TOOLS].join(', ')}`);
  console.log(``);
});
