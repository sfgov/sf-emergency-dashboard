# SF Emergency Response Dashboard

An analytical dashboard for reviewing San Francisco emergency response data across 911 calls, 311 service requests, and CAD dispatch records.

**Live:** https://sfgov.github.io/sf-emergency-dashboard/

## What It Does

- **Priority breakdown**: View call volume by priority level (A = life-threatening, B = urgent, C = non-urgent) with per-day averages
- **Time of day analysis**: See when calls peak across overnight, morning, afternoon, and evening windows
- **Encampment tracking**: Filter to 311 tickets related to encampments and homeless concerns
- **Geographic drill-down**: Start at city level, click into a district, then into a specific station
- **Call type ranking**: See top 10 call categories for any geography or time range

## Data Sources

All data comes from [SF OpenData](https://data.sf.gov):

| Dataset | Description |
|---------|-------------|
| [Police Incidents](https://data.sf.gov/resource/wg3w-h783) | SFPD incident reports |
| [Fire Calls](https://data.sf.gov/resource/nuek-vuh3) | SFFD calls for service |
| [311 Cases](https://data.sf.gov/resource/vw6y-z8j6) | 311 service requests |
| [CAD Dispatch](https://data.sf.gov/resource/enhu-st7v) | Computer-aided dispatch records |

## Priority Codes

SF Fire/EMS uses numeric priority codes:

- **Priority 3 / E**: Life-threatening emergency (mapped to "A")
- **Priority 2**: Urgent, non-life-threatening (mapped to "B")
- **Priority 1**: Non-urgent (mapped to "C")

## Development

```bash
npm install
npm run dev
```

Requires a Mapbox token in `.env.local`:
```
VITE_MAPBOX_TOKEN=your_token_here
```

## Deployment

```bash
npm run deploy
```

Deploys to GitHub Pages via `gh-pages` package.

## Tech Stack

- React + TypeScript + Vite
- Leaflet / react-leaflet for maps
- Mapbox dark tiles
- Lucide icons
