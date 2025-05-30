const { Application, Graphics } = PIXI;

// 1. Crear una nueva aplicación PixiJS
const app = new Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x000000, 
    resolution: window.devicePixelRatio || 1, 
    autoDensity: true,
});

const controlsPanel = document.getElementById('controls-panel');
document.body.insertBefore(app.view, controlsPanel);

// Ajustar el tamaño del canvas si la ventana cambia de tamaño
window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    updateParticles(particles.length);
});


// --- Parte para el efecto de partículas ---


const NUM_PARTICLES = 500; 
const CIRCLE_RADIUS = Math.min(window.innerWidth, window.innerHeight) * 0.3;
const CENTER_X = window.innerWidth / 2;
const CENTER_Y = window.innerHeight / 2;


const particles = [];


class Particle extends Graphics {
    constructor(x, y, radius, color, homeX, homeY) {
        super();
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.alpha = 1;
        this.homeX = homeX; 
        this.homeY = homeY;
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.92;
        this.spring = 0.08; 
        this.repulse = 0; 

        this.beginFill(this.color);
        this.drawCircle(0, 0, this.radius);
        this.endFill();

        app.stage.addChild(this);
    }

    update(mouseX, mouseY, particles) {
        
        if (mouseX !== null && mouseY !== null) {
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 80) {
                const angle = Math.atan2(dy, dx);
                const force = (80 - dist) * repulseForce;
                this.vx += Math.cos(angle) * force;
                this.vy += Math.sin(angle) * force;
            }
        }
        // --- Colisión con otras partículas ---
        for (let i = 0; i < particles.length; i++) {
            const other = particles[i];
            if (other === this) continue;
            const dx2 = this.x - other.x;
            const dy2 = this.y - other.y;
            const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            const minDist = this.radius + other.radius;
            if (dist2 < minDist && dist2 > 0) {
                // Fuerza de separación
                const overlap = minDist - dist2;
                const angle = Math.atan2(dy2, dx2);
                const sepX = Math.cos(angle) * overlap * 0.5;
                const sepY = Math.sin(angle) * overlap * 0.5;
                this.x += sepX;
                this.y += sepY;
                other.x -= sepX;
                other.y -= sepY;
            }
        }
        // Movimiento de regreso a la posición original (home)
        const homeDx = this.homeX - this.x;
        const homeDy = this.homeY - this.y;
        this.vx += homeDx * this.spring;
        this.vy += homeDy * this.spring;

        // Aplicar fricción
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Mover la partícula
        this.x += this.vx * 0.016;
        this.y += this.vy * 0.016;
    }
}

// Crear partículas en círculo
for (let i = 0; i < NUM_PARTICLES; i++) {
    const angle = (i / NUM_PARTICLES) * Math.PI * 2;
    const x = CENTER_X + Math.cos(angle) * CIRCLE_RADIUS;
    const y = CENTER_Y + Math.sin(angle) * CIRCLE_RADIUS;
    const radius = Math.random() * 5 + 2;
    const color = 0x00FF00;
    particles.push(new Particle(x, y, radius, color, x, y));
}

// Posición del cursor
let mouseX = null;
let mouseY = null;

// Actualizar la posición del cursor
app.view.addEventListener('mousemove', (event) => {
    // Obtener la posición relativa al canvas
    const rect = app.view.getBoundingClientRect();
    mouseX = (event.clientX - rect.left) * (app.view.width / rect.width);
    mouseY = (event.clientY - rect.top) * (app.view.height / rect.height);
});
app.view.addEventListener('mouseleave', () => {
    mouseX = null;
    mouseY = null;
});

// Crear un contorno brillante que conecta las partículas
const outline = new Graphics();
app.stage.addChild(outline);

// Variables para los controles
let repulseForce = 0.5;
let showLines = true;


const numParticlesInput = document.getElementById('numParticles');
const repulseForceInput = document.getElementById('repulseForce');
const showLinesInput = document.getElementById('showLines');

numParticlesInput.addEventListener('input', (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 999) val = 999;
    e.target.value = val;
    updateParticles(val);
});
repulseForceInput.addEventListener('input', (e) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 10) val = 10;
    e.target.value = val;
    repulseForce = val;
});
showLinesInput.addEventListener('change', (e) => {
    showLines = e.target.checked;
});

// Función para actualizar el número de partículas
function updateParticles(newCount) {
    // Eliminar partículas actuales
    for (let p of particles) p.destroy();
    particles.length = 0;
    // Recalcular centro y radio por si la ventana cambió de tamaño
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const circleRadius = Math.min(window.innerWidth, window.innerHeight) * 0.3;
    for (let i = 0; i < newCount; i++) {
        const angle = (i / newCount) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * circleRadius;
        const y = centerY + Math.sin(angle) * circleRadius;
        const radius = Math.random() * 5 + 2;
        const color = 0x00FF00;
        particles.push(new Particle(x, y, radius, color, x, y));
    }
}

// Animación principal
app.ticker.add(() => {
    for (let i = 0; i < particles.length; i++) {
        // Si el mouse está fuera del canvas, no aplicar repulsión
        particles[i].update(mouseX, mouseY, particles);
    }
    outline.clear();
    if (showLines && particles.length > 1) {
        outline.lineStyle(8, 0x00FF00, 0.7, 0.5, true);
        outline.moveTo(particles[0].x, particles[0].y);
        for (let i = 1; i < particles.length; i++) {
            outline.lineTo(particles[i].x, particles[i].y);
        }
        outline.lineTo(particles[0].x, particles[0].y);
    }
});
