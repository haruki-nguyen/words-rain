import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { AudioController } from "./audio-controller.js";

// Configuration constants
const CONFIG = {
  WORD_COUNT: 60,
  FALL_SPEED: 0.5,
  SPARKLE_COUNT: 80,
  HEART_CHANCE: 0.25,
  MAX_TEXT_LENGTH: 18,
  BASE_FONT_SIZE: 128,
  MIN_FONT_SIZE: 64,
  BASE_CANVAS_WIDTH: 1024,
  BASE_CANVAS_HEIGHT: 256,
  FONT_SIZE_REDUCTION: 6,
  CANVAS_WIDTH_INCREASE: 60,
  WORLD_BOUNDS: {
    X: 10,
    Y: { MIN: -10, MAX: 10 },
    Z: 10,
    FLOOR: -15,
  },
  SPEED: {
    MIN: 0.1,
    MAX: 0.5,
  },
  SPARKLE_MOVEMENT: 0.01,
};

// Vietnamese love words
const WORDS = [
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

// Audio Controller is now imported from audio-controller.js module

// Object Pool for better performance
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.active = new Set();

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  get() {
    let obj;
    if (this.pool.length > 0) {
      obj = this.pool.pop();
    } else {
      obj = this.createFn();
    }

    this.active.add(obj);
    return obj;
  }

  release(obj) {
    if (this.active.has(obj)) {
      this.resetFn(obj);
      this.active.delete(obj);
      this.pool.push(obj);
    }
  }

  releaseAll() {
    this.active.forEach((obj) => {
      this.resetFn(obj);
      this.pool.push(obj);
    });
    this.active.clear();
  }
}

// Text Sprite Factory with caching
class TextSpriteFactory {
  constructor() {
    // No caching needed since we create unique sprites for each word
  }

  createTextSprite(message) {
    const { fontSize, canvasWidth, canvasHeight } =
      this.calculateTextSize(message);

    // Create a new canvas for each sprite to avoid texture sharing
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");

    // Clear and setup context
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.font = `bold ${fontSize}px Segoe UI, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 0.9;

    // Draw text
    ctx.fillText(message, canvasWidth / 2, canvasHeight / 2);

    // Create texture and material
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      depthWrite: false,
    });

    // Create sprite with proper scaling based on actual canvas dimensions
    const scaleX = 12 * 0.65 * (canvasWidth / CONFIG.BASE_CANVAS_WIDTH);
    const scaleY = 2.8 * 0.65 * (canvasHeight / CONFIG.BASE_CANVAS_HEIGHT);
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(scaleX, scaleY, 1);

    return sprite;
  }

  calculateTextSize(message) {
    // Create a temporary canvas to measure text
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    let fontSize = CONFIG.BASE_FONT_SIZE;

    // Adjust font size based on message length
    if (message.length > CONFIG.MAX_TEXT_LENGTH) {
      fontSize = Math.max(
        CONFIG.MIN_FONT_SIZE,
        CONFIG.BASE_FONT_SIZE -
          (message.length - CONFIG.MAX_TEXT_LENGTH) * CONFIG.FONT_SIZE_REDUCTION
      );
    }

    // Set font and measure actual text width
    tempCtx.font = `bold ${fontSize}px Segoe UI, Arial, sans-serif`;
    const textMetrics = tempCtx.measureText(message);
    const actualTextWidth = textMetrics.width;

    // Calculate canvas dimensions with proper padding
    const padding = 80; // Padding on each side
    const shadowBlur = 16;
    const totalPadding = padding + shadowBlur * 2;

    const canvasWidth = Math.max(
      CONFIG.BASE_CANVAS_WIDTH,
      actualTextWidth + totalPadding
    );

    const canvasHeight = Math.max(
      CONFIG.BASE_CANVAS_HEIGHT,
      fontSize + totalPadding
    );

    return { fontSize, canvasWidth, canvasHeight };
  }

  createHeartSprite() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    ctx.font = `bold 160px Segoe UI Emoji, Apple Color Emoji, Arial, sans-serif`;
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
      alphaTest: 0.1,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(6.4, 6.4, 1);

    return sprite;
  }
}

// Main Application Class
class WordsRainApp {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    this.rainWords = [];
    this.sparkles = [];

    this.textFactory = new TextSpriteFactory();
    this.audioController = new AudioController();

    this.animationId = null;
    this.isRunning = false;

    this.init();
  }

  init() {
    try {
      this.setupScene();
      this.setupCamera();
      this.setupRenderer();
      this.setupControls();
      this.setupLighting();
      this.spawnInitialElements();
      this.setupEventListeners();

      this.isRunning = true;
      this.animate();
    } catch (error) {
      console.error("Failed to initialize app:", error);
    }
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
  }

  setupCamera() {
    const aspect = window.innerWidth / window.innerHeight;

    // Use perspective camera with wider field of view for better sprite visibility
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 18);
    this.camera.lookAt(0, 0, 0);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    this.renderer.setClearColor(0x000000);

    // Ensure canvas is positioned correctly
    this.renderer.domElement.style.position = "fixed";
    this.renderer.domElement.style.top = "0";
    this.renderer.domElement.style.left = "0";
    this.renderer.domElement.style.zIndex = "1";

    document.body.appendChild(this.renderer.domElement);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
  }

  setupLighting() {
    // Add ambient light for better visibility
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);
  }

  spawnInitialElements() {
    // Spawn initial rain words
    for (let i = 0; i < CONFIG.WORD_COUNT; i++) {
      this.spawnRainWordOrHeart();
    }

    // Spawn sparkles
    this.spawnSparkles();
  }

  setupEventListeners() {
    window.addEventListener("resize", () => this.onWindowResize(), {
      passive: true,
    });

    // Handle visibility change to pause/resume animation
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  randomPosition() {
    return {
      x: (Math.random() - 0.5) * CONFIG.WORLD_BOUNDS.X * 2,
      y:
        CONFIG.WORLD_BOUNDS.Y.MIN +
        Math.random() * (CONFIG.WORLD_BOUNDS.Y.MAX - CONFIG.WORLD_BOUNDS.Y.MIN),
      z: (Math.random() - 0.5) * CONFIG.WORLD_BOUNDS.Z * 2,
    };
  }

  randomSpeed() {
    return (
      CONFIG.SPEED.MIN + Math.random() * (CONFIG.SPEED.MAX - CONFIG.SPEED.MIN)
    );
  }

  spawnRainWordOrHeart() {
    const sprite =
      Math.random() < CONFIG.HEART_CHANCE
        ? this.textFactory.createHeartSprite()
        : this.textFactory.createTextSprite(
            WORDS[Math.floor(Math.random() * WORDS.length)]
          );

    const pos = this.randomPosition();
    sprite.position.set(pos.x, pos.y, pos.z);
    sprite.userData = { speed: this.randomSpeed() };

    this.scene.add(sprite);
    this.rainWords.push(sprite);
  }

  spawnSparkles() {
    for (let i = 0; i < CONFIG.SPARKLE_COUNT; i++) {
      const sparkle = this.createSparkle();
      this.scene.add(sparkle);
      this.sparkles.push(sparkle);
    }
  }

  createSparkle() {
    const geometry = new THREE.SphereGeometry(0.12, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);

    const pos = this.randomPosition();
    mesh.position.set(pos.x, pos.y, pos.z);

    mesh.userData = {
      dx: (Math.random() - 0.5) * CONFIG.SPARKLE_MOVEMENT,
      dy: (Math.random() - 0.5) * CONFIG.SPARKLE_MOVEMENT,
      dz: (Math.random() - 0.5) * CONFIG.SPARKLE_MOVEMENT,
      baseY: mesh.position.y,
      phase: Math.random() * Math.PI * 2,
    };

    // Add glow effect
    const glowTexture = this.createGlowTexture();
    const spriteMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      depthTest: false,
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1.2, 1.2, 1.2);
    mesh.add(sprite);

    return mesh;
  }

  createGlowTexture() {
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

  onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;

    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    if (!this.isRunning) return;

    this.animationId = requestAnimationFrame(() => this.animate());

    this.controls.update();
    this.updateRainWords();
    this.updateSparkles();
    this.renderer.render(this.scene, this.camera);
  }

  updateRainWords() {
    for (let i = 0; i < this.rainWords.length; i++) {
      const sprite = this.rainWords[i];
      sprite.position.y -= sprite.userData.speed * CONFIG.FALL_SPEED;

      if (sprite.position.y < CONFIG.WORLD_BOUNDS.FLOOR) {
        // Reset position
        const pos = this.randomPosition();
        sprite.position.set(pos.x, pos.y, pos.z);

        // Replace with new content
        this.scene.remove(sprite);

        const newSprite =
          Math.random() < CONFIG.HEART_CHANCE
            ? this.textFactory.createHeartSprite()
            : this.textFactory.createTextSprite(
                WORDS[Math.floor(Math.random() * WORDS.length)]
              );

        newSprite.position.copy(sprite.position);
        newSprite.userData = { speed: this.randomSpeed() };

        this.scene.add(newSprite);
        this.rainWords[i] = newSprite;
      }
    }
  }

  updateSparkles() {
    for (let i = 0; i < this.sparkles.length; i++) {
      const sparkle = this.sparkles[i];

      sparkle.position.x += sparkle.userData.dx;
      sparkle.position.y =
        sparkle.userData.baseY +
        Math.sin(Date.now() * 0.001 + sparkle.userData.phase) * 0.5;
      sparkle.position.z += sparkle.userData.dz;

      // Wrap sparkles if they drift too far
      if (sparkle.position.x < -CONFIG.WORLD_BOUNDS.X)
        sparkle.position.x = CONFIG.WORLD_BOUNDS.X;
      if (sparkle.position.x > CONFIG.WORLD_BOUNDS.X)
        sparkle.position.x = -CONFIG.WORLD_BOUNDS.X;
      if (sparkle.position.z < -CONFIG.WORLD_BOUNDS.Z)
        sparkle.position.z = CONFIG.WORLD_BOUNDS.Z;
      if (sparkle.position.z > CONFIG.WORLD_BOUNDS.Z)
        sparkle.position.z = -CONFIG.WORLD_BOUNDS.Z;
    }
  }

  pause() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  destroy() {
    this.pause();

    // Clean up Three.js resources
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(
          this.renderer.domElement
        );
      }
    }

    // Clean up scene
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }

    // Remove event listeners
    window.removeEventListener("resize", this.onWindowResize);
  }
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Clean up any existing instances
  if (window.wordsRainApp) {
    window.wordsRainApp.destroy();
  }

  // Create new instance
  window.wordsRainApp = new WordsRainApp();

  // Easter egg for girlfriend
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
});

// Handle page unload
window.addEventListener("beforeunload", () => {
  if (window.wordsRainApp) {
    window.wordsRainApp.destroy();
  }
});
