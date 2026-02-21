// Sacred Global — Globe.GL Visualization
// Real-time 3D globe showing Sacred device locations worldwide
//
// Requires (loaded in order in index.html):
//   1. three@0.169.0  (sets window.THREE for custom scene objects)
//   2. globe.gl@2.42.4

class SacredGlobe {
    constructor() {
        this.globe          = null;
        this.devices        = [];
        this.terminatorMesh = null;
        this._refreshTimer  = null;
        this._terminatorTimer = null;

        this.init();
    }

    // ----------------------------------------------------------------
    // Boot
    // ----------------------------------------------------------------
    async init() {
        await this.loadDevices();
        this.createGlobe();
        this.addTerminator();
        this.setupControls();
        this.updateStats();

        // Refresh device data every 30 s
        this._refreshTimer    = setInterval(() => this.refreshData(),      30_000);
        // Keep terminator accurate to the minute
        this._terminatorTimer = setInterval(() => this.updateTerminator(), 60_000);
    }

    // ----------------------------------------------------------------
    // Data  (swap loadDevices for a real fetch() when backend is ready)
    // ----------------------------------------------------------------
    async loadDevices() {
        // TODO: replace with fetch('https://api.sacred.systems/devices')
        this.devices = [
            { lat: -33.8688, lng:  151.2093, city: 'Sydney',        country: 'Australia',    status: 'active',  sessionTime: 125, totalTime: 3420, lastActive: 'Now'          },
            { lat: -37.8136, lng:  144.9631, city: 'Melbourne',     country: 'Australia',    status: 'idle',    sessionTime:   0, totalTime: 2100, lastActive: '15 min ago'   },
            { lat: -27.4698, lng:  153.0251, city: 'Brisbane',      country: 'Australia',    status: 'active',  sessionTime:  89, totalTime: 4200, lastActive: 'Now'          },
            { lat:  35.6762, lng:  139.6503, city: 'Tokyo',         country: 'Japan',        status: 'active',  sessionTime: 156, totalTime: 5800, lastActive: 'Now'          },
            { lat:  37.5665, lng:  126.9780, city: 'Seoul',         country: 'South Korea',  status: 'active',  sessionTime:  92, totalTime: 3900, lastActive: 'Now'          },
            { lat:   1.3521, lng:  103.8198, city: 'Singapore',     country: 'Singapore',    status: 'active',  sessionTime: 134, totalTime: 4500, lastActive: 'Now'          },
            { lat:  51.5074, lng:   -0.1278, city: 'London',        country: 'UK',           status: 'idle',    sessionTime:   0, totalTime: 2800, lastActive: '2 hours ago'  },
            { lat:  48.8566, lng:    2.3522, city: 'Paris',         country: 'France',       status: 'idle',    sessionTime:   0, totalTime: 1900, lastActive: '45 min ago'   },
            { lat:  52.5200, lng:   13.4050, city: 'Berlin',        country: 'Germany',      status: 'active',  sessionTime:  78, totalTime: 3200, lastActive: 'Now'          },
            { lat:  40.7128, lng:  -74.0060, city: 'New York',      country: 'USA',          status: 'active',  sessionTime: 167, totalTime: 6100, lastActive: 'Now'          },
            { lat:  37.7749, lng: -122.4194, city: 'San Francisco', country: 'USA',          status: 'active',  sessionTime: 143, totalTime: 5200, lastActive: 'Now'          },
            { lat:  34.0522, lng: -118.2437, city: 'Los Angeles',   country: 'USA',          status: 'idle',    sessionTime:   0, totalTime: 2700, lastActive: '1 hour ago'   },
            { lat:  43.6532, lng:  -79.3832, city: 'Toronto',       country: 'Canada',       status: 'offline', sessionTime:   0, totalTime: 1500, lastActive: '8 hours ago'  },
            { lat:  19.0760, lng:   72.8777, city: 'Mumbai',        country: 'India',        status: 'active',  sessionTime: 201, totalTime: 7200, lastActive: 'Now'          },
            { lat:  25.2048, lng:   55.2708, city: 'Dubai',         country: 'UAE',          status: 'active',  sessionTime: 112, totalTime: 4100, lastActive: 'Now'          },
            { lat: -23.5505, lng:  -46.6333, city: 'S\u00e3o Paulo',country: 'Brazil',       status: 'active',  sessionTime:  95, totalTime: 3600, lastActive: 'Now'          },
            { lat:  19.4326, lng:  -99.1332, city: 'Mexico City',   country: 'Mexico',       status: 'idle',    sessionTime:   0, totalTime: 2200, lastActive: '30 min ago'   },
            { lat: -33.9249, lng:   18.4241, city: 'Cape Town',     country: 'South Africa', status: 'active',  sessionTime:  87, totalTime: 2900, lastActive: 'Now'          },
        ];
    }

    // ----------------------------------------------------------------
    // Globe setup
    // ----------------------------------------------------------------
    createGlobe() {
        this.globe = Globe()
            (document.getElementById('globeViz'))

            // Textures
            .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
            .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
            .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')

            // Atmosphere — Sacred Gold glow
            .atmosphereColor('#FFCC00')
            .atmosphereAltitude(0.12)

            // Device dots
            .pointsData(this.devices)
            .pointLat('lat')
            .pointLng('lng')
            .pointAltitude(0.01)
            .pointRadius(0.4)
            .pointColor(d => this.getStatusColor(d.status))
            .pointLabel(d => this.buildTooltip(d))
            .onPointClick(this.handlePointClick.bind(this))

            // Pulsing rings for active devices (Sacred Gold, semi-transparent)
            .ringsData(this.devices.filter(d => d.status === 'active'))
            .ringLat('lat')
            .ringLng('lng')
            .ringMaxRadius(3)
            .ringPropagationSpeed(2)
            .ringRepeatPeriod(2000)
            .ringColor(() => 'rgba(255, 204, 0, 0.2)')

            // Initial camera
            .pointOfView({ lat: 20, lng: 0, altitude: 2.5 })
            .enablePointerInteraction(true);

        // Use Globe.GL’s built-in OrbitControls auto-rotation
        // (replaces the previous broken setInterval hack)
        const controls = this.globe.controls();
        controls.autoRotate      = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableDamping   = true;
        controls.dampingFactor   = 0.08;
    }

    // ----------------------------------------------------------------
    // Day / Night Terminator
    //
    // Strategy: add a Three.js sphere (r=101, just outside the globe
    // at r=100) with a GLSL ShaderMaterial that darkens night-side
    // fragments based on the current solar angle.
    //
    // Coordinate system (three-globe / Globe.GL):
    //   x = cos(lat) * sin(lng)
    //   y = sin(lat)
    //   z = cos(lat) * cos(lng)
    //   where lat/lng use the three-globe convention:
    //     phi   = (90 - lat) * π/180
    //     theta = (lng + 180) * π/180
    // ----------------------------------------------------------------
    getSunPosition() {
        const now       = new Date();
        const dayOfYear = Math.floor(
            (now - new Date(now.getFullYear(), 0, 0)) / 86_400_000
        );
        // Approximate solar declination (±23.45° range)
        const declination = -23.45 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));
        // Solar longitude: sun overhead at lng=0 at 12:00 UTC, 15°/hour
        const utcHours  = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
        const solarLng  = (utcHours - 12) * -15;
        return { lat: declination, lng: solarLng };
    }

    getSunVector(sunPos) {
        // Convert geographic lat/lng → 3-D unit vector in Globe.GL world space
        const phi   = (90 - sunPos.lat) * Math.PI / 180;   // polar angle from north
        const theta = (sunPos.lng + 180) * Math.PI / 180;  // azimuth
        return new THREE.Vector3(
            Math.sin(phi) * Math.sin(theta),
            Math.cos(phi),
            Math.sin(phi) * Math.cos(theta)
        );
    }

    addTerminator() {
        const sunVec   = this.getSunVector(this.getSunPosition());
        const geometry = new THREE.SphereGeometry(101, 64, 64);

        const material = new THREE.ShaderMaterial({
            uniforms: {
                sunDirection: { value: sunVec }
            },
            vertexShader: /* glsl */`
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: /* glsl */`
                uniform vec3 sunDirection;
                varying vec3 vNormal;
                void main() {
                    float cosA = dot(vNormal, normalize(sunDirection));
                    // ~6° soft edge around the terminator line
                    float alpha = smoothstep(0.06, -0.06, cosA) * 0.62;
                    gl_FragColor = vec4(0.01, 0.01, 0.06, alpha);
                }
            `,
            transparent: true,
            side:        THREE.FrontSide,
            depthWrite:  false,
            blending:    THREE.NormalBlending,
        });

        this.terminatorMesh = new THREE.Mesh(geometry, material);
        this.terminatorMesh.renderOrder = 1;   // render above globe surface, below UI
        this.globe.scene().add(this.terminatorMesh);
    }

    updateTerminator() {
        if (!this.terminatorMesh) return;
        const sunVec = this.getSunVector(this.getSunPosition());
        this.terminatorMesh.material.uniforms.sunDirection.value.copy(sunVec);
    }

    // ----------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------
    getStatusColor(status) {
        return { active: '#10b981', idle: '#f59e0b', offline: '#ef4444' }[status] ?? '#ef4444';
    }

    buildTooltip(d) {
        const color = this.getStatusColor(d.status);
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

        // Pause auto-rotation while the user is looking at a device
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

        // Pause auto-rotate when the user manually drags
        this.globe.controls().addEventListener('start', () => {
            this.globe.controls().autoRotate = false;
        });
    }

    // ----------------------------------------------------------------
    // Stats
    // ----------------------------------------------------------------
    updateStats() {
        const total   = this.devices.length;
        const active  = this.devices.filter(d => d.status === 'active').length;
        const hours   = this.devices.reduce((sum, d) => sum + Math.floor(d.totalTime / 60), 0);

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

        const tick = () => {
            const p  = Math.min((Date.now() - t0) / dur, 1);
            const ep = 1 - Math.pow(1 - p, 3);   // ease-out cubic
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

document.addEventListener('DOMContentLoaded', () => new SacredGlobe());
