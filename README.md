# Sacred Global - Live Device Status 🌍

Real-time 3D globe visualization showing Sacred device activity worldwide using **Globe.GL**.

![Sacred Global](https://img.shields.io/badge/Globe-GL-blue?style=flat-square) ![Three.js](https://img.shields.io/badge/Three.js-Interactive-green?style=flat-square)

## ✨ Features

### Interactive 3D Globe
- **Realistic Earth texture** with night lights and topology
- **Day/Night terminator** showing Earth's illumination
- **Animated atmosphere** with purple/blue glow
- **Click & drag** to rotate the globe manually
- **Scroll to zoom** in and out (1x-4x)
- **Auto-rotation** when idle (pauses on interaction)

### Live Device Tracking
- 🟢 **Active** - Currently in session (pulsing green rings)
- 🟡 **Idle** - Recently active (orange dots)
- 🔴 **Offline** - Inactive (red dots)
- **Hover tooltips** with quick device info
- **Click devices** for detailed stats panel

### Real-time Statistics
- **Total Boxes** - All registered devices
- **Active Now** - Devices currently in session
- **Hours Saved** - Cumulative phone-free time

### Controls
- ➕ Zoom In
- ➖ Zoom Out
- 🔄 Reset View

## 🚀 Local Development

### Quick Start

```bash
git clone https://github.com/petestein88/sacred-global.git
cd sacred-global

# Run local server (choose one):
python3 -m http.server 8000
# OR
npx serve
```

Open `http://localhost:8000`

### No Build Required!

This is a **pure vanilla JS** app - no npm install, no webpack, no build step. Just open `index.html` in a browser or serve the files.

## 🔌 Connecting Real Device Data

### Current Setup (Mock Data)
The app currently uses mock device data in `app.js` at line 23-40.

### Switching to Real API

Replace the `loadDevices()` method:

```javascript
async loadDevices() {
    const response = await fetch('https://api.sacred.systems/devices');
    this.devices = await response.json();
}
```

### Expected API Format

```json
[
  {
    "lat": -33.8688,
    "lng": 151.2093,
    "city": "Sydney",
    "country": "Australia",
    "status": "active",
    "sessionTime": 125,
    "totalTime": 3420,
    "lastActive": "Now"
  }
]
```

### WebSocket for Real-time Updates

For live updates without polling:

```javascript
const ws = new WebSocket('wss://api.sacred.systems/ws');
ws.onmessage = (event) => {
    const device = JSON.parse(event.data);
    this.updateDevice(device);
};
```

## 🎨 Customization

### Colors

Edit CSS variables in `styles.css`:

```css
:root {
    --primary: #6366f1;      /* Brand color */
    --success: #10b981;      /* Active status */
    --warning: #f59e0b;      /* Idle status */
    --danger: #ef4444;       /* Offline status */
}
```

### Globe Appearance

In `app.js`, line 55-57:

```javascript
.globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
.bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
.backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
```

Options:
- `earth-day.jpg` - Daytime satellite view
- `earth-blue-marble.jpg` - NASA Blue Marble
- Custom textures from your CDN

### Rotation Speed

In `app.js`, line 209:

```javascript
lng: pov.lng - 0.2  // Decrease = slower, increase = faster
```

### Device Location

Devices use **approximate locations** (city-level). You don't need exact GPS coordinates - just the lat/lng of the city where the box is located.

Find coordinates:
- [LatLong.net](https://www.latlong.net/)
- [GPS Coordinates](https://gps-coordinates.org/)
- Or ask the user for their city and use a geocoding service

## 🌐 Deployment

### GitHub Pages

1. Go to repository **Settings** > **Pages**
2. Source: **main branch**
3. Custom domain: `sacred.global`
4. ✅ Enforce HTTPS

### DNS Setup (sacred.global)

At your domain registrar:

```
Type: A
Name: @
Value: 185.199.108.153

Type: A
Name: @
Value: 185.199.109.153

Type: A
Name: @
Value: 185.199.110.153

Type: A
Name: @
Value: 185.199.111.153
```

Or CNAME:
```
Type: CNAME
Name: @
Value: petestein88.github.io
```

### Alternative Hosting

- **Netlify**: Drag & drop the folder
- **Vercel**: `vercel deploy`
- **Cloudflare Pages**: Connect GitHub repo

All support custom domains and HTTPS.

## 📚 Technologies

- **[Globe.GL](https://github.com/vasturiano/globe.gl)** - WebGL globe visualization
- **[Three.js](https://threejs.org/)** - 3D graphics library (bundled with Globe.GL)
- Pure vanilla JavaScript (no framework)
- No build tools required

## 🎯 Roadmap

- [ ] Add arc lines connecting related devices
- [ ] Heatmap overlay for usage density
- [ ] Time-lapse showing 24-hour activity patterns
- [ ] Filter devices by status/region
- [ ] Export globe as image/video
- [ ] VR mode support

## 📄 License

All rights reserved © 2026 Sacred

---

**Questions?** Check out the [Globe.GL documentation](https://github.com/vasturiano/globe.gl) or the [Stripe Globe blog post](https://stripe.com/blog/globe) for inspiration.