// The same radial stack is shown in perspective and as an orthographic plan.
(() => {
  const canvas = document.querySelector(".sculpture");
  const drawing = canvas?.parentElement;
  const controls = document.querySelector(".modes");
  const context = canvas?.getContext("2d");
  if (!context || !drawing || !controls) return;

  const tau = Math.PI * 2;
  const fins = 84;
  const sides = 24;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const mix = (a,b,t) => a + (b-a)*t;
  const material = (dark,light,t) => dark.map((c,i)=>Math.round(mix(c,light[i],Math.max(0,Math.min(1,t)))));
  const color = rgb => "rgb(" + rgb.join(",") + ")";
  const signedPower = (n,p) => Math.sign(n)*Math.abs(n)**p;

  // Thin beveled plates form a continuous twist. Keep the original mesh in
  // object coordinates so changing views never swaps out the cover image.
  const faces = [];
  function platePoint(theta, section, thickness) {
    const phi = theta + .27;
    const u = .45*signedPower(Math.cos(section), .53);
    const v = .56*signedPower(Math.sin(section), .53);
    const radial = 1.01 + .055*Math.cos(3*theta+.4) + u*Math.cos(phi) - v*Math.sin(phi);
    return [
      radial*Math.cos(theta)-thickness*Math.sin(theta),
      radial*Math.sin(theta)+thickness*Math.cos(theta),
      u*Math.sin(phi)+v*Math.cos(phi)+.09*Math.sin(2*theta-.7)
    ];
  }
  for (let i=0; i<fins; i++) {
    const theta=tau*i/fins;
    const back=[], front=[];
    for (let j=0;j<sides;j++) {
      back.push(platePoint(theta,tau*j/sides,-.015));
      front.push(platePoint(theta,tau*j/sides,.015));
    }
    faces.push({points:back, end:true, theta}, {points:front.slice().reverse(), end:true, theta});
    for (let j=0;j<sides;j++) {
      const next=(j+1)%sides;
      faces.push({points:[back[j],front[j],front[next],back[next]],end:false,theta});
    }
  }

  let width=0, height=0, progress=0, selectedView=0, shownView=0, frame=0;
  function render(p) {
    if (!width || !height) return;
    const tilt=mix(.93,.025,p), spin=mix(-.64,-.27,p), roll=mix(-.28,0,p);
    const ct=Math.cos(tilt), st=Math.sin(tilt), cs=Math.cos(spin), ss=Math.sin(spin), cr=Math.cos(roll), sr=Math.sin(roll);
    const scale=Math.min(width*.253,height*.291);
    const cx=width*.50, cy=height*.46;
    function project(point) {
      const x=point[0]*cs-point[1]*ss, y=point[0]*ss+point[1]*cs;
      const yy=y*ct-point[2]*st, z=y*st+point[2]*ct;
      return [x*cr-yy*sr,yy*cr+x*sr,z];
    }
    context.clearRect(0,0,width,height);
    context.save();
    context.translate(cx+width*.025,cy+scale*1.05);
    context.scale(scale*1.26,scale*.18);
    const shade=context.createRadialGradient(0,0,.04,0,0,1);
    shade.addColorStop(0,"rgba(38,44,68," + (.23*(1-p)) + ")");
    shade.addColorStop(1,"rgba(38,44,68,0)");
    context.fillStyle=shade;context.fillRect(-1,-1,2,2);context.restore();

    const projected=faces.map(face=>{
      const pts=face.points.map(project);
      const a=pts[0], b=pts[1], c=pts[2];
      const v=b.map((n,i)=>n-a[i]), w=c.map((n,i)=>n-b[i]);
      const normal=[v[1]*w[2]-v[2]*w[1],v[2]*w[0]-v[0]*w[2],v[0]*w[1]-v[1]*w[0]];
      const length=Math.hypot(...normal)||1;
      let lighting=Math.abs((-.50*normal[0]+.68*normal[1]+.54*normal[2])/length);
      lighting=face.end ? .035+.37*lighting : .22+.76*lighting;
      const base=material([13,23,77],[106,132,245],lighting);
      const flat=face.end?[40,58,131]:[136,153,214];
      const fill=color(material(base,flat,p*.70));
      return {pts,fill,depth:pts.reduce((s,pt)=>s+pt[2],0)/pts.length};
    }).sort((a,b)=>a.depth-b.depth);
    context.lineJoin="round";
    for (const face of projected) {
      context.beginPath();
      face.pts.forEach(([x,y],i)=>{
        if (i===0) context.moveTo(cx+x*scale,cy-y*scale);
        else context.lineTo(cx+x*scale,cy-y*scale);
      });
      context.closePath();
      context.fillStyle=face.fill; context.fill();
      context.strokeStyle=face.fill; context.lineWidth=.36; context.stroke();
    }
  }

  function resize() {
    const box=drawing.getBoundingClientRect();
    width=box.width; height=box.height;
    const dpr=Math.min(window.devicePixelRatio || 1,2);
    canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
    context.setTransform(dpr,0,0,dpr,0,0);
    render(progress);
  }
  function move(to) {
    cancelAnimationFrame(frame);
    const from=progress;
    shownView=to;
    if (motion.matches || Math.abs(from-to)<.002) { progress=to; render(to); return; }
    const start=performance.now();
    function tick(now) {
      const t=Math.min(1,(now-start)/530);
      const ease=t*t*(3-2*t);
      progress=mix(from,to,ease); render(progress);
      if (t<1) frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);
  }
  const buttons = [...controls.querySelectorAll("button")];
  const note = document.querySelector(".figure-note > span");
  let hoveredButton = null;
  function updatePreview() {
    const view = hoveredButton ? Number(hoveredButton.dataset.mode === "plan") : selectedView;
    note.textContent = view === selectedView ? "封面形态" : (view ? "平面预览" : "立体预览");
    if (shownView !== view) move(view);
  }
  for (const button of buttons) {
    button.addEventListener("pointerenter", event=>{
      if (event.pointerType === "touch" || !finePointer.matches) return;
      hoveredButton = button;
      updatePreview();
    });
    button.addEventListener("pointerleave", ()=>{
      hoveredButton = null;
      updatePreview();
    });
    button.addEventListener("click", ()=>{
      selectedView = Number(button.dataset.mode === "plan");
      hoveredButton = null;
      for (const option of buttons) option.setAttribute("aria-pressed", String(option === button));
      updatePreview();
    });
  }

  // Offset only the artwork, so controls remain fixed beneath the pointer.
  let pointerFrame = 0;
  let shiftX = 0, shiftY = 0;
  function resetTilt() {
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    drawing.style.removeProperty("--shift-x");
    drawing.style.removeProperty("--shift-y");
    drawing.style.removeProperty("--turn");
  }
  drawing.addEventListener("pointermove", event=>{
    if (event.pointerType === "touch" || !finePointer.matches || motion.matches) return;
    const box = drawing.getBoundingClientRect();
    shiftX = (event.clientX - box.left) / box.width - .5;
    shiftY = (event.clientY - box.top) / box.height - .5;
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(()=>{
      drawing.style.setProperty("--shift-x", (shiftX*13)+"px");
      drawing.style.setProperty("--shift-y", (shiftY*9)+"px");
      drawing.style.setProperty("--turn", (shiftX*1.5)+"deg");
      pointerFrame=0;
    });
  });
  drawing.addEventListener("pointerleave", resetTilt);
  function resetInteraction() {
    hoveredButton = null;
    resetTilt();
    updatePreview();
    if (motion.matches) move(selectedView);
  }
  motion.addEventListener("change",resetInteraction);
  finePointer.addEventListener("change",resetInteraction);
  resize();
  drawing.classList.add("is-ready");
  controls.hidden=false;
  if (typeof ResizeObserver==="function") new ResizeObserver(resize).observe(drawing);
  else window.addEventListener("resize",resize);
})();
