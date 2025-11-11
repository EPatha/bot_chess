#!/usr/bin/env python3
"""
Simple local Stockfish HTTP bridge.
Runs the native Stockfish binary (path configurable) and exposes a single endpoint:
  GET /bestmove?fen=<fen>&depth=10
Returns JSON: {"bestmove":"e2e4","raw":"bestmove e2e4 ponder ..."}

Usage:
  pip install -r requirements.txt
  python stockfish_server.py --engine ./stockfish/stockfish-macos-m1-apple-silicon

Note: this is a minimal implementation for local development only.
"""

from flask import Flask, request, jsonify
import subprocess
import threading
import argparse
import time
import sys

app = Flask(__name__)
lock = threading.Lock()
engine_proc = None


def start_engine(path):
    global engine_proc
    engine_proc = subprocess.Popen([
        path
    ], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)

    # Initialize UCI
    engine_proc.stdin.write('uci\n')
    engine_proc.stdin.flush()
    # read lines until uciok
    while True:
        line = engine_proc.stdout.readline()
        if not line:
            raise RuntimeError('Engine exited unexpectedly during uci init')
        line = line.strip()
        # print('ENGINE:', line)
        if line == 'uciok':
            break
    # isready
    engine_proc.stdin.write('isready\n')
    engine_proc.stdin.flush()
    while True:
        line = engine_proc.stdout.readline()
        if not line:
            raise RuntimeError('Engine exited unexpectedly during isready')
        line = line.strip()
        if line == 'readyok':
            break


@app.route('/bestmove')
def bestmove():
    fen = request.args.get('fen')
    depth = request.args.get('depth', '10')
    if not fen:
        return jsonify({'error': 'missing fen parameter'}), 400

    with lock:
        # send position and go commands
        engine_proc.stdin.write(f'position fen {fen}\n')
        engine_proc.stdin.write(f'go depth {depth}\n')
        engine_proc.stdin.flush()

        # read lines until bestmove
        best = None
        raw_lines = []
        while True:
            line = engine_proc.stdout.readline()
            if not line:
                return jsonify({'error': 'engine terminated unexpectedly'}), 500
            line = line.strip()
            raw_lines.append(line)
            if line.startswith('bestmove'):
                best = line.split(' ')[1]
                break

    resp = jsonify({'bestmove': best, 'raw': '\n'.join(raw_lines)})
    # allow cross-origin for local dev
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp



if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--engine', default='./stockfish/stockfish-macos-m1-apple-silicon', help='path to stockfish binary')
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', default=5000, type=int)
    args = parser.parse_args()

    try:
        start_engine(args.engine)
    except Exception as e:
        print('Failed to start engine:', e, file=sys.stderr)
        sys.exit(1)

    print('Stockfish bridge running — engine path:', args.engine)
    print(f'Listening http://{args.host}:{args.port}')
    # run flask
    app.run(host=args.host, port=args.port)
