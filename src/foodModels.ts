import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rollGeometry } from './rollGeometry';
import { createTakeoutBox } from './takeoutBox';

export type FoodPiece = { object: THREE.Group; base: THREE.Vector3; variant: number; index: number; yaw: number; scale: THREE.Vector3 };

export function createSushiModels(renderer: THREE.WebGLRenderer) {
  let seed = 735;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const root = new THREE.Group();
  const groups: THREE.Group[] = [];
  const foodPieces: FoodPiece[] = [];
  const manager = new THREE.LoadingManager();
  let resolveReady: () => void;
  const ready = new Promise<void>(resolve => { resolveReady = resolve; });
  manager.onLoad = () => resolveReady();
  const loader = new THREE.TextureLoader(manager);
  function ingredient(name: string, roughness: number, bumpScale: number) {
    const map = loader.load('/assets/ingredients/' + name + '.jpg');
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    return new THREE.MeshPhysicalMaterial({map, bumpMap:map, bumpScale, roughness,
      clearcoat:.12, clearcoatRoughness:.38, side:THREE.DoubleSide});
  }
  const rice = ingredient('rice',.53,.014);
  const pearl = new THREE.MeshStandardMaterial({color:'#dad1b9',roughness:.42});
  const salmon = ingredient('salmon',.34,.008);
  const prawn = ingredient('ebi',.39,.014);
  const egg = ingredient('tamago',.56,.015);
  const nori = ingredient('nori',.47,.018);
  const riceSide = ingredient('rice-sesame',.55,.019);
  const rollFaces = { salmon:ingredient('salmon-roll',.49,.02), garden:ingredient('garden-roll',.49,.02), maki:ingredient('maki',.49,.02) };
  const chiveMaterial = new THREE.MeshStandardMaterial({color:'#386528',roughness:.5});
  const grainGeo = new THREE.SphereGeometry(1, 8, 6);
  const smoothSphere = new THREE.SphereGeometry(1, 24, 16);
  const chiveGeo = new THREE.CylinderGeometry(.011, .013, .16, 7);
  const sesameGeo = new THREE.SphereGeometry(1, 7, 5);
  const sesameBlack = new THREE.MeshPhysicalMaterial({ color: '#28231b', roughness: .43 });
  const sesameWhite = new THREE.MeshPhysicalMaterial({ color: '#c7ae74', roughness: .5 });
  const mesh = (geo: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D, x=0,y=0,z=0,sx=1,sy=1,sz=1) => {
    const object = new THREE.Mesh(geo, material); object.position.set(x,y,z);object.scale.set(sx,sy,sz);object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;
  };

  const { box, hinge } = createTakeoutBox();
  root.add(box);
  function fishGeometry(offset: number, small=false) {
    const positions:number[]=[], uvs:number[]=[], indices:number[]=[];
    const nx=48,nz=28,layerSize=(nx+1)*(nz+1);
    for(let layer=0;layer<2;layer++) for(let i=0;i<=nx;i++) for(let j=0;j<=nz;j++) {
      const u=i/nx,v=j/nz,a=u*2-1,b=v*2-1;
      const taper=Math.sqrt(Math.max(.1,1-Math.pow(Math.abs(a)*.91,8)));
      const x=a*.70 + b*.027 + .008*Math.sin(v*19+offset)*Math.pow(Math.abs(a),4);
      const z=b*.365*taper + Math.sin(u*13+offset)*.012;
      const y=(small?.49:.57)-(small?.065:.18)*Math.pow(Math.abs(a),2.9)-(small?.025:.07)*b*b+.008*Math.sin(a*13+offset)*Math.cos(b*8)+(layer===0?0:-.055);
      positions.push(x*(small?.61:1),y,z*(small?.88:1));
      uvs.push(.03+u*.83+offset*.023,.05+v*.84);
    }
    const tri=(a:number,b:number,c:number)=>indices.push(a,b,c);
    for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=i*(nz+1)+j,b=a+nz+1;tri(a,a+1,b);tri(a+1,b+1,b);tri(a+layerSize,b+layerSize,a+1+layerSize);tri(a+1+layerSize,b+layerSize,b+1+layerSize);}
    for(let i=0;i<nx;i++) for(const j of [0,nz]){const a=i*(nz+1)+j,b=a+nz+1;tri(a,b,a+layerSize);tri(b,b+layerSize,a+layerSize);}
    for(let j=0;j<nz;j++)for(const i of [0,nx]){const a=i*(nz+1)+j,b=a+1;tri(a,a+layerSize,b);tri(b,a+layerSize,b+layerSize);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
  }

  function grains(parent:THREE.Group,mode:'nigiri'|'roll'|'uramaki') {
    const count=mode==='nigiri'?160:mode==='uramaki'?320:190;
    const instances=new THREE.InstancedMesh(grainGeo,pearl,count);instances.castShadow=true;instances.receiveShadow=true;
    const dummy=new THREE.Object3D(),color=new THREE.Color();
    for(let i=0;i<count;i++) {
      if(mode==='nigiri') {
        const theta=random()*Math.PI*2,phi=Math.acos(2*random()-1),s=Math.sin(phi);
        dummy.position.set(Math.cos(theta)*s*.475,.267+Math.cos(phi)*.245,Math.sin(theta)*s*.269);
      }else if(mode==='uramaki'&&i%2===0){
        const theta=random()*Math.PI*2;dummy.position.set(Math.cos(theta)*.407,.13+random()*.46,Math.sin(theta)*.407);
      }else{
        const theta=random()*Math.PI*2,r=Math.sqrt(.24*.24+random()*(.385*.385-.24*.24));
        dummy.position.set(Math.cos(theta)*r,.591+(random()-.5)*.018,Math.sin(theta)*r);
      }
      dummy.rotation.set((random()-.5)*1.6,random()*Math.PI,(random()-.5)*1.4);
      const size=.9+random()*.25;dummy.scale.set(.025*size,.023*size,.057*size);dummy.updateMatrix();instances.setMatrixAt(i,dummy.matrix);
      color.setRGB(.84+random()*.14,.82+random()*.14,.73+random()*.16,THREE.SRGBColorSpace);instances.setColorAt(i,color);
    }
    parent.add(instances);
  }

  const contactCanvas=document.createElement('canvas');contactCanvas.width=contactCanvas.height=128;
  const cc=contactCanvas.getContext('2d')!,cg=cc.createRadialGradient(64,64,8,64,64,64);cg.addColorStop(0,'rgba(0,0,0,.62)');cg.addColorStop(.6,'rgba(0,0,0,.22)');cg.addColorStop(1,'rgba(0,0,0,0)');cc.fillStyle=cg;cc.fillRect(0,0,128,128);
  const contactMap=new THREE.CanvasTexture(contactCanvas),contactMaterial=new THREE.MeshBasicMaterial({map:contactMap,transparent:true,depthWrite:false,opacity:.65});
  function contact(parent:THREE.Group,x:number,z:number,sx=1.4,sz=.95){const shadow=new THREE.Mesh(new THREE.PlaneGeometry(sx,sz),contactMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.set(x,.193,z);parent.add(shadow);}

  function nigiri(parent:THREE.Group,x:number,z:number,angle:number) {
    const group=new THREE.Group();group.position.set(x,.205,z);group.rotation.y=angle;group.scale.setScalar(.96+random()*.08);parent.add(group);contact(parent,x,z);
    mesh(smoothSphere,rice,group,0,.265,0,.466,.238,.252);grains(group,'nigiri');
    const fish=mesh(fishGeometry(random()*5),salmon,group);fish.rotation.x=(random()-.5)*.035;
    for(let i=0;i<3;i++){const chive=mesh(chiveGeo,chiveMaterial,group,(i-1)*.075,.595,.02+random()*.04);chive.rotation.set(1.1,.4,.7+random()*.35);}
    for(let i=0;i<5;i++){const s=mesh(sesameGeo,i%3?sesameBlack:sesameWhite,group,(random()-.5)*.53,.588,(random()-.5)*.26,.012,.009,.023);s.rotation.y=random()*6;}
    return group;
  }

  function cutRoll(parent: THREE.Group, x: number, z: number, kind: keyof typeof rollFaces) {
    const group = new THREE.Group();
    group.position.set(x,.15,z);
    group.rotation.y=(random()-.5)*.26;
    group.rotation.z=(random()-.5)*.045;
    const piece = new THREE.Mesh(rollGeometry(kind!=='maki',random()*6),[kind==='maki'?nori:riceSide,rollFaces[kind]]);
    piece.castShadow = piece.receiveShadow = true;
    group.add(piece);parent.add(group);
    contact(parent,x,z,1.05,1.05);
    return group;
  }
  function tamago(parent:THREE.Group,x:number,z:number){
    const g=new THREE.Group();g.position.set(x,.19,z);g.scale.setScalar(.94);g.rotation.y=Math.PI/2;parent.add(g);
    mesh(smoothSphere,rice,g,0,.265,0,.466,.238,.252);grains(g,'nigiri');

    mesh(new RoundedBoxGeometry(1.13,.28,.65,5,.102),egg,g,0,.59);
    mesh(new RoundedBoxGeometry(.22,.69,.675,3,.035),nori,g,0,.406);
    return g;
  }
  function shrimp(parent:THREE.Group,x:number,z:number){
    const g=new THREE.Group();g.position.set(x,.19,z);g.rotation.y=-.1;g.scale.setScalar(1.15);parent.add(g);
    mesh(smoothSphere,rice,g,0,.265,0,.466,.238,.252);grains(g,'nigiri');
    const pos:number[]=[], uv:number[]=[], indices:number[]=[];
    const nx=48,nz=32;
    for(let i=0;i<=nx;i++) for(let j=0;j<=nz;j++){
      const u=i/nx,v=j/nz,a=2*u-1,b=2*v-1;
      const width=.4*Math.sqrt(Math.max(.07,1-a*a*.8))*(1-.24*a);
      const fold=Math.cos(10*Math.PI*u+.75*b*b);
      const y=.61-.2*Math.pow(Math.abs(a),2.3)-.16*b*b+.019*fold-.03*Math.exp(-b*b*55);
      pos.push(a*.71,y,b*width+.045*Math.sin(Math.PI*u));uv.push(.03+.94*u,.04+.92*v);
    }
    for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
      const a=i*(nz+1)+j,b=a+nz+1;indices.push(a,a+1,b,a+1,b+1,b);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    geo.setIndex(indices);geo.computeVertexNormals();mesh(geo,prawn,g);
    const tailMaterial=new THREE.MeshPhysicalMaterial({color:'#e57b47',roughness:.45,side:THREE.DoubleSide});
    for(const side of [-1,1]){const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(.22,.1*side);shape.lineTo(.24,.23*side);shape.lineTo(.05,.08*side);const tail=mesh(new THREE.ShapeGeometry(shape),tailMaterial,g,.57,.36,0);tail.rotation.x=-Math.PI/2;}
    return g;
  }
  for(let variant=0;variant<3;variant++) {
    const group=new THREE.Group();root.add(group);groups.push(group);const pieces:THREE.Group[]=[];
    if(variant===0){
      for(let row=0;row<3;row++)for(let col=0;col<2;col++){const p=cutRoll(group,-2.22+col*.9,-1.24+row*.88,'salmon');p.scale.setScalar(.91);pieces.push(p);}
      for(let row=0;row<3;row++)for(let col=0;col<2;col++){const p=cutRoll(group,-.44+col*.83,-1.24+row*.85,'maki');p.scale.setScalar(.90);pieces.push(p);}
      for(let row=0;row<2;row++)for(let col=0;col<2;col++)pieces.push(tamago(group,1.38+col*.84,-1.12+row*1.12));
      pieces.push(shrimp(group,-1.54,1.31));pieces.push(shrimp(group,.30,1.31));
    }
    if(variant===1)for(let row=0;row<3;row++)for(let col=0;col<4;col++){const p=cutRoll(group,-2.0+col*1.28,-1.1+row*1.1,'garden');p.scale.setScalar(1.05);pieces.push(p);}
    if(variant===2)for(let row=0;row<4;row++)for(let col=0;col<3;col++){const p=nigiri(group,-1.8+col*1.72,-1.27+row*.83,-.1);p.scale.setScalar(.97);pieces.push(p);}
    pieces.forEach((object,index)=>foodPieces.push({object,base:object.position.clone(),variant,index,yaw:object.rotation.y,scale:object.scale.clone()}));
    group.visible=false;
  }
  return {root,hinge,groups,foodPieces,ready};
}
