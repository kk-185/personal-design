// Orthographic drawings of material studies. All coordinates are local to the object.
(() => {
  const TAU = Math.PI * 2;
  const {sin, cos, pow, abs, max, min} = Math;
  const clamp = (x, low, high) => min(high, max(low, x));
  function ink(normal, blue, depth, edge) {
    const [x,y,z] = normal;
    const sky = .49 - .28*y + .17*x + .14*z;
    const strip = Math.exp(-pow((x-.52*y+.15*z-.52)/.23, 2));
    const dark = Math.exp(-pow((y+.6*x-.2*z-.3)/.16, 2));
    const luminance = clamp(sky + .45*strip - .36*dark + edge, .07, .98) * depth;
    const base = blue ? [14,43,172] : [234,235,230];
    const gloss = blue ? pow(luminance,4)*112 : 0;
    return 'rgb('+base.map((c,i)=>Math.round(clamp(c*luminance+gloss+(blue&&i===2?38:0),0,255))).join(',')+')';
  }
  function draw(canvas, angle=45, front=false) {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const dpr = min(devicePixelRatio || 1, 2);
    const w = Math.round(bounds.width*dpr), h = Math.round(bounds.height*dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width=w;canvas.height=h; }
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,w,h);
    const scale = min(w/3.42,h/2.9);
    const pitch=front?0:1.02;
    const roll=front?0:-.56;
    function view(x,y,z) {
      const yy=y*cos(pitch)-z*sin(pitch);
      return [x*cos(roll)-yy*sin(roll),x*sin(roll)+yy*cos(roll),y*sin(pitch)+z*cos(pitch)];
    }
    function point(v) {return [w/2+v[0]*scale,h*.49+v[1]*scale];}
    function polygon(points, fill, stroke) {
      ctx.beginPath();
      points.forEach((p,i)=>{const [x,y]=point(p);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});
      ctx.closePath();ctx.fillStyle=fill;ctx.fill();
      if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.52*dpr;ctx.stroke();}
    }
    const layers=[];
    const count=72, sections=40;
    for(let i=0;i<count;i++){
      const u=TAU*i/count, t=u+(angle-45)*Math.PI/180;
      const twist=u*.5+.38, c=cos(t), s=sin(t);
      const normal=view(-s,c,0), blue=i>=5&&i<=24;
      const faceA=[],faceB=[],sideNormals=[];
      for(let j=0;j<sections;j++){
        const v=TAU*j/sections;
        const sx=Math.sign(cos(v))*pow(abs(cos(v)),.46)*.56;
        const sy=Math.sign(sin(v))*pow(abs(sin(v)),.46)*.30;
        const radial=sx*cos(twist)-sy*sin(twist), vertical=sx*sin(twist)+sy*cos(twist);
        function vertex(offset) {return view((.94+radial)*c-offset*s,(.94+radial)*s+offset*c,vertical);}
        faceA.push(vertex(-.020));faceB.push(vertex(.020));
      }
      const center=view(.94*c,.94*s,0);
      const zDepth=.87+.13*(center[2]+1)/2;
      const face=normal[2]>0?faceB:faceA;
      const n=normal.map(x=> x*(normal[2]>0?1:-1));
      for(let j=0;j<sections;j++){
        const k=(j+1)%sections, a=faceA[j], b=faceA[k];
        const d=b.map((v,k)=>v-a[k]);
        const norm=[normal[1]*d[2]-normal[2]*d[1],normal[2]*d[0]-normal[0]*d[2],normal[0]*d[1]-normal[1]*d[0]];
        const len=Math.hypot(...norm);
        sideNormals.push(norm.map(x=>x/len));
      }
      layers.push({center, faceA,faceB, face,n,blue,zDepth,sideNormals});
    }
    layers.sort((a,b)=>a.center[2]-b.center[2]);
    for(const L of layers){
      const {faceA,faceB,face,n,blue,zDepth,sideNormals}=L;
      const [x1,y1]=point(face[0]), [x2,y2]=point(face[sections/2]);
      const g=ctx.createLinearGradient(x1,y1,x2+.001,y2);
      g.addColorStop(0,ink(n,blue,zDepth,.22));
      g.addColorStop(.24,ink(n,blue,zDepth,.07));
      g.addColorStop(.73,ink(n,blue,zDepth,-.16));
      g.addColorStop(1,ink(n,blue,zDepth,.05));
      polygon(face,g,ink(n,blue,zDepth,.19));
      for(let j=0;j<sections;j++){
        const normal=sideNormals[j];
        if(normal[2]<=0)continue;
        const k=(j+1)%sections, color=ink(normal,blue,zDepth,.04);
        polygon([faceA[j],faceA[k],faceB[k],faceB[j]],color,color);
      }
    }
  }
  window.drawFoldedRing=draw;
})();
