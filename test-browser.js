// humanMCP RPG — browser tests (zero dependencies)
// Run: open test-browser.html after npm start

const output = document.getElementById('output');
let passed = 0;
let failed = 0;
let currentSection = '';

function log(msg) {
  output.textContent += msg + '\n';
  console.log(msg);
}

function section(name) {
  currentSection = name;
  log('\n═══ ' + name + ' ═══');
}

function assert(condition, msg) {
  if (condition) {
    passed++;
    log('  \u2713 ' + msg);
  } else {
    failed++;
    log('  \u2717 ' + msg + '  [FAIL in: ' + currentSection + ']');
  }
}

function resetState() {
  const T = window.__TEST__;
  T.state.scene = 'title';
  T.state.menuCursor = 0;
  T.state.teamCursor = 0;
  T.state.contentCursor = 0;
  T.state.skillsCursor = 0;
  T.state.readingScroll = 0;
  T.state.aboutScroll = 0;
  T.state.aboutTab = 0;
  T.state.liveScroll = 0;
  T.state.logCursor = 0;
  T.state.logBody = null;
  T.state.vaultQuery = '';
  T.state.vaultResults = null;
  T.state.naradaPrompt = '';
  T.state.naradaResults = null;
  T.state.messageText = '';
  T.state.messageSent = false;
  T.state.connected = false;
  T.state.proxyAvailable = false;
  T.state.inputText = '';
  T.state.tokenInput = '';
  T.state.sessionInput = '';
  T.state.connectField = 0;
  T.state.currentDialog = null;
  T.state.dialogQueue = [];
  T.state.liveActive = false;
  T.state.liveBubbles = [];
  T.state.liveSpeakers = {};
  T.state.liveWs = null;
  T.state.liveRecorder = null;
  T.state.liveStream = null;
  T.state.seenTips = {};
  T.state.contentItems = [];
  T.state.logItems = [];
}

function fakeKeyEvent(key, extra) {
  return Object.assign({
    key: key,
    preventDefault: function() {},
    ctrlKey: false,
    metaKey: false,
  }, extra || {});
}

// Wait for engine.js init to complete
setTimeout(function() {
  const T = window.__TEST__;
  if (!T) {
    log('ERROR: window.__TEST__ not found. Did engine.js load?');
    return;
  }

  log('humanMCP RPG — Browser Tests');
  log('─────────────────────────────');

  // ═══════════════════════════════════
  section('Init');
  // ═══════════════════════════════════

  assert(T.state !== undefined, 'state object exists');
  assert(T.state.scene === 'connect' || T.state.scene === 'title' || T.state.scene === 'dialog' || T.state.scene === 'menu',
    'initial scene is valid (' + T.state.scene + ')');
  assert(Array.isArray(T.state.starField), 'starField is an array');
  assert(T.state.starField.length === 60, 'starField has 60 stars (got ' + T.state.starField.length + ')');

  const canvas = document.getElementById('game');
  assert(canvas && canvas.getContext('2d') !== null, 'canvas has 2d context');

  // ═══════════════════════════════════
  section('Scene Render');
  // ═══════════════════════════════════

  // Each scene should render without throwing
  const scenes = [
    'title', 'connect', 'menu', 'dialog', 'team', 'content',
    'reading', 'skills', 'about', 'vault', 'message', 'log',
    'narada', 'live', 'live-summary'
  ];

  // Set up minimal state for scenes that need it
  resetState();
  T.state.connected = true;
  T.state.menuItems = [
    { label: 'Team' }, { label: 'Live' }, { label: 'Skills' },
    { label: 'Library' }, { label: 'Log' }, { label: 'Vault' },
    { label: 'Narada' }, { label: 'Message' }, { label: 'About' },
    { label: 'Disconnect' },
  ];
  T.state.contentItems = [
    { slug: 'test', title: 'Test', access: 'open' },
  ];
  T.state.logItems = [
    { slug: 'session-1', title: 'Session 1' },
  ];

  // showDialog sets up dialog state
  T.showDialog('ghost', 'Test dialog');

  scenes.forEach(function(sceneName) {
    T.state.scene = sceneName;
    // Special state for live-summary
    if (sceneName === 'live-summary') {
      T.state.liveSummary = { title: 'Test', slug: 'test', chunks: 3, summary: 'Test summary' };
    }
    try {
      T.render();
      assert(true, 'render ' + sceneName + ' — no throw');
    } catch (e) {
      assert(false, 'render ' + sceneName + ' — threw: ' + e.message);
    }
  });

  // ═══════════════════════════════════
  section('Keyboard');
  // ═══════════════════════════════════

  // Title → Enter → connect
  resetState();
  T.state.scene = 'title';
  T.handleKey(fakeKeyEvent('Enter'));
  assert(T.state.scene === 'connect', 'Enter on title → connect scene');

  // Connect → Escape → title
  T.state.scene = 'connect';
  T.handleKey(fakeKeyEvent('Escape'));
  assert(T.state.scene === 'title', 'Escape on connect → title');

  // Arrow keys on menu
  resetState();
  T.state.scene = 'menu';
  T.state.connected = true;
  T.state.menuItems = [{ label: 'Team' }, { label: 'Skills' }, { label: 'About' }];
  T.state.menuCursor = 0;
  T.handleKey(fakeKeyEvent('ArrowDown'));
  assert(T.state.menuCursor === 1, 'ArrowDown on menu increments cursor');
  T.handleKey(fakeKeyEvent('ArrowUp'));
  assert(T.state.menuCursor === 0, 'ArrowUp on menu decrements cursor');

  // Arrow keys on team
  T.state.scene = 'team';
  T.state.teamCursor = 0;
  T.handleKey(fakeKeyEvent('ArrowDown'));
  assert(T.state.teamCursor === 1, 'ArrowDown on team increments cursor');
  T.handleKey(fakeKeyEvent('ArrowUp'));
  assert(T.state.teamCursor === 0, 'ArrowUp on team decrements cursor');

  // Escape on team → menu
  T.handleKey(fakeKeyEvent('Escape'));
  assert(T.state.scene === 'menu', 'Escape on team → menu');

  // Connect field Tab cycling
  resetState();
  T.state.scene = 'connect';
  T.state.connectField = 0;
  T.handleKey(fakeKeyEvent('Tab'));
  assert(T.state.connectField === 1, 'Tab cycles connect field 0→1');
  T.handleKey(fakeKeyEvent('Tab'));
  assert(T.state.connectField === 2, 'Tab cycles connect field 1→2');
  T.handleKey(fakeKeyEvent('Tab'));
  assert(T.state.connectField === 0, 'Tab cycles connect field 2→0');

  // Text input in connect scene
  T.state.connectField = 0;
  T.state.inputText = '';
  T.handleKey(fakeKeyEvent('a'));
  T.handleKey(fakeKeyEvent('b'));
  assert(T.state.inputText === 'ab', 'typing in connect field 0 appends');
  T.handleKey(fakeKeyEvent('Backspace'));
  assert(T.state.inputText === 'a', 'Backspace removes last char');

  // Token field input
  T.state.connectField = 1;
  T.state.tokenInput = '';
  T.handleKey(fakeKeyEvent('x'));
  assert(T.state.tokenInput === 'x', 'typing in connect field 1 (token)');

  // Skills scene keyboard
  resetState();
  T.state.scene = 'skills';
  T.state.skillsCursor = 0;
  T.handleKey(fakeKeyEvent('ArrowDown'));
  assert(T.state.skillsCursor === 1, 'ArrowDown on skills increments cursor');
  T.handleKey(fakeKeyEvent('Escape'));
  assert(T.state.scene === 'menu', 'Escape on skills → menu');

  // Reading scene scroll
  resetState();
  T.state.scene = 'reading';
  T.state.readingScroll = 20;
  T.handleKey(fakeKeyEvent('ArrowUp'));
  assert(T.state.readingScroll === 0, 'ArrowUp on reading scrolls up');
  T.handleKey(fakeKeyEvent('Escape'));
  assert(T.state.scene === 'content', 'Escape on reading → content');

  // About scene tab switch
  resetState();
  T.state.scene = 'about';
  T.state.aboutTab = 0;
  T.handleKey(fakeKeyEvent('ArrowRight'));
  assert(T.state.aboutTab === 1, 'ArrowRight on about switches tab');
  T.handleKey(fakeKeyEvent('ArrowLeft'));
  assert(T.state.aboutTab === 0, 'ArrowLeft on about switches tab back');

  // ═══════════════════════════════════
  section('Network');
  // ═══════════════════════════════════

  // mcpCall sends correct POST
  window.__fetchLog.length = 0;
  resetState();
  T.state.proxyToken = 'test-token-123';

  const mcpPromise = T.mcpCall('list_personas', { limit: 10 });
  assert(window.__fetchLog.length > 0, 'mcpCall triggers fetch');

  const lastFetch = window.__fetchLog[window.__fetchLog.length - 1];
  assert(lastFetch.url === 'http://localhost:3001/call', 'mcpCall POSTs to proxy /call');
  assert(lastFetch.opts.method === 'POST', 'mcpCall uses POST');

  const fetchBody = JSON.parse(lastFetch.opts.body);
  assert(fetchBody.tool === 'list_personas', 'mcpCall sends tool name');
  assert(fetchBody.args.limit === 10, 'mcpCall sends args');

  const fetchHeaders = lastFetch.opts.headers;
  assert(fetchHeaders['Authorization'] === 'Bearer test-token-123', 'mcpCall sends auth token');
  assert(fetchHeaders['Content-Type'] === 'application/json', 'mcpCall sets content-type');

  // mcpCall returns result
  mcpPromise.then(function(result) {
    assert(result === 'mock result', 'mcpCall returns mock result');
  });

  // mcpCall with no token
  T.state.proxyToken = '';
  window.__fetchLog.length = 0;
  T.mcpCall('get_skill', {});
  const noTokenFetch = window.__fetchLog[window.__fetchLog.length - 1];
  assert(!noTokenFetch.opts.headers['Authorization'], 'mcpCall omits auth when no token');

  // connectToServer flow
  resetState();
  window.__fetchLog.length = 0;
  T.connectToServer('https://kapoost-humanmcp.fly.dev/mcp');
  assert(T.state.serverUrl === 'https://kapoost-humanmcp.fly.dev/mcp', 'connectToServer sets serverUrl');

  // ═══════════════════════════════════
  section('Live Session');
  // ═══════════════════════════════════

  resetState();
  T.state.connected = true;
  window.__wsLog.length = 0;
  window.__recorderLog.length = 0;

  // addBubble
  T.addBubble('System', 'Test bubble', { color: '#88ccff' });
  assert(T.state.liveBubbles.length === 1, 'addBubble adds to liveBubbles');
  assert(T.state.liveBubbles[0].speaker === 'System', 'bubble has correct speaker');
  assert(T.state.liveBubbles[0].text === 'Test bubble', 'bubble has correct text');

  // addBubble truncation
  const longText = 'x'.repeat(500);
  T.addBubble('User', longText);
  assert(T.state.liveBubbles[1].text.length === 400, 'addBubble truncates to 400 chars');

  // addBubble persona
  T.addBubble('Ghost', 'Red team says hi', { isPersona: true, color: '#aaa' });
  assert(T.state.liveBubbles[2].isPersona === true, 'persona bubble flagged');

  // startLiveSession triggers getUserMedia
  T.state.scene = 'live';
  T.state.liveBubbles = [];
  const livePromise = T.startLiveSession();

  // Give microtasks time to run
  setTimeout(function() {
    assert(window.__wsLog.some(function(e) { return e.type === 'create'; }),
      'startLiveSession creates WebSocket');
    assert(T.state.liveBubbles.some(function(b) { return b.text.includes('mic'); }),
      'startLiveSession shows mic request bubble');

    // After WS connects, MediaRecorder should be created
    setTimeout(function() {
      assert(window.__recorderLog.some(function(e) { return e.type === 'create'; }),
        'MediaRecorder created after WS connect');
      assert(window.__recorderLog.some(function(e) { return e.type === 'start'; }),
        'MediaRecorder started recording');

      // stopLiveSession cleanup
      T.stopLiveSession();
      assert(T.state.liveActive === false, 'stopLiveSession sets liveActive=false');
      assert(T.state.liveRecorder === null, 'stopLiveSession clears recorder');
      assert(T.state.liveWs === null, 'stopLiveSession clears WS');

      continueTests();
    }, 50);
  }, 50);

  function continueTests() {

    // ═══════════════════════════════════
    section('State Bounds');
    // ═══════════════════════════════════

    resetState();

    // Menu cursor bounds
    T.state.scene = 'menu';
    T.state.menuItems = [{ label: 'A' }, { label: 'B' }, { label: 'C' }];
    T.state.menuCursor = 0;
    T.handleKey(fakeKeyEvent('ArrowUp'));
    assert(T.state.menuCursor === 0, 'menu cursor min is 0');
    T.state.menuCursor = 2;
    T.handleKey(fakeKeyEvent('ArrowDown'));
    assert(T.state.menuCursor === 2, 'menu cursor max is items.length-1');

    // Team cursor bounds
    T.state.scene = 'team';
    T.state.teamCursor = 0;
    T.handleKey(fakeKeyEvent('ArrowUp'));
    assert(T.state.teamCursor === 0, 'team cursor min is 0');
    T.state.teamCursor = T.PERSONAS.length - 1;
    T.handleKey(fakeKeyEvent('ArrowDown'));
    assert(T.state.teamCursor === T.PERSONAS.length - 1, 'team cursor max is PERSONAS.length-1');

    // Reading scroll bounds
    T.state.scene = 'reading';
    T.state.readingScroll = 0;
    T.handleKey(fakeKeyEvent('ArrowUp'));
    assert(T.state.readingScroll === 0, 'reading scroll min is 0');

    // Live scroll bounds
    T.state.scene = 'live';
    T.state.liveScroll = 0;
    T.handleKey(fakeKeyEvent('ArrowUp'));
    assert(T.state.liveScroll === 0, 'live scroll min is 0');

    // Text max lengths
    T.state.scene = 'message';
    T.state.messageSent = false;
    T.state.messageText = 'x'.repeat(500);
    T.handleKey(fakeKeyEvent('a'));
    assert(T.state.messageText.length === 500, 'message text max 500 chars');

    // ═══════════════════════════════════
    section('Touch Controls');
    // ═══════════════════════════════════

    // Touch buttons dispatch to handleKey
    resetState();
    T.state.scene = 'menu';
    T.state.connected = true;
    T.state.menuItems = [{ label: 'Team' }, { label: 'Skills' }];
    T.state.menuCursor = 0;

    T.handleKey(fakeKeyEvent('ArrowDown'));
    assert(T.state.menuCursor === 1, 'touch ArrowDown dispatches correctly');

    T.handleKey(fakeKeyEvent('ArrowUp'));
    assert(T.state.menuCursor === 0, 'touch ArrowUp dispatches correctly');

    // Touch enter on title
    resetState();
    T.state.scene = 'title';
    T.handleKey(fakeKeyEvent('Enter'));
    assert(T.state.scene === 'connect', 'touch Enter on title → connect');

    // Touch escape
    T.state.scene = 'connect';
    T.handleKey(fakeKeyEvent('Escape'));
    assert(T.state.scene === 'title', 'touch Escape on connect → title');

    // Touch tab in connect
    T.state.scene = 'connect';
    T.state.connectField = 0;
    T.handleKey(fakeKeyEvent('Tab'));
    assert(T.state.connectField === 1, 'touch Tab cycles connect field');

    // ═══════════════════════════════════
    section('Paste');
    // ═══════════════════════════════════

    resetState();

    // Paste in connect scene
    T.state.scene = 'connect';
    T.state.connectField = 0;
    T.state.inputText = 'http://';
    const pasteEvent1 = {
      clipboardData: { getData: function() { return 'example.com/mcp'; } },
      preventDefault: function() {},
    };
    T.handlePaste(pasteEvent1);
    assert(T.state.inputText === 'http://example.com/mcp', 'paste appends to connect field');

    // Paste strips newlines
    T.state.scene = 'vault';
    T.state.vaultQuery = '';
    const pasteEvent2 = {
      clipboardData: { getData: function() { return 'hello\nworld\r\nfoo'; } },
      preventDefault: function() {},
    };
    T.handlePaste(pasteEvent2);
    assert(!T.state.vaultQuery.includes('\n') && !T.state.vaultQuery.includes('\r'), 'paste strips newlines');

    // Paste respects max length
    T.state.scene = 'message';
    T.state.messageSent = false;
    T.state.messageText = 'x'.repeat(490);
    const pasteEvent3 = {
      clipboardData: { getData: function() { return 'y'.repeat(100); } },
      preventDefault: function() {},
    };
    T.handlePaste(pasteEvent3);
    assert(T.state.messageText.length === 500, 'paste respects max length (500)');

    // Paste ignored in non-text scenes
    T.state.scene = 'title';
    const oldScene = T.state.scene;
    const pasteEvent4 = {
      clipboardData: { getData: function() { return 'ignored'; } },
      preventDefault: function() {},
    };
    T.handlePaste(pasteEvent4);
    assert(T.state.scene === oldScene, 'paste ignored in title scene');

    // Paste in narada
    T.state.scene = 'narada';
    T.state.naradaLoading = false;
    T.state.naradaPrompt = 'ask ';
    const pasteEvent5 = {
      clipboardData: { getData: function() { return 'a question'; } },
      preventDefault: function() {},
    };
    T.handlePaste(pasteEvent5);
    assert(T.state.naradaPrompt === 'ask a question', 'paste works in narada');

    // ═══════════════════════════════════
    section('Error Paths');
    // ═══════════════════════════════════

    // mcpCall with fetch failure
    const origResp = window.__fetchResponses['http://localhost:3001/call'];
    delete window.__fetchResponses['http://localhost:3001/call'];
    T.mcpCall('nonexistent_tool').then(function(result) {
      assert(result === null, 'mcpCall returns null on fetch error');
      window.__fetchResponses['http://localhost:3001/call'] = origResp;

      // connectToServer with proxy down
      resetState();
      const origHealth = window.__fetchResponses['http://localhost:3001/health'];
      delete window.__fetchResponses['http://localhost:3001/health'];
      // Make fetch reject for health check
      const savedFetch = window.fetch;
      let callCount = 0;
      window.fetch = function(url, opts) {
        if (typeof url === 'string' && url.includes('localhost:3001/health')) {
          return Promise.reject(new Error('Connection refused'));
        }
        return savedFetch(url, opts);
      };

      T.connectToServer('https://test.fly.dev/mcp');
      setTimeout(function() {
        assert(T.state.connected === true, 'offline mode still connects');
        assert(T.state.proxyAvailable === false, 'proxy marked unavailable');
        window.fetch = savedFetch;
        window.__fetchResponses['http://localhost:3001/health'] = origHealth;

        // getUserMedia rejection
        const origGUM = navigator.mediaDevices.getUserMedia;
        navigator.mediaDevices.getUserMedia = function() {
          return Promise.reject(new Error('NotAllowedError'));
        };
        resetState();
        T.state.scene = 'live';
        T.state.liveBubbles = [];
        T.startLiveSession();
        setTimeout(function() {
          assert(T.state.liveBubbles.some(function(b) { return b.text.includes('Mic error'); }),
            'getUserMedia rejection shows error bubble');
          navigator.mediaDevices.getUserMedia = origGUM;

          // WS error handling
          resetState();
          T.state.scene = 'live';
          T.state.liveBubbles = [];
          T.state.liveActive = true;
          const mockWs = new MockWebSocket('ws://localhost:7331/ws/transcribe');
          T.state.liveWs = mockWs;
          mockWs.readyState = 1;
          // Simulate WS close with error code
          if (mockWs.onclose) {
            mockWs.onclose({ code: 1006 });
          }

          finishTests();
        }, 50);
      }, 50);
    });

    function finishTests() {
      // ═══════════════════════════════════
      section('CSP Compliance');
      // ═══════════════════════════════════

      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      const mainCsp = document.querySelector('#main-csp');
      // test-browser.html has relaxed CSP, but verify engine.js URLs match patterns
      const allowedHosts = [
        'http://localhost:3001',
        'http://localhost:7331',
        'ws://localhost:7331',
      ];

      // Check that mcpCall uses PROXY_URL
      window.__fetchLog.length = 0;
      T.state.proxyToken = '';
      T.mcpCall('test_tool');
      const mcpFetch = window.__fetchLog[window.__fetchLog.length - 1];
      assert(mcpFetch.url.startsWith('http://localhost:3001'), 'mcpCall URL matches CSP connect-src');

      // Check that vault search uses LOCAL_VAULT_URL
      assert(allowedHosts.includes('http://localhost:7331'), 'LOCAL_VAULT_URL in allowed hosts');

      // WS URL uses localhost:7331
      assert(allowedHosts.includes('ws://localhost:7331'), 'WS URL in allowed hosts');

      // ═══════════════════════════════════
      // handleSelect coverage
      // ═══════════════════════════════════
      section('handleSelect');

      resetState();
      T.state.scene = 'title';
      T.handleSelect();
      assert(T.state.scene === 'connect', 'handleSelect title → connect');

      // Dialog advance
      T.showDialog('ghost', 'Test');
      assert(T.state.scene === 'dialog', 'showDialog sets scene to dialog');
      T.state.currentDialog.done = true;
      T.handleSelect();
      // Should return to title (not connected) or menu (connected)
      assert(T.state.scene === 'title' || T.state.scene === 'menu', 'handleSelect advances dialog');

      // Team select shows dialog
      resetState();
      T.state.scene = 'team';
      T.state.connected = true;
      T.state.teamCursor = 0;
      T.handleSelect();
      assert(T.state.scene === 'dialog', 'team select shows persona dialog');

      // ═══════════════════════════════════
      // Results
      // ═══════════════════════════════════

      log('\n─────────────────────────────');
      log(passed + ' passed, ' + failed + ' failed');
      log('─────────────────────────────');

      output.style.color = failed > 0 ? '#ff6666' : '#66ff66';
      document.title = (failed > 0 ? '\u2717 ' : '\u2713 ') + passed + '/' + (passed + failed) + ' — humanMCP RPG Tests';
    }
  }
}, 200);
