# Sacred Global - Live Device Status

Real-time visualization of Sacred device activity worldwide, connected to **sacred.global**.

## Features

- **3D Animated Globe**: Rotating globe showing device locations
- **Live Status Indicators**: 
  - 🟢 Active (currently in session)
  - 🟡 Idle (recently active)
  - 🔴 Offline (inactive)
- **Interactive**: Click on any device to see detailed stats
- **Real-time Stats**: Active devices, countries, total sessions
- **Responsive Design**: Works on all devices

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/petestein88/sacred-global.git
cd sacred-global
```

2. Run a local development server:

**Option 1: Using Python**
```bash
python3 -m http.server 8001
```

**Option 2: Using Node.js (npx)**
```bash
npx serve -p 8001
```

**Option 3: Using VS Code Live Server**
- Install the "Live Server" extension
- Right-click on `index.html` and select "Open with Live Server"

3. Open your browser to `http://localhost:8001`

## Domain Setup

To connect this to **sacred.global**:

1. Go to your domain registrar
2. Update DNS settings for sacred.global:
   - Add A records pointing to GitHub Pages IP addresses:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Or add CNAME record: `petestein88.github.io`

3. In GitHub repository settings:
   - Go to Settings > Pages
   - Set source to "main" branch
   - Add custom domain: `sacred.global`
   - Enable "Enforce HTTPS"

## Integration with Backend

Currently uses mock data. To connect to your real backend:

1. Replace `generateMockDevices()` in `app.js` with API calls to your backend
2. Update the data refresh interval in `updateStats()`
3. Add WebSocket connection for real-time updates:

```javascript
const ws = new WebSocket('wss://api.sacred.systems/devices');
ws.onmessage = (event) => {
    const deviceData = JSON.parse(event.data);
    this.updateDeviceData(deviceData);
};
```

## Customization

### Change Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #6366f1;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --danger-color: #ef4444;
}
```

### Adjust Globe Rotation Speed
In `app.js`, modify the rotation increment:
```javascript
this.rotation += 0.2; // Increase for faster rotation
```

## License

All rights reserved © 2026 Sacred