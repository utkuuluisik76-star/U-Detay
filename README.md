# U/GARAGE — Porsche 911 concept

Actuele statische website, export 6 november 2026 (v18).
Turkse 3D-configurator van U-LUKSSTUDYO, https://u-luksstudyo.com.
Geen installatie of build nodig. Alle websitebestanden staan in dist/.

## GitHub

Pak de zip uit. Upload de inhoud van deze map naar de hoofdmap van je repository.
De repository bevat dan onder andere dist/index.html en package.json.
Upload geen overkoepelende extra map en upload niet alleen het zipbestand.
Er staan geen accountgegevens of omgevingsbestanden in dit pakket.

## Cloudflare Pages met GitHub

Koppel je GitHub-repository aan een Pages-project.
- Framework preset: None
- Production branch: de branch waarop je de bestanden uploadt (bijvoorbeeld main)
- Root directory: leeg laten als dist/ direct in de repository staat
- Build command: exit 0
- Build output directory: dist
- Environment variables: niet nodig

Officiële instructie: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/

Voor handmatige statische hosting publiceer je de inhoud van dist/.
Dit pakket is ingericht voor Cloudflare Pages; er is geen Worker-servercode nodig.
Gebruik voor het publiek een eigen domein of subdomein.

## Lokaal bekijken

Node.js vereist:
    npm run dev
Open http://127.0.0.1:4182/
Controles: npm run check
Open index.html niet via file://: de 3D-modules gebruiken een webserver.

## Wat is getest en wat staat nog open?

Getest in lokale browser: 390/768/1440 px, vergroten/sluiten, cameragrenzen,
kleurkeuzes bewaren, gedeelde configuratie heropenen en PNG-export (1080 × 1350).
Laatste twee lokale 3D-opstartmetingen: 2,64 en 2,93 s. Geen 4G- of echte telefoontest.
De downloadmelding wachtte in één browsercontrole lang; oorzaak niet bevestigd.
Controleer de werking op je telefoon en na de daadwerkelijke deployment.
De site staat bewust op noindex; robots.txt en _headers zijn meegeleverd.
Prijzen zijn niet ingevuld: er wordt geen verzonnen bedrag getoond.
Dit is een onafhankelijke conceptwebsite, geen officiële Porsche-website.

## Rechten en bronnen

3D-model: Lionsharp Studios, CC BY-SA 4.0. Zie licenses/model-license.txt
en dist/credits.html. De aangepaste 3D-inhoud valt onder CC BY-SA 4.0.
Wielen en aero zijn digitale conceptonderdelen, geen gevalideerde producten.
Third-party licenties staan bij de bestanden in dist/vendor/ en dist/fonts/.
Bewaar de licentieteksten en bronvermeldingen bij publicatie.
