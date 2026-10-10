import "./style.css";
import * as THREE from "three";

// ---- Constants (no magic numbers) ----
const CLEAR_COLOR = 0x1b1e24; // sRGB 27, 30, 36
const CAMERA_FOV_DEG = 50;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;
const CAMERA_POSITION = new THREE.Vector3(0, 2, 6);
const MAX_PIXEL_RATIO = 2;
const PROBE_INTERVAL_S = 1;
const ELAPSED_DECIMALS = 1;

// ---- Renderer ----
const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app not found in index.html");

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

// ---- Debug readout (elapsed time + centre pixel) ----
const hud = document.createElement("pre");
hud.id = "hud";
app.appendChild(hud);

// ---- Scene and camera ----
const scene = new THREE.Scene();
scene.background = new THREE.Color(CLEAR_COLOR);

const camera = new THREE.PerspectiveCamera(
  CAMERA_FOV_DEG,
  window.innerWidth / window.innerHeight,
  CAMERA_NEAR,
  CAMERA_FAR,
);
camera.position.copy(CAMERA_POSITION);
camera.lookAt(0, 0, 0);

// ---- Time ----
const timer = new THREE.Timer();
timer.connect(document);

// ---- Centre-pixel probe (reads the frame just rendered) ----
const gl = renderer.getContext();
const probePixel = new Uint8Array(4);
let nextProbeTime = 0;
let probeText = "centre (waiting)";

function probeCentre(): string {
  const x = Math.floor(gl.drawingBufferWidth / 2);
  const y = Math.floor(gl.drawingBufferHeight / 2);
  gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, probePixel);
  return `centre ${probePixel[0]} ${probePixel[1]} ${probePixel[2]}`;
}

// ---- Resize ----
function onResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onResize);

// ---- Loop ----
renderer.setAnimationLoop((timestamp: number) => {
  timer.update(timestamp);
  renderer.render(scene, camera);

  const elapsed = timer.getElapsed();
  if (elapsed >= nextProbeTime) {
    probeText = probeCentre();
    nextProbeTime = elapsed + PROBE_INTERVAL_S;
  }
  hud.textContent = `elapsed ${elapsed.toFixed(ELAPSED_DECIMALS)} s\n${probeText}`;
});
