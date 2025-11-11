import { Chess } from 'chess.js'

const game = new Chess()
game.load_pgn(pgn_data)

const moves = game.history()
console.log(moves)
