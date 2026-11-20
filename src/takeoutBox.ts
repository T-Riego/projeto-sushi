import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createTakeoutBox() {
  const box = new THREE.Group();
  const paper = document.createElement('canvas'); paper.width=paper.height=512;
  const ctx=paper.getContext('2d')!;
  ctx.fillStyle='#c4b5a0';ctx.fillRect(0,0,512,512);
  let seed=26;
  for(let i=0;i<45000;i++){seed=(seed*16807)%2147483647;const x=seed%512;seed=(seed*16807)%2147483647;const y=seed%512;ctx.fillStyle=i%2?'rgba(255,246,225,.12)':'rgba(69,47,28,.08)';ctx.fillRect(x,y,1,2);}
  const paperMap=new THREE.CanvasTexture(paper);paperMap.colorSpace=THREE.SRGBColorSpace;
  const cardboard=new THREE.MeshStandardMaterial({map:paperMap,roughness:.92,bumpMap:paperMap,bumpScale:.009});
  const inside=new THREE.MeshStandardMaterial({color:'#242321',roughness:.88,bumpMap:paperMap,bumpScale:.006});
  const cutEdge=new THREE.MeshStandardMaterial({color:'#ae9b80',roughness:1});
  const add=(w:number,h:number,d:number,x:number,y:number,z:number,material:THREE.Material|THREE.Material[],parent:THREE.Group=box)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  };
  add(5.95,.12,4.12,0,.07,0,cardboard);
  const liner=new THREE.Mesh(new RoundedBoxGeometry(5.76,.04,3.94,2,.035),inside);liner.position.y=.15;liner.receiveShadow=true;box.add(liner);
  const walls=[cardboard,cardboard,cutEdge,cardboard,cardboard,inside];
  add(5.97,.53,.065,0,.34,2.04,walls);
  add(5.97,.58,.065,0,.36,-2.04,[cardboard,cardboard,cutEdge,cardboard,inside,cardboard]);
  add(.065,.58,4.1,-2.95,.36,0,[inside,cardboard,cutEdge,cardboard,cardboard,cardboard]);
  add(.065,.58,4.1,2.95,.36,0,[cardboard,inside,cutEdge,cardboard,cardboard,cardboard]);
  // A physical hinge and printed inside face; the lid opens away from the food.
  const hinge=new THREE.Group();hinge.position.set(0,.65,-2.04);hinge.rotation.x=0;box.add(hinge);
  const print=document.createElement('canvas');print.width=1024;print.height=768;
  const pc=print.getContext('2d')!;pc.fillStyle='#242321';pc.fillRect(0,0,1024,768);
  for(let i=0;i<30000;i++){seed=(seed*16807)%2147483647;const x=seed%1024;seed=(seed*16807)%2147483647;const y=seed%768;pc.fillStyle=i%2?'rgba(255,250,232,.025)':'rgba(0,0,0,.04)';pc.fillRect(x,y,1,2);}
  pc.save();pc.translate(512,370);pc.textAlign='center';pc.fillStyle='#d0bca0';pc.font='bold 76px Georgia';pc.fillText('ayorume',0,0);pc.font='15px sans-serif';pc.fillStyle='#b4a48d';pc.fillText('P E Q U E N O S  R I T U A I S .',0,56);pc.fillText('G R A N D E S  S A B O R E S .',0,84);pc.restore();
  const printMap=new THREE.CanvasTexture(print);printMap.colorSpace=THREE.SRGBColorSpace;
  const printed=new THREE.MeshStandardMaterial({map:printMap,roughness:.93});
  const cover = document.createElement('canvas');
  cover.width = 1024;
  cover.height = 768;
  const ink = cover.getContext('2d')!;
  ink.drawImage(paper, 0, 0, cover.width, cover.height);
  ink.fillStyle = '#a23c29';
  ink.fillRect(800, 0, 18, cover.height);
  ink.textAlign = 'center';
  ink.font = 'bold 102px Georgia';
  ink.fillText('ayorume', 488, 430);
  const coverMap = new THREE.CanvasTexture(cover);
  coverMap.colorSpace = THREE.SRGBColorSpace;
  const exterior = new THREE.MeshStandardMaterial({map:coverMap, roughness:.92});
  // A shallow outer lip encloses the taller nigiri when the lid is shut.
  add(6.09,.055,4.20,0,.47,2.06,[cardboard,cardboard,exterior,printed,cutEdge,cutEdge],hinge);
  add(.048,.48,4.20,-3.02,.235,2.06,cardboard,hinge);
  add(.048,.48,4.20,3.02,.235,2.06,cardboard,hinge);
  add(6.09,.48,.045,0,.235,4.14,cardboard,hinge);
  add(6.09,.48,.045,0,.235,-.025,cardboard,hinge);
  hinge.traverse(object=>{if(object instanceof THREE.Mesh)object.castShadow=false;});
  // Narrow fold lines and a small red wordmark on the front of the box.
  const brand=document.createElement('canvas');brand.width=512;brand.height=128;
  const bc=brand.getContext('2d')!;bc.fillStyle='#c4b5a0';bc.fillRect(0,0,512,128);bc.fillStyle='#922e23';bc.font='bold 50px Georgia';bc.textAlign='center';bc.fillText('ayorume',256,82);
  const brandMap=new THREE.CanvasTexture(brand);brandMap.colorSpace=THREE.SRGBColorSpace;
  const logo=new THREE.Mesh(new THREE.PlaneGeometry(1.05,.2625),new THREE.MeshStandardMaterial({map:brandMap,roughness:1}));logo.position.set(0,.32,2.075);box.add(logo);
  return { box, hinge };
}
