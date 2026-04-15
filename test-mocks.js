// humanMCP RPG — browser test mocks
// Loaded BEFORE engine.js to intercept browser APIs

// ── requestAnimationFrame mock ──
// Capture the loop callback without auto-calling it
let __rafCallback = null;
window.requestAnimationFrame = function(cb) {
  __rafCallback = cb;
  return 1;
};
window.cancelAnimationFrame = function() {};

// Manual tick for tests
window.__TEST_TICK__ = function(dt) {
  if (__rafCallback) __rafCallback(dt || 16);
};

// ── fetch mock ──
const __fetchLog = [];
const __fetchResponses = {
  // proxy
  'http://localhost:3001/health': { status: 'ok', version: '0.1.0' },
  'http://localhost:3001/call': { ok: true, result: 'mock result' },
  // myśloodsiewnia
  'http://localhost:7331/health': { status: 'ok' },
  'http://localhost:7331/documents': [{ doc_type: 'note', slug: 'test-note' }],
  'http://localhost:7331/lexicon': [{ term: 'test' }],
  'http://localhost:7331/transcripts': [{ slug: 'session-1', title: 'Session 1' }],
  'http://localhost:7331/query': { results: [{ title: 'Test', body: 'mock body' }] },
};

window.__fetchLog = __fetchLog;
window.__fetchResponses = __fetchResponses;

const __origFetch = window.fetch;
window.fetch = function(url, opts) {
  __fetchLog.push({ url, opts });
  const urlStr = typeof url === 'string' ? url : url.toString();

  // Match URL prefix for POST endpoints
  let responseData;
  for (const [pattern, data] of Object.entries(__fetchResponses)) {
    if (urlStr === pattern || urlStr.startsWith(pattern)) {
      responseData = data;
      break;
    }
  }

  if (responseData !== undefined) {
    const body = JSON.stringify(responseData);
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(responseData),
      text: () => Promise.resolve(body),
    });
  }

  // Default: 404
  return Promise.resolve({
    ok: false,
    status: 404,
    json: () => Promise.reject(new Error('Not found')),
    text: () => Promise.resolve('Not found'),
  });
};

// ── WebSocket mock ──
const __wsLog = [];
window.__wsLog = __wsLog;

class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    this.sentData = [];
    __wsLog.push({ type: 'create', url });

    // Auto-connect after microtask
    Promise.resolve().then(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen(new Event('open'));
    });
  }
  send(data) {
    this.sentData.push(data);
    __wsLog.push({ type: 'send', data });
  }
  close(code) {
    this.readyState = 3; // CLOSED
    __wsLog.push({ type: 'close', code });
    if (this.onclose) this.onclose({ code: code || 1000 });
  }
  // Simulate receiving a message
  __simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: typeof data === 'string' ? data : JSON.stringify(data) });
    }
  }
}
MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSING = 2;
MockWebSocket.CLOSED = 3;
window.WebSocket = MockWebSocket;

// ── MediaRecorder mock ──
const __recorderLog = [];
window.__recorderLog = __recorderLog;

class MockMediaRecorder {
  constructor(stream, opts) {
    this.stream = stream;
    this.state = 'inactive';
    this.mimeType = (opts && opts.mimeType) || 'audio/webm;codecs=opus';
    this.ondataavailable = null;
    this.onstop = null;
    this.onerror = null;
    __recorderLog.push({ type: 'create', mime: this.mimeType });
  }
  start() {
    this.state = 'recording';
    __recorderLog.push({ type: 'start' });
  }
  stop() {
    this.state = 'inactive';
    __recorderLog.push({ type: 'stop' });
    // Simulate data + stop events
    if (this.ondataavailable) {
      const blob = new Blob(['fake-audio'], { type: this.mimeType });
      this.ondataavailable({ data: blob });
    }
    if (this.onstop) {
      Promise.resolve().then(() => { if (this.onstop) this.onstop(); });
    }
  }
  static isTypeSupported(type) {
    return type === 'audio/webm;codecs=opus' || type === 'audio/webm';
  }
}
window.MediaRecorder = MockMediaRecorder;

// ── getUserMedia mock ──
const __fakeTrack = {
  stop: function() {},
  kind: 'audio',
  enabled: true,
};
const __fakeStream = {
  active: true,
  getTracks: function() { return [__fakeTrack]; },
  getAudioTracks: function() { return [__fakeTrack]; },
};
window.__fakeStream = __fakeStream;

if (!navigator.mediaDevices) navigator.mediaDevices = {};
navigator.mediaDevices.getUserMedia = function() {
  return Promise.resolve(__fakeStream);
};

// ── Image mock: force immediate onload ──
const OrigImage = window.Image;
window.Image = function() {
  const img = new OrigImage();
  // When src is set, immediately fire onload in next microtask
  let _src = '';
  Object.defineProperty(img, 'src', {
    get() { return _src; },
    set(v) {
      _src = v;
      Promise.resolve().then(() => {
        Object.defineProperty(img, 'width', { value: 48 });
        Object.defineProperty(img, 'height', { value: 48 });
        Object.defineProperty(img, 'naturalWidth', { value: 48 });
        Object.defineProperty(img, 'naturalHeight', { value: 48 });
        Object.defineProperty(img, 'complete', { value: true });
        if (img.onload) img.onload();
      });
    }
  });
  return img;
};

// ── AudioContext mock ──
class MockOscillator {
  connect() { return this; }
  start() {}
  stop() {}
  disconnect() {}
}
MockOscillator.prototype.frequency = { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} };

class MockGainNode {
  connect() { return this; }
  disconnect() {}
}
MockGainNode.prototype.gain = { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} };

class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.destination = {};
    this.state = 'running';
  }
  createOscillator() { return new MockOscillator(); }
  createGain() { return new MockGainNode(); }
  resume() { return Promise.resolve(); }
  close() { return Promise.resolve(); }
}
window.AudioContext = MockAudioContext;
window.webkitAudioContext = MockAudioContext;

// ── location mock helpers ──
// engine.js reads location.protocol for WS
if (!window.location.protocol) window.location.protocol = 'http:';

console.log('[test-mocks] All mocks installed');
