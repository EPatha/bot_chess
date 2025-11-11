import { Chess } from 'https://cdn.jsdelivr.net/npm/chess.js@1.0.0/esm/chess.mjs';

// Simple UI glue to run a tiny bot and render board as Unicode pieces
const boardEl = document.getElementById('board');
const fenEl = document.getElementById('fen');
const logEl = document.getElementById('log');
const btnNext = document.getElementById('btn-next');
const btnReset = document.getElementById('btn-reset');
const autoChk = document.getElementById('auto');

const EPstyle = { aggression: 0.7 }; // gaya contoh: >0.6 prefer capture

const pieceMap = {
  p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚',
  P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔'
};

let game = new Chess();
let autoInterval = null;

function renderBoard() {
  // clear
  boardEl.innerHTML = '';
  const fen = game.fen().split(' ')[0];
  fenEl.textContent = game.fen();
  const rows = fen.split('/'); // 8 ranks
  for (let r = 0; r < 8; r++) {
    const rank = rows[r];
    let file = 0;
    for (const ch of rank) {
      if (/[1-8]/.test(ch)) {
        const emptyCount = parseInt(ch, 10);
        for (let i = 0; i < emptyCount; i++) {
          appendSquare(r, file, null);
          file++;
        }
      } else {
        appendSquare(r, file, ch);
        file++;
      }
    }
  }
}

function appendSquare(rankIndex, fileIndex, pieceChar) {
  const sq = document.createElement('div');
  sq.className = 'square ' + (((rankIndex + fileIndex) % 2 === 0) ? 'light' : 'dark');
  if (pieceChar) sq.textContent = pieceMap[pieceChar] || '?';
  boardEl.appendChild(sq);
}

function log(msg) {
  logEl.textContent = (new Date()).toLocaleTimeString() + ' — ' + msg + '\n' + logEl.textContent;
}

function makeBestMove() {
  const moves = game.moves();
  if (moves.length === 0) {
    log('Game over: ' + (game.in_checkmate() ? 'checkmate' : (game.in_draw() ? 'draw' : 'no moves')));
    return false;
  }
  // prefer captures if aggression > 0.6
  const captures = moves.filter(m => m.includes('x'));
  let bestMove;
  if (EPstyle.aggression > 0.6 && captures.length > 0) {
    bestMove = captures[Math.floor(Math.random() * captures.length)];
  } else {
    bestMove = moves[Math.floor(Math.random() * moves.length)];
  }
  game.move(bestMove);
  renderBoard();
  log('Played: ' + bestMove + '  |  SAN list length: ' + moves.length);
  return true;
}

btnNext.addEventListener('click', () => {
  makeBestMove();
});

btnReset.addEventListener('click', () => {
  game = new Chess();
  renderBoard();
  log('Reset game');
});

autoChk.addEventListener('change', (e) => {
  if (e.target.checked) {
    autoInterval = setInterval(() => {
      const ok = makeBestMove();
      if (!ok) { clearInterval(autoInterval); autoChk.checked = false; }
    }, 1000);
  } else {
    clearInterval(autoInterval);
    autoInterval = null;
  }
});

// initial render
renderBoard();
log('Ready — klik "Next Move (bot)" untuk memulai');
