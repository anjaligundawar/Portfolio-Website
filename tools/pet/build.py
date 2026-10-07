"""Dev tool: build the pet's sprite sheet from pet.txt.

pet.txt is sylvy's pet image traced to one letter per pixel. The pet is cut
into a "puppet": body, two arms and two feet. Every frame is the same puppet
with the parts moved or rotated a little, plus squash/stretch on the body,
so all six animations stay on-model.

Run from this folder:
  python3 build.py --sheet ../../assets/pet-sheet.png --gif ../../previews/pet-animations.gif --js
"""
import json, math, sys
import numpy as np
from PIL import Image

# source letters -> palette (STYLE.md tokens)
PAL = {
    'L': '#9A80C2',  # body            --lavender
    'D': '#5B45A8',  # body shadow     --outline-sm
    'H': '#F2A8F0',  # highlights      --pink
    'V': '#4E3F6E',  # dark details    --violet-deep
    'K': '#2B2235',  # outline         --ink
    'B': '#2B2235',  # outline (black in the source) --ink
    'R': '#E05FC6',  # eyes            --magenta
    'W': '#F3F0F8',  # teeth           --text
    'o': '#6E48C8',  # rim so the dark outline reads on dark pages --outline
}

SRC = np.array([list(r) for r in open('pet.txt').read().split()])
SH, SW = SRC.shape                        # 56 x 58
CUT = 44                                  # squash removes (stretch repeats) belly rows just above this

# ---------- 1. cut the puppet into parts ----------
yy, xx = np.mgrid[0:SH, 0:SW]
filled = SRC != '.'
masks = {
    'armL': filled & (xx <= 10) & (yy >= 17) & (yy <= 29),
    'armR': filled & (xx >= 44) & (yy >= 14) & (yy <= 28),
    'footL': filled & (xx <= 24) & (yy >= 47),
    'footR': filled & (((xx >= 34) & (yy >= 45)) | ((xx >= 36) & (xx <= 45) & (yy >= 43) & (yy <= 44))),
}
PIVOT = {'armL': (11, 24), 'armR': (43, 22)}   # shoulders (x, y)

def layer(mask):
    out = np.full(SRC.shape, '.', dtype='<U1')
    out[mask] = SRC[mask]
    return out

parts = {k: layer(m) for k, m in masks.items()}
body = SRC.copy()
for m in masks.values():
    body[m] = '.'
# where a part was cut off, close the body with an outline
cut_edge = np.zeros_like(filled)
for m in masks.values():
    grown = np.zeros_like(m)
    grown[1:] |= m[:-1]; grown[:-1] |= m[1:]; grown[:, 1:] |= m[:, :-1]; grown[:, :-1] |= m[:, 1:]
    cut_edge |= grown
body[(body != '.') & cut_edge & (body != 'W')] = 'K'

EYES = SRC == 'R'

# ---------- 2. pixel-art rotation (scale2x x3, rotate, sample back) ----------
def scale2x(a):
    h, w = a.shape
    p = np.pad(a, 1, mode='edge')
    B, D, F, H, E = p[:-2, 1:-1], p[1:-1, :-2], p[1:-1, 2:], p[2:, 1:-1], a
    out = np.empty((h * 2, w * 2), dtype=a.dtype)
    c = (B != H) & (D != F)
    out[0::2, 0::2] = np.where(c & (D == B), D, E)
    out[0::2, 1::2] = np.where(c & (B == F), F, E)
    out[1::2, 0::2] = np.where(c & (D == H), D, E)
    out[1::2, 1::2] = np.where(c & (H == F), F, E)
    return out

def rotate(a, deg, pivot):
    """Rotate a letter grid around pivot (x, y); returns a grid of the same size, padded."""
    if deg == 0:
        return a
    pad = 14
    a = np.pad(a, pad, constant_values='.')
    big = scale2x(scale2x(scale2x(a)))
    S = 8
    h, w = a.shape
    px, py = (pivot[0] + pad + .5) * S, (pivot[1] + pad + .5) * S
    t = math.radians(deg)
    out = np.full((h, w), '.', dtype='<U1')
    for y in range(h):
        for x in range(w):
            cx, cy = (x + .5) * S - px, (y + .5) * S - py
            # inverse rotation: where does this pixel come from?
            sx = cx * math.cos(t) + cy * math.sin(t) + px
            sy = -cx * math.sin(t) + cy * math.cos(t) + py
            ix, iy = int(sx), int(sy)
            if 0 <= ix < w * S and 0 <= iy < h * S:
                out[y, x] = big[iy, ix]
    out = out[pad:-pad, pad:-pad]
    # drop lonely pixels the rotation leaves behind
    solid = out != '.'
    p = np.pad(solid, 1)
    n = sum(np.roll(np.roll(p, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1))[1:-1, 1:-1] - solid
    out[solid & (n <= 1)] = '.'
    return out

# ---------- 3. compose one frame ----------
FW, FH = 76, 72                       # frame size
OX, OY = (FW - SW) // 2, FH - 1 - SH  # where the source sits; feet on the last row but one

def blit(canvas, src, dx, dy):
    ys, xs = np.where(src != '.')
    for y, x in zip(ys, xs):
        cy, cx = y + dy, x + dx
        if 0 <= cy < FH and 0 <= cx < FW:
            canvas[cy, cx] = src[y, x]

def squash_body(b, n):
    """n > 0: drop the top of the body n rows (squash); n < 0: stretch it up."""
    if n == 0:
        return b
    b = b.copy()
    if n > 0:
        top = b[:CUT - n].copy()
        b[:CUT] = '.'
        b[n:CUT] = top
    else:
        n = -n
        top = b[:CUT].copy()
        b = np.vstack([np.full((n, SW), '.'), b])           # grow upward
        b[:CUT] = top
        b[:CUT - 3] = top[:CUT - 3]
        b[CUT - 3:CUT + n] = top[CUT - 4]                   # repeat a plain belly row
        b[CUT + n - 3:CUT + n] = top[CUT - 3:CUT]
    return b

def close_eyes(b):
    b = b.copy()
    b[EYES] = 'D'
    for x in range(SW):
        rows = np.where(EYES[:, x])[0]
        if len(rows):
            b[rows.max() - 1, x] = 'K'       # a happy closed-eye line along the lower lid
    return b

def add_rim(f):
    out = f.copy()
    solid = f != '.'
    near = np.zeros_like(solid)
    near[1:] |= solid[:-1]; near[:-1] |= solid[1:]; near[:, 1:] |= solid[:, :-1]; near[:, :-1] |= solid[:, 1:]
    out[near & ~solid] = 'o'
    return out

def lean(f, px):
    """Shear the upper body px pixels sideways (run lean). Feet stay put."""
    if px == 0:
        return f
    out = np.full_like(f, '.')
    for y in range(FH):
        s = round(px * max(0, (OY + 44 - y)) / 44)   # 0 at the feet, px at the head
        row = f[y]
        out[y] = np.roll(row, s) if s else row
    return out

def frame(arms=(0, 0), arm_dy=(0, 0), feet=((0, 0), (0, 0)), squash=0, lift=0, eyes=True, tilt=0):
    """arms: raise angle in degrees for (left, right) as seen on screen.
    feet: (dx, dy) for (left, right). squash: rows the body sinks (negative = stretch).
    lift: whole pet up in pixels."""
    f = np.full((FH, FW), '.', dtype='<U1')
    b = body if eyes else close_eyes(body)
    b = squash_body(b, squash)
    extra = b.shape[0] - SH                            # rows added on top by stretching
    oy = OY - lift
    # feet first (behind the body)
    for k, (dx, dy) in zip(('footL', 'footR'), feet):
        blit(f, parts[k], OX + dx, oy + dy)
    blit(f, b, OX, oy - extra)
    shift = squash                                     # arms ride with the upper body
    for k, ang, ady in zip(('armL', 'armR'), arms, arm_dy):
        deg = ang if k == 'armL' else -ang             # raising = tip goes up on both sides
        out = max(0, ang) // 14                        # raised arms also reach out and up a bit
        dx = -out if k == 'armL' else out
        blit(f, rotate(parts[k], deg, PIVOT[k]), OX + dx, oy + shift + ady - out)
    f = lean(f, tilt)
    return add_rim(f)

# ---------- 4. the six animations ----------
# Each entry: list of (frame params, milliseconds). The pet faces the
# viewer's left; the site mirrors it to run right.
ANIMS = {
    'idle': [
        (dict(), 420),
        (dict(squash=1, arm_dy=(1, 1)), 420),
        (dict(), 420),
        (dict(squash=1, arm_dy=(1, 1)), 420),
        (dict(eyes=False), 140),
    ],
    'run': [
        (dict(feet=((-4, -2), (3, 0)), arms=(-12, 22), lift=1, tilt=-3), 90),
        (dict(feet=((-1, 0), (0, 0)), arms=(4, 6), lift=3, tilt=-3), 90),
        (dict(feet=((3, 0), (-4, -2)), arms=(22, -12), lift=1, tilt=-3), 90),
        (dict(feet=((0, 0), (-1, 0)), arms=(6, 4), lift=3, tilt=-3), 90),
    ],
    'jump': [
        (dict(squash=4, arms=(-18, -18), feet=((-1, 0), (1, 0))), 110),   # crouch
        (dict(squash=-3, arms=(40, 40), feet=((0, 1), (0, 1))), 90),     # take-off
        (dict(arms=(55, 55), feet=((1, -3), (-1, -3))), 160),            # tucked, top of the jump
        (dict(squash=-2, arms=(25, 25), feet=((0, 1), (0, 1))), 120),    # coming down
        (dict(squash=4, arms=(-18, -18), feet=((-1, 0), (1, 0))), 110),  # landing
    ],
    'wave': [
        (dict(arms=(60, 15), squash=0), 140),
        (dict(arms=(35, 40), squash=1), 140),
        (dict(arms=(10, 65), squash=0), 140),
        (dict(arms=(35, 40), squash=1), 140),
    ],
    'fall': [
        (dict(arms=(75, 65), squash=-2, feet=((0, 2), (1, 1))), 110),
        (dict(arms=(60, 80), squash=-2, feet=((-1, 1), (0, 2))), 110),
    ],
    'sit': [
        (dict(squash=6, feet=((-5, 0), (5, 0)), arms=(-20, -20), arm_dy=(2, 2)), 520),
        (dict(squash=7, feet=((-5, 0), (5, 0)), arms=(-20, -20), arm_dy=(3, 3)), 520),
        (dict(squash=6, feet=((-5, 0), (5, 0)), arms=(-20, -20), arm_dy=(2, 2)), 520),
        (dict(squash=7, feet=((-5, 0), (5, 0)), arms=(-20, -20), arm_dy=(3, 3)), 520),
        (dict(squash=6, feet=((-5, 0), (5, 0)), arms=(-20, -20), arm_dy=(2, 2), eyes=False), 160),
    ],
}

def rgba(c):
    return tuple(int(PAL[c][i:i + 2], 16) for i in (1, 3, 5)) + (255,)

def to_img(f):
    im = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    for y, x in zip(*np.where(f != '.')):
        im.putpixel((int(x), int(y)), rgba(f[y, x]))
    return im

rendered = {name: [(to_img(frame(**p)), ms) for p, ms in seq] for name, seq in ANIMS.items()}
names = list(ANIMS)
cols = max(len(v) for v in rendered.values())

if '--sheet' in sys.argv:
    sheet = Image.new('RGBA', (cols * FW, len(names) * FH), (0, 0, 0, 0))
    for r, n in enumerate(names):
        for c, (im, _) in enumerate(rendered[n]):
            sheet.paste(im, (c * FW, r * FH))
    sheet.save(sys.argv[sys.argv.index('--sheet') + 1])

if '--big' in sys.argv:          # the sheet blown up on a dark page, for showing off
    S = 4
    big = Image.new('RGBA', (cols * FW * S, len(names) * FH * S), (27, 26, 30, 255))
    for r, n in enumerate(names):
        for c, (im, _) in enumerate(rendered[n]):
            big.alpha_composite(im.resize((FW * S, FH * S), Image.NEAREST), (c * FW * S, r * FH * S))
    big.save(sys.argv[sys.argv.index('--big') + 1])

if '--gif' in sys.argv:          # all six playing side by side
    S = 3
    loop = 2400
    step = 20
    out = []
    for t in range(0, loop, step):
        im = Image.new('RGBA', (len(names) * FW * S, FH * S), (40, 38, 58, 255))
        for i, n in enumerate(names):
            seq = rendered[n]
            total = sum(ms for _, ms in seq)
            tt = t % total
            for fr, ms in seq:
                if tt < ms:
                    break
                tt -= ms
            im.alpha_composite(fr.resize((FW * S, FH * S), Image.NEAREST), (i * FW * S, 0))
        out.append(im.convert('RGB'))
    out[0].save(sys.argv[sys.argv.index('--gif') + 1], save_all=True, append_images=out[1:],
                duration=step, loop=0)

if '--js' in sys.argv:
    print(json.dumps({'w': FW, 'h': FH, 'anims': {n: [ms for _, ms in rendered[n]] for n in names}}))
