from chess.pgn import read_game
import json, chess

pgn = open("ep_games.pgn")
data = {}

while True:
    game = read_game(pgn)
    if game is None: break
    board = game.board()
    for move in game.mainline_moves():
        fen = board.fen()
        uci = move.uci()
        if fen not in data: data[fen] = []
        data[fen].append(uci)
        board.push(move)

with open("ep_opening.json", "w") as f:
    json.dump(data, f)
