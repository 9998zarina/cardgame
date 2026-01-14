const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const waveDisplay = document.getElementById('wave');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlay-text');
const startBtn = document.getElementById('start-btn');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let player = null;
let bullets = [];
let enemies = [];
let particles = [];
let stars = [];
let score = 0;
let lives = 3;
let wave = 1;
let isPlaying = false;
let isPaused = false;
let animationId = null;
let lastEnemySpawn = 0;
let enemySpawnInterval = 1500;

const keys = {
    left: false,
    right: false,
    space: false
};

// Star background
function createStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * WIDTH,
            y: Math.random() * HEIGHT,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 2 + 0.5
        });
    }
}

function updateStars() {
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > HEIGHT) {
            star.y = 0;
            star.x = Math.random() * WIDTH;
        }
    });
}

function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        ctx.globalAlpha = Math.random() * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// Player
function createPlayer() {
    return {
        x: WIDTH / 2,
        y: HEIGHT - 60,
        width: 40,
        height: 40,
        speed: 6,
        canShoot: true,
        shootCooldown: 200
    };
}

function updatePlayer() {
    if (keys.left && player.x > player.width / 2) {
        player.x -= player.speed;
    }
    if (keys.right && player.x < WIDTH - player.width / 2) {
        player.x += player.speed;
    }
}

function drawPlayer() {
    // Spaceship body
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.height / 2);
    ctx.lineTo(player.x - player.width / 2, player.y + player.height / 2);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(player.x, player.y + 5, 8, 0, Math.PI * 2);
    ctx.fill();

    // Engine glow
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(player.x - 10, player.y + player.height / 2);
    ctx.lineTo(player.x, player.y + player.height / 2 + 15 + Math.random() * 5);
    ctx.lineTo(player.x + 10, player.y + player.height / 2);
    ctx.closePath();
    ctx.fill();
}

// Bullets
function shoot() {
    if (!player.canShoot) return;

    bullets.push({
        x: player.x,
        y: player.y - player.height / 2,
        width: 4,
        height: 15,
        speed: 10
    });

    player.canShoot = false;
    setTimeout(() => {
        player.canShoot = true;
    }, player.shootCooldown);
}

function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > -bullet.height;
    });
}

function drawBullets() {
    ctx.fillStyle = '#ffff00';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);

        // Glow effect
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 10;
        ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
        ctx.shadowBlur = 0;
    });
}

// Enemies
function spawnEnemy() {
    const types = ['basic', 'fast', 'strong'];
    const type = wave < 3 ? 'basic' : types[Math.floor(Math.random() * Math.min(wave, types.length))];

    const enemy = {
        x: Math.random() * (WIDTH - 60) + 30,
        y: -30,
        width: 35,
        height: 35,
        type: type,
        health: type === 'strong' ? 3 : 1,
        speed: type === 'fast' ? 4 : 2 + wave * 0.3,
        points: type === 'strong' ? 30 : type === 'fast' ? 20 : 10
    };

    enemies.push(enemy);
}

function updateEnemies() {
    enemies = enemies.filter(enemy => {
        enemy.y += enemy.speed;

        // Check collision with player
        if (checkCollision(enemy, { x: player.x, y: player.y, width: player.width, height: player.height })) {
            loseLife();
            createExplosion(enemy.x, enemy.y, '#ff0000');
            return false;
        }

        // Remove if off screen
        if (enemy.y > HEIGHT + enemy.height) {
            return false;
        }

        return true;
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        let color;
        switch (enemy.type) {
            case 'fast':
                color = '#ff00ff';
                break;
            case 'strong':
                color = '#ff8800';
                break;
            default:
                color = '#ff4444';
        }

        // Enemy body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y + enemy.height / 2);
        ctx.lineTo(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2);
        ctx.lineTo(enemy.x + enemy.width / 2, enemy.y - enemy.height / 2);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(enemy.x - 8, enemy.y - 5, 5, 0, Math.PI * 2);
        ctx.arc(enemy.x + 8, enemy.y - 5, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(enemy.x - 8, enemy.y - 5, 2, 0, Math.PI * 2);
        ctx.arc(enemy.x + 8, enemy.y - 5, 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Particles
function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            size: Math.random() * 5 + 2,
            color: color,
            life: 1
        });
    }
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        return p.life > 0;
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// Collision detection
function checkCollision(a, b) {
    return Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
           Math.abs(a.y - b.y) < (a.height + b.height) / 2;
}

function checkBulletCollisions() {
    bullets = bullets.filter(bullet => {
        let hit = false;
        enemies = enemies.filter(enemy => {
            if (checkCollision(bullet, enemy)) {
                hit = true;
                enemy.health--;
                if (enemy.health <= 0) {
                    score += enemy.points;
                    scoreDisplay.textContent = score;
                    createExplosion(enemy.x, enemy.y, '#ffff00');
                    return false;
                }
                createExplosion(bullet.x, bullet.y, '#ffffff');
            }
            return true;
        });
        return !hit;
    });
}

function loseLife() {
    lives--;
    updateLivesDisplay();

    if (lives <= 0) {
        gameOver();
    }
}

function updateLivesDisplay() {
    livesDisplay.textContent = '❤️'.repeat(lives);
}

function gameOver() {
    isPlaying = false;
    cancelAnimationFrame(animationId);
    overlayText.textContent = `게임 오버! 점수: ${score}`;
    startBtn.textContent = '다시 시작';
    overlay.classList.remove('hidden');
}

function checkWaveComplete() {
    if (enemies.length === 0 && Date.now() - lastEnemySpawn > 2000) {
        wave++;
        waveDisplay.textContent = wave;
        enemySpawnInterval = Math.max(500, 1500 - wave * 100);
    }
}

function update() {
    if (!isPlaying || isPaused) return;

    updateStars();
    updatePlayer();
    updateBullets();
    updateEnemies();
    updateParticles();
    checkBulletCollisions();
    checkWaveComplete();

    // Auto shoot when holding space
    if (keys.space) {
        shoot();
    }

    // Spawn enemies
    if (Date.now() - lastEnemySpawn > enemySpawnInterval) {
        spawnEnemy();
        lastEnemySpawn = Date.now();
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    drawStars();
    drawBullets();
    drawEnemies();
    drawPlayer();
    drawParticles();
}

function gameLoop() {
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
    player = createPlayer();
    bullets = [];
    enemies = [];
    particles = [];
    score = 0;
    lives = 3;
    wave = 1;
    lastEnemySpawn = 0;
    enemySpawnInterval = 1500;

    scoreDisplay.textContent = score;
    waveDisplay.textContent = wave;
    updateLivesDisplay();

    createStars();

    isPlaying = true;
    isPaused = false;
    overlay.classList.add('hidden');

    cancelAnimationFrame(animationId);
    gameLoop();
}

function togglePause() {
    if (!isPlaying) return;

    isPaused = !isPaused;
    if (isPaused) {
        overlayText.textContent = '일시정지';
        startBtn.textContent = '계속하기';
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === ' ') {
        e.preventDefault();
        keys.space = true;
    }
    if (e.key === 'p' || e.key === 'P') togglePause();
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === ' ') keys.space = false;
});

startBtn.addEventListener('click', () => {
    if (isPaused) {
        togglePause();
    } else {
        startGame();
    }
});

// Initial star background
createStars();
function drawInitial() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawStars();
}
drawInitial();
