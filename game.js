// Voxel Snow Plow Game
// A fun cartoon-physics snow plowing game with voxel art style

class VoxelSnowPlowGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.snowPlow = null;
        this.snowBlocks = [];
        this.terrain = null;

        // Game state
        this.gameStarted = false;
        this.score = 0;
        this.totalSnowBlocks = 0;

        // Enhanced physics properties
        this.forwardVelocity = 0;
        this.lateralVelocity = 0;
        this.plowRotation = 0;
        this.plowRotationVelocity = 0;

        // Acceleration with curve
        this.acceleration = 0.008;
        this.maxSpeed = 0.5;
        this.reverseSpeed = 0.25;

        // Friction and drag
        this.forwardFriction = 0.98;
        this.lateralFriction = 0.85;  // Higher lateral friction for realistic handling
        this.rotationDamping = 0.90;

        // Turning dynamics
        this.baseTurnSpeed = 0.012;
        this.speedTurnFactor = 0.6;  // Turning gets harder at high speed

        // Drift and slide
        this.driftThreshold = 0.15;
        this.isDrifting = false;

        // Visual feedback
        this.bodyTilt = 0;
        this.tiltSpeed = 0.15;
        this.tiltDamping = 0.85;

        // Camera properties
        this.cameraDistance = 18;
        this.cameraHeight = 10;
        this.cameraLookAhead = 3;
        this.cameraSmoothing = 0.08;
        this.cameraTargetPos = new THREE.Vector3();
        this.cameraTargetLook = new THREE.Vector3();

        // Particle systems
        this.particles = [];
        this.tireTrackMarks = [];
        this.maxTireMarks = 100;

        // Controls
        this.keys = {};

        // Grid settings
        this.gridSize = 40;
        this.voxelSize = 1;

        // Wall bounce
        this.bounciness = 0.6;

        this.init();
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 80);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 20, 20);
        this.camera.lookAt(0, 0, 0);

        // Initialize camera targets
        this.cameraTargetPos.copy(this.camera.position);
        this.cameraTargetLook.set(0, 0, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Add lights
        this.setupLights();

        // Create terrain
        this.createTerrain();

        // Create snow
        this.createSnow();

        // Create snow plow
        this.createSnowPlow();

        // Setup controls
        this.setupControls();

        // Setup UI
        this.setupUI();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Start animation loop
        this.animate();
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 50, 50);
        dirLight.castShadow = true;
        dirLight.shadow.camera.left = -50;
        dirLight.shadow.camera.right = 50;
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = -50;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);
    }

    createVoxel(x, y, z, color, size = 1) {
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshLambertMaterial({ color: color });
        const voxel = new THREE.Mesh(geometry, material);
        voxel.position.set(x, y, z);
        voxel.castShadow = true;
        voxel.receiveShadow = true;
        return voxel;
    }

    createTerrain() {
        // Create ground plane
        const groundSize = this.gridSize * this.voxelSize;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        this.terrain = new THREE.Mesh(groundGeometry, groundMaterial);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;
        this.scene.add(this.terrain);

        // Add border walls (voxel style)
        const wallHeight = 3;
        const wallColor = 0x8B4513;

        for (let i = -this.gridSize / 2; i <= this.gridSize / 2; i++) {
            for (let h = 0; h < wallHeight; h++) {
                // North and South walls
                const northWall = this.createVoxel(i, h + 0.5, -this.gridSize / 2, wallColor);
                const southWall = this.createVoxel(i, h + 0.5, this.gridSize / 2, wallColor);
                this.scene.add(northWall);
                this.scene.add(southWall);

                // East and West walls
                if (i !== -this.gridSize / 2 && i !== this.gridSize / 2) {
                    const eastWall = this.createVoxel(this.gridSize / 2, h + 0.5, i, wallColor);
                    const westWall = this.createVoxel(-this.gridSize / 2, h + 0.5, i, wallColor);
                    this.scene.add(eastWall);
                    this.scene.add(westWall);
                }
            }
        }
    }

    createSnow() {
        // Create random snow piles (voxel blocks)
        const snowColor = 0xFFFFFF;
        const centerClear = 5; // Clear area in center for starting position

        for (let x = -this.gridSize / 2 + 2; x < this.gridSize / 2 - 2; x += 1) {
            for (let z = -this.gridSize / 2 + 2; z < this.gridSize / 2 - 2; z += 1) {
                // Skip center area
                if (Math.abs(x) < centerClear && Math.abs(z) < centerClear) {
                    continue;
                }

                // Random snow placement (70% coverage)
                if (Math.random() > 0.3) {
                    const height = Math.floor(Math.random() * 2) + 1; // 1-2 blocks tall

                    for (let y = 0; y < height; y++) {
                        const snowBlock = this.createVoxel(x, y + 0.5, z, snowColor);
                        snowBlock.userData.isSnow = true;
                        snowBlock.userData.gridX = x;
                        snowBlock.userData.gridZ = z;
                        snowBlock.userData.layer = y;
                        this.scene.add(snowBlock);
                        this.snowBlocks.push(snowBlock);
                    }
                }
            }
        }

        this.totalSnowBlocks = this.snowBlocks.length;
    }

    createSnowPlow() {
        // Create a voxel-style snow plow
        this.snowPlow = new THREE.Group();

        // Create body container for tilt animation
        this.snowPlowBody = new THREE.Group();
        this.snowPlow.add(this.snowPlowBody);

        // Main body (orange)
        const body = this.createVoxel(0, 1, 0, 0xFF6600, 2);
        this.snowPlowBody.add(body);

        // Cabin (yellow)
        const cabin = this.createVoxel(0, 2.5, -0.3, 0xFFDD00, 1.5);
        this.snowPlowBody.add(cabin);

        // Plow blade (silver) - front
        const blade = this.createVoxel(0, 0.8, 1.5, 0xC0C0C0, 2.5);
        blade.scale.z = 0.3;
        this.snowPlowBody.add(blade);

        // Wheels (black) - store for animation
        this.wheels = [];
        const wheelPositions = [
            [-0.8, 0.3, 0.8],
            [0.8, 0.3, 0.8],
            [-0.8, 0.3, -0.8],
            [0.8, 0.3, -0.8]
        ];

        wheelPositions.forEach(pos => {
            const wheel = this.createVoxel(pos[0], pos[1], pos[2], 0x222222, 0.6);
            this.snowPlow.add(wheel);  // Wheels don't tilt
            this.wheels.push(wheel);
        });

        // Lights (bright yellow)
        const leftLight = this.createVoxel(-0.6, 1.5, 1.3, 0xFFFF00, 0.4);
        const rightLight = this.createVoxel(0.6, 1.5, 1.3, 0xFFFF00, 0.4);
        this.snowPlowBody.add(leftLight);
        this.snowPlowBody.add(rightLight);

        // Set initial position
        this.snowPlow.position.set(0, 0, 0);
        this.scene.add(this.snowPlow);
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            // Handle special keys
            if (e.key === 'r' || e.key === 'R') {
                this.resetPlowPosition();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    setupUI() {
        const startBtn = document.getElementById('start-btn');
        const restartBtn = document.getElementById('restart-btn');

        startBtn.addEventListener('click', () => {
            document.getElementById('start-screen').classList.add('hidden');
            this.gameStarted = true;
        });

        restartBtn.addEventListener('click', () => {
            this.resetGame();
        });
    }

    updateControls() {
        if (!this.gameStarted) return;

        // Acceleration input (non-linear for better feel)
        if (this.keys['w'] || this.keys['arrowup']) {
            // Acceleration curve - easier to start, harder to reach max speed
            const speedRatio = Math.abs(this.forwardVelocity) / this.maxSpeed;
            const accelMultiplier = 1.0 - (speedRatio * 0.5);
            this.forwardVelocity += this.acceleration * accelMultiplier;
        }

        if (this.keys['s'] || this.keys['arrowdown']) {
            // Braking or reverse
            if (this.forwardVelocity > 0.01) {
                // Braking (faster than friction)
                this.forwardVelocity -= this.acceleration * 1.5;
            } else {
                // Reverse (slower than forward)
                this.forwardVelocity -= this.acceleration * 0.7;
            }
        }

        // Speed limits
        this.forwardVelocity = Math.max(-this.reverseSpeed, Math.min(this.maxSpeed, this.forwardVelocity));

        // Speed-based turning
        const speed = Math.abs(this.forwardVelocity);
        const canTurn = speed > 0.02;

        if (canTurn) {
            // Turn speed decreases at high speeds (more realistic)
            const speedFactor = 1.0 - (speed / this.maxSpeed) * this.speedTurnFactor;
            const effectiveTurnSpeed = this.baseTurnSpeed * speedFactor;

            // Turning direction depends on forward/reverse
            const turnDirection = this.forwardVelocity >= 0 ? 1 : -1;

            if (this.keys['a'] || this.keys['arrowleft']) {
                this.plowRotationVelocity += effectiveTurnSpeed * turnDirection;
            }
            if (this.keys['d'] || this.keys['arrowright']) {
                this.plowRotationVelocity -= effectiveTurnSpeed * turnDirection;
            }
        }

        // Handbrake - creates drift
        if (this.keys[' ']) {
            this.forwardVelocity *= 0.96;
            this.lateralVelocity *= 0.90;  // Less lateral friction when drifting
            this.isDrifting = true;
        } else {
            this.isDrifting = false;
        }

        // Apply rotation damping
        this.plowRotationVelocity *= this.rotationDamping;

        // Update rotation
        this.plowRotation += this.plowRotationVelocity;
        this.snowPlow.rotation.y = -this.plowRotation;

        // Calculate velocity in world space using forward/lateral components
        const forwardX = Math.sin(this.plowRotation) * this.forwardVelocity;
        const forwardZ = Math.cos(this.plowRotation) * this.forwardVelocity;

        const lateralX = Math.cos(this.plowRotation) * this.lateralVelocity;
        const lateralZ = -Math.sin(this.plowRotation) * this.lateralVelocity;

        // Update position
        this.snowPlow.position.x += forwardX + lateralX;
        this.snowPlow.position.z += forwardZ + lateralZ;

        // Apply friction
        this.forwardVelocity *= this.forwardFriction;
        this.lateralVelocity *= this.lateralFriction;

        // Drift detection and lateral velocity from turning
        if (Math.abs(this.plowRotationVelocity) > this.driftThreshold && speed > 0.15) {
            this.lateralVelocity += this.plowRotationVelocity * speed * 2;
            this.isDrifting = true;
        }

        // Update body tilt based on turning
        const targetTilt = -this.plowRotationVelocity * 8;
        this.bodyTilt += (targetTilt - this.bodyTilt) * this.tiltSpeed;
        this.bodyTilt *= this.tiltDamping;
        this.snowPlowBody.rotation.z = this.bodyTilt;

        // Animate wheels
        this.animateWheels();

        // Leave tire tracks
        if (speed > 0.05 && this.gameStarted) {
            this.createTireTracks();
        }

        // Spawn particles when drifting
        if (this.isDrifting && speed > 0.2) {
            this.createDriftParticles();
        }

        // Boundary collision
        this.handleBoundaryCollision();
    }

    animateWheels() {
        const rotationSpeed = this.forwardVelocity * 3;
        this.wheels.forEach(wheel => {
            wheel.rotation.x += rotationSpeed;
        });
    }

    createTireTracks() {
        // Create simple tire track markers every few frames
        if (Math.random() > 0.7) {
            const trackGeometry = new THREE.PlaneGeometry(0.3, 0.6);
            const trackMaterial = new THREE.MeshBasicMaterial({
                color: 0x444444,
                transparent: true,
                opacity: 0.3
            });
            const track = new THREE.Mesh(trackGeometry, trackMaterial);
            track.rotation.x = -Math.PI / 2;
            track.rotation.z = -this.plowRotation;
            track.position.set(
                this.snowPlow.position.x,
                0.01,
                this.snowPlow.position.z
            );

            this.scene.add(track);
            this.tireTrackMarks.push(track);

            // Remove old tracks
            if (this.tireTrackMarks.length > this.maxTireMarks) {
                const oldTrack = this.tireTrackMarks.shift();
                this.scene.remove(oldTrack);
            }
        }
    }

    createDriftParticles() {
        // Create snow dust particles when drifting
        if (Math.random() > 0.5) {
            const particleGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);

            // Spawn behind the vehicle
            const offset = 2;
            particle.position.set(
                this.snowPlow.position.x - Math.sin(this.plowRotation) * offset,
                0.3,
                this.snowPlow.position.z - Math.cos(this.plowRotation) * offset
            );

            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                Math.random() * 0.05,
                (Math.random() - 0.5) * 0.1
            );
            particle.life = 1.0;

            this.scene.add(particle);
            this.particles.push(particle);
        }

        // Update and remove old particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.position.add(particle.velocity);
            particle.velocity.y -= 0.002;  // Gravity
            particle.life -= 0.02;
            particle.material.opacity = particle.life * 0.8;

            if (particle.life <= 0) {
                this.scene.remove(particle);
                this.particles.splice(i, 1);
            }
        }
    }

    handleBoundaryCollision() {
        const maxBound = this.gridSize / 2 - 3;

        if (Math.abs(this.snowPlow.position.x) > maxBound) {
            this.snowPlow.position.x = Math.sign(this.snowPlow.position.x) * maxBound;
            this.forwardVelocity *= -this.bounciness;
            this.lateralVelocity *= -this.bounciness;
            this.plowRotationVelocity *= -0.5;
            this.createBounceEffect(this.snowPlow.position);
        }

        if (Math.abs(this.snowPlow.position.z) > maxBound) {
            this.snowPlow.position.z = Math.sign(this.snowPlow.position.z) * maxBound;
            this.forwardVelocity *= -this.bounciness;
            this.lateralVelocity *= -this.bounciness;
            this.plowRotationVelocity *= -0.5;
            this.createBounceEffect(this.snowPlow.position);
        }
    }

    createBounceEffect(position) {
        // Visual bounce feedback - make plow jump slightly
        const bounceAnim = { y: 0 };
        const startY = this.snowPlow.position.y;

        const interval = setInterval(() => {
            bounceAnim.y += 0.1;
            this.snowPlow.position.y = startY + Math.sin(bounceAnim.y * Math.PI) * 0.5;

            if (bounceAnim.y >= 1) {
                this.snowPlow.position.y = startY;
                clearInterval(interval);
            }
        }, 16);
    }

    checkSnowCollision() {
        const plowPos = this.snowPlow.position;
        const plowRadius = 2;
        const speed = Math.abs(this.forwardVelocity);

        for (let i = this.snowBlocks.length - 1; i >= 0; i--) {
            const snowBlock = this.snowBlocks[i];
            const snowPos = snowBlock.position;

            const distance = Math.sqrt(
                Math.pow(plowPos.x - snowPos.x, 2) +
                Math.pow(plowPos.z - snowPos.z, 2)
            );

            if (distance < plowRadius && speed > 0.08) {
                // Remove snow with animation
                this.removeSnowBlock(snowBlock, i);

                // Create extra particles when hitting snow
                this.createSnowHitParticles(snowPos);
            }
        }
    }

    createSnowHitParticles(position) {
        // Burst of particles when snow is hit
        for (let i = 0; i < 5; i++) {
            const particleGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 1.0
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);

            particle.position.set(
                position.x + (Math.random() - 0.5) * 0.5,
                position.y + Math.random() * 0.5,
                position.z + (Math.random() - 0.5) * 0.5
            );

            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.15,
                Math.random() * 0.1 + 0.05,
                (Math.random() - 0.5) * 0.15
            );
            particle.life = 1.0;

            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    removeSnowBlock(snowBlock, index) {
        // Cartoon-style removal animation
        const startY = snowBlock.position.y;
        const startScale = 1;
        let progress = 0;

        const animInterval = setInterval(() => {
            progress += 0.15;

            // Pop up and shrink
            snowBlock.position.y = startY + Math.sin(progress * Math.PI) * 2;
            const scale = startScale * (1 - progress);
            snowBlock.scale.set(scale, scale, scale);
            snowBlock.rotation.x += 0.2;
            snowBlock.rotation.z += 0.3;

            if (progress >= 1) {
                this.scene.remove(snowBlock);
                clearInterval(animInterval);
            }
        }, 16);

        // Remove from array
        this.snowBlocks.splice(index, 1);
        this.score++;

        // Update UI
        this.updateUI();

        // Check win condition
        if (this.snowBlocks.length === 0) {
            this.gameComplete();
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;

        const speed = Math.round(Math.abs(this.forwardVelocity) * 50);
        document.getElementById('speed').textContent = speed;

        const progress = Math.round((this.score / this.totalSnowBlocks) * 100);
        document.getElementById('progress').textContent = progress;
    }

    updateCamera() {
        // Enhanced camera with look-ahead and smooth following
        const speed = Math.abs(this.forwardVelocity);

        // Dynamic camera distance based on speed
        const dynamicDistance = this.cameraDistance + (speed * 8);
        const dynamicHeight = this.cameraHeight + (speed * 4);

        // Camera position behind vehicle
        const idealOffset = new THREE.Vector3(
            -Math.sin(this.plowRotation) * dynamicDistance,
            dynamicHeight,
            -Math.cos(this.plowRotation) * dynamicDistance
        );

        // Look-ahead point (further when going faster)
        const lookAheadDistance = this.cameraLookAhead + (speed * 6);
        const idealLookAt = new THREE.Vector3(
            this.snowPlow.position.x + Math.sin(this.plowRotation) * lookAheadDistance,
            this.snowPlow.position.y + 2,
            this.snowPlow.position.z + Math.cos(this.plowRotation) * lookAheadDistance
        );

        // Smooth camera movement with separate smoothing for position and look
        this.cameraTargetPos.x += (this.snowPlow.position.x + idealOffset.x - this.cameraTargetPos.x) * this.cameraSmoothing;
        this.cameraTargetPos.y += (this.snowPlow.position.y + idealOffset.y - this.cameraTargetPos.y) * this.cameraSmoothing;
        this.cameraTargetPos.z += (this.snowPlow.position.z + idealOffset.z - this.cameraTargetPos.z) * this.cameraSmoothing;

        this.cameraTargetLook.x += (idealLookAt.x - this.cameraTargetLook.x) * this.cameraSmoothing * 1.2;
        this.cameraTargetLook.y += (idealLookAt.y - this.cameraTargetLook.y) * this.cameraSmoothing * 1.2;
        this.cameraTargetLook.z += (idealLookAt.z - this.cameraTargetLook.z) * this.cameraSmoothing * 1.2;

        this.camera.position.copy(this.cameraTargetPos);
        this.camera.lookAt(this.cameraTargetLook);
    }

    resetPlowPosition() {
        this.snowPlow.position.set(0, 0, 0);
        this.forwardVelocity = 0;
        this.lateralVelocity = 0;
        this.plowRotation = 0;
        this.plowRotationVelocity = 0;
        this.bodyTilt = 0;
        this.snowPlowBody.rotation.z = 0;

        // Clear particles and tracks
        this.particles.forEach(p => this.scene.remove(p));
        this.particles = [];
        this.tireTrackMarks.forEach(t => this.scene.remove(t));
        this.tireTrackMarks = [];
    }

    gameComplete() {
        this.gameStarted = false;
        document.getElementById('final-score').textContent =
            `You cleared ${this.score} snow blocks!`;
        document.getElementById('complete-screen').classList.remove('hidden');
    }

    resetGame() {
        // Remove all snow blocks
        this.snowBlocks.forEach(block => this.scene.remove(block));
        this.snowBlocks = [];

        // Reset state
        this.score = 0;
        this.resetPlowPosition();

        // Recreate snow
        this.createSnow();

        // Hide complete screen and show start screen
        document.getElementById('complete-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');

        this.updateUI();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.gameStarted) {
            this.updateControls();
            this.checkSnowCollision();
            this.updateCamera();
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new VoxelSnowPlowGame();
});
