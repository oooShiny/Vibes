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

        // Physics properties (cartoon style - exaggerated)
        this.plowVelocity = new THREE.Vector3(0, 0, 0);
        this.plowRotation = 0;
        this.plowRotationVelocity = 0;
        this.acceleration = 0.15;
        this.maxSpeed = 0.8;
        this.friction = 0.92;
        this.turnSpeed = 0.04;
        this.bounciness = 0.6;

        // Controls
        this.keys = {};

        // Grid settings
        this.gridSize = 40;
        this.voxelSize = 1;

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

        // Main body (orange)
        const body = this.createVoxel(0, 1, 0, 0xFF6600, 2);
        this.snowPlow.add(body);

        // Cabin (yellow)
        const cabin = this.createVoxel(0, 2.5, -0.3, 0xFFDD00, 1.5);
        this.snowPlow.add(cabin);

        // Plow blade (silver) - front
        const blade = this.createVoxel(0, 0.8, 1.5, 0xC0C0C0, 2.5);
        blade.scale.z = 0.3;
        this.snowPlow.add(blade);

        // Wheels (black)
        const wheelPositions = [
            [-0.8, 0.3, 0.8],
            [0.8, 0.3, 0.8],
            [-0.8, 0.3, -0.8],
            [0.8, 0.3, -0.8]
        ];

        wheelPositions.forEach(pos => {
            const wheel = this.createVoxel(pos[0], pos[1], pos[2], 0x222222, 0.6);
            this.snowPlow.add(wheel);
        });

        // Lights (bright yellow)
        const leftLight = this.createVoxel(-0.6, 1.5, 1.3, 0xFFFF00, 0.4);
        const rightLight = this.createVoxel(0.6, 1.5, 1.3, 0xFFFF00, 0.4);
        this.snowPlow.add(leftLight);
        this.snowPlow.add(rightLight);

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

        // Forward/Backward
        if (this.keys['w'] || this.keys['arrowup']) {
            const forward = new THREE.Vector3(
                Math.sin(this.plowRotation),
                0,
                Math.cos(this.plowRotation)
            ).multiplyScalar(this.acceleration);
            this.plowVelocity.add(forward);
        }

        if (this.keys['s'] || this.keys['arrowdown']) {
            const backward = new THREE.Vector3(
                Math.sin(this.plowRotation),
                0,
                Math.cos(this.plowRotation)
            ).multiplyScalar(-this.acceleration * 0.6);
            this.plowVelocity.add(backward);
        }

        // Turning (only when moving)
        const speed = this.plowVelocity.length();
        if (speed > 0.05) {
            if (this.keys['a'] || this.keys['arrowleft']) {
                this.plowRotationVelocity += this.turnSpeed;
            }
            if (this.keys['d'] || this.keys['arrowright']) {
                this.plowRotationVelocity -= this.turnSpeed;
            }
        }

        // Handbrake
        if (this.keys[' ']) {
            this.plowVelocity.multiplyScalar(0.85);
        }

        // Apply speed limit
        if (this.plowVelocity.length() > this.maxSpeed) {
            this.plowVelocity.normalize().multiplyScalar(this.maxSpeed);
        }

        // Apply friction
        this.plowVelocity.multiplyScalar(this.friction);
        this.plowRotationVelocity *= 0.88;

        // Update rotation
        this.plowRotation += this.plowRotationVelocity;
        this.snowPlow.rotation.y = -this.plowRotation;

        // Update position
        this.snowPlow.position.add(this.plowVelocity);

        // Boundary collision with bounce (cartoon physics)
        const maxBound = this.gridSize / 2 - 3;

        if (Math.abs(this.snowPlow.position.x) > maxBound) {
            this.snowPlow.position.x = Math.sign(this.snowPlow.position.x) * maxBound;
            this.plowVelocity.x *= -this.bounciness;
            this.plowVelocity.z *= 0.7;
            this.createBounceEffect(this.snowPlow.position);
        }

        if (Math.abs(this.snowPlow.position.z) > maxBound) {
            this.snowPlow.position.z = Math.sign(this.snowPlow.position.z) * maxBound;
            this.plowVelocity.z *= -this.bounciness;
            this.plowVelocity.x *= 0.7;
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

        for (let i = this.snowBlocks.length - 1; i >= 0; i--) {
            const snowBlock = this.snowBlocks[i];
            const snowPos = snowBlock.position;

            const distance = Math.sqrt(
                Math.pow(plowPos.x - snowPos.x, 2) +
                Math.pow(plowPos.z - snowPos.z, 2)
            );

            if (distance < plowRadius && this.plowVelocity.length() > 0.1) {
                // Remove snow with animation
                this.removeSnowBlock(snowBlock, i);
            }
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

        const speed = Math.round(this.plowVelocity.length() * 50);
        document.getElementById('speed').textContent = speed;

        const progress = Math.round((this.score / this.totalSnowBlocks) * 100);
        document.getElementById('progress').textContent = progress;
    }

    updateCamera() {
        // Follow camera with smooth interpolation
        const idealOffset = new THREE.Vector3(
            -Math.sin(this.plowRotation) * 15,
            12,
            -Math.cos(this.plowRotation) * 15
        );

        const idealLookAt = this.snowPlow.position.clone();
        idealLookAt.y += 2;

        // Smooth camera movement
        const t = 0.1;
        this.camera.position.x += (this.snowPlow.position.x + idealOffset.x - this.camera.position.x) * t;
        this.camera.position.y += (this.snowPlow.position.y + idealOffset.y - this.camera.position.y) * t;
        this.camera.position.z += (this.snowPlow.position.z + idealOffset.z - this.camera.position.z) * t;

        this.camera.lookAt(idealLookAt);
    }

    resetPlowPosition() {
        this.snowPlow.position.set(0, 0, 0);
        this.plowVelocity.set(0, 0, 0);
        this.plowRotation = 0;
        this.plowRotationVelocity = 0;
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
