import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { assetManifest } from "./asset-manifest.js";
import "./styles.css";

const canvas = document.querySelector("#scene-canvas");
const statusEl = document.querySelector("#load-status");
const errorEl = document.querySelector("#stage-error");
const animationSelect = document.querySelector("#animation-select");
const playToggle = document.querySelector("#play-toggle");
const resetCamera = document.querySelector("#reset-camera");
const animationState = document.querySelector("#animation-state");
const frameReadout = document.querySelector("#frame-readout");
const paneTags = [...document.querySelectorAll(".pane-tag")];
const paneDivider = document.querySelector(".pane-divider");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(29, 1, 0.1, 100);
const initialCameraPosition = new THREE.Vector3(0, 2.05, 7.4);
camera.position.copy(initialCameraPosition);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.55, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 4.4;
controls.maxDistance = 12;
controls.maxPolarAngle = Math.PI * 0.53;
controls.update();

const sceneA = createStage();
const sceneB = createStage();
const baseline = createBaseline();
sceneA.add(baseline);

let modelRoot = null;
let mixer = null;
let actions = new Map();
let activeAction = null;
let isPlaying = true;
let viewMode = "both";
let lastFrame = performance.now();
let frameCount = 0;
let fps = 0;

populateManifestStats();
setupViewControls();
setupAnimationControls();
loadSourcedModel();
window.addEventListener("resize", render);
requestAnimationFrame(animate);

function createStage() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#0b0d10");

  const hemi = new THREE.HemisphereLight("#dce8f4", "#13171d", 2.0);
  scene.add(hemi);

  const key = new THREE.DirectionalLight("#ffe0a4", 4.1);
  key.position.set(-3.5, 6.5, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -2;
  scene.add(key);

  const rim = new THREE.PointLight("#45c9c4", 10, 11, 2);
  rim.position.set(3.7, 2.8, -2.4);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.MeshStandardMaterial({ color: "#151a20", roughness: 0.82, metalness: 0.12 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(16, 32, "#29343c", "#151e25");
  grid.position.y = 0.008;
  grid.material.transparent = true;
  grid.material.opacity = 0.42;
  scene.add(grid);

  return scene;
}

function createBaseline() {
  const group = new THREE.Group();
  group.name = "PrimitiveBaseline";
  const boneMaterial = new THREE.MeshStandardMaterial({ color: "#c9bda8", roughness: 0.9, metalness: 0.02 });
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: "#1a2328", emissive: "#44d5ce", emissiveIntensity: 2.1 });

  const joint = (x, y, z, radius = 0.15) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 6), boneMaterial);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    group.add(mesh);
  };
  const bone = (a, b, radius = 0.1) => {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const direction = end.clone().sub(start);
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, Math.max(0.05, direction.length() - radius * 1.8), 5, 8), boneMaterial);
    mesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.castShadow = true;
    group.add(mesh);
  };

  joint(0, 1.05, 0, 0.24);
  bone([0, 1.05, 0], [0, 2.15, 0], 0.17);
  [1.35, 1.62, 1.88].forEach((y) => {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.045, 6, 12), boneMaterial);
    rib.rotation.x = Math.PI / 2;
    rib.position.y = y;
    rib.castShadow = true;
    group.add(rib);
  });
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), boneMaterial);
  skull.position.set(0, 2.72, 0);
  skull.scale.set(1, 1.12, 0.9);
  skull.castShadow = true;
  group.add(skull);
  [-0.14, 0.14].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 5), eyeMaterial);
    eye.position.set(x, 2.74, 0.35);
    group.add(eye);
  });

  [[-0.2, 2.02, -0.02], [0.2, 2.02, -0.02]].forEach(([x, y, z], index) => {
    const side = index === 0 ? -1 : 1;
    joint(x, y, z, 0.14);
    bone([x, y, z], [side * 0.72, 1.56, 0], 0.095);
    joint(side * 0.72, 1.56, 0, 0.12);
    bone([side * 0.72, 1.56, 0], [side * 0.85, 1.02, 0.03], 0.085);
    joint(side * 0.85, 1.02, 0.03, 0.105);
  });
  [-1, 1].forEach((side) => {
    bone([side * 0.14, 1.03, 0], [side * 0.3, 0.45, 0], 0.11);
    joint(side * 0.3, 0.45, 0, 0.12);
    bone([side * 0.3, 0.45, 0], [side * 0.23, 0.08, 0.05], 0.09);
    joint(side * 0.23, 0.06, 0.08, 0.11);
  });
  return group;
}

function loadSourcedModel() {
  const loader = new GLTFLoader();
  loader.load(
    assetManifest.localPath,
    (gltf) => {
      modelRoot = gltf.scene;
      applyRuntimeRemix(modelRoot);
      normalizeToStage(modelRoot, 3.25);
      sceneB.add(modelRoot);

      mixer = new THREE.AnimationMixer(modelRoot);
      const clipData = gltf.animations.map((clip) => ({ clip, label: clip.name.split("|").at(-1) || clip.name }));
      clipData.forEach(({ clip, label }) => actions.set(label, mixer.clipAction(clip)));
      populateAnimationSelect(clipData);
      setActiveAnimation(clipData.find(({ label }) => label === "Idle")?.label ?? clipData[0]?.label);
      statusEl.textContent = "GLB loaded / audit matched";
      statusEl.classList.add("is-ready");
      animationState.textContent = "PLAYING / IDLE";
    },
    (event) => {
      if (event.total) statusEl.textContent = `Loading sourced GLB ${Math.round((event.loaded / event.total) * 100)}%`;
    },
    (error) => {
      statusEl.textContent = "GLB load failed";
      errorEl.hidden = false;
      errorEl.textContent = "The sourced GLB could not be loaded. The A baseline remains visible; no substitute asset was used.";
      console.error(error);
    },
  );
}

function applyRuntimeRemix(root) {
  root.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
    if (node.isSkinnedMesh) node.frustumCulled = false;
    const wasMaterialArray = Array.isArray(node.material);
    const sourceMaterials = wasMaterialArray ? node.material : [node.material];
    const remixedMaterials = sourceMaterials.map((sourceMaterial) => {
      const material = sourceMaterial.clone();
      const key = `${node.name} ${sourceMaterial.name}`.toLowerCase();
      const armor = key.includes("armor") || key.includes("atlas.003");
      material.color.set(armor ? "#b9823d" : "#d8c9b5");
      material.roughness = armor ? 0.38 : 0.78;
      material.metalness = armor ? 0.5 : 0.08;
      if (armor) material.emissive.set("#1e1208");
      return material;
    });
    node.material = wasMaterialArray ? remixedMaterials : remixedMaterials[0];
  });
}

function normalizeToStage(root, targetHeight) {
  const initialBounds = new THREE.Box3().setFromObject(root);
  const size = initialBounds.getSize(new THREE.Vector3());
  const scale = targetHeight / Math.max(size.y, 0.001);
  root.scale.setScalar(scale);
  const bounds = new THREE.Box3().setFromObject(root);
  const center = bounds.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= bounds.min.y;
}

function populateAnimationSelect(clipData) {
  animationSelect.innerHTML = "";
  clipData.forEach(({ label }) => {
    const option = document.createElement("option");
    option.value = label;
    option.textContent = label;
    animationSelect.append(option);
  });
  animationSelect.disabled = clipData.length === 0;
}

function setActiveAnimation(label) {
  if (!label || !actions.has(label)) return;
  if (activeAction && activeAction !== actions.get(label)) activeAction.fadeOut(0.18);
  activeAction = actions.get(label);
  activeAction.reset().fadeIn(0.18).play();
  animationSelect.value = label;
  animationState.textContent = `${isPlaying ? "PLAYING" : "PAUSED"} / ${label.toUpperCase()}`;
}

function setupAnimationControls() {
  animationSelect.addEventListener("change", () => setActiveAnimation(animationSelect.value));
  playToggle.addEventListener("click", () => {
    isPlaying = !isPlaying;
    playToggle.textContent = isPlaying ? "||" : "▶";
    playToggle.setAttribute("aria-label", isPlaying ? "Pause animation" : "Play animation");
    const selected = animationSelect.value || "IDLE";
    animationState.textContent = `${isPlaying ? "PLAYING" : "PAUSED"} / ${selected.toUpperCase()}`;
  });
  resetCamera.addEventListener("click", () => {
    camera.position.copy(initialCameraPosition);
    controls.target.set(0, 1.55, 0);
    controls.update();
  });
}

function setupViewControls() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      viewMode = button.dataset.view;
      document.querySelectorAll("[data-view]").forEach((item) => {
        const selected = item === button;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-selected", String(selected));
      });
      paneTags.forEach((tag) => tag.classList.toggle("is-hidden", viewMode !== "both" && !tag.classList.contains(`pane-tag-${viewMode}`)));
      paneDivider.classList.toggle("is-hidden", viewMode !== "both");
      render();
    });
  });
}

function populateManifestStats() {
  document.querySelector("#metric-file").textContent = `${Math.round(assetManifest.stats.fileBytes / 1024)} KB`;
  document.querySelector("#metric-triangles").textContent = assetManifest.stats.triangles.toLocaleString();
  document.querySelector("#metric-materials").textContent = `${assetManifest.stats.materials} / ${assetManifest.stats.textures}`;
  document.querySelector("#metric-skeleton").textContent = `${assetManifest.stats.skins} / ${assetManifest.stats.joints}`;
  document.querySelector("#metric-animations").textContent = assetManifest.stats.animations;
}

function paneRects(width, height) {
  const showA = viewMode === "both" || viewMode === "a";
  const showB = viewMode === "both" || viewMode === "b";
  if (viewMode === "a") return [{ scene: sceneA, x: 0, y: 0, width, height }];
  if (viewMode === "b") return [{ scene: sceneB, x: 0, y: 0, width, height }];
  if (height > width * 1.14) {
    return [
      { scene: sceneA, x: 0, y: height / 2, width, height: height / 2 },
      { scene: sceneB, x: 0, y: 0, width, height: height / 2 },
    ];
  }
  return [
    { scene: showA ? sceneA : sceneB, x: 0, y: 0, width: width / 2, height },
    { scene: showB ? sceneB : sceneA, x: width / 2, y: 0, width: width / 2, height },
  ];
}

function render() {
  const width = Math.max(canvas.clientWidth, 1);
  const height = Math.max(canvas.clientHeight, 1);
  renderer.setSize(width, height, false);
  renderer.setScissorTest(true);
  paneRects(width, height).forEach(({ scene, x, y, width: paneWidth, height: paneHeight }) => {
    camera.aspect = paneWidth / paneHeight;
    camera.updateProjectionMatrix();
    renderer.setViewport(x, y, paneWidth, paneHeight);
    renderer.setScissor(x, y, paneWidth, paneHeight);
    renderer.render(scene, camera);
  });
  renderer.setScissorTest(false);
}

function animate(now) {
  const delta = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  if (isPlaying && mixer) mixer.update(delta);
  controls.update();
  frameCount += 1;
  animate.lastReadout ??= now;
  if (now - animate.lastReadout > 700) {
    fps = Math.round((frameCount * 1000) / Math.max(now - animate.lastReadout, 1));
    animate.lastReadout = now;
    frameCount = 0;
    frameReadout.textContent = `${fps} FPS / ${renderer.info.render.calls} DRAW CALLS`;
  }
  render();
  requestAnimationFrame(animate);
}
