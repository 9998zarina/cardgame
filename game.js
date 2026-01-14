const emojis = ['🐶', '🐱', '🐼', '🦊', '🦁', '🐸', '🐵', '🐰'];
const cards = [...emojis, ...emojis];

let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let isLocked = false;

const gameBoard = document.getElementById('game-board');
const movesDisplay = document.getElementById('moves');
const matchesDisplay = document.getElementById('matches');
const messageDisplay = document.getElementById('message');
const restartBtn = document.getElementById('restart-btn');

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

        if (matchedPairs === emojis.length) {
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

function initGame() {
    gameBoard.innerHTML = '';
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    isLocked = false;
    movesDisplay.textContent = '0';
    matchesDisplay.textContent = '0';
    messageDisplay.textContent = '';

    const shuffledCards = shuffle(cards);
    shuffledCards.forEach((emoji, index) => {
        const card = createCard(emoji, index);
        gameBoard.appendChild(card);
    });
}

restartBtn.addEventListener('click', initGame);

initGame();
