"""Draws the pixel icons for the Projects window and writes js/project-icons.js.

Each icon is drawn on a 20x20 grid with simple shapes, then gets a 1px ink
outline around its silhouette (the "sticker" look from STYLE.md). Glow and
sparkle pixels are added after the outline so they float free.

Run from this folder:  python3 build.py   (add --preview for a PNG sheet)
"""
import json, math, sys
from pathlib import Path

N = 20
PAL = {  # letters used in the grids -> palette tokens (STYLE.md)
    "k": "#2B2235", "d": "#4E3F6E", "o": "#6E48C8", "v": "#9A80C2", "l": "#B9A6F2",
    "s": "#D58AE6", "m": "#E05FC6", "p": "#F2A8F0", "b": "#F9CDEB", "w": "#F3F0F8",
}


class Icon:
    def __init__(self):
        self.g = [["." for _ in range(N)] for _ in range(N)]

    def px(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < N and 0 <= y < N:
            self.g[y][x] = c

    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.px(x, y, c)

    def disc(self, cx, cy, r, c):
        for y in range(N):
            for x in range(N):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                    self.px(x, y, c)

    def line(self, x0, y0, x1, y1, c, w=1):
        steps = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 1
        for i in range(steps + 1):
            t = i / steps
            x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            for dx in range(w):
                for dy in range(w):
                    self.px(x + dx - (w - 1) / 2, y + dy - (w - 1) / 2, c)

    def poly(self, pts, c):
        for y in range(N):
            for x in range(N):
                if inside(x + 0.5, y + 0.5, pts):
                    self.px(x, y, c)

    def outline(self, c="k"):
        g = self.g
        add = []
        for y in range(N):
            for x in range(N):
                if g[y][x] != ".":
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < N and 0 <= ny < N and g[ny][nx] not in ".":
                        add.append((x, y))
                        break
        for x, y in add:
            g[y][x] = c

    def rows(self):
        return ["".join(r) for r in self.g]


def inside(x, y, pts):
    hit = False
    for i in range(len(pts)):
        (x0, y0), (x1, y1) = pts[i], pts[i - 1]
        if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0) + x0:
            hit = not hit
    return hit


def arc(ic, cx, cy, r, a0, a1, c):
    for i in range(60):
        a = math.radians(a0 + (a1 - a0) * i / 59)
        ic.px(cx + r * math.cos(a), cy + r * math.sin(a), c)


def sparkle(ic, x, y, c="w"):
    ic.px(x, y, c)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ic.px(x + dx, y + dy, c)


# 1. DishaVaani: compass, needle pointing north, sound waves coming out of it
def disha():
    ic = Icon()
    ic.disc(7.5, 10, 6.4, "b")
    ic.disc(7.5, 10, 5.0, "w")
    for a in range(0, 360, 90):  # tick marks
        ic.px(7.5 + 5.6 * math.cos(math.radians(a)), 10 + 5.6 * math.sin(math.radians(a)), "l")
    ic.poly([(7.5, 4.6), (9.4, 10), (5.6, 10)], "m")    # north half
    ic.poly([(7.5, 15.4), (9.4, 10), (5.6, 10)], "o")   # south half
    ic.rect(7, 9, 8, 10, "k")
    ic.outline()
    arc(ic, 7.5, 10, 9.0, -38, 38, "m")
    arc(ic, 7.5, 10, 11.0, -30, 30, "p")
    return ic


# 2. Breadcrumbs: microphone with a dotted trail of breadcrumb nodes
def breadcrumbs():
    ic = Icon()
    ic.rect(6, 1, 11, 10, "l")
    ic.px(6, 1, "."); ic.px(11, 1, "."); ic.px(6, 10, "."); ic.px(11, 10, ".")
    for y in (3, 5, 7):
        ic.rect(7, y, 10, y, "o")
    ic.rect(7, 2, 7, 2, "w")
    ic.outline()
    arc(ic, 8.5, 7.5, 5.0, 10, 170, "m")     # holder
    ic.rect(8, 13, 9, 14, "m")               # stem
    ic.rect(5, 15, 12, 15, "m")              # base
    ic.outline()
    for x, y, c in ((14, 15, "p"), (16, 12, "s"), (17, 9, "m"), (18, 6, "p")):
        ic.rect(x, y, x + 1, y + 1, c)       # crumbs
    ic.px(1, 3, "p"); sparkle(ic, 2, 17, "w")
    return ic


# 3. Clueminati: magnifying glass with a keyhole in the lens
def clueminati():
    ic = Icon()
    ic.line(12.5, 12.5, 17.5, 17.5, "m", 3)  # handle
    ic.disc(8, 8, 6.4, "o")                  # rim
    ic.disc(8, 8, 4.8, "l")                  # glass
    ic.px(5, 5, "w"); ic.px(6, 4, "w"); ic.px(4, 6, "w")
    ic.disc(8, 6.5, 1.7, "k")                # keyhole
    ic.poly([(7.5, 7.5), (8.5, 7.5), (9.6, 11.6), (6.4, 11.6)], "k")
    ic.outline()
    return ic


# 4. Frog Maze Run: frog face sitting inside a little maze
def frog():
    ic = Icon()
    walls = [
        "####################",
        "#..................#",
        "#.######..#######..#",
        "#.#...............##",
        "#.#..............#.#",
        "#................#.#",
        "#................#.#",
        "#................#.#",
        "#................#.#",
        "#.#..............#.#",
        "#.#..............#.#",
        "#.#..............#.#",
        "#.#..............#.#",
        "#.#..............#.#",
        "#.#...............##",
        "#.#..............#.#",
        "#.######..########.#",
        "#..................#",
        "#.....###########..#",
        "####################",
    ]
    for y, row in enumerate(walls):
        for x, ch in enumerate(row):
            if ch == "#":
                ic.px(x, y, "o")
    for x in range(1, 19):  # maze floor paths
        for y in (1, 17):
            ic.px(x, y, "d")
    # frog
    ic.disc(10, 11, 4.6, "p")
    ic.disc(7, 7, 1.9, "p"); ic.disc(13, 7, 1.9, "p")
    ic.px(7, 7, "k"); ic.px(13, 7, "k"); ic.px(6, 6, "w"); ic.px(12, 6, "w")
    ic.rect(8, 12, 12, 12, "k"); ic.px(7, 11, "k"); ic.px(13, 11, "k")
    ic.px(6, 12, "m"); ic.px(14, 12, "m")    # cheeks
    ic.rect(6, 15, 7, 15, "s"); ic.rect(13, 15, 14, 15, "s")
    return ic


# 5. The Last Light: glowing lantern with light rays
def lantern():
    ic = Icon()
    ic.rect(9, 2, 10, 2, "v")               # ring
    ic.rect(6, 4, 13, 5, "m")               # cap
    ic.rect(7, 3, 12, 3, "m")
    ic.rect(6, 6, 13, 14, "b")              # glass
    ic.rect(7, 7, 12, 13, "w")
    ic.disc(9.5, 10.5, 2.4, "p")            # flame
    ic.rect(9, 9, 10, 12, "m")
    ic.px(9, 8, "m")
    ic.rect(6, 15, 13, 16, "m")             # base
    ic.outline()
    ic.px(9, 1, "k"); ic.px(10, 1, "k"); ic.px(8, 2, "k"); ic.px(11, 2, "k")
    for x, y in ((2, 10), (1, 10), (17, 10), (18, 10), (3, 5), (16, 5), (3, 15), (16, 15)):
        ic.px(x, y, "p")
    sparkle(ic, 2, 2, "l")
    sparkle(ic, 17, 18, "w")
    return ic


# 6. Sponsor Outreach Mail Sender: paper plane with a dotted trail and a sparkle
def plane():
    ic = Icon()
    ic.poly([(19, 2), (3, 9), (8, 11)], "w")          # top wing
    ic.poly([(19, 2), (8, 11), (12, 17)], "l")        # side wing
    ic.poly([(19, 2), (8, 11), (9, 15)], "v")         # fold
    ic.outline()
    for x, y, c in ((5, 14, "m"), (3, 16, "p"), (1, 18, "s")):
        ic.rect(x, y, x, y, c)
        ic.px(x + 1, y, c)
    sparkle(ic, 14, 15, "p")
    sparkle(ic, 3, 3, "w")
    return ic


ICONS = {"dishavaani": disha, "breadcrumbs": breadcrumbs, "clueminati": clueminati,
         "frog-maze": frog, "last-light": lantern, "sponsor-mail": plane}


def main():
    root = Path(__file__).resolve().parents[2]
    out = {k: f().rows() for k, f in ICONS.items()}
    js = ["// Generated by tools/icons/build.py. Each icon is a 20x20 grid; letters are",
          "// palette colors (see PALETTE), '.' is transparent.",
          f"export const PALETTE = {json.dumps(PAL)};",
          "export const ICONS = {"]
    for k, rows in out.items():
        js.append(f'  "{k}": [')
        js += [f'    "{r}",' for r in rows]
        js.append("  ],")
    js.append("};")
    (root / "js" / "project-icons.js").write_text("\n".join(js) + "\n")
    if "--preview" in sys.argv:
        from PIL import Image, ImageColor
        S = 12
        img = Image.new("RGB", (len(out) * (N + 2) * S, (N + 2) * S), "#28263A")
        for i, rows in enumerate(out.values()):
            for y, r in enumerate(rows):
                for x, ch in enumerate(r):
                    if ch != ".":
                        for dy in range(S):
                            for dx in range(S):
                                img.putpixel(((i * (N + 2) + 1 + x) * S + dx, (1 + y) * S + dy), ImageColor.getrgb(PAL[ch]))
        img.save(sys.argv[sys.argv.index("--preview") + 1])


main()
