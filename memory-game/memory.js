// ===== MNEMO — Memory Card Game =====

// ===== EMOJI SETS =====
const EMOJI_POOL = [
  '🌙','⭐','🌊','🔥','🌸','🦋','🐉','🦅',
  '🌺','🍄','🦊','🐺','🌻','🍁','🦁','🐬',
  '🌈','⚡','🎯','🎪','🧿','🔮','💎','🗝️',
  '🏔️','🌋','🐙','🦑','🦚','🦜','🌵','🍀'
];

// ===== STATE =====
let cards = [];
let flipped = [];
let matched = [];
let moves = 0;
let pairs = 0;
let timerInterval = null;
let seconds = 0;
let isLocked = false;
let gridCols = 4;
let gridRows = 4;
let totalPairs = 0;

// ===== DOM =====
const board       = document.getElementById('board');
const movesCount  = document.getElementById('movesCount');
const pairsCount  = document.getElementById('pairsCount');
const timerDisplay= document.getElementById('timerDisplay');
const overlay     = document.getElementById('overlay');
const finalMoves  = document.getElementById('finalMoves');
const finalTime   = document.getElementById('finalTime');
const finalScore  = document.getElementById('finalScore');

// ===== TIMER =====
function startTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  updateTimer();
  timerInterval = setInterval(() => {
    seconds++;
    updateTimer();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function updateTimer() {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  timerDisplay.textContent = `${m}:${s}`;
}

// ===== SHUFFLE =====
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== BUILD BOARD =====
function buildBoard() {
  // reset state
  clearInterval(timerInterval);
  flipped = [];
  matched = [];
  moves = 0;
  pairs = 0;
  seconds = 0;
  isLocked = false;
  movesCount.textContent = '0';
  pairsCount.textContent = '0';
  updateTimer();
  overlay.classList.remove('visible');

  totalPairs = gridCols * gridRows / 2;

  const emojis = shuffle(EMOJI_POOL).slice(0, totalPairs);
  cards = shuffle([...emojis, ...emojis]);

  board.style.setProperty('--cols', gridCols);

  // Calculate card size to fit viewport
  const wrapH = board.parentElement.clientHeight - 40;
  const wrapW = board.parentElement.clientWidth;
  const gap = 10;
  const maxCardW = (wrapW - gap * (gridCols - 1)) / gridCols;
  const maxCardH = (wrapH - gap * (gridRows - 1)) / gridRows;
  const cardH = Math.min(maxCardH, maxCardW * 4 / 3);
  board.style.maxWidth = `${(cardH * 3/4) * gridCols + gap * (gridCols - 1)}px`;
  board.style.gridTemplateRows = `repeat(${gridRows}, 1fr)`;

  board.innerHTML = '';

  cards.forEach((emoji, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = i;
    card.dataset.emoji = emoji;
    card.style.animationDelay = `${i * 30}ms`;

    card.innerHTML = `
      <div class="card__inner">
        <div class="card__face card__back"></div>
        <div class="card__face card__front">${emoji}</div>
      </div>
    `;

    card.addEventListener('click', () => handleFlip(card));
    board.appendChild(card);
  });

  // Start timer on first flip (handled in handleFlip)
}

// ===== FLIP LOGIC =====
let timerStarted = false;

function handleFlip(card) {
  if (isLocked) return;
  if (card.classList.contains('flipped')) return;
  if (card.classList.contains('matched')) return;

  // Start timer on first interaction
  if (!timerStarted) {
    timerStarted = true;
    startTimer();
  }

  card.classList.add('flipped');
  flipped.push(card);

  if (flipped.length === 2) {
    moves++;
    movesCount.textContent = moves;
    isLocked = true;
    checkMatch();
  }
}

function checkMatch() {
  const [a, b] = flipped;
  const isMatch = a.dataset.emoji === b.dataset.emoji;

  if (isMatch) {
    setTimeout(() => {
      a.classList.add('matched');
      b.classList.add('matched');
      flipped = [];
      isLocked = false;
      pairs++;
      pairsCount.textContent = pairs;
      if (pairs === totalPairs) {
        setTimeout(showWin, 500);
      }
    }, 300);
  } else {
    setTimeout(() => {
      a.classList.add('wrong');
      b.classList.add('wrong');
      setTimeout(() => {
        a.classList.remove('flipped', 'wrong');
        b.classList.remove('flipped', 'wrong');
        flipped = [];
        isLocked = false;
      }, 400);
    }, 700);
  }
}

// ===== WIN =====
function showWin() {
  stopTimer();
  const score = Math.max(100, Math.round((totalPairs * 1000) / (moves * (1 + seconds / 60))));
  finalMoves.textContent = moves;
  finalTime.textContent = timerDisplay.textContent;
  finalScore.textContent = score;
  overlay.classList.add('visible');
}

// ===== DIFFICULTY =====
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    const size = +this.dataset.size;
    gridCols = size;
    gridRows = 4;
    timerStarted = false;
    buildBoard();
  });
});

// ===== CONTROLS =====
document.getElementById('newGameBtn').addEventListener('click', () => {
  timerStarted = false;
  buildBoard();
});

document.getElementById('playAgainBtn').addEventListener('click', () => {
  timerStarted = false;
  buildBoard();
});

// ===== PARTICLES =====
function spawnParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 3 + 1;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      bottom: ${-10}px;
      animation-duration: ${8 + Math.random() * 12}s;
      animation-delay: ${Math.random() * 10}s;
    `;
    container.appendChild(p);
  }
}

// ===== KEYBOARD =====
document.addEventListener('keydown', e => {
  if (e.key === 'n' || e.key === 'N') {
    timerStarted = false;
    buildBoard();
  }
});

// ===== INIT =====
spawnParticles();
timerStarted = false;
buildBoard();
