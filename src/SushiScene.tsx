import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createSushiModels } from './foodModels';

type Props = { selected: number; exploded: boolean; onReady: () => void; onFail: () => void; onTap: () => void };
export default function SushiScene({ selected, exploded, onReady, onFail, onTap }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef({ selected, exploded });
  const callbacks = useRef({ onReady, onFail, onTap });
  state.current = { selected, exploded };
  callbacks.current = { onReady, onFail, onTap };

  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }); }
    catch { callbacks.current.onFail(); return; }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.style.opacity = '0';
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
    camera.position.set(6.3, 8.8, 10.4);
    camera.lookAt(0, 1.3, -.3);
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0x493c32, .43));
    const key = new THREE.DirectionalLight(0xffedcf, 1.65);
    key.position.set(-4, 7, 2); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 });
    key.shadow.radius = 5; key.shadow.blurSamples = 8;
    key.shadow.normalBias = .012; key.shadow.bias = -.00008;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdde8ff, .28); fill.position.set(4, 5, -4); scene.add(fill);
    const pmrem = new THREE.PMREMGenerator(renderer), studio = new RoomEnvironment();
    const environment = pmrem.fromScene(studio, .04);
    scene.environment = environment.texture; scene.environmentIntensity = .29;
    studio.dispose(); pmrem.dispose();
    const { root, hinge, groups, foodPieces, ready } = createSushiModels(renderer);
    scene.add(root);
    // Invisible stationary hit areas keep hover stable while each piece lifts away.
    root.updateMatrixWorld(true);
    const hitTargets: THREE.Mesh[][] = [[], [], []];
    const hitMaterial = new THREE.MeshBasicMaterial();
    for (const piece of foodPieces) {
      const bounds = new THREE.Box3().setFromObject(piece.object), size = bounds.getSize(new THREE.Vector3());
      const proxy = new THREE.Mesh(new THREE.BoxGeometry(size.x + .07, size.y + .12, size.z + .07), hitMaterial);
      proxy.position.copy(bounds.getCenter(new THREE.Vector3()));
      proxy.visible = false; proxy.userData.pieceIndex = piece.index;
      groups[piece.variant].add(proxy); hitTargets[piece.variant].push(proxy);
    }
    root.rotation.y = -.16;
    root.scale.setScalar(1.04);
    // Diffuse contact shadow from a large window, strongest under the carton.
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 128;
    const brush = shadowCanvas.getContext('2d')!;
    const feather = brush.createRadialGradient(64,64,12,64,64,63);
    feather.addColorStop(0,'rgba(35,23,14,.36)');
    feather.addColorStop(.55,'rgba(35,23,14,.20)');
    feather.addColorStop(1,'rgba(35,23,14,0)');
    brush.fillStyle = feather;
    brush.fillRect(0,0,128,128);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(9.5,7.2),new THREE.MeshBasicMaterial({
      map:new THREE.CanvasTexture(shadowCanvas), transparent:true, depthWrite:false
    }));
    floor.rotation.x=-Math.PI/2;
    floor.position.set(.45,-.02,.16);
    scene.add(floor);

    const view = { left: 0, top: 0, width: 1, height: 1 };
    const frameAspect = 1000 / 850;
    const resize = () => {
      const width = el.clientWidth, height = el.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      view.width = Math.min(width, height * frameAspect); view.height = view.width / frameAspect;
      view.left = (width - view.width) / 2; view.top = (height - view.height) / 2;
      renderer.setViewport(view.left, view.top, view.width, view.height);
      camera.aspect = frameAspect; camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize); observer.observe(el);
    let disposed = false, initialized = false, revealStart = 0, current = state.current.selected;
    let targetX = 0, targetY = 0, dragRotation = 0, downX = 0, downY = 0, distance = 0;
    let dragging = false, hover: number | null = null, pinned: number | null = null, raf = 0, last = performance.now();
    const openAngle = -1.93;
    let openingElapsed = 0;
    let lidOpen = false;
    const pointer = new THREE.Vector2(), raycaster = new THREE.Raycaster();
    const spins = new Map<string, number>();
    const pick = (event: PointerEvent) => {
      if (!lidOpen) return;
      const rect = el.getBoundingClientRect();
      pointer.set((event.clientX - rect.left - view.left) / view.width * 2 - 1, -(event.clientY - rect.top - view.top) / view.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(hitTargets[current], false)[0];
      hover = hit ? hit.object.userData.pieceIndex as number : null;
      el.dataset.hoveredPiece = hover === null ? '' : String(hover);
      el.style.cursor = hover === null ? 'grab' : 'pointer';
    };
    const move = (event: PointerEvent) => {
      if (!lidOpen) return;
      const rect = el.getBoundingClientRect();
      targetX = (event.clientX - rect.left) / rect.width - .5;
      targetY = (event.clientY - rect.top) / rect.height - .5;
      if (dragging) {
        distance += Math.hypot(event.clientX - downX, event.clientY - downY);
        dragRotation += (event.clientX - downX) * .005;
        downX = event.clientX; downY = event.clientY; hover = null;
      } else if (initialized) pick(event);
    };
    const leave = () => { targetX = 0; targetY = 0; hover = null; el.dataset.hoveredPiece = ''; };
    const down = (event: PointerEvent) => {
      if (!lidOpen) return;
      pick(event); dragging = true; distance = 0; downX = event.clientX; downY = event.clientY;
      el.setPointerCapture(event.pointerId);
    };
    const up = (event: PointerEvent) => {
      if (dragging && distance < 6) {
        pick(event);
        if (hover !== null) pinned = pinned === hover ? null : hover;
        else callbacks.current.onTap();
      }
      dragging = false;
      if(event.pointerType !== 'mouse'){hover=null;el.dataset.hoveredPiece='';}
    };
    const cancel = () => { dragging = false; hover = null; };
    const keyboard = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'Enter', ' ', 'Escape'].includes(event.key)) return;
      event.preventDefault();
      const count = hitTargets[current].length;
      if (event.key === 'ArrowLeft') dragRotation -= .2;
      if (event.key === 'ArrowRight') dragRotation += .2;
      if (event.key === 'ArrowUp') pinned = ((pinned ?? -1) + 1) % count;
      if (event.key === 'ArrowDown') pinned = ((pinned ?? 0) + count - 1) % count;
      if (event.key === 'Home') { dragRotation = 0; pinned = null; }
      if (event.key === 'Escape') { pinned = null; hover = null; }
      if (event.key === 'Enter' || event.key === ' ') callbacks.current.onTap();
    };
    for (const [type, handler] of [['pointermove', move], ['pointerleave', leave], ['pointerdown', down], ['pointerup', up], ['pointercancel', cancel], ['keydown', keyboard]] as const) el.addEventListener(type, handler as EventListener);

    const tick = (time: number) => {
      const dt = Math.min(Math.max((time - last) / 1000, 0), .05); last = time;
      if (!lidOpen) {
        openingElapsed += dt;
        const progress = reduced ? 1 : Math.min(openingElapsed / 1.15, 1);
        const eased = progress * progress * (3 - 2 * progress);
        hinge.rotation.x = openAngle * eased;
        if (progress === 1) {
          lidOpen = true;
          el.dataset.lid = 'open';
        }
      }
      if (current !== state.current.selected) {
        groups[current].visible = false; current = state.current.selected;
        groups[current].visible = initialized; revealStart = lidOpen ? time : -Infinity;
        hover = null; pinned = null; spins.clear(); el.dataset.pieceCount = String(hitTargets[current].length);
      }
      const ease = 1 - Math.exp(-dt * 8);
      root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, -.16 + dragRotation + (reduced ? 0 : targetX * .13), ease);
      root.rotation.x = THREE.MathUtils.lerp(root.rotation.x, reduced ? 0 : targetY * .045, ease);
      for (const piece of foodPieces) {
        if (piece.variant !== current) continue;
        const progress = reduced ? 1 : THREE.MathUtils.clamp((time - revealStart - piece.index * 38) / 820, 0, 1);
        const arrival = 1 - Math.pow(1 - progress, 3);
        const active = lidOpen && progress === 1 && (hover === piece.index || pinned === piece.index);
        const spread = lidOpen && state.current.exploded ? 1 : 0;
        const key = `${current}-${piece.index}`;
        let spin = spins.get(key) ?? 0;
        if (active && !reduced) spin += dt * 1.2;
        else spin = THREE.MathUtils.lerp(Math.atan2(Math.sin(spin), Math.cos(spin)), 0, ease);
        spins.set(key, spin);
        piece.object.position.x = piece.base.x;
        piece.object.position.z = piece.base.z;
        const lift = active ? .85 : spread * (.48 + piece.index % 3 * .12);
        if (progress < 1) {
          piece.object.position.y = piece.base.y + (1 - arrival) * (2.8 + piece.index % 3 * .18);
          piece.object.rotation.y = piece.yaw - (1 - arrival) * .45;
        } else {
          piece.object.position.y = THREE.MathUtils.lerp(piece.object.position.y, piece.base.y + lift, ease);
          piece.object.rotation.y = THREE.MathUtils.lerp(piece.object.rotation.y, piece.yaw + spin, ease);
        }
        piece.object.scale.copy(piece.scale).multiplyScalar(.82 + arrival * .18);
      }
      el.dataset.activePiece = pinned !== null ? String(pinned) : hover !== null ? String(hover) : '';
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    ready.then(async () => {
      if (disposed) return;
      groups[current].visible = true;
      await renderer.compileAsync(scene, camera);
      if (disposed) return;
      current = state.current.selected;
      groups.forEach((group, index) => { group.visible = index === current; });
      // All food is in place before the closed poster yields to the live lid.
      hinge.rotation.x = reduced ? openAngle : 0;
      lidOpen = reduced;
      el.dataset.lid = reduced ? 'open' : 'opening';
      revealStart = -Infinity;
      renderer.render(scene, camera);
      renderer.domElement.style.opacity = '1';
      initialized = true;
      callbacks.current.onReady();
      last = performance.now();
      raf = requestAnimationFrame(tick);
      el.dataset.ready = 'true'; el.dataset.pieceCount = String(hitTargets[current].length);
    }).catch(() => { if (!disposed) callbacks.current.onFail(); });
    const visibility = () => { cancelAnimationFrame(raf); if (initialized && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    document.addEventListener('visibilitychange', visibility);
    const contextLost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(raf); callbacks.current.onFail(); };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    return () => {
      disposed = true; cancelAnimationFrame(raf); observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      for (const [type, handler] of [['pointermove', move], ['pointerleave', leave], ['pointerdown', down], ['pointerup', up], ['pointercancel', cancel], ['keydown', keyboard]] as const) el.removeEventListener(type, handler as EventListener);
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          geometries.add(object.geometry);
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
            materials.add(material);
            for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
          }
        }
      });
      geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); textures.forEach(value => value.dispose());
      environment.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <div className="sushi-scene" ref={host} tabIndex={0} role="group" aria-label="Caixa de sushi 3D. Passe o mouse ou toque para levantar uma peça. Arraste ou use as setas laterais para girar a caixa. Setas para cima e para baixo escolhem uma peça. Home restaura a cena." />;
}
