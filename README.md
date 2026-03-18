# Kadastrs App

Interaktīva kadastra karte ar zemes sludinājumu pārvaldību.

## Funkcionalitāte

**Publiskā karte** (`/`)
- Satelītattēls + kadastra robežas (LVM GEO WFS/WMS)
- Meklēšana pēc kadastra apzīmējuma
- Klikšķis uz poligona — info par zemes vienību
- Pārdošanas objekti iezīmēti oranžā krāsā ar cenām

**Admin panelis** (`/admin`)
- Pievienot sludinājumu (kadastra nr., cena, platība, apraksts)
- CSV imports (vairāki ieraksti uzreiz)
- Aktivēt/deaktivēt/dzēst sludinājumus

## Uzstādīšana

```bash
npm install
npm start
```

Atver: http://localhost:3000
Admin: http://localhost:3000/admin (parole: `kalme2025`)

## Konfigurācija

Vides mainīgie:
- `PORT` — servera ports (noklusēti: 3000)
- `ADMIN_PASS` — admin parole (noklusēti: kalme2025)

## Deploy

### Railway.app
1. Push uz GitHub
2. railway.app → New Project → Deploy from GitHub
3. Settings → set `ADMIN_PASS` env variable

### Render.com
1. Push uz GitHub
2. render.com → New Web Service → Connect repo
3. Build: `npm install`, Start: `npm start`

### VPS (Hetzner, DigitalOcean)
```bash
git clone <repo>
cd kadastrs-app
npm install
ADMIN_PASS=tava_parole PORT=3000 node server.js
```

## Tehnoloģijas
- Node.js + Express
- SQLite (better-sqlite3) — datubāze vienā failā
- Leaflet.js — karte
- LVM GEO WFS/WMS — kadastra dati
- ESRI World Imagery — satelītattēls
