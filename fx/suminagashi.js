/* ══════════════════════════════════════════════════════════════
   AGI HUB — Suminagashi Hero Effect
   GPU stable-fluid simulation (Jos Stam, "Stable Fluids") on raw
   WebGL2. Monotone ink on paper. No dependencies.
   Pipeline: curl → vorticity → divergence → pressure (Jacobi)
             → gradient subtract → advect velocity → advect dye
   Graceful degradation: no WebGL2 / no float render targets /
   prefers-reduced-motion → canvas stays invisible, page unaffected.
   ══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const band = document.getElementById('hero-band');
  const canvas = document.getElementById('sumi-canvas');
  if (!band || !canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const gl = canvas.getContext('webgl2', {
    alpha: false, depth: false, stencil: false,
    antialias: false, preserveDrawingBuffer: false,
  });
  if (!gl) return;
  if (!gl.getExtension('EXT_color_buffer_float')) return;

  /* ── 調整パラメータ ── */
  const CFG = {
    SIM_RES: 160,            // 速度場の短辺解像度
    DYE_RES: 720,            // 墨テクスチャの短辺解像度
    PRESSURE_ITER: 22,
    CURL: 2.5,               // 渦度強制（強すぎると輪郭が毛羽立つ）
    VEL_DISSIPATION: 0.25,   // 水の減衰（大きいほど早く静まる）
    DYE_DISSIPATION: 0.03,   // 墨の退色（小さいほど残る）
    PRESSURE_DECAY: 0.8,
    DPR_CAP: 1.75,
  };

  /* テーマ別の紙と墨。濃度場は共有し、表示色だけ切り替える */
  const THEMES = {
    light: { paper: [1.0, 1.0, 1.0], ink: [0.102, 0.102, 0.106] },     // #fff / #1a1a1a
    dark: { paper: [0.039, 0.039, 0.039], ink: [0.847, 0.847, 0.863] }, // #0a0a0a / 銀墨
  };
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  function currentTheme() {
    const t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark') return THEMES.dark;
    if (t === 'light') return THEMES.light;
    return prefersDark.matches ? THEMES.dark : THEMES.light;
  }

  /* ════════════ GL ヘルパー ════════════ */

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('suminagashi shader:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  const VERT = compile(gl.VERTEX_SHADER, `
    precision highp float;
    attribute vec2 aPos;
    varying vec2 vUv;
    void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
  `);

  function program(fragSrc, uniformNames) {
    const frag = compile(gl.FRAGMENT_SHADER, fragSrc);
    const p = gl.createProgram();
    gl.attachShader(p, VERT);
    gl.attachShader(p, frag);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn('suminagashi link:', gl.getProgramInfoLog(p));
      return null;
    }
    const u = {};
    uniformNames.forEach((n) => { u[n] = gl.getUniformLocation(p, n); });
    return { p, u };
  }

  /* 全画面クアッド */
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function blit(target) {
    if (target == null) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.width, target.height);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function createFBO(w, h, internalFormat, format, filter) {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return {
      texture, fbo, width: w, height: h,
      texelX: 1 / w, texelY: 1 / h,
      attach(id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      },
    };
  }

  function createDoubleFBO(w, h, internalFormat, format, filter) {
    return {
      width: w, height: h, texelX: 1 / w, texelY: 1 / h,
      read: createFBO(w, h, internalFormat, format, filter),
      write: createFBO(w, h, internalFormat, format, filter),
      swap() { const t = this.read; this.read = this.write; this.write = t; },
    };
  }

  /* ════════════ シェーダー ════════════ */

  const copyProg = program(`
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    void main() { gl_FragColor = texture2D(uTexture, vUv); }
  `, ['uTexture']);

  const clearProg = program(`
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float uValue;
    void main() { gl_FragColor = uValue * texture2D(uTexture, vUv); }
  `, ['uTexture', 'uValue']);

  /* 墨滴: 同心円リング状に墨を足す（uR0=0 でガウシアン円盤） */
  const splatInkProg = program(`
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float uAspect, uR0, uW, uIntensity;
    uniform vec2 uPoint;
    void main() {
      vec2 p = vUv - uPoint;
      p.x *= uAspect;
      float d = length(p);
      float s = exp(-(d - uR0) * (d - uR0) / uW) * uIntensity;
      float base = texture2D(uTarget, vUv).x;
      gl_FragColor = vec4(clamp(base + s, 0.0, 2.5), 0.0, 0.0, 1.0);
    }
  `, ['uTarget', 'uAspect', 'uR0', 'uW', 'uIntensity', 'uPoint']);

  /* 速度の注入: uDir 方向（マウス）／放射状（墨滴の押し広げ） */
  const splatVelProg = program(`
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float uAspect, uW, uRadial;
    uniform vec2 uPoint, uDir;
    void main() {
      vec2 p = vUv - uPoint;
      p.x *= uAspect;
      float g = exp(-dot(p, p) / uW);
      vec2 dir = mix(uDir, normalize(p + 1e-5) * length(uDir), uRadial);
      vec2 vel = texture2D(uTarget, vUv).xy + dir * g;
      gl_FragColor = vec4(vel, 0.0, 1.0);
    }
  `, ['uTarget', 'uAspect', 'uW', 'uRadial', 'uPoint', 'uDir']);

  const advectProg = program(`
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity, uSource;
    uniform vec2 uTexel;
    uniform float uDt, uDissipation;
    void main() {
      vec2 coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexel;
      gl_FragColor = texture2D(uSource, coord) / (1.0 + uDissipation * uDt);
    }
  `, ['uVelocity', 'uSource', 'uTexel', 'uDt', 'uDissipation']);

  const curlProg = program(`
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform vec2 uTexel;
    void main() {
      float L = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
      float R = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
      float B = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
      float T = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
      gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
    }
  `, ['uVelocity', 'uTexel']);

  const vorticityProg = program(`
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity, uCurl;
    uniform vec2 uTexel;
    uniform float uCurlStrength, uDt;
    void main() {
      float L = texture2D(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
      float R = texture2D(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
      float B = texture2D(uCurl, vUv - vec2(0.0, uTexel.y)).x;
      float T = texture2D(uCurl, vUv + vec2(0.0, uTexel.y)).x;
      float C = texture2D(uCurl, vUv).x;
      vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
      force /= length(force) + 0.0001;
      force *= uCurlStrength * C;
      force.y *= -1.0;
      vec2 vel = texture2D(uVelocity, vUv).xy + force * uDt;
      gl_FragColor = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);
    }
  `, ['uVelocity', 'uCurl', 'uTexel', 'uCurlStrength', 'uDt']);

  const divergenceProg = program(`
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform vec2 uTexel;
    void main() {
      float L = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
      float R = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
      float B = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
      float T = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
      vec2 C = texture2D(uVelocity, vUv).xy;
      if (vUv.x - uTexel.x < 0.0) L = -C.x;
      if (vUv.x + uTexel.x > 1.0) R = -C.x;
      if (vUv.y - uTexel.y < 0.0) B = -C.y;
      if (vUv.y + uTexel.y > 1.0) T = -C.y;
      gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
    }
  `, ['uVelocity', 'uTexel']);

  const pressureProg = program(`
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uPressure, uDivergence;
    uniform vec2 uTexel;
    void main() {
      float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
      float R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
      float B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
      float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
      float div = texture2D(uDivergence, vUv).x;
      gl_FragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
    }
  `, ['uPressure', 'uDivergence', 'uTexel']);

  const gradientProg = program(`
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uPressure, uVelocity;
    uniform vec2 uTexel;
    void main() {
      float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
      float R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
      float B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
      float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
      vec2 vel = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);
      gl_FragColor = vec4(vel, 0.0, 1.0);
    }
  `, ['uPressure', 'uVelocity', 'uTexel']);

  /* 表示: 紙白 → 墨。トーンカーブ + 微細ノイズでバンディング抑制 */
  const displayProg = program(`
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uDye;
    uniform vec3 uPaper, uInk;
    float rand(vec2 c) { return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      float d = texture2D(uDye, vUv).x;
      d = 1.0 - exp(-d * 1.35);
      d = pow(d, 1.12);
      vec3 col = mix(uPaper, uInk, clamp(d, 0.0, 0.93));
      col += (rand(vUv * 731.7) - 0.5) / 255.0;
      gl_FragColor = vec4(col, 1.0);
    }
  `, ['uDye', 'uPaper', 'uInk']);

  if (!copyProg || !clearProg || !splatInkProg || !splatVelProg || !advectProg ||
      !curlProg || !vorticityProg || !divergenceProg || !pressureProg ||
      !gradientProg || !displayProg) return;

  /* ════════════ フレームバッファ ════════════ */

  let velocity, dye, divergence, curl, pressure;

  function simSize(baseRes) {
    const aspect = canvas.width / Math.max(1, canvas.height);
    return aspect >= 1
      ? [Math.round(baseRes * aspect), baseRes]
      : [baseRes, Math.round(baseRes / aspect)];
  }

  function initFramebuffers() {
    const [sw, sh] = simSize(CFG.SIM_RES);
    const [dw, dh] = simSize(CFG.DYE_RES);
    const oldVelocity = velocity, oldDye = dye;

    velocity = createDoubleFBO(sw, sh, gl.RG16F, gl.RG, gl.LINEAR);
    dye = createDoubleFBO(dw, dh, gl.R16F, gl.RED, gl.LINEAR);
    divergence = createFBO(sw, sh, gl.R16F, gl.RED, gl.NEAREST);
    curl = createFBO(sw, sh, gl.R16F, gl.RED, gl.NEAREST);
    pressure = createDoubleFBO(sw, sh, gl.R16F, gl.RED, gl.NEAREST);

    /* リサイズ時は旧テクスチャをバイリニアで引き継ぐ */
    if (oldVelocity) {
      gl.useProgram(copyProg.p);
      gl.uniform1i(copyProg.u.uTexture, oldVelocity.read.attach(0));
      blit(velocity.read);
      gl.uniform1i(copyProg.u.uTexture, oldDye.read.attach(0));
      blit(dye.read);
    }
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, CFG.DPR_CAP);
    const w = Math.max(2, Math.round(band.clientWidth * dpr));
    const h = Math.max(2, Math.round(band.clientHeight * dpr));
    if (canvas.width === w && canvas.height === h) return false;
    canvas.width = w;
    canvas.height = h;
    return true;
  }

  /* ════════════ シミュレーション ════════════ */

  const aspect = () => canvas.width / Math.max(1, canvas.height);

  function splatInk(x, y, r0, w, intensity) {
    gl.useProgram(splatInkProg.p);
    gl.uniform1i(splatInkProg.u.uTarget, dye.read.attach(0));
    gl.uniform1f(splatInkProg.u.uAspect, aspect());
    gl.uniform1f(splatInkProg.u.uR0, r0);
    gl.uniform1f(splatInkProg.u.uW, w);
    gl.uniform1f(splatInkProg.u.uIntensity, intensity);
    gl.uniform2f(splatInkProg.u.uPoint, x, y);
    blit(dye.write);
    dye.swap();
  }

  function splatVelocity(x, y, dirX, dirY, w, radial) {
    gl.useProgram(splatVelProg.p);
    gl.uniform1i(splatVelProg.u.uTarget, velocity.read.attach(0));
    gl.uniform1f(splatVelProg.u.uAspect, aspect());
    gl.uniform1f(splatVelProg.u.uW, w);
    gl.uniform1f(splatVelProg.u.uRadial, radial);
    gl.uniform2f(splatVelProg.u.uPoint, x, y);
    gl.uniform2f(splatVelProg.u.uDir, dirX, dirY);
    blit(velocity.write);
    velocity.swap();
  }

  function step(dt) {
    gl.useProgram(curlProg.p);
    gl.uniform1i(curlProg.u.uVelocity, velocity.read.attach(0));
    gl.uniform2f(curlProg.u.uTexel, velocity.texelX, velocity.texelY);
    blit(curl);

    gl.useProgram(vorticityProg.p);
    gl.uniform1i(vorticityProg.u.uVelocity, velocity.read.attach(0));
    gl.uniform1i(vorticityProg.u.uCurl, curl.attach(1));
    gl.uniform2f(vorticityProg.u.uTexel, velocity.texelX, velocity.texelY);
    gl.uniform1f(vorticityProg.u.uCurlStrength, CFG.CURL);
    gl.uniform1f(vorticityProg.u.uDt, dt);
    blit(velocity.write);
    velocity.swap();

    gl.useProgram(divergenceProg.p);
    gl.uniform1i(divergenceProg.u.uVelocity, velocity.read.attach(0));
    gl.uniform2f(divergenceProg.u.uTexel, velocity.texelX, velocity.texelY);
    blit(divergence);

    gl.useProgram(clearProg.p);
    gl.uniform1i(clearProg.u.uTexture, pressure.read.attach(0));
    gl.uniform1f(clearProg.u.uValue, CFG.PRESSURE_DECAY);
    blit(pressure.write);
    pressure.swap();

    gl.useProgram(pressureProg.p);
    gl.uniform2f(pressureProg.u.uTexel, velocity.texelX, velocity.texelY);
    gl.uniform1i(pressureProg.u.uDivergence, divergence.attach(0));
    for (let i = 0; i < CFG.PRESSURE_ITER; i++) {
      gl.uniform1i(pressureProg.u.uPressure, pressure.read.attach(1));
      blit(pressure.write);
      pressure.swap();
    }

    gl.useProgram(gradientProg.p);
    gl.uniform2f(gradientProg.u.uTexel, velocity.texelX, velocity.texelY);
    gl.uniform1i(gradientProg.u.uPressure, pressure.read.attach(0));
    gl.uniform1i(gradientProg.u.uVelocity, velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();

    gl.useProgram(advectProg.p);
    gl.uniform2f(advectProg.u.uTexel, velocity.texelX, velocity.texelY);
    gl.uniform1f(advectProg.u.uDt, dt);
    gl.uniform1i(advectProg.u.uVelocity, velocity.read.attach(0));
    gl.uniform1i(advectProg.u.uSource, velocity.read.attach(0));
    gl.uniform1f(advectProg.u.uDissipation, CFG.VEL_DISSIPATION);
    blit(velocity.write);
    velocity.swap();

    gl.uniform1i(advectProg.u.uVelocity, velocity.read.attach(0));
    gl.uniform1i(advectProg.u.uSource, dye.read.attach(1));
    gl.uniform1f(advectProg.u.uDissipation, CFG.DYE_DISSIPATION);
    blit(dye.write);
    dye.swap();
  }

  function render() {
    const theme = currentTheme();
    gl.useProgram(displayProg.p);
    gl.uniform1i(displayProg.u.uDye, dye.read.attach(0));
    gl.uniform3fv(displayProg.u.uPaper, theme.paper);
    gl.uniform3fv(displayProg.u.uInk, theme.ink);
    blit(null);
  }

  /* ════════════ 墨滴の演出 ════════════ */

  const events = [];   // { time, fn } の予約キュー
  let now = 0;

  function schedule(delay, fn) { events.push({ time: now + delay, fn }); }

  function runDue() {
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].time <= now) {
        const e = events.splice(i, 1)[0];
        e.fn();
      }
    }
  }

  /* 一滴: 中心の種 + 半径を広げながら同心円リングを注入。
     交互の放射押し出しが本物の墨流しの「水滴で押しのける」工程に相当 */
  function dropSequence(x, y, pulses, scale) {
    splatInk(x, y, 0, 0.0012 * scale, 0.9);
    for (let i = 0; i < pulses; i++) {
      const isInk = i % 2 === 0;
      schedule(i * 0.4, () => {
        const force = 38 * scale * Math.pow(0.85, i);
        splatVelocity(x, y, force, force, 0.02 * scale, 1.0);
        if (isInk) {
          const r0 = (0.05 + 0.085 * i) * scale;
          splatInk(x, y, r0, 0.0007 * scale, 0.8 + Math.random() * 0.4);
        }
      });
    }
  }

  /* 右寄りバイアスの落下位置（左はテキストゾーン） */
  function randomDropPoint() {
    const x = 0.30 + Math.pow(Math.random(), 0.6) * 0.62;
    const y = 0.15 + Math.random() * 0.7;
    return [x, y];
  }

  function scheduleAmbientDrop() {
    schedule(6 + Math.random() * 6, () => {
      const [x, y] = randomDropPoint();
      dropSequence(x, y, 3 + Math.floor(Math.random() * 4), 0.7 + Math.random() * 0.6);
      scheduleAmbientDrop();
    });
  }

  /* 見えないかき混ぜ棒: リサージュ軌道でゆっくり水を動かす */
  let stirPrev = null;
  function stir(t) {
    const x = 0.5 + 0.36 * Math.sin(t * 0.07 + 1.7) + 0.08 * Math.sin(t * 0.231);
    const y = 0.5 + 0.32 * Math.sin(t * 0.113) + 0.06 * Math.cos(t * 0.177);
    if (stirPrev) {
      const dx = x - stirPrev[0], dy = y - stirPrev[1];
      splatVelocity(x, y, dx * 140, dy * 140, 0.012, 0.0);
    }
    stirPrev = [x, y];
  }

  /* ════════════ ポインタ操作 ════════════ */

  let pointerPrev = null;

  band.addEventListener('pointermove', (e) => {
    const rect = band.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    if (pointerPrev) {
      /* ピクセル基準のデルタで縦横の力を等方にする */
      const dxPx = (x - pointerPrev[0]) * rect.width;
      const dyPx = (y - pointerPrev[1]) * rect.height;
      const speed = Math.hypot(dxPx, dyPx);
      if (speed > 0.5) {
        splatVelocity(x, y, dxPx * 2.2, dyPx * 2.2, 0.0022, 0.0);
        splatInk(x, y, 0, 0.0005, Math.min(speed * 0.004, 0.16));
      }
    }
    pointerPrev = [x, y];
  }, { passive: true });

  band.addEventListener('pointerleave', () => { pointerPrev = null; }, { passive: true });

  band.addEventListener('pointerdown', (e) => {
    const rect = band.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    dropSequence(x, y, 5, 0.9);
  }, { passive: true });

  /* ════════════ メインループ ════════════ */

  let visible = true;
  let rafId = 0;
  let lastTime = 0;
  let running = false;
  let contextLost = false;

  function frame(t) {
    rafId = 0;
    if (!running) return;
    now = t / 1000;
    const dt = Math.min((t - lastTime) / 1000, 1 / 40);
    lastTime = t;
    if (dt > 0) {
      runDue();
      stir(now);
      step(dt);
      render();
    }
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running || contextLost) return;
    running = true;
    lastTime = performance.now();
    stirPrev = null;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }

  function updateRunState() {
    if (visible && !document.hidden) start(); else stop();
  }

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    updateRunState();
  }).observe(band);

  document.addEventListener('visibilitychange', updateRunState);

  /* テーマ切替（ヘッダーのトグル / OS設定）を即時反映 */
  function onThemeChange() { if (!contextLost) render(); }
  new MutationObserver(onThemeChange)
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (prefersDark.addEventListener) prefersDark.addEventListener('change', onThemeChange);

  let resizeTimer = 0;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (resizeCanvas()) initFramebuffers(); }, 150);
  }).observe(band);

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    contextLost = true;
    stop();
  });

  /* ════════════ 起動 ════════════ */

  resizeCanvas();
  initFramebuffers();
  render();                       // 初回フレームを紙白で描いてから表示
  canvas.classList.add('on');

  now = performance.now() / 1000;
  dropSequence(0.66, 0.5, 7, 1.1);                   // 初滴
  schedule(1.8, () => dropSequence(0.38, 0.65, 5, 0.8));
  schedule(3.6, () => dropSequence(0.85, 0.35, 5, 0.7));
  scheduleAmbientDrop();

  /* デバッグ: ?sumi-warp=N でN秒ぶん同期的に早送り（チューニング検証用） */
  const warp = parseFloat(new URLSearchParams(location.search).get('sumi-warp'));
  if (warp > 0) {
    const dt = 1 / 30;
    for (let t = 0; t < Math.min(warp, 120); t += dt) {
      now += dt;
      runDue();
      stir(now);
      step(dt);
    }
    render();
  }

  updateRunState();
})();
