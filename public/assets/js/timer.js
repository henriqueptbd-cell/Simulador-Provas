export class Timer {
  constructor({ seconds, onTick, onEnd }) {
    this.remaining = seconds;
    this.total = seconds;
    this.onTick = onTick;
    this.onEnd = onEnd;
    this._interval = null;
    this._paused = false;
  }

  start() {
    this._interval = setInterval(() => {
      if (this._paused) return;
      this.remaining--;
      this.onTick(this.remaining);
      if (this.remaining <= 0) {
        this.stop();
        this.onEnd();
      }
    }, 1000);
  }

  pause()  { this._paused = true; }
  resume() { this._paused = false; }
  stop()   { clearInterval(this._interval); }

  get elapsed() { return this.total - this.remaining; }

  format(seconds = this.remaining) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}
