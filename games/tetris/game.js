const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlay-text');
const startBtn = document.getElementById('start-btn');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = canvas.width / COLS;
const NEXT_BLOCK_SIZE = 20;

const COLORS = [
    null,
    '#00ffff', // I - cyan
    '#0000ff', // J - blue
    '#ff8000', // L - orange
    '#ffff00', // O - yellow
    '#00ff00', // S - green
    '#800080', // T - purple
    '#ff0000'  // Z - red
];

const SHAPES = [
    [],
    [[1, 1, 1, 1]],                          // I
    [[2, 0, 0], [2, 2, 2]],                  // J
    [[0, 0, 3], [3, 3, 3]],                  // L
    [[4, 4], [4, 4]],                        // O
    [[0, 5, 5], [5, 5, 0]],                  // S
    [[0, 6, 0], [6, 6, 6]],                  // T
    [[7, 7, 0], [0, 7, 7]]                   // Z
];

let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameLoop = null;
let isPlaying = false;
let isPaused = false;

function createBoard() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function createPiece(type) {
    const shape = SHAPES[type].map(row => [...row]);
    return {
        type,
        shape,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };
}

function randomPiece() {
    const type = Math.floor(Math.random() * 7) + 1;
    return createPiece(type);
}

function drawBlock(context, x, y, color, size) {
    context.fillStyle = color;
    context.fillRect(x * size, y * size, size - 1, size - 1);

    context.fillStyle = 'rgba(255, 255, 255, 0.3)';
    context.fillRect(x * size, y * size, size - 1, 3);
    context.fillRect(x * size, y * size, 3, size - 1);

    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    context.fillRect(x * size + size - 4, y * size, 3, size - 1);
    context.fillRect(x * size, y * size + size - 4, size - 1, 3);
}

function drawBoard() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                drawBlock(ctx, x, y, COLORS[board[y][x]], BLOCK_SIZE);
            }
        }
    }

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(canvas.width, y * BLOCK_SIZE);
        ctx.stroke();
    }
}

function drawPiece() {
    if (!currentPiece) return;

    currentPiece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value) {
                drawBlock(ctx, currentPiece.x + dx, currentPiece.y + dy, COLORS[value], BLOCK_SIZE);
            }
        });
    });
}

function drawGhost() {
    if (!currentPiece) return;

    let ghostY = currentPiece.y;
    while (isValidMove(currentPiece.shape, currentPiece.x, ghostY + 1)) {
        ghostY++;
    }

    ctx.globalAlpha = 0.3;
    currentPiece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value) {
                drawBlock(ctx, currentPiece.x + dx, ghostY + dy, COLORS[value], BLOCK_SIZE);
            }
        });
    });
    ctx.globalAlpha = 1;
}

function drawNext() {
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (!nextPiece) return;

    const offsetX = (nextCanvas.width / NEXT_BLOCK_SIZE - nextPiece.shape[0].length) / 2;
    const offsetY = (nextCanvas.height / NEXT_BLOCK_SIZE - nextPiece.shape.length) / 2;

    nextPiece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value) {
                drawBlock(nextCtx, offsetX + dx, offsetY + dy, COLORS[value], NEXT_BLOCK_SIZE);
            }
        });
    });
}

function isValidMove(shape, offsetX, offsetY) {
    return shape.every((row, dy) => {
        return row.every((value, dx) => {
            if (!value) return true;
            const x = offsetX + dx;
            const y = offsetY + dy;
            return x >= 0 && x < COLS && y < ROWS && (y < 0 || !board[y][x]);
        });
    });
}

function rotatePiece() {
    const rotated = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
    );

    if (isValidMove(rotated, currentPiece.x, currentPiece.y)) {
        currentPiece.shape = rotated;
    } else if (isValidMove(rotated, currentPiece.x - 1, currentPiece.y)) {
        currentPiece.x--;
        currentPiece.shape = rotated;
    } else if (isValidMove(rotated, currentPiece.x + 1, currentPiece.y)) {
        currentPiece.x++;
        currentPiece.shape = rotated;
    }
}

function mergePiece() {
    currentPiece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value && currentPiece.y + dy >= 0) {
                board[currentPiece.y + dy][currentPiece.x + dx] = value;
            }
        });
    });
}

function clearLines() {
    let linesCleared = 0;

    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++;
        }
    }

    if (linesCleared > 0) {
        const points = [0, 100, 300, 500, 800];
        score += points[linesCleared] * level;
        lines += linesCleared;
        level = Math.floor(lines / 10) + 1;

        scoreDisplay.textContent = score;
        levelDisplay.textContent = level;
    }
}

function gameOver() {
    isPlaying = false;
    clearInterval(gameLoop);
    overlayText.textContent = `게임 오버! 점수: ${score}`;
    startBtn.textContent = '다시 시작';
    overlay.classList.remove('hidden');
}

function drop() {
    if (!isValidMove(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
        mergePiece();
        clearLines();

        currentPiece = nextPiece;
        nextPiece = randomPiece();
        drawNext();

        if (!isValidMove(currentPiece.shape, currentPiece.x, currentPiece.y)) {
            gameOver();
        }
    } else {
        currentPiece.y++;
    }
}

function hardDrop() {
    while (isValidMove(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
        score += 2;
    }
    scoreDisplay.textContent = score;
    drop();
}

function moveLeft() {
    if (isValidMove(currentPiece.shape, currentPiece.x - 1, currentPiece.y)) {
        currentPiece.x--;
    }
}

function moveRight() {
    if (isValidMove(currentPiece.shape, currentPiece.x + 1, currentPiece.y)) {
        currentPiece.x++;
    }
}

function update() {
    drawBoard();
    drawGhost();
    drawPiece();
}

function startGame() {
    createBoard();
    score = 0;
    level = 1;
    lines = 0;
    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;

    currentPiece = randomPiece();
    nextPiece = randomPiece();
    drawNext();

    isPlaying = true;
    isPaused = false;
    overlay.classList.add('hidden');

    clearInterval(gameLoop);
    gameLoop = setInterval(() => {
        if (!isPaused) {
            drop();
            update();
        }
    }, Math.max(100, 1000 - (level - 1) * 100));

    update();
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
    if (!isPlaying) return;
    if (isPaused && e.key !== 'p' && e.key !== 'P') return;

    switch (e.key) {
        case 'ArrowLeft':
            moveLeft();
            break;
        case 'ArrowRight':
            moveRight();
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case 'ArrowDown':
            drop();
            score += 1;
            scoreDisplay.textContent = score;
            break;
        case ' ':
            hardDrop();
            break;
        case 'p':
        case 'P':
            togglePause();
            break;
    }

    if (!isPaused) update();
});

startBtn.addEventListener('click', () => {
    if (isPaused) {
        togglePause();
    } else {
        startGame();
    }
});

// Initial draw
drawBoard();
drawNext();
