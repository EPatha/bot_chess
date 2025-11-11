function makeBestMove() {
  const moves = game.moves()
  let bestMove

  // gaya kamu: pilih capture dulu, baru random
  const captures = moves.filter(m => m.includes('x'))
  if (EPstyle.aggression > 0.6 && captures.length > 0) {
    bestMove = captures[Math.floor(Math.random() * captures.length)]
  } else {
    bestMove = moves[Math.floor(Math.random() * moves.length)]
  }

  game.move(bestMove)
  board.position(game.fen())
}
