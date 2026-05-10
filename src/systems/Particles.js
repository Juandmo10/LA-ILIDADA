export class Particle {
    constructor(x, y, color, vx, vy, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 4 + 2;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // Gravity
        this.life--;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    addBlood(x, y) {
        for(let i=0; i<15; i++) {
            this.particles.push(new Particle(x, y, '#8B0000', (Math.random()-0.5)*10, (Math.random()-1)*10, 30));
        }
    }
    addFire(x, y) {
        for(let i=0; i<8; i++) {
            this.particles.push(new Particle(x, y, '#FF4500', (Math.random()-0.5)*4, (Math.random()-0.5)*4, 15));
            this.particles.push(new Particle(x, y, '#FFD700', (Math.random()-0.5)*2, (Math.random()-0.5)*2, 10));
        }
    }
    addDust(x, y) {
        for(let i=0; i<10; i++) {
            this.particles.push(new Particle(x, y, '#A9A9A9', (Math.random()-0.5)*4, Math.random()*-2, 20));
        }
    }
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }
    }
    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}

export const particleSystem = new ParticleSystem();
