/**
 * RakhiVerse Video & Audio Engine
 * Plays the sacred Raksha Bandhan celebration MP4 video (assets/rakhi.mp4)
 * with its embedded festive audio/music.
 * Central single source of all music across the website.
 */

class FestiveAudioEngine {
  constructor() {
    this.videoSrc = 'assets/rakhi.mp4';
    this.videoElement = null;
    this.isPlaying = false;
    this.modalElement = null;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    if (!this.videoElement) {
      this.videoElement = document.getElementById('rakhi-celebration-video');
      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.id = 'rakhi-celebration-video';
        this.videoElement.src = this.videoSrc;
        this.videoElement.playsInline = true;
        this.videoElement.preload = 'auto';
        this.videoElement.style.display = 'none';
        document.body.appendChild(this.videoElement);
      }
    }

    this.modalElement = document.getElementById('rakhi-video-modal');

    if (this.videoElement) {
      this.videoElement.loop = true;
      this.videoElement.volume = 0.35;
      this.videoElement.muted = false;

      // Event listeners for state sync
      this.videoElement.onplay = () => {
        this.isPlaying = true;
        this.updateUI(true);
      };

      this.videoElement.onpause = () => {
        this.isPlaying = false;
        this.updateUI(false);
      };

      this.videoElement.onended = () => {
        this.isPlaying = false;
        this.updateUI(false);
      };
    }
  }

  updateUI(playing) {
    const soundBtn = document.getElementById('btn-sound-toggle');
    const soundIcon = document.getElementById('sound-btn-icon');
    const modalPlayBtn = document.getElementById('rakhi-modal-play-icon');

    if (soundBtn) soundBtn.classList.toggle('playing', playing);
    if (soundIcon) soundIcon.innerText = playing ? '🔔' : '🎵';
    if (modalPlayBtn) modalPlayBtn.innerText = playing ? '⏸️ Pause' : '▶️ Play';
  }

  /**
   * Play the Rakhi MP4 video & its original music automatically
   * @param {boolean} openModal - Whether to also display the celebration video modal
   */
  playRakhiVideo(openModal = true) {
    this.init();
    if (!this.videoElement) return;

    this.videoElement.muted = false;
    this.videoElement.volume = 0.35;

    if (openModal) {
      this.openVideoModal();
    }

    const promise = this.videoElement.play();
    if (promise !== undefined) {
      promise.then(() => {
        this.isPlaying = true;
        this.updateUI(true);
      }).catch(err => {
        console.warn('[FestiveAudio] Autoplay handled by browser:', err);
      });
    }
  }

  /**
   * Toggle playback of rakhi.mp4
   */
  toggleMusic() {
    this.init();
    if (!this.videoElement) return false;

    if (this.isPlaying && !this.videoElement.paused) {
      this.videoElement.pause();
      this.isPlaying = false;
      this.updateUI(false);
      return false;
    } else {
      this.playRakhiVideo(false);
      return true;
    }
  }

  /**
   * Play song (alias for toggle/playRakhiVideo for backward compatibility)
   */
  playSong() {
    this.playRakhiVideo(false);
  }

  /**
   * Stop/pause video and music
   */
  stop() {
    if (this.videoElement) {
      this.videoElement.pause();
    }
    this.isPlaying = false;
    this.updateUI(false);
  }

  /**
   * Open the celebration video modal and start playback with sound
   */
  openVideoModal() {
    this.init();
    const modal = document.getElementById('rakhi-video-modal');
    if (modal) {
      modal.style.display = 'flex';
      // Force reflow
      void modal.offsetWidth;
      modal.classList.add('active');
    }
    if (this.videoElement && this.videoElement.paused) {
      this.videoElement.muted = false;
      this.videoElement.play().catch(e => console.log('Playback:', e));
    }
  }

  /**
   * Close the celebration video modal
   * @param {boolean} pauseVideo - Whether to pause playback upon closing (default: false keeps music playing)
   */
  closeVideoModal(pauseVideo = false) {
    const modal = document.getElementById('rakhi-video-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 200);
    }
    if (pauseVideo && this.videoElement) {
      this.videoElement.pause();
    }
  }

  // Safe stubs to prevent runtime errors in any callers while keeping external synth sounds removed
  playTempleBell() {}
  playAartiChime() {}
  playShehnaiRaga() {}
}

window.festiveAudio = new FestiveAudioEngine();
