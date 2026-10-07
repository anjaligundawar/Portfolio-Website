"""Dev tool: turn sylvy's character into palette pixels, then build the
animation frames (idle bob, jump, turn-around) + a sprite sheet PNG."""
import json, sys
import numpy as np
from PIL import Image

PAL = {
    'k': '#2B2235', 'd': '#4E3F6E', 'o': '#5B45A8', 'm': '#6F5A92', 'l': '#9A80C2',
    'L': '#B9A6F2', 'S': '#D58AE6', 'M': '#E05FC6', 'p': '#F2A8F0', 'b': '#F9CDEB', 't': '#F3F0F8',
}
MAP = {0: 'L', 1: 'k', 5: 'k', 2: 'm', 3: 'o', 4: 'l', 9: 'm', 6: 'l', 14: 'l', 7: 'S',
       8: 'b', 10: 'p', 13: 'p', 15: 'M', 11: 'l', 12: 'l'}

L = np.load('L.npy')
H0, W0 = L.shape
base = [['.'] * W0 for _ in range(H0)]
for y in range(H0):
    for x in range(W0):
        v = int(L[y, x])
        if v < 0: continue
        if v in (11, 12) and y >= 31: continue      # drop the old ground shadow
        base[y][x] = MAP[v]
base = np.array(base)
ys, xs = np.where(base != '.')
base = base[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
# 1px violet rim around the silhouette, so the dark outline still reads
# on the dark console screen
def add_rim(spr):
    spr = np.pad(spr, 1, constant_values='.')
    out = spr.copy()
    for y in range(spr.shape[0]):
        for x in range(spr.shape[1]):
            if spr[y, x] == '.':
                near = [spr[yy, xx] for yy, xx in ((y-1, x), (y+1, x), (y, x-1), (y, x+1))
                        if 0 <= yy < spr.shape[0] and 0 <= xx < spr.shape[1]]
                if any(c != '.' for c in near):
                    out[y, x] = 'o'
    return out

base = add_rim(base)
ch, cw = base.shape
print('character', cw, 'x', ch, file=sys.stderr)

JUMP = 9                      # highest lift in pixels
W, H = 34, ch + JUMP + 3      # frame size (room for the jump + shadow)
GROUND = H - 2                # row the feet stand on

def blank():
    return np.full((H, W), '.', dtype='<U1')

def shadow(f, lift):
    # dithered oval on the ground; smaller and sparser while airborne
    half = max(3, 9 - lift // 2)
    for x in range(W // 2 - half, W // 2 + half):
        for dy in (0, 1):
            edge = abs(x - W // 2 + 0.5) / half
            if (x + dy) % 2 == 0 or (lift < 3 and edge < 0.6):
                if edge < 1 - dy * 0.3:
                    f[GROUND + dy - 0, x] = 'd' if f[GROUND + dy, x] == '.' else f[GROUND + dy, x]

def place(f, spr, lift=0):
    sh, sw = spr.shape
    x0 = (W - sw) // 2
    y0 = GROUND - sh - lift + 1
    for y in range(sh):
        for x in range(sw):
            if spr[y, x] != '.' and 0 <= y0 + y < H:
                f[y0 + y, x0 + x] = spr[y, x]

def squash(spr, rows):
    # crouch: drop `rows` rows from the legs/skirt area, widen nothing
    sh = spr.shape[0]
    cut = list(range(sh - 9, sh - 9 + rows))
    return np.delete(spr, cut, axis=0)

def stretch(spr, rows):
    # take-off: repeat a couple of torso rows so she looks longer
    sh = spr.shape[0]
    at = sh - 12
    return np.insert(spr, [at] * rows, spr[at], axis=0)

def frame(spr, lift=0):
    f = blank()
    shadow(f, lift)
    place(f, spr, lift)
    return f

def bob(spr):
    # idle "breathing": the body sinks one pixel, head included
    return np.insert(np.delete(spr, spr.shape[0] - 6, axis=0), 0, '.', axis=0)

def sequence(spr):
    """One facing direction: idle, jump, idle. Returns list of (frame, ms)."""
    s = []
    for _ in range(3):
        s += [(frame(spr), 260), (frame(bob(spr)), 260)]
    s += [(frame(squash(spr, 2)), 110),          # anticipation
          (frame(stretch(spr, 1), 3), 70),       # take-off
          (frame(spr, 7), 80),
          (frame(spr, JUMP), 160),               # hang at the top
          (frame(spr, 6), 80),
          (frame(stretch(spr, 1), 2), 70),
          (frame(squash(spr, 2)), 120),          # landing squash
          (frame(spr), 220)]
    return s

# hand-drawn views for turning (see views.py)
from views import FRONT, SIDE, BACK
grid = lambda rows: np.array([list(r) for r in rows])
front, side, back = (add_rim(grid(v)) for v in (FRONT, SIDE, BACK))

right = base            # three-quarter view, face towards the viewer's left
left = base[:, ::-1]

# One full spin over the loop, always rotating the same way:
# 3/4 -> front -> mirrored 3/4 ... jump ... -> side -> back -> other side -> 3/4
turn_a = [(frame(front), 300)]
turn_b = [(frame(side), 110), (frame(back), 200), (frame(side[:, ::-1]), 110)]
anim = sequence(right) + turn_a + sequence(left) + turn_b

rows = lambda f: [''.join(r) for r in f]
frames = [rows(f) for f, _ in anim]
durations = [d for _, d in anim]

# de-duplicate frames for the sprite sheet / JS (sequence refers by index)
uniq, order = [], []
for fr in frames:
    if fr not in uniq: uniq.append(fr)
    order.append(uniq.index(fr))

def to_img(fr, scale=1):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for y, r in enumerate(fr):
        for x, c in enumerate(r):
            if c != '.':
                im.putpixel((x, y), tuple(int(PAL[c][i:i + 2], 16) for i in (1, 3, 5)) + (255,))
    return im.resize((W * scale, H * scale), Image.NEAREST)

if '--sheet' in sys.argv:
    cols = 8
    rws = (len(uniq) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * W, rws * H), (0, 0, 0, 0))
    for i, fr in enumerate(uniq):
        sheet.paste(to_img(fr), ((i % cols) * W, (i // cols) * H))
    sheet.save(sys.argv[sys.argv.index('--sheet') + 1])
if '--gif' in sys.argv:
    bg = (40, 38, 58, 255)
    ims = []
    for o in order:
        im = Image.new('RGBA', (W * 8, H * 8), bg)
        im.alpha_composite(to_img(uniq[o], 8))
        ims.append(im.convert('RGB'))
    ims[0].save(sys.argv[sys.argv.index('--gif') + 1], save_all=True, append_images=ims[1:], duration=durations, loop=0)
if '--still' in sys.argv:
    picks = [0, 1, order[7], order[9], order[12], order[16], order[18], order[20]]
    strip = Image.new('RGBA', (len(picks) * (W * 6 + 10), H * 6), (40, 38, 58, 255))
    for i, o in enumerate(picks):
        strip.alpha_composite(to_img(uniq[o], 6), (i * (W * 6 + 10), 0))
    strip.convert('RGB').save(sys.argv[sys.argv.index('--still') + 1])
if '--js' in sys.argv:
    print(json.dumps({'w': W, 'h': H, 'frames': uniq, 'sequence': [[o, d] for o, d in zip(order, durations)]}))
