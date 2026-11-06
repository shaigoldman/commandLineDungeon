import type { HeroPose } from "./hero-art";

/** A compact, face-first mage silhouette, drawn on the same 24×32 grid as the other heroes. */
export function mageCanvas(pose: HeroPose = "idle", scale = 2) {
  const canvas = document.createElement("canvas");
  canvas.width = 24 * scale;
  canvas.height = 32 * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.scale(scale, scale);
  const r = (x:number,y:number,w:number,h:number,color:string) => {
    ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
  };
  const ink="#152031", shade="#342b50", robe="#70508e", lit="#a783b3";
  const hair="#30324f", hairLight="#52577d", gold="#c5a25f", goldLight="#f0d38a";
  const skin="#e5b18d", skinLight="#ffdab0", skinShade="#b97967";
  const wood="#795740", woodLight="#ad8152", gem="#65d2cf", gemLight="#c5f5d9";
  const attack=pose==="attack", step=pose==="left-step"?-1:pose==="right-step"?1:0;

  // Separate boots and a split, tapered robe rather than a square skirt.
  const leftX=step<0?6:step>0?9:8, rightX=step>0?15:13;
  const leftY=step>0?27:28, rightY=step<0?27:28;
  r(leftX,leftY,4,3,ink);r(leftX+1,leftY,2,2,wood);
  r(rightX,rightY,4,3,ink);r(rightX+1,rightY,2,2,wood);
  r(7,14,10,9,ink);r(6,21,12,5,ink);r(5+step,25,14,3,ink);
  r(7,20,10,5,shade);r(6+step,25,12,2,robe);
  r(8,21,3,5,robe);r(14,21,3,5,robe);
  r(8,23,2,3,lit);r(15,23,1,3,lit);
  r(10,24,4,4,ink);r(11,24,2,3,shade);
  r(6+step,27,4,1,gold);r(14+step,27,4,1,gold);
  r(10,23,1,3,gold);r(13,23,1,4,gold);

  // Narrow shoulders, a gold neckline and one small belt clasp.
  r(8,14,8,8,robe);r(9,15,2,5,lit);r(14,15,2,6,shade);
  r(9,14,2,1,goldLight);r(10,15,2,1,gold);r(12,16,2,1,gold);
  r(13,14,2,1,gold);r(13,15,1,2,gold);
  r(12,17,2,2,ink);r(12,17,1,1,gem);
  r(8,21,8,2,wood);r(11,21,3,2,gold);r(12,21,1,1,ink);
  r(7,20,2,3,wood);r(7,20,2,1,woodLight);

  // The staff has a readable crystal head and a distinctly raised casting pose.
  const staffX=attack?21:20, staffTop=attack?5:10;
  r(staffX-1,staffTop,3,20,ink);r(staffX,staffTop,1,20,wood);
  r(staffX,staffTop+1,1,8,woodLight);
  r(staffX-1,staffTop-4,3,4,ink);
  r(staffX,staffTop-4,1,1,gem);r(staffX-1,staffTop-3,3,2,gem);
  r(staffX,staffTop-1,1,1,gem);r(staffX,staffTop-3,1,1,gemLight);
  r(staffX-2,staffTop-2,1,3,wood);r(staffX+2,staffTop-2,1,3,wood);
  r(staffX-1,staffTop,3,1,gold);
  if(attack) {
    r(15,14,4,4,ink);r(16,14,3,2,robe);r(18,13,3,3,ink);
    r(19,13,2,2,skin);r(19,13,1,1,skinLight);
    r(4,16,4,4,ink);r(5,16,3,2,robe);r(3,18,4,2,skin);r(3,18,2,1,skinLight);
    r(17,2,1,2,gem);r(18,3,1,1,gemLight);r(23,1,1,2,gem);
  } else {
    r(5,15,4,6,ink);r(6,15,3,4,robe);r(6,19,3,1,gold);
    r(6,20+(step<0?1:0),2,2,skin);r(6,20+(step<0?1:0),1,1,skinLight);
    r(15,15,4,5,ink);r(16,15,2,3,robe);r(17,18,2,1,gold);
    r(18,19,3,2,skin);r(19,19,1,1,skinLight);
  }

  // Long indigo hair frames a face kept entirely below the short hat brim.
  r(8,6,9,8,ink);r(7,9,3,8,hair);r(15,8,3,10,hair);
  r(7,12,1,5,hairLight);r(16,11,1,6,hairLight);
  r(10,12,4,2,skinShade);r(10,12,3,1,skin);
  r(9,7,7,5,skin);r(10,7,5,4,skinLight);r(14,9,2,3,skin);
  r(8,7,2,3,hair);r(9,7,3,1,hair);r(15,7,2,3,hair);
  r(10,9,1,1,ink);r(14,9,1,1,ink);r(12,10,1,1,skinShade);
  r(11,12,2,1,skinShade);r(8,10,1,1,goldLight);
  // One sloping cap and a thin gold band, with no brim over the eyes.
  r(6,2,3,2,ink);r(8,1,3,3,ink);r(10,2,5,4,ink);
  r(7,3,3,1,shade);r(9,2,3,3,robe);r(11,3,3,3,robe);
  r(10,2,1,1,lit);
  r(6,5,12,2,ink);r(7,5,10,1,robe);r(9,6,7,1,gold);r(12,6,3,1,goldLight);
  return canvas;
}
