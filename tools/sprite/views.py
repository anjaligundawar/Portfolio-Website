"""Hand-drawn turn views (unrimmed, same palette letters as build.py).
Feet on the last row, 32 rows tall like the base pose."""
import numpy as np

def sym(halves, w=21):
    # left half incl. centre column, mirrored to the right
    rows = []
    for h in halves:
        assert len(h) == w // 2 + 1, (h, len(h))
        rows.append(h + h[:-1][::-1])
    return rows

def put(rows, y, x, s):
    r = list(rows[y]); r[x:x + len(s)] = s; rows[y] = ''.join(r)

# ---- front: face centred, hair framing both sides ----
FRONT = sym([
    "..o....kkkk",
    "..oo.kkmlll",
    "..ommlLLLLL",
    ".omlLLLLLLL",
    ".mLLLLLlLLL",
    "mlLLLLLLLLL",
    "mlLLLlLLLLL",
    "mlLLLlLLLlL",
    "mllLLSLLLSL",
    "kLlSbbSbbSb",
    "klLSbkkbbbb",
    "kSlSbkkbbbb",
    "kSSlbkMbbbb",
    ".kSlbpbbbbb",
    "..kSkbbbbbb",
    ".kSlkkkkkmm",
    "..kkokLLLlm",
    ".opopkllllL",
    "oppoklLLlll",
    "....klLLllm",
    "....kmlmmmm",
    "...kmmmmmmm",
    "...kmmlmmlm",
    "...kmmmmmmm",
    "...kmlmmmlm",
    "...kllmmmll",
    ".....kpbpk.",
    ".....kpppk.",
    ".....kpppk.",
    ".....koook.",
    "....klllmk.",
    "....kmmmmk.",
])
# tail peeking out on her left (viewer's right) behind the skirt
for y, x, s in [(25, 17, "m"), (26, 17, "mm"), (27, 18, "m"), (28, 18, "mmm"), (29, 19, "m")]:
    put(FRONT, y, x, s)
# little mouth
put(FRONT, 13, 10, "S")

# ---- back: all hair, both horns, tail in the middle ----
BACK = sym([
    "..o....kkkk",
    "..oo.kkmlll",
    "..ommlLLLLL",
    ".omlLLLLLLL",
    ".mLLLLLlLLL",
    "mlLLLLLLLLL",
    "mlLLLlLLLLL",
    "mlLLLlLLLlL",
    "mllLLlLLLlL",
    "kLlLLlLLLlL",
    "klLLLlLLLlL",
    "kSlLLlLLLlL",
    "kSSlLlLLLlL",
    ".kSSlSLLLSL",
    "..kSSkSSSkS",
    ".kSlkkkkkmm",
    "..kkokmmmmm",
    ".opopkmmlmm",
    "oppokmmlmmm",
    "....kmmlmmm",
    "....kmlmmmm",
    "...kmmmmmmm",
    "...kmmlmmlm",
    "...kmmmmmmm",
    "...kmlmmmlm",
    "...kllmmmll",
    ".....kpbpk.",
    ".....kpppk.",
    ".....kpppk.",
    ".....kkkkk.",
    "....kmmmlk.",
    "....kmmmmk.",
])
for y, x, s in [(21, 10, "k"), (22, 10, "k"), (23, 10, "k"), (24, 10, "k"), (25, 10, "k"),
                (26, 10, "m"), (27, 10, "m"), (28, 10, "mm"), (29, 11, "mS"), (28, 12, "S")]:
    put(BACK, y, x, s)

# ---- side: profile facing right ----
SIDE = [
    "........kkkkk.o..",
    "......kkmlllloo..",
    ".....kmlLLLLLLko.",
    "....kmlLLLLLLLLk.",
    "...kmlLLLLLLLLLk.",
    "...mlLLLLLLLLLLlk",
    "..mllLLLLLLLLLLLk",
    "..mlLLLlLLLLLLSSk",
    "..mllLLlLLLSSbbbk",
    "..kLlLLlLLSbbbbbk",
    "..klLLLlLSSbbkkbk",
    "..kSlLLlLSbbbkkbk",
    "..kSSlLlSbbbbkMbk",
    "...kSSSSkpbbbbbk.",
    "....kSSkSkbbbbk..",
    "....kSkkkkkkmmk..",
    ".....kkmLLlmk....",
    ".....kllLLlmk....",
    ".....kllLlopk....",
    ".....kllLlppok...",
    ".....kmlmmookk...",
    "....kmmmmmmmmk...",
    "....kmmlmmlmmk...",
    "...kmmmmmmmmmk...",
    "..mkmlmmmlmmlmk..",
    ".m.kllmmmllmmlk..",
    "m...kkpbpbpk.....",
    "m.....kpppk......",
    ".m....kpppk......",
    "..m...koook......",
    "......kllmmmk....",
    "......kmmmmmk....",
]
