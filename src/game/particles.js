// Particle system for visual effects
export class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
  }

  emit(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.015,
        life: 1
      });
    }
  }

  emitLine(y, width, color, count = 30) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 4 - 1,
        size: Math.random() * 3 + 1,
        color,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.01,
        life: 1
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= p.decay;
      p.alpha = p.life;
      p.size *= 0.98;
      if (p.life <= 0 || p.size < 0.5) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw() {
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  get active() {
    return this.particles.length > 0;
  }
}
