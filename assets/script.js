import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const words = [
  "Anh yêu em",
  "Yêu em nhiều",
  "Mãi yêu em",
  "Yêu em nhất",
  "Em là tất cả",
  "Tình yêu của chúng ta thật đẹp",
  "Yêu em mãi mãi",
  "Em là duy nhất",
  "Yêu em vô cùng",
  "Em là tình yêu của anh",
  "Yêu em thật nhiều",
  "Em là tất cả",
  "Yêu em nhất đời",
  "Em là tình yêu",
  "Yêu em vĩnh viễn",
];

let scene, camera, renderer, controls;
let rainWords = [];
const wordCount = 60;
const fallSpeed = 0.5;
let sparkles = [];
const sparkleCount = 80;

function randomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

function randomX() {
  return (Math.random() - 0.5) * 40; // -20 to 20
}
function randomZ() {
  return (Math.random() - 0.5) * 40; // -20 to 20
}
function randomY() {
  return 20 + Math.random() * 10; // 20 to 30
}
function randomSpeed() {
  return 0.1 + Math.random() * 0.4; // 0.1 to 0.5
}

function createTextSprite(message) {
  // Dynamically adjust font size and canvas width based on text length
  const baseFontSize = 128;
  const minFontSize = 64;
  const baseCanvasWidth = 1024;
  const baseCanvasHeight = 256;
  const maxTextLength = 18; // characters before scaling down
  let fontSize = baseFontSize;
  let canvasWidth = baseCanvasWidth;

  if (message.length > maxTextLength) {
    // Reduce font size for longer text
    fontSize = Math.max(
      minFontSize,
      baseFontSize - (message.length - maxTextLength) * 6
    );
    // Increase canvas width for longer text
    canvasWidth = baseCanvasWidth + (message.length - maxTextLength) * 60;
  }

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = baseCanvasHeight;
  const ctx = canvas.getContext("2d");
  ctx.font = `bold ${fontSize}px Segoe UI, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#fff";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#fff";
  ctx.globalAlpha = 0.9;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  // Keep the sprite scale visually consistent regardless of canvas width
  const scaleX = 10 * 0.65 * (canvas.width / baseCanvasWidth);
  const scaleY = 2.5 * 0.65;
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(scaleX, scaleY, 1);
  return sprite;
}

function createHeartSprite() {
  const fontSize = 160;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.font = `bold ${fontSize}px Segoe UI Emoji, Apple Color Emoji, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#f00";
  ctx.shadowBlur = 24;
  ctx.globalAlpha = 0.95;
  ctx.fillText("❤️", canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(5, 5, 1); // Make the heart large and square
  return sprite;
}

function createSparkle() {
  // Main sparkle (bright white)
  const geometry = new THREE.SphereGeometry(0.12, 8, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 40
  );
  mesh.userData = {
    dx: (Math.random() - 0.5) * 0.01,
    dy: (Math.random() - 0.5) * 0.01,
    dz: (Math.random() - 0.5) * 0.01,
    baseY: mesh.position.y,
    phase: Math.random() * Math.PI * 2,
  };

  // Add a glowing sprite behind the sparkle
  const glowTexture = createGlowTexture();
  const spriteMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xffffff,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(1.2, 1.2, 1.2); // Glow size
  mesh.add(sprite);

  return mesh;
}

function createGlowTexture() {
  // Create a radial gradient texture for glow
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, "rgba(255,255,255,0.9)");
  gradient.addColorStop(0.3, "rgba(255,255,255,0.5)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function spawnRainWordOrHeart() {
  let sprite;
  if (Math.random() < 0.25) {
    // 25% chance for a heart
    sprite = createHeartSprite();
  } else {
    sprite = createTextSprite(randomWord());
  }
  sprite.position.set(randomX(), randomY(), randomZ());
  sprite.userData = { speed: randomSpeed() };
  scene.add(sprite);
  rainWords.push(sprite);
}

function spawnSparkles() {
  for (let i = 0; i < sparkleCount; i++) {
    const sparkle = createSparkle();
    scene.add(sparkle);
    sparkles.push(sparkle);
  }
}

function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Orthographic Camera for 2D-like view
  const aspect = window.innerWidth / window.innerHeight;
  const frustumHeight = 20;
  camera = new THREE.OrthographicCamera(
    (-frustumHeight * aspect) / 2, // left
    (frustumHeight * aspect) / 2, // right
    frustumHeight / 2, // top
    -frustumHeight / 2, // bottom
    0.1,
    1000
  );
  camera.position.set(0, 0, 50); // Look straight on
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // Controls (allow rotation again)
  controls = new OrbitControls(camera, renderer.domElement);
  // controls.enableRotate = false;
  // controls.enablePan = false;
  // controls.enableZoom = false;

  // Initial rain
  for (let i = 0; i < wordCount; i++) {
    spawnRainWordOrHeart();
  }
  // Add sparkles
  spawnSparkles();

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight;
  const frustumHeight = 20;
  camera.left = (-frustumHeight * aspect) / 2;
  camera.right = (frustumHeight * aspect) / 2;
  camera.top = frustumHeight / 2;
  camera.bottom = -frustumHeight / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Animate rain
  for (let i = 0; i < rainWords.length; i++) {
    const sprite = rainWords[i];
    sprite.position.y -= sprite.userData.speed * fallSpeed;
    if (sprite.position.y < -10) {
      sprite.position.x = randomX();
      sprite.position.y = randomY();
      sprite.position.z = randomZ();
      scene.remove(sprite);
      rainWords[i] =
        Math.random() < 0.25
          ? createHeartSprite()
          : createTextSprite(randomWord());
      rainWords[i].position.copy(sprite.position);
      rainWords[i].userData = { speed: randomSpeed() };
      scene.add(rainWords[i]);
    }
  }

  // Animate sparkles
  for (let i = 0; i < sparkles.length; i++) {
    const s = sparkles[i];
    s.position.x += s.userData.dx;
    s.position.y =
      s.userData.baseY + Math.sin(Date.now() * 0.001 + s.userData.phase) * 0.5;
    s.position.z += s.userData.dz;
    // Wrap sparkles if they drift too far
    if (s.position.x < -20) s.position.x = 20;
    if (s.position.x > 20) s.position.x = -20;
    if (s.position.z < -20) s.position.z = 20;
    if (s.position.z > 20) s.position.z = -20;
  }

  renderer.render(scene, camera);
}

// Remove old renderer if reloading
if (window.THREE_RENDERER) {
  document.body.removeChild(window.THREE_RENDERER.domElement);
}
window.THREE_RENDERER = renderer;

// Remove old canvas if present
const oldCanvas = document.querySelector("canvas");
if (oldCanvas) oldCanvas.remove();

init();
animate();

// Easter egg for my girlfriend
setTimeout(() => {
  console.log(
    "%c💖 Gửi đến người yêu thương nhất của anh,",
    "color: #e255a3; font-size: 2rem; font-weight: bold;"
  );
  console.log(
    "%cMỗi ánh sáng lấp lánh, mỗi trái tim, mỗi từ ngữ đều dành cho em! 💌",
    "color: #ff69b4; font-size: 1.2rem;"
  );
  console.log(
    "%c\n        (¯`·.·´¯)\n         `·.¸.·´\n",
    "color: #e255a3; font-size: 1.1rem;"
  );
}, 1000);
