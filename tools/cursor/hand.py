"""Draw the pointing-hand cursor to match sylvy's arrow (see build.py).

    python3 hand.py

The hand is drawn as a mask on a small grid below ('#' = hand). Each grid
cell becomes 2x2 pixels in assets/cursor-hand.png and 4x4 in the @2x file.
Like the arrow: lavender face, violet strip down the left and bottom inner
edges and violet creases between the folded fingers, a black outline, and a black 3D slab pushed out down-left.
"""
from pathlib import Path

from PIL import Image

HAND = """
...##......
...##......
...##......
...##......
...####....
...######..
##.########
###########
###########
.##########
..#########
...########
...#######.
"""
# violet creases between the folded fingers
CREASES = {(5, 5), (5, 6), (7, 6), (7, 7), (9, 7), (9, 8)}

FACE = (213, 199, 235, 255)
SHADE = (153, 131, 206, 255)
INK = (17, 17, 17, 255)

rows = [r for r in HAND.strip().splitlines()]
mask = {(x, y) for y, r in enumerate(rows) for x, ch in enumerate(r) if ch == "#"}

PAD_L, PAD_T = 2, 1  # room for the outline (1) + the slab (1) on the left
cells = {(x + PAD_L, y + PAD_T) for x, y in mask}
creases = {(x + PAD_L, y + PAD_T) for x, y in CREASES}
near = lambda c: {(c[0] + dx, c[1] + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1)}
outline = set().union(*(near(c) for c in cells)) - cells
slab = {(x - 1, y + 1) for x, y in cells | outline}

W = len(rows[0]) + PAD_L + 1
H = len(rows) + PAD_T + 2

def draw(scale):
    im = Image.new("RGBA", (W * scale, H * scale))
    def put(cell, colour):
        x, y = cell
        for i in range(scale):
            for j in range(scale):
                im.putpixel((x * scale + i, y * scale + j), colour)
    for c in slab | outline:
        put(c, INK)
    for c in cells:
        x, y = c
        edge = (x - 1, y) not in cells or (x, y + 1) not in cells
        put(c, SHADE if edge or c in creases else FACE)
    return im

assets = Path(__file__).resolve().parents[2] / "assets"
draw(2).save(assets / "cursor-hand.png", optimize=True)
draw(4).save(assets / "cursor-hand@2x.png", optimize=True)
# hotspot: the middle of the fingertip, in 1x pixels
tip_x = (PAD_L + 3 + 1) * 2
print("size", W * 2, H * 2, "hotspot", tip_x, PAD_T * 2)
