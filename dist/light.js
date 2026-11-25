(() => {
  const canvas = document.getElementById("light-field");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const root = document.documentElement;
  const toggle = document.querySelector(".light-toggle");
  const title = document.querySelector(".hero-title");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const contrast = matchMedia("(forced-colors: active)");
  const mouse = matchMedia("(any-hover: hover) and (any-pointer: fine)");
  const beamCount = 26;
  let width = 0, height = 0, time = 0, previous = 0, frame = 0;
  let x = 0, y = 0, targetX = 0, targetY = 0, reach = 0, inside = false;
  let enabled = true;
  try { enabled = sessionStorage.getItem("portfolio-light") !== "off"; } catch {}

  // A sheaf of lines passes through the same narrow fold, then fans out again.
  // A second sheet crosses it at a shallower angle, like a reflection on paper.
  function ribbon(back) {
    const count = back ? 12 : beamCount;
    const steps = Math.max(48, Math.ceil(width / 15));
    const radius = Math.min(270, width * .32);
    const glint = .52 + .35 * Math.sin(time * .32 + (back ? 2 : 0));
    const ink = ctx.createLinearGradient(0, 0, width, 0);
    ink.addColorStop(0, back ? "#667dc8" : "#4767b9");
    ink.addColorStop(Math.max(.01, glint - .16), "#7883c4");
    ink.addColorStop(glint, "#3e9fb4");
    ink.addColorStop(Math.min(.99, glint + .12), "#5963cb");
    ink.addColorStop(1, "#808ac7");
    const sheen = ctx.createLinearGradient(0, 0, width, 0);
    sheen.addColorStop(0, "rgba(89,124,236,0)");
    sheen.addColorStop(glint - .12, "rgba(89,124,236,0)");
    sheen.addColorStop(glint - .03, "rgba(93,153,221,.60)");
    sheen.addColorStop(glint, "rgba(219,251,255,.96)");
    sheen.addColorStop(glint + .09, "rgba(89,124,236,0)");
    sheen.addColorStop(1, "rgba(89,124,236,0)");

    for (let n = 0; n < count; n++) {
      const layer = n / (count - 1);
      const band = layer - .5;
      ctx.strokeStyle = ink;
      ctx.globalAlpha = back ? .095 : .19 + .11 * layer;
      ctx.lineWidth = back ? .7 : .8 + .55 * layer;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const px = -12 + (width + 24) * u;
        const bend = Math.sin(u * 6.4 + .35 * Math.sin(time * .25));
        const base = back
          ? .14 + .38 * u + .11 * Math.sin(u * 5.7 + .55 + time * .13)
          : .58 - .23 * u + .20 * Math.sin(u * 6.4 - .62 + .30 * Math.sin(time * .24));
        const spread = back ? .15 * Math.sin(u * 6 + time * .16) : .24 * bend;
        let py = height * (base + spread * band + .013 * Math.sin(u * 9 + time * .36 + layer * 2));
        if (reach > .002) {
          const dx = (px - x) / radius;
          const dy = (py - y) / radius;
          const weight = Math.max(0, 1 - dx * dx - dy * dy);
          py += weight * weight * reach * (Math.max(-34, Math.min(34, (y - py) * .32)) + band * 19);
        }
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.stroke();
      if (!back && n >= count - 5) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = sheen;
        ctx.globalAlpha = .92;
        ctx.stroke();
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    if (!enabled || contrast.matches) return;
    const cx = width * (.68 + .12 * Math.sin(time * .19));
    const cy = height * (.40 + .07 * Math.cos(time * .23));
    const extent = Math.max(width * .48, height * .59);
    const wash = ctx.createRadialGradient(cx, cy, 0, cx, cy, extent);
    wash.addColorStop(0, "rgba(157,188,244,.26)");
    wash.addColorStop(.58, "rgba(182,215,229,.12)");
    wash.addColorStop(1, "rgba(193,209,239,0)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);
    ribbon(true);
    ribbon(false);
    ctx.globalAlpha = 1;
  }

  function tick(stamp) {
    frame = 0;
    if (document.hidden || !enabled) return;
    if (reduced.matches || contrast.matches) {
      sync();
      return;
    }
    const dt = previous ? stamp - previous : 34;
    if (dt >= 32) {
      const seconds = Math.min(dt, 100) / 1000;
      previous = stamp;
      time += seconds;
      const follow = 1 - Math.exp(-seconds * 13);
      x += (targetX - x) * follow;
      y += (targetY - y) * follow;
      reach += ((inside ? 1 : 0) - reach) * follow;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }

  function resetPointer() {
    inside = false;
    delete root.dataset.mouse;
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = previous = 0;
    const animate = enabled && !reduced.matches && !contrast.matches;
    if (!animate || !mouse.matches || document.hidden) {
      resetPointer();
      reach = 0;
    }
    root.dataset.light = animate ? "on" : "off";
    toggle.hidden = reduced.matches || contrast.matches;
    toggle.setAttribute("aria-pressed", String(enabled));
    if (document.hidden) return;
    draw();
    if (animate) frame = requestAnimationFrame(tick);
  }

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    const density = Math.min(devicePixelRatio || 1, 1.5, 2000 / Math.max(width, height));
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    sync();
  }

  window.addEventListener("pointermove", event => {
    if (event.pointerType !== "mouse" || !mouse.matches || root.dataset.light !== "on") {
      resetPointer();
      return;
    }
    targetX = event.clientX;
    targetY = event.clientY;
    if (!inside) { x = targetX; y = targetY; }
    inside = true;
    root.dataset.mouse = "";
    if (title && title.contains(event.target)) {
      const bounds = title.getBoundingClientRect();
      title.style.setProperty("--nib-x", (targetX - bounds.left) + "px");
      title.style.setProperty("--nib-y", (targetY - bounds.top) + "px");
    }
  }, { passive: true });
  window.addEventListener("pointerdown", event => { if (event.pointerType !== "mouse") resetPointer(); });
  document.documentElement.addEventListener("pointerleave", resetPointer);
  window.addEventListener("blur", resetPointer);
  window.addEventListener("keydown", event => { if (event.key === "Tab") resetPointer(); });
  toggle.addEventListener("click", () => {
    enabled = !enabled;
    try { sessionStorage.setItem("portfolio-light", enabled ? "on" : "off"); } catch {}
    sync();
  });
  document.addEventListener("visibilitychange", sync);
  for (const query of [mouse, reduced, contrast]) query.addEventListener("change", sync);
  window.addEventListener("resize", resize);
  resize();
})();
