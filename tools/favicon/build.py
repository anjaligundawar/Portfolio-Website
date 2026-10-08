"""Build the browser-tab icons from Anjali's front-facing sprite frame.

Crops her head out of assets/sprite-sheet.png (frame 8), closes the
outline under the hair, and writes pixel-exact icons to assets/favicon/:
favicon.svg (crisp at any size), favicon-32.png, favicon.ico (16/32/48)
and apple-touch-icon.png (180, on the site background).

Run from the repo root: python3 tools/favicon/build.py
"""
from PIL import Image

OUT = "assets/favicon/"
OUTLINE = (0x5B, 0x45, 0xA8, 255)  # --outline-sm, the sprite's own outline
BG = (0x28, 0x26, 0x3A, 255)       # --bg-alt

sheet = Image.open("assets/sprite-sheet.png").convert("RGBA")
frame = sheet.crop((0, 46, 34, 92))           # frame 8: front view
head = frame.crop((5, 11, 28, 28))            # 23 x 17

# One more row: outline under every opaque pixel of the last row.
w, h = head.size
head2 = Image.new("RGBA", (w, h + 1))
head2.paste(head, (0, 0))
for x in range(w):
    if head.getpixel((x, h - 1))[3]:
        head2.putpixel((x, h), OUTLINE)
head = head2                                   # 23 x 18

# 24 x 24 base tile, head centred vertically.
tile = Image.new("RGBA", (24, 24))
tile.paste(head, (0, 3), head)

def scaled(n, size, bg=None):
    """Tile upscaled n times (nearest), centred on a size x size canvas."""
    big = tile.resize((24 * n, 24 * n), Image.NEAREST)
    canvas = Image.new("RGBA", (size, size), bg or (0, 0, 0, 0))
    off = (size - 24 * n) // 2
    canvas.paste(big, (off, off), big)
    return canvas

scaled(1, 32).save(OUT + "favicon-32.png")
scaled(7, 180, BG).save(OUT + "apple-touch-icon.png")

ico48 = scaled(2, 48)
ico48.save(OUT + "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)],
           append_images=[scaled(1, 32)])

# SVG: one rect per run of same-coloured pixels in a row.
rects = []
for y in range(24):
    x = 0
    while x < 24:
        p = tile.getpixel((x, y))
        if not p[3]:
            x += 1
            continue
        run = 1
        while x + run < 24 and tile.getpixel((x + run, y)) == p:
            run += 1
        rects.append(f'<rect x="{x}" y="{y}" width="{run}" height="1" fill="#{p[0]:02x}{p[1]:02x}{p[2]:02x}"/>')
        x += run
svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">'
       + "".join(rects) + "</svg>\n")
open(OUT + "favicon.svg", "w").write(svg)
print(len(rects), "rects")
