import * as THREE from 'three';

// The cut face has planar UVs. The side unwraps continuously around the rice or nori.
export function rollGeometry(square: boolean, phase: number) {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const geometry = new THREE.BufferGeometry();
  const segments = 64;
  const profile = [[.035,.91],[.062,.98],[.15,1],[.38,1.015],[.56,1],[.60,.97],[.615,.92]];
  const outline = (angle: number) => {
    const power = square ? 3.1 : 2.15;
    const c = Math.cos(angle), s = Math.sin(angle);
    const radius = .46 / Math.pow(Math.abs(c)**power + Math.abs(s)**power, 1/power);
    const variation = 1 + .018*Math.sin(7*angle+phase) + .012*Math.cos(13*angle-phase);
    return [c*radius*variation,s*radius*variation];
  };
  for(const [y,scale] of profile) {
    for(let i=0;i<=segments;i++) {
      const angle=i/segments*Math.PI*2, [x,z]=outline(angle);
      positions.push(x*scale,y+.012*Math.sin(angle*5+phase),z*scale);
      uvs.push(i/segments*(square?4:2),y/.615);
    }
  }
  for(let j=0;j<profile.length-1;j++) for(let i=0;i<segments;i++) {
    const a=j*(segments+1)+i,b=a+segments+1;
    indices.push(a,b,a+1,a+1,b,b+1);
  }
  geometry.addGroup(0,indices.length,0);
  const faceStart=indices.length;
  for(const top of [true,false]) {
    const base=positions.length/3;
    for(let ring=0;ring<=8;ring++) for(let i=0;i<=segments;i++) {
      const t=ring/8, angle=i/segments*Math.PI*2, [x,z]=outline(angle);
      const r=t*(top?.92:.91);
      positions.push(x*r, (top ? .615+.015*(1-t*t) : .035)+t*.012*Math.sin(angle*5+phase), z*r);
      uvs.push(.5+x*r/1.01,.5+z*r/1.01);
    }
    for(let j=0;j<8;j++) for(let i=0;i<segments;i++) {
      const a=base+j*(segments+1)+i,b=a+segments+1;
      if(top) indices.push(a,a+1,b,a+1,b+1,b);
      else indices.push(a,b,a+1,a+1,b,b+1);
    }
  }
  geometry.addGroup(faceStart,indices.length-faceStart,1);
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return geometry;
}
