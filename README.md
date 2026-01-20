# ❄️ Voxel Snow Plow Game

A fun, cartoon-style snow plowing game built with Three.js and voxel art aesthetics!

## 🎮 About

Clear the streets of snow with your trusty voxel snow plow! Drive around the arena, plow through snow blocks, and watch them pop away with satisfying cartoon physics. Complete the level by clearing all the snow!

## ✨ Features

- **Voxel Art Style**: Charming blocky graphics reminiscent of retro games
- **Cartoon Physics**: Bouncy, exaggerated vehicle movement and collisions
- **Dynamic Snow Removal**: Watch snow blocks fly away as you plow through them
- **Smooth Camera**: Follow camera that tracks your plow's movement
- **Score Tracking**: Keep track of snow blocks cleared and completion percentage
- **Responsive Controls**: Intuitive WASD/Arrow key controls

## 🕹️ Controls

- **W / ↑**: Accelerate forward
- **S / ↓**: Brake / Reverse
- **A / ←**: Turn left
- **D / →**: Turn right
- **Space**: Handbrake (drift!)
- **R**: Reset position if you get stuck

## 🚀 How to Play

1. Open `index.html` in a modern web browser
2. Click "Start Plowing!" to begin
3. Drive around and clear all the snow blocks
4. Complete the level by removing all snow!

## 🛠️ Technical Details

### Technologies Used
- **Three.js** (r128): 3D rendering engine
- **Vanilla JavaScript**: Game logic and physics
- **CSS3**: UI styling and animations

### Game Features

#### Voxel Rendering System
- Custom voxel creation function for blocky aesthetic
- Procedural snow pile generation
- Voxel-style walls and terrain

#### Cartoon Physics
- Exaggerated acceleration and friction
- Bouncy wall collisions
- Momentum-based turning
- Visual bounce effects on impact

#### Snow Mechanics
- Random snow pile heights (1-2 blocks)
- Collision detection with plow
- Animated snow removal (pop and spin away)
- Progress tracking

#### Camera System
- Smooth follow camera with interpolation
- Dynamic positioning based on plow rotation
- Ideal viewing angle for gameplay

## 📁 Project Structure

```
Vibes/
├── index.html      # Main HTML file with UI
├── style.css       # Styling and animations
├── game.js         # Core game logic
└── README.md       # This file
```

## 🎨 Customization

You can easily customize the game by modifying these parameters in `game.js`:

```javascript
// Physics properties
this.acceleration = 0.15;      // How fast the plow accelerates
this.maxSpeed = 0.8;           // Maximum plow speed
this.friction = 0.92;          // Friction coefficient (higher = less friction)
this.turnSpeed = 0.04;         // How fast the plow turns
this.bounciness = 0.6;         // Wall bounce intensity

// Grid settings
this.gridSize = 40;            // Size of the play area
this.voxelSize = 1;            // Size of each voxel block
```

## 🌟 Future Enhancement Ideas

- Multiple levels with different layouts
- Obstacles and hazards
- Time-based challenges
- Power-ups (speed boost, bigger plow, etc.)
- Different weather conditions
- Multiplayer mode
- Mobile touch controls
- Sound effects and music

## 🖥️ Browser Compatibility

Works best in modern browsers that support:
- WebGL
- ES6 JavaScript
- CSS3 animations

Tested on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## 📝 License

This is a personal project created for fun and learning. Feel free to use and modify as you like!

## 🎉 Have Fun!

Enjoy plowing snow in this charming voxel world! Remember, in this game, the snow won't plow itself! ⛄
