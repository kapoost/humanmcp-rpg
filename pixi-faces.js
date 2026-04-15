// ── Pixi.js Animated Face Thumbnails ──
// Offscreen Pixi renderer → Canvas 2D bridge for drawFace()
// Toggle: Shift+P | Fallback: getCanvas() returns null → static sprite

(function () {
  'use strict';

  const SIZE = 92;
  const BLINK_Y_RATIO = 0.30;  // eye line ~30% from top
  const BLINK_H = 2;           // blink bar height in px
  const BREATH_PERIOD = 3000;  // ms full breathing cycle
  const BREATH_AMP = 1.5;      // px vertical bob
  const SPEAK_PERIOD = 1500;   // faster breathing when speaking
  const SPEAK_BRIGHT = 1.15;   // brightness pulse peak

  let app = null;
  let entries = {};  // personaId → { container, sprite, blinkGfx, filter, phase, nextBlink, blinkTimer }
  let renderTex = null;
  let extractCanvas = null;
  let canvasCache = {};  // personaId → HTMLCanvasElement
  let totalTime = 0;

  function createApp() {
    app = new PIXI.Application({
      width: SIZE,
      height: SIZE,
      backgroundAlpha: 0,
      autoStart: false,
      hello: false,
      preference: 'webgl',
    });
    PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;
    renderTex = PIXI.RenderTexture.create({ width: SIZE, height: SIZE });
  }

  function destroyApp() {
    if (!app) return;
    Object.keys(entries).forEach(function (id) {
      var e = entries[id];
      if (e.sprite) e.sprite.destroy(true);
      if (e.blinkGfx) e.blinkGfx.destroy();
      if (e.container) e.container.destroy({ children: true });
    });
    entries = {};
    canvasCache = {};
    if (renderTex) { renderTex.destroy(true); renderTex = null; }
    if (extractCanvas) { extractCanvas = null; }
    app.destroy(true, { children: true, texture: true, baseTexture: true });
    app = null;
  }

  function initPersona(persona) {
    var id = persona.id;
    var path = 'sprites/faces/' + id + '/rotations/south.png';

    var tex;
    try {
      tex = PIXI.Texture.from(path);
    } catch (_e) {
      return; // no sprite → skip
    }

    var container = new PIXI.Container();
    var sprite = new PIXI.Sprite(tex);
    sprite.anchor.set(0.5, 0.5);
    sprite.x = SIZE / 2;
    sprite.y = SIZE / 2;
    container.addChild(sprite);

    // blink overlay — thin black bar at eye level
    var blinkGfx = new PIXI.Graphics();
    blinkGfx.visible = false;
    container.addChild(blinkGfx);

    // color matrix filter for speaking brightness
    var filter = new PIXI.ColorMatrixFilter();
    container.filters = [filter];

    entries[id] = {
      container: container,
      sprite: sprite,
      blinkGfx: blinkGfx,
      filter: filter,
      phase: Math.random() * Math.PI * 2,  // random breath offset
      nextBlink: 3000 + Math.random() * 4000,
      blinkTimer: -1,
      baseY: SIZE / 2,
      texLoaded: false,
    };

    // handle async texture load
    if (tex.valid) {
      entries[id].texLoaded = true;
      setupBlink(id, tex);
    } else {
      tex.on('update', function () {
        if (entries[id]) {
          entries[id].texLoaded = true;
          setupBlink(id, tex);
        }
      });
      // handle load failure
      tex.baseTexture.on('error', function () {
        delete entries[id];
        container.destroy({ children: true });
      });
    }
  }

  function setupBlink(id, tex) {
    var e = entries[id];
    if (!e) return;
    var w = tex.width;
    var blinkY = Math.floor(tex.height * BLINK_Y_RATIO);
    e.blinkGfx.clear();
    e.blinkGfx.beginFill(0x000000);
    // position relative to sprite center
    var lx = (SIZE - w) / 2;
    e.blinkGfx.drawRect(lx, blinkY, w, BLINK_H);
    e.blinkGfx.endFill();
  }

  function renderEntry(id) {
    var e = entries[id];
    if (!e || !e.texLoaded || !app) return null;

    app.renderer.render(e.container, { renderTexture: renderTex });

    // extract to canvas
    var pixels = app.renderer.extract.canvas(renderTex);
    if (!pixels) return null;

    // cache as a persistent canvas to avoid GC churn
    if (!canvasCache[id]) {
      canvasCache[id] = document.createElement('canvas');
      canvasCache[id].width = SIZE;
      canvasCache[id].height = SIZE;
    }
    var cctx = canvasCache[id].getContext('2d');
    cctx.clearRect(0, 0, SIZE, SIZE);
    cctx.drawImage(pixels, 0, 0);

    return canvasCache[id];
  }

  // determine which persona IDs are currently visible
  function getVisibleIds() {
    var ids = [];
    // dialog speaker
    if (typeof state !== 'undefined' && state.currentDialog && state.currentDialog.persona) {
      ids.push(state.currentDialog.persona);
    }
    // team selected persona
    if (typeof state !== 'undefined' && state.scene === 'team' && typeof PERSONAS !== 'undefined') {
      var cursor = state.teamCursor || 0;
      var scroll = state.teamScroll || 0;
      var idx = scroll + cursor;
      if (PERSONAS[idx]) ids.push(PERSONAS[idx].id);
    }
    return ids;
  }

  window.PixiFaces = {
    enabled: true,

    init: function (personas) {
      if (!window.PIXI) {
        console.warn('[PixiFaces] PIXI not found, disabled');
        this.enabled = false;
        return;
      }
      try {
        createApp();
      } catch (err) {
        console.warn('[PixiFaces] WebGL init failed:', err);
        this.enabled = false;
        return;
      }
      var count = 0;
      personas.forEach(function (p) {
        initPersona(p);
        count++;
      });
      console.log('[PixiFaces] init: ' + Object.keys(entries).length + '/' + count + ' personas with south.png');
    },

    update: function (dt) {
      if (!app || !this.enabled) return;
      totalTime += dt;

      var visible = getVisibleIds();
      var speakingId = (typeof state !== 'undefined' && state.currentDialog && !state.currentDialog.done)
        ? state.currentDialog.persona : null;

      var startTime = performance.now();

      for (var i = 0; i < visible.length; i++) {
        var id = visible[i];
        var e = entries[id];
        if (!e || !e.texLoaded) continue;

        // frame budget check: skip if >4ms spent
        if (i > 0 && performance.now() - startTime > 4) break;

        var isSpeaking = (id === speakingId);
        var period = isSpeaking ? SPEAK_PERIOD : BREATH_PERIOD;

        // breathing bob
        e.sprite.y = e.baseY + Math.sin(totalTime * (Math.PI * 2 / period) + e.phase) * BREATH_AMP;

        // blink logic
        e.nextBlink -= dt;
        if (e.blinkTimer >= 0) {
          e.blinkTimer -= dt;
          if (e.blinkTimer < 0) {
            e.blinkGfx.visible = false;
          }
        }
        if (e.nextBlink <= 0) {
          e.blinkGfx.visible = true;
          e.blinkTimer = 120; // 120ms blink
          e.nextBlink = 3000 + Math.random() * 4000;
        }

        // speaking brightness pulse
        if (isSpeaking) {
          var pulse = 1.0 + (SPEAK_BRIGHT - 1.0) * (0.5 + 0.5 * Math.sin(totalTime * 0.006));
          e.filter.brightness(pulse, false);
        } else {
          e.filter.brightness(1.0, false);
        }

        renderEntry(id);
      }
    },

    getCanvas: function (personaId) {
      if (!this.enabled || !entries[personaId] || !entries[personaId].texLoaded) return null;
      return canvasCache[personaId] || null;
    },

    destroy: function () {
      destroyApp();
    },
  };
})();
