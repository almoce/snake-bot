
const CELL_SIZE = 20; // Matches state.js/canvas.js

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    // Random velocity
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 0.5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    
    this.life = 1.0;
    this.decay = Math.random() * 0.03 + 0.02;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    // Draw small square or circle
    ctx.fillRect(this.x, this.y, 4, 4);
    ctx.restore();
  }
}

const particles = [];

export const spawn = (x, y, color, count = 10) => {
  // x, y are grid coordinates, convert to pixels
  const px = x * CELL_SIZE + CELL_SIZE / 2;
  const py = y * CELL_SIZE + CELL_SIZE / 2;
  
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(px, py, color));
  }
};

export const update = () => {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
};

export const draw = (ctx) => {
  if (!ctx) return;
  particles.forEach(p => p.draw(ctx));
};
