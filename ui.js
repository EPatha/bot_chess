// ui.js: Simple UI glue to run a tiny bot and render board as Unicode pieces
// Uses the global `Chess` provided by the UMD build (chess.min.js). Do not import ESM here.
const boardEl = document.getElementById('board');
const fenEl = document.getElementById('fen');
const logEl = document.getElementById('log');
const btnNext = document.getElementById('btn-next');
const btnReset = document.getElementById('btn-reset');
const autoChk = document.getElementById('auto');
const ranksEl = document.getElementById('ranks');
const filesEl = document.getElementById('files');

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
  // render ranks (8..1) and files (a..h)
  if (ranksEl) {
    ranksEl.innerHTML = '';
    for (let r = 8; r >= 1; r--) {
      const d = document.createElement('div');
      d.className = 'rank';
      d.textContent = r;
      ranksEl.appendChild(d);
    }
  }
  if (filesEl) {
    filesEl.innerHTML = '';
    const files = ['a','b','c','d','e','f','g','h'];
    for (const f of files) {
      const s = document.createElement('div');
      s.style.width = '48px';
      s.style.textAlign = 'center';
      s.textContent = f;
      filesEl.appendChild(s);
    }
  }
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
  if (pieceChar) {
    // create piece element so we can style white/black pieces differently
    const sp = document.createElement('span');
    const isWhite = (pieceChar === pieceChar.toUpperCase());
    sp.className = 'piece ' + (isWhite ? 'white' : 'black');
    sp.textContent = pieceMap[pieceChar] || '?';
    sq.appendChild(sp);
  }
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
  // call local Stockfish bridge (runs native engine) — expects stockfish_server.py on port 5000
  const endpoint = 'http://127.0.0.1:5000/bestmove?fen=' + encodeURIComponent(game.fen()) + '&depth=12';
  fetch(endpoint)
    .then(r => r.json())
    .then(data => {
      if (data && data.bestmove) {
        const mv = data.bestmove;
        game.move({ from: mv.slice(0,2), to: mv.slice(2,4), promotion: 'q' });
        renderBoard();
        log('Stockfish: ' + mv);
      } else {
        // fallback random
        const moves = game.moves();
        if (moves.length > 0) {
          const mv = moves[Math.floor(Math.random() * moves.length)];
          game.move(mv);
          renderBoard();
        }
      }
    })
    .catch(err => {
      console.warn('Engine request failed:', err);
      const moves = game.moves();
      if (moves.length > 0) {
        const mv = moves[Math.floor(Math.random() * moves.length)];
        game.move(mv);
        renderBoard();
      }
    });
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
