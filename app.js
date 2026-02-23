// Sacred Global — Globe.GL Visualization
// Real-time 3D globe showing Sacred device locations worldwide

class SacredGlobe {
    constructor() {
        this.globe         = null;
        this.devices       = [];
        this._refreshTimer = null;

        this.init();
    }

    // ----------------------------------------------------------------
    // Boot
    // ----------------------------------------------------------------
    async init() {
        try {
            // Wait for Globe library to be available
            if (typeof Globe === 'undefined') {
                console.error('[SacredGlobe] Globe.GL not loaded. Check CDN or network.');
                document.getElementById('loading').textContent = 'Failed to load globe library. Check your connection.';
                return;
            }

            await this.loadDevices();
            this.createGlobe();
            this.setupControls();
            this.updateStats();
            this.startTerminatorAnimation();
            this._refreshTimer = setInterval(() => this.refreshData(), 30_000);

            // Hide loading indicator
            const loader = document.getElementById('loading');
            if (loader) loader.style.display = 'none';
        } catch (err) {
            console.error('[SacredGlobe] init failed:', err);
            const loader = document.getElementById('loading');
            if (loader) loader.textContent = `Error: ${err.message}`;
        }
    }

    // ----------------------------------------------------------------
    // Data  —  swap loadDevices() for fetch() when backend is ready
    // ----------------------------------------------------------------
    async loadDevices() {
        // TODO: replace with fetch('https://api.sacred.systems/devices')
        this.devices = [
            { lat: -33.8688, lng:  151.2093, city: 'Sydney',        country: 'Australia',    status: 'active',  sessionTime: 125, totalTime: 3420, lastActive: 'Now'         },
            { lat: -37.8136, lng:  144.9631, city: 'Melbourne',     country: 'Australia',    status: 'idle',    sessionTime:   0, totalTime: 2100, lastActive: '15 min ago'  },
            { lat: -27.4698, lng:  153.0251, city: 'Brisbane',      country: 'Australia',    status: 'active',  sessionTime:  89, totalTime: 4200, lastActive: 'Now'         },
            { lat:  35.6762, lng:  139.6503, city: 'Tokyo',         country: 'Japan',        status: 'active',  sessionTime: 156, totalTime: 5800, lastActive: 'Now'         },
            { lat:  37.5665, lng:  126.9780, city: 'Seoul',         country: 'South Korea',  status: 'active',  sessionTime:  92, totalTime: 3900, lastActive: 'Now'         },
            { lat:   1.3521, lng:  103.8198, city: 'Singapore',     country: 'Singapore',    status: 'active',  sessionTime: 134, totalTime: 4500, lastActive: 'Now'         },
            { lat:  51.5074, lng:   -0.1278, city: 'London',        country: 'UK',           status: 'idle',    sessionTime:   0, totalTime: 2800, lastActive: '2 hours ago' },
            { lat:  48.8566, lng:    2.3522, city: 'Paris',         country: 'France',       status: 'idle',    sessionTime:   0, totalTime: 1900, lastActive: '45 min ago'  },
            { lat:  52.5200, lng:   13.4050, city: 'Berlin',        country: 'Germany',      status: 'active',  sessionTime:  78, totalTime: 3200, lastActive: 'Now'         },
            { lat:  40.7128, lng:  -74.0060, city: 'New York',      country: 'USA',          status: 'active',  sessionTime: 167, totalTime: 6100, lastActive: 'Now'         },
            { lat:  37.7749, lng: -122.4194, city: 'San Francisco', country: 'USA',          status: 'active',  sessionTime: 143, totalTime: 5200, lastActive: 'Now'         },
            { lat:  34.0522, lng: -118.2437, city: 'Los Angeles',   country: 'USA',          status: 'idle',    sessionTime:   0, totalTime: 2700, lastActive: '1 hour ago'  },
            { lat:  43.6532, lng:  -79.3832, city: 'Toronto',       country: 'Canada',       status: 'offline', sessionTime:   0, totalTime: 1500, lastActive: '8 hours ago' },
            { lat:  19.0760, lng:   72.8777, city: 'Mumbai',        country: 'India',        status: 'active',  sessionTime: 201, totalTime: 7200, lastActive: 'Now'         },
            { lat:  25.2048, lng:   55.2708, city: 'Dubai',         country: 'UAE',          status: 'active',  sessionTime: 112, totalTime: 4100, lastActive: 'Now'         },
            { lat: -23.5505, lng:  -46.6333, city: 'São Paulo',     country: 'Brazil',       status: 'active',  sessionTime:  95, totalTime: 3600, lastActive: 'Now'         },
            { lat:  19.4326, lng:  -99.1332, city: 'Mexico City',   country: 'Mexico',       status: 'idle',    sessionTime:   0, totalTime: 2200, lastActive: '30 min ago'  },
            { lat: -33.9249, lng:   18.4241, city: 'Cape Town',     country: 'South Africa', status: 'active',  sessionTime:  87, totalTime: 2900, lastActive: 'Now'         },
        ];
    }

    // ----------------------------------------------------------------
    // Solar calculations for terminator line
    // ----------------------------------------------------------------
    getSunPosition(date) {
        // Simplified solar position calculation
        const startOfYear = new Date(date.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((date - startOfYear) / 86400000);
        
        // Solar declination (Earth's tilt)
        const declination = -23.44 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));
        
        // Solar hour angle (Earth's rotation)
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const seconds = date.getUTCSeconds();
        const hoursDecimal = hours + minutes / 60 + seconds / 3600;
        
        // Convert to longitude (-180 to 180)
        const longitude = (hoursDecimal / 24) * 360 - 180;
        
        return { lat: declination, lng: longitude };
    }

    // Generate hex grid for day side illumination
    generateDaySideHexes() {
        const sunPos = this.getSunPosition(new Date());
        const hexes = [];
        
        // Create a grid of hexagons on the day side
        for (let lat = -85; lat <= 85; lat += 8) {
            for (let lng = -180; lng <= 180; lng += 8) {
                // Calculate if this point is on the day side
                const angle = this.calculateSolarAngle(lat, lng, sunPos);
                
                // If angle < 90 degrees, it's daytime
                if (angle < 90) {
                    hexes.push({
                        lat: lat,
                        lng: lng,
                        intensity: Math.cos(angle * Math.PI / 180) // Brighter near subsolar point
                    });
                }
            }
        }
        
        return hexes;
    }

    calculateSolarAngle(lat, lng, sunPos) {
        // Convert to radians
        const lat1 = lat * Math.PI / 180;
        const lng1 = lng * Math.PI / 180;
        const lat2 = sunPos.lat * Math.PI / 180;
        const lng2 = sunPos.lng * Math.PI / 180;
        
        // Great circle distance (solar zenith angle)
        const angle = Math.acos(
            Math.sin(lat1) * Math.sin(lat2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1)
        );
        
        return angle * 180 / Math.PI;
    }

    // ----------------------------------------------------------------
    // Globe setup
    // ----------------------------------------------------------------
    createGlobe() {
        const el = document.getElementById('globeViz');
        if (!el) throw new Error('#globeViz element not found');

        this.globe = Globe()
            (el)
            // Textures
            .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
            .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
            .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
            // Atmosphere — Sacred Gold glow
            .atmosphereColor('#FFCC00')
            .atmosphereAltitude(0.12)
            // Daytime hexagons (terminator effect)
            .hexBinPointsData(this.generateDaySideHexes())
            .hexBinPointLat('lat')
            .hexBinPointLng('lng')
            .hexBinPointWeight('intensity')
            .hexAltitude(0.001)
            .hexTopColor(() => 'rgba(255, 255, 100, 0.3)')
            .hexSideColor(() => 'rgba(255, 255, 100, 0.15)')
            .hexBinResolution(4)
            // Device dots
            .pointsData(this.devices)
            .pointLat('lat')
            .pointLng('lng')
            .pointAltitude(0.01)
            .pointRadius(0.4)
            .pointColor(d => this.getStatusColor(d.status))
            .pointLabel(d => this.buildTooltip(d))
            .onPointClick(this.handlePointClick.bind(this))
            // Pulsing rings for active devices
            .ringsData(this.devices.filter(d => d.status === 'active'))
            .ringLat('lat')
            .ringLng('lng')
            .ringMaxRadius(3)
            .ringPropagationSpeed(2)
            .ringRepeatPeriod(2000)
            .ringColor(() => 'rgba(255, 204, 0, 0.2)')
            // Camera
            .pointOfView({ lat: 20, lng: 0, altitude: 2.5 })
            .enablePointerInteraction(true)
            // Resize canvas to fill container properly
            .width(el.clientWidth)
            .height(el.clientHeight);

        // Native OrbitControls auto-rotation
        const controls = this.globe.controls();
        controls.autoRotate      = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableDamping   = true;
        controls.dampingFactor   = 0.08;

        // Keep canvas sized correctly if window resizes
        window.addEventListener('resize', () => {
            this.globe
                .width(el.clientWidth)
                .height(el.clientHeight);
        });
    }

    // ----------------------------------------------------------------
    // Terminator animation (updates in real-time)
    // ----------------------------------------------------------------
    startTerminatorAnimation() {
        const updateTerminator = () => {
            const hexes = this.generateDaySideHexes();
            this.globe.hexBinPointsData(hexes);
        };

        // Update every 60 seconds (terminator moves slowly)
        setInterval(updateTerminator, 60000);
    }

    // ----------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------
    getStatusColor(status) {
        return { active: '#10b981', idle: '#f59e0b', offline: '#ef4444' }[status] ?? '#ef4444';
    }

    buildTooltip(d) {
        const color   = this.getStatusColor(d.status);
        const session = d.sessionTime > 0 ? `${d.sessionTime} min` : '—';
        return `
            <div style="
                background:rgba(22,26,35,0.97);
                padding:12px 16px;
                border-radius:8px;
                border:1px solid rgba(255,204,0,0.18);
                color:#F0F2F5;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                font-size:13px;
                line-height:1.65;
                box-shadow:0 10px 40px rgba(0,0,0,0.6);
                min-width:160px;
            ">
                <div style="font-weight:700;font-size:14px;margin-bottom:5px;color:${color};">
                    ${d.city}, ${d.country}
                </div>
                <div style="color:#8B95A6;font-size:12px;">
                    Status: <span style="color:#F0F2F5;text-transform:capitalize;">${d.status}</span>
                </div>
                <div style="color:#8B95A6;font-size:12px;">
                    Session: <span style="color:#F0F2F5;">${session}</span>
                </div>
            </div>
        `;
    }

    // ----------------------------------------------------------------
    // Interaction
    // ----------------------------------------------------------------
    handlePointClick(point) {
        if (!point) return;
        this.globe.controls().autoRotate = false;

        document.getElementById('deviceLocation').textContent = `${point.city}, ${point.country}`;
        document.getElementById('deviceStatus').textContent   = point.status.charAt(0).toUpperCase() + point.status.slice(1);
        document.getElementById('sessionTime').textContent    = point.sessionTime > 0 ? `${point.sessionTime} min` : '—';
        document.getElementById('totalTime').textContent      = `${Math.floor(point.totalTime / 60)}h ${point.totalTime % 60}m`;
        document.getElementById('lastActive').textContent     = point.lastActive;

        document.getElementById('infoPanel').classList.add('visible');
        this.globe.pointOfView({ lat: point.lat, lng: point.lng, altitude: 2 }, 1000);
    }

    setupControls() {
        document.getElementById('zoomIn').addEventListener('click', () => {
            const { altitude } = this.globe.pointOfView();
            this.globe.pointOfView({ altitude: Math.max(altitude - 0.5, 0.5) }, 500);
        });
        document.getElementById('zoomOut').addEventListener('click', () => {
            const { altitude } = this.globe.pointOfView();
            this.globe.pointOfView({ altitude: Math.min(altitude + 0.5, 5) }, 500);
        });
        document.getElementById('resetView').addEventListener('click', () => {
            this.globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
            this.globe.controls().autoRotate = true;
        });
        document.getElementById('closeBtn').addEventListener('click', () => {
            document.getElementById('infoPanel').classList.remove('visible');
            this.globe.controls().autoRotate = true;
        });
        this.globe.controls().addEventListener('start', () => {
            this.globe.controls().autoRotate = false;
        });
    }

    // ----------------------------------------------------------------
    // Stats
    // ----------------------------------------------------------------
    updateStats() {
        const total  = this.devices.length;
        const active = this.devices.filter(d => d.status === 'active').length;
        const hours  = this.devices.reduce((sum, d) => sum + Math.floor(d.totalTime / 60), 0);

        this.animateCounter('totalBoxes',  total);
        this.animateCounter('activeBoxes', active);
        this.animateCounter('hoursSaved',  hours);
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
    }

    animateCounter(id, target) {
        const el    = document.getElementById(id);
        const start = parseInt(el.textContent.replace(/,/g, '')) || 0;
        const t0    = Date.now();
        const dur   = 1200;
        const tick  = () => {
            const p  = Math.min((Date.now() - t0) / dur, 1);
            const ep = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.floor(start + (target - start) * ep).toLocaleString();
            if (p < 1) requestAnimationFrame(tick);
        };
        tick();
    }

    // ----------------------------------------------------------------
    // Refresh
    // ----------------------------------------------------------------
    async refreshData() {
        await this.loadDevices();
        this.globe
            .pointsData(this.devices)
            .ringsData(this.devices.filter(d => d.status === 'active'));
        this.updateStats();
    }
}

// Wait for both DOM and all scripts (including Globe.GL from CDN) to be ready
window.addEventListener('load', () => {
    new SacredGlobe();
});
