# Anjali Gundawar · Portfolio

a portfolio website explaining my projects and work till now

Plain HTML, CSS and JavaScript. No build step.

## Run it
ES modules need a local server (opening the file directly won't work):

```
python3 -m http.server 8000
# then open http://localhost:8000
```

## Files
- `index.html` – page structure (start page, placeholder for the windows section)
- `css/style.css` – console drawn entirely in CSS, layout, animations
- `js/ascii.js` – image → ASCII conversion, cursive text → ASCII, placeholder portrait
- `js/explode.js` – scroll-driven particle explosion on a canvas
- `js/main.js` – wires it all together
- `css/windows.css`, `js/windows.js` – the windows desktop: a stack of window previews; click or scroll zooms one open, × or scroll closes it and the next comes forward
- `assets/about-photo.webp` – Anjali's photo with the background removed (rembg, BiRefNet portrait model)

## Your photo
Drop a photo at `assets/portrait.jpg` and reload. It's converted to ASCII in the browser.
A head-and-shoulders shot on a plain, light background works best.
