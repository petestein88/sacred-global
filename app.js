// Sacred Global - Live Device Status Visualization
// This simulates live device data - replace with real API calls in production

class GlobeVisualizer {
    constructor() {
        this.canvas = document.getElementById('globeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.devices = [];
        this.rotation = 0;
        this.animationId = null;
        
        this.setupCanvas();
        this.generateMockDevices();
        this.setupEventListeners();
        this.startAnimation();
        this.updateStats();
        
        // Hide loading indicator
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
        }, 1500);
    }
    
    setupCanvas() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth, container.clientHeight);
        this.canvas.width = size;
        this.canvas.height = size;
        this.centerX = size / 2;
        this.centerY = size / 2;
        this.radius = size * 0.4;
    }
    
    generateMockDevices() {
        // Mock device data with geographic distribution
        const locations = [
            { name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, status: 'active' },
            { name: 'Melbourne, Australia', lat: -37.8136, lon: 144.9631, status: 'idle' },
            { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, status: 'active' },
            { name: 'Seoul, South Korea', lat: 37.5665, lon: 126.9780, status: 'active' },
            { name: 'Singapore', lat: 1.3521, lon: 103.8198, status: 'active' },
            { name: 'London, UK', lat: 51.5074, lon: -0.1278, status: 'idle' },
            { name: 'New York, USA', lat: 40.7128, lon: -74.0060, status: 'active' },
            { name: 'San Francisco, USA', lat: 37.7749, lon: -122.4194, status: 'active' },
            { name: 'Toronto, Canada', lat: 43.6532, lon: -79.3832, status: 'offline' },
            { name: 'Berlin, Germany', lat: 52.5200, lon: 13.4050, status: 'active' },
            { name: 'Paris, France', lat: 48.8566, lon: 2.3522, status: 'idle' },
            { name: 'Mumbai, India', lat: 19.0760, lon: 72.8777, status: 'active' },
            { name: 'Dubai, UAE', lat: 25.2048, lon: 55.2708, status: 'active' },
            { name: 'São Paulo, Brazil', lat: -23.5505, lon: -46.6333, status: 'active' },
            { name: 'Mexico City, Mexico', lat: 19.4326, lon: -99.1332, status: 'idle' },
        ];
        
        this.devices = locations.map((loc, index) => ({
            id: `device-${index}`,
            location: loc.name,
            lat: loc.lat,
            lon: loc.lon,
            status: loc.status,
            sessionTime: Math.floor(Math.random() * 180) + 10, // 10-190 minutes
            totalTime: Math.floor(Math.random() * 5000) + 500, // 500-5500 minutes
            lastActive: this.getRandomLastActive(loc.status)
        }));
    }
    
    getRandomLastActive(status) {
        if (status === 'active') return 'Now';
        if (status === 'idle') return `${Math.floor(Math.random() * 30) + 1} min ago`;
        return `${Math.floor(Math.random() * 24) + 1} hours ago`;
    }
    
    latLonToXY(lat, lon, rotation) {
        // Convert lat/lon to 3D coordinates, then project to 2D
        const adjustedLon = lon + rotation;
        const latRad = (lat * Math.PI) / 180;
        const lonRad = (adjustedLon * Math.PI) / 180;
        
        const x = this.radius * Math.cos(latRad) * Math.sin(lonRad);
        const y = this.radius * Math.sin(latRad);
        const z = this.radius * Math.cos(latRad) * Math.cos(lonRad);
        
        // Only show devices on the visible hemisphere
        if (z < 0) return null;
        
        return {
            x: this.centerX + x,
            y: this.centerY - y,
            z: z,
            visible: true
        };
    }
    
    drawGlobe() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw globe background
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, this.radius * 0.5,
            this.centerX, this.centerY, this.radius
        );
        gradient.addColorStop(0, '#1e293b');
        gradient.addColorStop(1, '#0f172a');
        
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Draw subtle grid lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        // Latitude lines
        for (let lat = -60; lat <= 60; lat += 30) {
            this.ctx.beginPath();
            for (let lon = -180; lon <= 180; lon += 5) {
                const pos = this.latLonToXY(lat, lon, this.rotation);
                if (pos) {
                    if (lon === -180) {
                        this.ctx.moveTo(pos.x, pos.y);
                    } else {
                        this.ctx.lineTo(pos.x, pos.y);
                    }
                }
            }
            this.ctx.stroke();
        }
        
        // Longitude lines
        for (let lon = -180; lon <= 180; lon += 30) {
            this.ctx.beginPath();
            for (let lat = -90; lat <= 90; lat += 5) {
                const pos = this.latLonToXY(lat, lon, this.rotation);
                if (pos) {
                    if (lat === -90) {
                        this.ctx.moveTo(pos.x, pos.y);
                    } else {
                        this.ctx.lineTo(pos.x, pos.y);
                    }
                }
            }
            this.ctx.stroke();
        }
        
        // Draw devices
        this.devices.forEach(device => {
            const pos = this.latLonToXY(device.lat, device.lon, this.rotation);
            if (pos) {
                this.drawDevice(pos.x, pos.y, device.status, pos.z);
            }
        });
    }
    
    drawDevice(x, y, status, z) {
        const colors = {
            active: '#10b981',
            idle: '#f59e0b',
            offline: '#ef4444'
        };
        
        const color = colors[status] || colors.offline;
        const size = 4 + (z / this.radius) * 3; // Perspective sizing
        
        // Glow effect for active devices
        if (status === 'active') {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = color;
        } else {
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = color;
        }
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        
        // Pulse animation for active devices
        if (status === 'active') {
            const pulseSize = size + Math.sin(Date.now() / 500) * 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 1;
            this.ctx.globalAlpha = 0.3;
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }
    }
    
    startAnimation() {
        const animate = () => {
            this.rotation += 0.2; // Slow rotation
            if (this.rotation >= 360) this.rotation = 0;
            
            this.drawGlobe();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    updateStats() {
        const activeCount = this.devices.filter(d => d.status === 'active').length;
        const countries = new Set(this.devices.map(d => d.location.split(',')[1]?.trim() || 'Unknown')).size;
        const totalSessions = this.devices.reduce((sum, d) => sum + Math.floor(d.totalTime / 30), 0);
        
        document.getElementById('activeDevices').textContent = activeCount;
        document.getElementById('countriesCount').textContent = countries;
        document.getElementById('totalSessions').textContent = totalSessions;
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
        
        // Update every 5 seconds
        setTimeout(() => this.updateStats(), 5000);
    }
    
    setupEventListeners() {
        // Click on canvas to show device info
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Find clicked device
            for (const device of this.devices) {
                const pos = this.latLonToXY(device.lat, device.lon, this.rotation);
                if (pos) {
                    const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
                    if (distance < 10) {
                        this.showDeviceInfo(device);
                        return;
                    }
                }
            }
        });
        
        // Close info panel
        document.getElementById('closeBtn').addEventListener('click', () => {
            document.getElementById('infoPanel').classList.remove('visible');
        });
    }
    
    showDeviceInfo(device) {
        document.getElementById('locationName').textContent = device.location;
        document.getElementById('deviceStatus').textContent = device.status.charAt(0).toUpperCase() + device.status.slice(1);
        document.getElementById('sessionTime').textContent = `${device.sessionTime} min`;
        document.getElementById('totalTime').textContent = `${Math.floor(device.totalTime / 60)}h ${device.totalTime % 60}m`;
        document.getElementById('lastActive').textContent = device.lastActive;
        
        document.getElementById('infoPanel').classList.add('visible');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GlobeVisualizer();
});