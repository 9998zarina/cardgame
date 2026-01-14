const allEmojis = ['🐶', '🐱', '🐼', '🦊', '🦁', '🐸', '🐵', '🐰', '🐯', '🐻', '🐨', '🐷'];

const difficultySettings = {
    easy: { pairs: 4 },
    normal: { pairs: 8 },
    hard: { pairs: 12 }
};

let currentDifficulty = 'easy';
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let isLocked = false;
let totalPairs = 4;

const gameBoard = document.getElementById('game-board');
const movesDisplay = document.getElementById('moves');
const matchesDisplay = document.getElementById('matches');
const totalPairsDisplay = document.getElementById('total-pairs');
const messageDisplay = document.getElementById('message');
const restartBtn = document.getElementById('restart-btn');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');

function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function createCard(emoji, index) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.emoji = emoji;
    card.dataset.index = index;

    card.innerHTML = `
        <div class="card-face card-back"></div>
        <div class="card-face card-front">${emoji}</div>
    `;

    card.addEventListener('click', () => flipCard(card));
    return card;
}

function flipCard(card) {
    if (isLocked) return;
    if (card.classList.contains('flipped')) return;
    if (card.classList.contains('matched')) return;
    if (flippedCards.length >= 2) return;

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        moves++;
        movesDisplay.textContent = moves;
        checkMatch();
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.emoji === card2.dataset.emoji;

    if (isMatch) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        matchesDisplay.textContent = matchedPairs;
        flippedCards = [];

        if (matchedPairs === totalPairs) {
            messageDisplay.textContent = `축하합니다! ${moves}번 만에 완료했습니다!`;
        }
    } else {
        isLocked = true;
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
            isLocked = false;
        }, 1000);
    }
}

function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
    totalPairs = difficultySettings[difficulty].pairs;

    difficultyBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
    });

    initGame();
}

function initGame() {
    gameBoard.innerHTML = '';
    gameBoard.classList.remove('hard');

    if (currentDifficulty === 'hard') {
        gameBoard.classList.add('hard');
    }

    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    isLocked = false;
    movesDisplay.textContent = '0';
    matchesDisplay.textContent = '0';
    totalPairsDisplay.textContent = totalPairs;
    messageDisplay.textContent = '';

    const emojis = allEmojis.slice(0, totalPairs);
    const cards = [...emojis, ...emojis];
    const shuffledCards = shuffle(cards);

    shuffledCards.forEach((emoji, index) => {
        const card = createCard(emoji, index);
        gameBoard.appendChild(card);
    });
}

difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => setDifficulty(btn.dataset.difficulty));
});

restartBtn.addEventListener('click', initGame);

initGame();
