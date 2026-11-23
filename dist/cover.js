const stage = document.querySelector(".dial-stage");
const canvas = stage.querySelector("canvas");
const slider = document.querySelector("#rotation");
const reading = document.querySelector("#reading");
const modes = [...stage.querySelectorAll("[data-view]")];
let front = false;
let pending = false;
function redraw() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    window.drawFoldedRing(canvas, Number(slider.value), front);
  });
}
function updateAngle(value) {
  slider.value = String(Math.min(270, Math.max(0, Math.round(value))));
  reading.value = slider.value.padStart(3,"0") + "°";
  slider.setAttribute("aria-valuetext", slider.value + " 度");
  redraw();
}
if (canvas.getContext("2d") && window.drawFoldedRing) {
  stage.querySelector(".axis").hidden = false;
  canvas.hidden = false;
  window.drawFoldedRing(canvas, Number(slider.value), front);
  stage.querySelector(".art-fallback").hidden = true;
  stage.querySelector(".art-controls").hidden = false;
  stage.setAttribute("aria-label", "叠片环。拖动模型或使用角度滑块旋转。");
  new ResizeObserver(redraw).observe(canvas);
  slider.addEventListener("input", () => updateAngle(Number(slider.value)));
  updateAngle(Number(slider.value));
  for (const mode of modes) {
    mode.addEventListener("click", () => {
      front = mode.dataset.view === "plan";
      modes.forEach(item => item.setAttribute("aria-pressed", String(item === mode)));
      redraw();
    });
  }
  let drag;
  canvas.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0) return;
    drag = {id:event.pointerId, x:event.clientX, angle:Number(slider.value)};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", event => {
    if (drag?.id === event.pointerId) updateAngle(drag.angle + (event.clientX - drag.x)*.85);
  });
  canvas.addEventListener("lostpointercapture", () => { drag = null; });
}
