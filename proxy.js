#!/usr/bin/env node
// humanMCP RPG Proxy — bridges browser client to MCP server
// Usage: node proxy.js [--port 3001] [--mcp https://kapoost-humanmcp.fly.dev/mcp]

import http from 'http';
import https from 'https';

const args = process.argv.slice(2);
const PORT = parseInt(args[args.indexOf('--port') + 1]) || 3001;
const MCP_URL = args[args.indexOf('--mcp') + 1] || 'https://kapoost-humanmcp.fly.dev/mcp';

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', mcp: MCP_URL }));
    return;
  }

  // Proxy MCP tool call: POST /call { tool, args }
  if (req.method === 'POST' && req.url === '/call') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { tool, args: toolArgs } = JSON.parse(body);
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
      id: Date.now(),
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
  console.log(`humanMCP proxy running on http://localhost:${PORT}`);
  console.log(`Proxying to: ${MCP_URL}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  /health     — status check`);
  console.log(`  POST /call       — { tool, args } → MCP tool call`);
  console.log(`\nExample:`);
  console.log(`  curl -X POST http://localhost:${PORT}/call \\`);
  console.log(`    -H 'Content-Type: application/json' \\`);
  console.log(`    -d '{"tool":"list_content","args":{}}'`);
});
