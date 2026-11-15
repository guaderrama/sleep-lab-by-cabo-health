# Vendored libraries

Served from the site itself so the app works without third-party CDNs (and offline).
Copied unmodified from the npm packages:

| Path | Package | License |
|---|---|---|
| `gsap/gsap.min.js`, `gsap/ScrollTrigger.min.js` | `gsap@3.12.2` (`dist/`) | GreenSock Standard License (see header of each file) |
| `fontawesome/css/all.min.css`, `fontawesome/webfonts/*.woff2` | `@fortawesome/fontawesome-free@6.4.0` | Font Awesome Free License (`fontawesome/LICENSE.txt`) |

Only the `.woff2` webfonts are included; every supported browser loads those first.
To update, download the new package version with `npm pack` and copy the same files.
