// Keyboard + mouse. Uses pointer lock when available; falls back to
// click-and-drag mouse look if the browser refuses pointer lock.
const BLOCK = ['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

export class Input {
  constructor(el) {
    this.el = el;
    this.keys = new Set();
    this.pressedSet = new Set();
    this.dx = 0; this.dy = 0; this.wheel = 0;
    this.locked = false;
    this.dragging = false;
    this.onLockChange = null;

    addEventListener('keydown', (e) => {
      if (!e.repeat && !this.keys.has(e.code)) this.pressedSet.add(e.code);
      this.keys.add(e.code);
      if (BLOCK.includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    document.addEventListener('mousemove', (e) => {
      if (this.locked || this.dragging) { this.dx += e.movementX; this.dy += e.movementY; }
    });
    el.addEventListener('mousedown', (e) => {
      if (!this.locked) this.dragging = true;
      const code = `Mouse${e.button}`;
      if (!this.keys.has(code)) this.pressedSet.add(code);
      this.keys.add(code);
    });
    addEventListener('mouseup', (e) => { this.dragging = false; this.keys.delete(`Mouse${e.button}`); });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('wheel', (e) => { this.wheel += e.deltaY; e.preventDefault(); }, { passive: false });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === el;
      this.onLockChange?.(this.locked);
    });
  }

  lock() {
    try {
      const p = this.el.requestPointerLock();
      if (p && p.catch) p.catch(() => {});
    } catch { /* fall back to drag-look */ }
  }

  down(...codes) { return codes.some((c) => this.keys.has(c)); }
  pressed(code) { return this.pressedSet.has(code); }

  consumeMouse() {
    const r = { dx: this.dx, dy: this.dy };
    this.dx = 0; this.dy = 0;
    return r;
  }
  consumeWheel() { const w = this.wheel; this.wheel = 0; return w; }
  endFrame() { this.pressedSet.clear(); }
}
