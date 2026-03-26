// ===== TYPEX — Typing Speed Test =====

// ===== WORD BANKS =====
const WORDS_NORMAL = [
  'the','be','to','of','and','a','in','that','have','it','for','not','on','with',
  'he','as','you','do','at','this','but','his','by','from','they','we','say','her',
  'she','or','an','will','my','one','all','would','there','their','what','so','up',
  'out','if','about','who','get','which','go','me','when','make','can','like','time',
  'no','just','him','know','take','people','into','year','your','good','some','could',
  'them','see','other','than','then','now','look','only','come','its','over','think',
  'also','back','after','use','two','how','our','work','first','well','way','even',
  'new','want','because','any','these','give','day','most','us','great','between',
  'need','large','often','hand','high','place','hold','turn','keep','children','side',
  'feet','car','mile','night','walk','white','sea','began','grow','took','river','four',
  'carry','state','once','book','hear','stop','without','second','later','miss','idea',
];

const WORDS_HARD = [
  'ephemeral','luminescent','perseverance','philosophical','extraordinary','metamorphosis',
  'sophisticated','comprehensive','overwhelming','unprecedented','conscientious','exquisite',
  'melancholy','ambiguous','perpendicular','catastrophic','bureaucratic','simultaneous',
  'enthusiastic','circumstances','consequently','particularly','approximately','significantly',
  'accommodation','revolutionary','infrastructure','technological','manifestation','civilization',
  'accomplishment','administrative','bibliography','characteristic','collaboration',
  'contemplation','deterioration','distinguished','electromagnetic','establishment','fascination',
  'hallucination','implementation','justification','kaleidoscope','miscellaneous',
  'omnipresent','paraphernalia','quantitative','reconnaissance','sophisticated',
  'transformation','unambiguous','vulnerability','wavelength','xylophone','yesterday',
];

const WORDS_CODE = [
  'function','return','const','let','var','if','else','for','while','class',
  'import','export','default','async','await','try','catch','throw','new','this',
  'typeof','instanceof','undefined','null','true','false','break','continue','switch',
  'case','void','delete','yield','static','extends','super','interface','implements',
  'React','useState','useEffect','props','state','render','component','module','require',
  'prototype','callback','promise','resolve','reject','fetch','then','catch','finally',
  'Array','Object','String','Number','Boolean','Map','Set','Symbol','BigInt','WeakMap',
  'forEach','filter','reduce','map','find','some','every','includes','indexOf','splice',
  'console','log','error','warn','document','window','addEventListener','querySelector',
];

// ===== STATE =====
let mode = 15;
let difficulty = 'normal';
let wordList = [];
let currentWordIndex = 0;
let currentCharIndex = 0;
let totalChars = 0;
let correctChars = 0;
let wrongChars = 0;
let totalErrors = 0;
let isRunning = false;
let isFinished = false;
let startTime = null;
let timerInterval = null;
let timeLeft = 15;
let wpmHistory = [];
let wpmSampleInterval = null;

// ===== DOM =====
const wordsContainer = document.getElementById('wordsContainer');
const typeInput      = document.getElementById('typeInput');
const timerDisplay   = document.getElementById('timerDisplay');
const liveWpm        = document.getElementById('liveWpm');
const liveAcc        = document.getElementById('liveAcc');
const liveErrors     = document.getElementById('liveErrors');
const progressBar    = document.getElementById('progressBar');
const progressGlow   = document.getElementById('progressGlow');
const resultScreen   = document.getElementById('resultScreen');
const timerStat      = document.querySelector('.live-stat--timer');

// ===== WORD BANK =====
function getWordBank() {
  if (difficulty === 'hard') return WORDS_HARD;
  if (difficulty === 'code') return WORDS_CODE;
  return WORDS_NORMAL;
}

function generateWords(count = 80) {
  const bank = getWordBank();
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(bank[Math.floor(Math.random() * bank.length)]);
  }
  return result;
}

// ===== RENDER WORDS =====
function renderWords() {
  wordsContainer.innerHTML = '';
  wordList.forEach((word, wi) => {
    const wordEl = document.createElement('span');
    wordEl.className = `word${wi === 0 ? ' current' : ''}`;
    wordEl.id = `word-${wi}`;

    word.split('').forEach((ch, ci) => {
      const charEl = document.createElement('span');
      charEl.className = `char${wi === 0 && ci === 0 ? ' cursor' : ''}`;
      charEl.textContent = ch;
      wordEl.appendChild(charEl);
    });

    wordsContainer.appendChild(wordEl);
  });
}

// ===== UPDATE CURSOR =====
function updateCursor() {
  document.querySelectorAll('.char.cursor').forEach(el => el.classList.remove('cursor'));
  const wordEl = document.getElementById(`word-${currentWordIndex}`);
  if (!wordEl) return;
  const chars = wordEl.querySelectorAll('.char');
  if (currentCharIndex < chars.length) {
    chars[currentCharIndex].classList.add('cursor');
  } else if (chars.length > 0) {
    chars[chars.length - 1].classList.add('cursor');
  }
}

// ===== SCROLL INTO VIEW =====
function scrollWordIntoView() {
  const wordEl = document.getElementById(`word-${currentWordIndex}`);
  if (wordEl) {
    const container = wordsContainer;
    const wordTop = wordEl.offsetTop;
    const containerH = container.clientHeight;
    if (wordTop > containerH * 0.5) {
      container.scrollTop = wordTop - containerH * 0.35;
    }
  }
}

// ===== TIMER =====
function startTimer() {
  timeLeft = mode;
  timerDisplay.textContent = timeLeft;
  timerStat.classList.remove('warning');

  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    const pct = ((mode - timeLeft) / mode) * 100;
    progressBar.style.width = pct + '%';
    progressGlow.style.left = pct + '%';

    if (timeLeft <= 5) timerStat.classList.add('warning');
    if (timeLeft <= 0) endTest();
  }, 1000);

  // WPM sampling
  wpmSampleInterval = setInterval(() => {
    if (startTime) {
      const elapsed = (Date.now() - startTime) / 60000;
      const wpm = elapsed > 0 ? Math.round((correctChars / 5) / elapsed) : 0;
      wpmHistory.push(wpm);
    }
  }, 2000);
}

// ===== PROCESS INPUT =====
typeInput.addEventListener('input', function(e) {
  if (isFinished) return;

  const val = this.value;

  // Start test on first keystroke
  if (!isRunning && val.length > 0) {
    isRunning = true;
    startTime = Date.now();
    startTimer();
  }

  // Space = next word
  if (val.endsWith(' ')) {
    const typed = val.trimEnd();
    const expected = wordList[currentWordIndex];

    // Mark remaining chars as wrong if word incomplete
    const wordEl = document.getElementById(`word-${currentWordIndex}`);
    const chars = wordEl ? wordEl.querySelectorAll('.char:not(.extra)') : [];
    let wordErrors = 0;

    typed.split('').forEach((ch, i) => {
      if (i < chars.length) {
        if (ch === expected[i]) { correctChars++; }
        else { wrongChars++; wordErrors++; }
      }
    });
    // Untyped chars at end = errors
    for (let i = typed.length; i < expected.length; i++) {
      if (chars[i]) chars[i].classList.add('wrong');
      wrongChars++; wordErrors++;
    }

    totalErrors += wordErrors;
    totalChars += expected.length + 1; // +1 for space

    currentWordIndex++;
    currentCharIndex = 0;

    // Mark new current word
    document.querySelectorAll('.word.current').forEach(w => w.classList.remove('current'));
    const nextWord = document.getElementById(`word-${currentWordIndex}`);
    if (nextWord) {
      nextWord.classList.add('current');
      scrollWordIntoView();
    }

    this.value = '';
    updateCursor();
    updateLiveStats();
    return;
  }

  // Character-by-character coloring
  const expected = wordList[currentWordIndex];
  if (!expected) return;

  const wordEl = document.getElementById(`word-${currentWordIndex}`);
  if (!wordEl) return;

  // Remove extra chars
  wordEl.querySelectorAll('.char.extra').forEach(el => el.remove());

  const chars = Array.from(wordEl.querySelectorAll('.char'));
  currentCharIndex = val.length;

  chars.forEach((ch, i) => {
    ch.classList.remove('correct', 'wrong', 'cursor');
    if (i < val.length) {
      ch.classList.add(val[i] === expected[i] ? 'correct' : 'wrong');
    }
  });

  // Extra characters typed beyond word length
  if (val.length > expected.length) {
    const extra = val.slice(expected.length);
    extra.split('').forEach(ch => {
      const span = document.createElement('span');
      span.className = 'char extra wrong';
      span.textContent = ch;
      wordEl.appendChild(span);
    });
  }

  updateCursor();
  updateLiveStats();
});

// ===== BACKSPACE across words =====
typeInput.addEventListener('keydown', function(e) {
  if (isFinished) return;

  if (e.key === 'Tab') {
    e.preventDefault();
    resetTest();
    return;
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    resetTest();
    return;
  }
  if (e.key === 'Enter' && isFinished) {
    newTest();
    return;
  }
});

// ===== LIVE STATS =====
function updateLiveStats() {
  if (!startTime) return;
  const elapsed = (Date.now() - startTime) / 60000;
  const wpm = elapsed > 0 ? Math.round((correctChars / 5) / elapsed) : 0;
  const acc = (totalChars + correctChars) > 0
    ? Math.round((correctChars / (correctChars + wrongChars + 0.01)) * 100)
    : 100;

  liveWpm.textContent = wpm;
  liveAcc.textContent = acc + '%';
  liveErrors.textContent = totalErrors;
}

// ===== END TEST =====
function endTest() {
  clearInterval(timerInterval);
  clearInterval(wpmSampleInterval);
  isFinished = true;
  isRunning = false;
  typeInput.blur();

  const elapsed = mode;
  const rawWpm = Math.round(((correctChars + wrongChars) / 5) / (elapsed / 60));
  const netWpm = Math.round((correctChars / 5) / (elapsed / 60));
  const acc = correctChars + wrongChars > 0
    ? Math.round((correctChars / (correctChars + wrongChars)) * 100)
    : 100;

  // Consistency (lower std-dev = higher consistency)
  let consistency = 100;
  if (wpmHistory.length > 2) {
    const avg = wpmHistory.reduce((a, b) => a + b, 0) / wpmHistory.length;
    const variance = wpmHistory.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / wpmHistory.length;
    const stdDev = Math.sqrt(variance);
    consistency = Math.max(0, Math.round(100 - (stdDev / (avg + 1)) * 100));
  }

  // Grade
  let grade = 'F';
  if (netWpm >= 120 && acc >= 98) grade = 'S+';
  else if (netWpm >= 100 && acc >= 96) grade = 'S';
  else if (netWpm >= 80 && acc >= 94) grade = 'A';
  else if (netWpm >= 60 && acc >= 90) grade = 'B';
  else if (netWpm >= 40 && acc >= 85) grade = 'C';
  else if (netWpm >= 20) grade = 'D';

  document.getElementById('finalWpm').textContent = netWpm;
  document.getElementById('finalAcc').textContent = acc + '%';
  document.getElementById('finalRaw').textContent = rawWpm;
  document.getElementById('finalErrors').textContent = totalErrors;
  document.getElementById('finalChars').textContent = correctChars;
  document.getElementById('finalConsistency').textContent = consistency + '%';
  document.getElementById('resultGrade').textContent = grade;

  drawWpmChart();
  resultScreen.classList.add('visible');
}

// ===== WPM CHART =====
function drawWpmChart() {
  const canvas = document.getElementById('wpmChart');
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 500;
  const H = 80;
  canvas.width = W;
  canvas.height = H;

  const data = wpmHistory.length > 1 ? wpmHistory : [0, 0];
  const max = Math.max(...data, 1);
  const pad = 10;

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(0,255,65,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad + ((H - pad * 2) / 4) * i;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Fill
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - pad - ((v / max) * (H - pad * 2));
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(0,255,65,0.25)');
  grad.addColorStop(1, 'rgba(0,255,65,0.02)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - pad - ((v / max) * (H - pad * 2));
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#00ff41';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00ff41';
  ctx.shadowBlur = 6;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Dots
  data.forEach((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - pad - ((v / max) * (H - pad * 2));
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00ff41';
    ctx.shadowColor = '#00ff41';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

// ===== RESET / NEW =====
function resetTest() {
  clearInterval(timerInterval);
  clearInterval(wpmSampleInterval);
  isRunning = false;
  isFinished = false;
  startTime = null;
  currentWordIndex = 0;
  currentCharIndex = 0;
  correctChars = 0;
  wrongChars = 0;
  totalErrors = 0;
  totalChars = 0;
  wpmHistory = [];
  timeLeft = mode;

  timerDisplay.textContent = '--';
  liveWpm.textContent = '—';
  liveAcc.textContent = '—';
  liveErrors.textContent = '0';
  progressBar.style.width = '0%';
  progressGlow.style.left = '0%';
  timerStat.classList.remove('warning');

  typeInput.value = '';
  resultScreen.classList.remove('visible');
  wordsContainer.scrollTop = 0;

  typeInput.focus();
  updateCursor();
}

function newTest() {
  wordList = generateWords(100);
  renderWords();
  resetTest();
}

// ===== CONTROLS =====
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    mode = +this.dataset.mode;
    newTest();
  });
});

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    difficulty = this.dataset.diff;
    newTest();
  });
});

document.getElementById('restartBtn').addEventListener('click', () => {
  resultScreen.classList.remove('visible');
  wordList = generateWords(100);
  renderWords();
  resetTest();
});

document.getElementById('newTestBtn').addEventListener('click', newTest);

// ===== CUSTOM CURSOR =====
document.addEventListener('mousemove', e => {
  document.body.style.setProperty('--cx', e.clientX + 'px');
  document.body.style.setProperty('--cy', e.clientY + 'px');
});

// ===== GLOBAL KEYS =====
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && isFinished) newTest();
  if (e.target !== typeInput && !isFinished) typeInput.focus();
});

// ===== CLICK TO FOCUS =====
document.querySelector('.terminal-frame').addEventListener('click', () => typeInput.focus());

// ===== INIT =====
newTest();
typeInput.focus();
