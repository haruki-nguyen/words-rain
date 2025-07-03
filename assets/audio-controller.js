/**
 * Audio Controller Module
 * Handles all audio playback, controls, and user interactions
 */

export class AudioController {
  constructor() {
    this.audio = document.getElementById("bg-music");
    this.overlay = document.getElementById("play-overlay");
    this.playBtn = document.getElementById("play-btn");
    this.pauseBtn = document.getElementById("pause-btn");
    this.slider = document.getElementById("audio-slider");
    this.timeLabel = document.getElementById("audio-time");
    this.controls = document.getElementById("audio-controls");

    this.isPlaying = false;
    this.isInitialized = false;

    this.init();
  }

  init() {
    if (
      !this.audio ||
      !this.overlay ||
      !this.playBtn ||
      !this.pauseBtn ||
      !this.slider ||
      !this.timeLabel
    ) {
      console.error("Audio elements not found");
      return;
    }

    this.setupEventListeners();
    this.setupAccessibility();
  }

  setupEventListeners() {
    // Audio events
    this.audio.addEventListener("timeupdate", () => this.updateSlider());
    this.audio.addEventListener("loadedmetadata", () => this.updateSlider());
    this.audio.addEventListener("ended", () => this.handleAudioEnd());
    this.audio.addEventListener("error", (e) => this.handleAudioError(e));
    this.audio.addEventListener("play", () => this.handlePlay());
    this.audio.addEventListener("pause", () => this.handlePause());

    // User interaction events
    this.playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.startMusic();
    });

    this.pauseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.togglePlayPause();
    });

    this.slider.addEventListener("input", (e) => {
      if (!isNaN(this.audio.duration)) {
        this.audio.currentTime = parseFloat(e.target.value);
      }
    });

    // Prevent slider seeking while dragging if not playing
    this.slider.addEventListener("mousedown", () => {
      if (this.isPlaying) {
        this.audio.pause();
      }
    });

    this.slider.addEventListener("mouseup", () => {
      if (this.isPlaying) {
        this.audio.play().catch(console.error);
      }
    });

    // Global events for starting music
    window.addEventListener("click", (e) => {
      if (!this.isInitialized && e.target !== this.playBtn) {
        this.startMusic();
      }
    });

    window.addEventListener("keydown", (e) => {
      if (!this.isInitialized && (e.code === "Space" || e.code === "Enter")) {
        e.preventDefault();
        this.startMusic();
      }
    });

    // Keyboard controls for audio
    window.addEventListener("keydown", (e) => {
      if (this.isInitialized) {
        switch (e.code) {
          case "Space":
            e.preventDefault();
            this.togglePlayPause();
            break;
          case "ArrowLeft":
            e.preventDefault();
            this.seek(-10);
            break;
          case "ArrowRight":
            e.preventDefault();
            this.seek(10);
            break;
        }
      }
    });
  }

  setupAccessibility() {
    // Add ARIA labels and roles
    this.audio.setAttribute(
      "aria-label",
      "Nhạc nền - The Moon Represents My Heart"
    );
    this.slider.setAttribute("aria-label", "Điều chỉnh thời gian phát nhạc");

    // Update ARIA values dynamically
    this.updateAriaValues();

    // Initialize pause button state
    this.updatePauseButton();
  }

  updateAriaValues() {
    if (!isNaN(this.audio.duration)) {
      this.slider.setAttribute(
        "aria-valuemax",
        Math.floor(this.audio.duration)
      );
      this.slider.setAttribute(
        "aria-valuenow",
        Math.floor(this.audio.currentTime)
      );
    }
  }

  formatTime(seconds) {
    const sec = Math.floor(seconds);
    const minutes = Math.floor(sec / 60);
    const remainingSeconds = sec % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  updateSlider() {
    if (!isNaN(this.audio.duration)) {
      this.slider.max = Math.floor(this.audio.duration);
      this.slider.value = Math.floor(this.audio.currentTime);
      this.timeLabel.textContent = `${this.formatTime(
        this.audio.currentTime
      )} / ${this.formatTime(this.audio.duration)}`;
      this.updateAriaValues();
    } else {
      this.timeLabel.textContent = "0:00 / 0:00";
    }
  }

  async startMusic() {
    try {
      await this.audio.play();
      this.isInitialized = true;
      this.isPlaying = true;

      // Hide overlay with smooth transition
      this.overlay.classList.add("hidden");

      // Remove global event listeners
      window.removeEventListener("click", this.startMusic);
      window.removeEventListener("keydown", this.startMusic);

      // Show controls
      this.controls.classList.remove("hidden");

      console.log("🎵 Music started successfully");
    } catch (error) {
      console.error("Failed to start music:", error);
      this.handleAudioError(error);
    }
  }

  updatePauseButton() {
    if (this.isPlaying) {
      this.pauseBtn.classList.add("playing");
      this.pauseBtn.setAttribute("aria-label", "Tạm dừng nhạc");
      this.pauseBtn.querySelector(".pause-icon").textContent = "⏸";
    } else {
      this.pauseBtn.classList.remove("playing");
      this.pauseBtn.setAttribute("aria-label", "Phát nhạc");
      this.pauseBtn.querySelector(".pause-icon").textContent = "▶";
    }
  }

  togglePlayPause() {
    if (this.audio.paused) {
      this.audio.play().catch(console.error);
    } else {
      this.audio.pause();
    }
  }

  seek(seconds) {
    const newTime = this.audio.currentTime + seconds;
    this.audio.currentTime = Math.max(
      0,
      Math.min(newTime, this.audio.duration)
    );
  }

  handlePlay() {
    this.isPlaying = true;
    this.playBtn.setAttribute("aria-label", "Tạm dừng nhạc");
    this.updatePauseButton();
  }

  handlePause() {
    this.isPlaying = false;
    this.playBtn.setAttribute("aria-label", "Phát nhạc");
    this.updatePauseButton();
  }

  handleAudioEnd() {
    this.audio.currentTime = 0;
    this.audio.play().catch(console.error);
  }

  handleAudioError(error) {
    console.error("Audio error:", error);
    // Show user-friendly error message
    this.timeLabel.textContent = "Lỗi tải nhạc";
  }

  // Public methods for external control
  play() {
    return this.audio.play();
  }

  pause() {
    this.audio.pause();
  }

  setVolume(volume) {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume() {
    return this.audio.volume;
  }

  isAudioPlaying() {
    return !this.audio.paused;
  }

  destroy() {
    // Remove event listeners
    this.audio.removeEventListener("timeupdate", this.updateSlider);
    this.audio.removeEventListener("loadedmetadata", this.updateSlider);
    this.audio.removeEventListener("ended", this.handleAudioEnd);
    this.audio.removeEventListener("error", this.handleAudioError);
    this.audio.removeEventListener("play", this.handlePlay);
    this.audio.removeEventListener("pause", this.handlePause);

    // Pause audio
    this.audio.pause();
  }
}
