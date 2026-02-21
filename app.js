// Sacred Global - Globe.GL Visualization
// Real-time 3D globe showing Sacred device locations worldwide

class SacredGlobe {
    constructor() {
        this.globe = null;
        this.devices = [];
        this.autoRotate = true;
        this.currentZoom = 1;
        
        this.init();
    }
    
    async init() {
        // Generate mock device data (replace with real API later)
        await this.loadDevices();
        
        // Initialize Globe.GL
        this.createGlobe();
        
        // Setup event listeners
        this.setupControls();
        
        // Update stats
        this.updateStats();
        
        // Refresh data periodically
        setInterval(() => this.refreshData(), 30000); // Every 30 seconds
    }
    
    async loadDevices() {
        // Mock device data - replace with: fetch('https://api.sacred.systems/devices')
        this.devices = [
            { lat: -33.8688, lng: 151.2093, city: 'Sydney', country: 'Australia', status: 'active', sessionTime: 125, totalTime: 3420, lastActive: 'Now' },
            { lat: -37.8136, lng: 144.9631, city: 'Melbourne', country: 'Australia', status: 'idle', sessionTime: 45, totalTime: 2100, lastActive: '15 min ago' },
            { lat: -27.4698, lng: 153.0251, city: 'Brisbane', country: 'Australia', status: 'active', sessionTime: 89, totalTime: 4200, lastActive: 'Now' },
            { lat: 35.6762, lng: 139.6503, city: 'Tokyo', country: 'Japan', status: 'active', sessionTime: 156, totalTime: 5800, lastActive: 'Now' },
            { lat: 37.5665, lng: 126.9780, city: 'Seoul', country: 'South Korea', status: 'active', sessionTime: 92, totalTime: 3900, lastActive: 'Now' },
            { lat: 1.3521, lng: 103.8198, city: 'Singapore', country: 'Singapore', status: 'active', sessionTime: 134, totalTime: 4500, lastActive: 'Now' },
            { lat: 51.5074, lng: -0.1278, city: 'London', country: 'UK', status: 'idle', sessionTime: 0, totalTime: 2800, lastActive: '2 hours ago' },
            { lat: 48.8566, lng: 2.3522, city: 'Paris', country: 'France', status: 'idle', sessionTime: 0, totalTime: 1900, lastActive: '45 min ago' },
            { lat: 52.5200, lng: 13.4050, city: 'Berlin', country: 'Germany', status: 'active', sessionTime: 78, totalTime: 3200, lastActive: 'Now' },
            { lat: 40.7128, lng: -74.0060, city: 'New York', country: 'USA', status: 'active', sessionTime: 167, totalTime: 6100, lastActive: 'Now' },
            { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'USA', status: 'active', sessionTime: 143, totalTime: 5200, lastActive: 'Now' },
            { lat: 34.0522, lng: -118.2437, city: 'Los Angeles', country: 'USA', status: 'idle', sessionTime: 0, totalTime: 2700, lastActive: '1 hour ago' },
            { lat: 43.6532, lng: -79.3832, city: 'Toronto', country: 'Canada', status: 'offline', sessionTime: 0, totalTime: 1500, lastActive: '8 hours ago' },
            { lat: 19.0760, lng: 72.8777, city: 'Mumbai', country: 'India', status: 'active', sessionTime: 201, totalTime: 7200, lastActive: 'Now' },
            { lat: 25.2048, lng: 55.2708, city: 'Dubai', country: 'UAE', status: 'active', sessionTime: 112, totalTime: 4100, lastActive: 'Now' },
            { lat: -23.5505, lng: -46.6333, city: 'São Paulo', country: 'Brazil', status: 'active', sessionTime: 95, totalTime: 3600, lastActive: 'Now' },
            { lat: 19.4326, lng: -99.1332, city: 'Mexico City', country: 'Mexico', status: 'idle', sessionTime: 0, totalTime: 2200, lastActive: '30 min ago' },
            { lat: -33.9249, lng: 18.4241, city: 'Cape Town', country: 'South Africa', status: 'active', sessionTime: 87, totalTime: 2900, lastActive: 'Now' },
        ];
    }
    
    createGlobe() {
        this.globe = Globe()
            (document.getElementById('globeViz'))
            // Globe appearance
            .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
            .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
            .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
            
            // Atmosphere glow
            .atmosphereColor('#6366f1')
            .atmosphereAltitude(0.15)
            
            // Points (devices)
            .pointsData(this.devices)
            .pointLat('lat')
            .pointLng('lng')
            .pointAltitude(0.01)
            .pointRadius(0.4)
            .pointColor(d => this.getStatusColor(d.status))
            .pointLabel(d => `
                <div style="
                    background: rgba(15, 23, 42, 0.95);
                    padding: 12px 16px;
                    border-radius: 8px;
                    border: 1px solid rgba(99, 102, 241, 0.3);
                    color: #f9fafb;
                    font-family: -apple-system, sans-serif;
                    font-size: 13px;
                    line-height: 1.6;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                ">
                    <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px; color: ${this.getStatusColor(d.status)};">
                        ${d.city}, ${d.country}
                    </div>
                    <div style="color: #9ca3af; font-size: 12px;">
                        Status: <span style="color: #f9fafb;">${d.status}</span>
                    </div>
                    <div style="color: #9ca3af; font-size: 12px;">
                        Session: <span style="color: #f9fafb;">${d.sessionTime} min</span>
                    </div>
                </div>
            `)
            .onPointClick(this.handlePointClick.bind(this))
            
            // Rings animation for active devices
            .ringsData(this.devices.filter(d => d.status === 'active'))
            .ringLat('lat')
            .ringLng('lng')
            .ringMaxRadius(3)
            .ringPropagationSpeed(2)
            .ringRepeatPeriod(2000)
            .ringColor(() => 'rgba(16, 185, 129, 0.3)')
            
            // Camera
            .pointOfView({ altitude: 2.5 })
            
            // Controls
            .controls(this.globe.controls())
            .enablePointerInteraction(true);
        
        // Add day/night terminator
        this.addDayNightTerminator();
        
        // Start auto-rotation
        this.startAutoRotation();
    }
    
    addDayNightTerminator() {
        // Calculate sun position based on current time
        const now = new Date();
        const hours = now.getUTCHours();
        const minutes = now.getUTCMinutes();
        const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        
        // Solar declination (simplified)
        const declination = -23.45 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));
        
        // Create terminator arc (simplified)
        const terminatorData = [];
        for (let lat = -90; lat <= 90; lat += 5) {
            const sunLng = (hours + minutes / 60) * 15 - 180; // Solar longitude
            terminatorData.push({
                startLat: lat,
                startLng: sunLng - 90,
                endLat: lat + 5,
                endLng: sunLng - 90
            });
        }
        
        // Note: Globe.GL doesn't have built-in terminator support
        // For production, you'd use custom Three.js shader or arcsData
        // Keeping it simple for MVP
    }
    
    getStatusColor(status) {
        const colors = {
            'active': '#10b981',   // Green
            'idle': '#f59e0b',     // Orange
            'offline': '#ef4444'   // Red
        };
        return colors[status] || colors.offline;
    }
    
    handlePointClick(point) {
        if (!point) return;
        
        // Stop auto-rotation when interacting
        this.autoRotate = false;
        
        // Update info panel
        document.getElementById('deviceLocation').textContent = `${point.city}, ${point.country}`;
        document.getElementById('deviceStatus').textContent = point.status.charAt(0).toUpperCase() + point.status.slice(1);
        document.getElementById('sessionTime').textContent = `${point.sessionTime} min`;
        document.getElementById('totalTime').textContent = `${Math.floor(point.totalTime / 60)}h ${point.totalTime % 60}m`;
        document.getElementById('lastActive').textContent = point.lastActive;
        
        // Show panel
        document.getElementById('infoPanel').classList.add('visible');
        
        // Point camera at device
        this.globe.pointOfView({
            lat: point.lat,
            lng: point.lng,
            altitude: 2
        }, 1000);
    }
    
    setupControls() {
        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', () => {
            const pov = this.globe.pointOfView();
            this.globe.pointOfView({ altitude: Math.max(pov.altitude - 0.5, 1) }, 500);
        });
        
        document.getElementById('zoomOut').addEventListener('click', () => {
            const pov = this.globe.pointOfView();
            this.globe.pointOfView({ altitude: Math.min(pov.altitude + 0.5, 4) }, 500);
        });
        
        document.getElementById('resetView').addEventListener('click', () => {
            this.globe.pointOfView({ lat: 0, lng: 0, altitude: 2.5 }, 1000);
            this.autoRotate = true;
        });
        
        // Close info panel
        document.getElementById('closeBtn').addEventListener('click', () => {
            document.getElementById('infoPanel').classList.remove('visible');
            this.autoRotate = true;
        });
        
        // Disable auto-rotate on user interaction
        const controls = this.globe.controls();
        controls.addEventListener('start', () => {
            this.autoRotate = false;
        });
    }
    
    startAutoRotation() {
        setInterval(() => {
            if (this.autoRotate) {
                const pov = this.globe.pointOfView();
                this.globe.pointOfView({
                    lat: pov.lat,
                    lng: pov.lng - 0.2,  // Slow rotation speed
                    altitude: pov.altitude
                });
            }
        }, 50);
    }
    
    updateStats() {
        const totalBoxes = this.devices.length;
        const activeBoxes = this.devices.filter(d => d.status === 'active').length;
        const hoursSaved = this.devices.reduce((sum, d) => sum + Math.floor(d.totalTime / 60), 0);
        
        // Animate counters
        this.animateCounter('totalBoxes', totalBoxes);
        this.animateCounter('activeBoxes', activeBoxes);
        this.animateCounter('hoursSaved', hoursSaved);
        
        // Update last update time
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
    }
    
    animateCounter(id, target) {
        const element = document.getElementById(id);
        const start = parseInt(element.textContent) || 0;
        const duration = 1000;
        const startTime = Date.now();
        
        const updateCounter = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (target - start) * progress);
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };
        
        updateCounter();
    }
    
    async refreshData() {
        // Reload device data
        await this.loadDevices();
        
        // Update globe points
        this.globe
            .pointsData(this.devices)
            .ringsData(this.devices.filter(d => d.status === 'active'));
        
        // Update stats
        this.updateStats();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SacredGlobe());
} else {
    new SacredGlobe();
}