// Project logos for professional mode: a rounded square with a gradient in
// the site's cool colors (violet, pink, blue, teal) and one simple white mark.
// Each is a 64x64 SVG; the gradient ids carry the project id so several logos
// can sit on one page.

const W = "#fff";

function tile(id, from, to, mark) {
  return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="lg-${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
      </linearGradient>
      <radialGradient id="lh-${id}" cx=".25" cy=".15" r=".9">
        <stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#lg-${id})"/>
    <rect width="64" height="64" rx="16" fill="url(#lh-${id})"/>
    ${mark}
  </svg>`;
}

export const LOGOS = {
  // a direction arrow with sound waves: "direction" + "voice"
  dishavaani: tile("dishavaani", "#7C5CFF", "#38BDF8", `
    <path d="M17 45 27 17l10 28-10-6z" fill="${W}"/>
    <g fill="none" stroke="${W}" stroke-width="3.5" stroke-linecap="round">
      <path d="M41 26a8 8 0 0 1 0 12" opacity=".9"/>
      <path d="M46.5 21a15 15 0 0 1 0 22" opacity=".6"/>
    </g>`),

  // a trail of crumbs that ends in a voice note
  breadcrumbs: tile("breadcrumbs", "#E05FC6", "#7C5CFF", `
    <g fill="${W}">
      <circle cx="15" cy="47" r="2.6" opacity=".55"/>
      <circle cx="23" cy="40" r="3.2" opacity=".75"/>
      <circle cx="31" cy="34" r="3.8" opacity=".9"/>
    </g>
    <g fill="none" stroke="${W}" stroke-width="3.5" stroke-linecap="round">
      <path d="M40 24v8M46 18v20M52 25v6"/>
    </g>`),

  // a magnifying glass with a keyhole: solve the mystery
  clueminati: tile("clueminati", "#4F46E5", "#C084FC", `
    <circle cx="28" cy="28" r="12" fill="none" stroke="${W}" stroke-width="4"/>
    <path d="M37 37l10 10" stroke="${W}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="28" cy="26" r="3" fill="${W}"/>
    <path d="M26.6 27.5h2.8l1 6h-4.8z" fill="${W}"/>`),

  // a square maze with a dot at its heart
  "frog-maze": tile("frog-maze", "#14B8A6", "#3B82F6", `
    <g fill="none" stroke="${W}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M26 15H15v34h34V15H34"/>
      <path d="M41 30v11H23V23h10"/>
    </g>
    <circle cx="32" cy="32" r="3.5" fill="${W}"/>`),

  // a flame with a pink core: the last light
  "last-light": tile("last-light", "#312E81", "#8B5CF6", `
    <circle cx="32" cy="36" r="18" fill="#F2A8F0" opacity=".18"/>
    <path d="M32 13c3 7 12 12 12 23a12 12 0 0 1-24 0c0-6 3-9 5-11 0 4 2 6 4 6-1-7 1-13 3-18z" fill="${W}"/>
    <path d="M32 33c2 3 5 5 5 8.5a5 5 0 0 1-10 0c0-3.5 3-5 5-8.5z" fill="#E05FC6"/>`),

  // a paper plane: the pitch email going out
  "sponsor-mail": tile("sponsor-mail", "#3B82F6", "#E05FC6", `
    <path d="M14 31 50 15 42 49 32 39z" fill="${W}"/>
    <path d="M32 39 50 15 27 36z" fill="#000" opacity=".18"/>
    <path d="M27 36v11l6-7z" fill="${W}" opacity=".8"/>`),
};
