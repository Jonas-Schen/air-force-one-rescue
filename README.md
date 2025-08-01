# Air Force One Rescue ✈️

A thrilling 3D web-based flight game where you pilot Air Force One through dangerous territory, avoiding enemies and managing fuel while completing rescue missions.

![Air Force One Rescue](https://img.shields.io/badge/Game-Air%20Force%20One%20Rescue-blue)
![Three.js](https://img.shields.io/badge/Three.js-0.176.0-green)
![Vite](https://img.shields.io/badge/Vite-6.3.5-purple)
![GSAP](https://img.shields.io/badge/GSAP-3.13.0-orange)

## 🕹️ Try it
https://jonas-schen.github.io/air-force-one-rescue/

PS: This isn't quite ready yet, there are still some bugs 🐛. We're working on improving it asap.

## 🎯 Game Story

Earth is under siege by alien invaders. Military defenses have collapsed and intercontinental missiles threaten total annihilation. The White House has fallen.

**Your Mission**: Pilot Air Force One to rescue the President and transport him to a safe fortress. Fly under fire from the alien stellar fleet, dodge hostile missiles, and break free from the wreckage of Washington D.C. Your mission is to fly to the designated safe zone to coordinate a counter-offensive.

Failure to escape means the President will be lost and Earth's last hope will end. **The fate of humanity depends on this evacuation.**

*"In God We Trust"* - Your courage is humanity's last hope.

## 🎮 Game Features

### Core Gameplay
- **3D Flight Simulation**: Immersive 3D environment powered by Three.js
- **Realistic Physics**: Authentic flight dynamics and aircraft behavior
- **Fuel Management System**: Monitor and manage fuel consumption with refueling mechanics
- **Enemy Encounters**: Dodge alien spaceships and incoming missiles
- **Progressive Difficulty**: Challenging gameplay that scales with distance traveled
- **Distance-Based Scoring**: Track your progress as you fly toward safety

### Advanced Features
- **Aerial Refueling**: Rendezvous with tanker aircraft for mid-flight refueling
- **Multi-language Support**: Full localization in 40+ languages
- **Responsive Controls**: Smooth keyboard controls with customizable settings
- **Real-time HUD**: Live display of speed, distance, fuel level, and remaining lives
- **Sound Effects**: Immersive audio experience with engine sounds and alerts
- **Pause System**: Pause/resume functionality for strategic planning

### Visual & Audio
- **3D Models**: Detailed aircraft models including Air Force One and enemy ships
- **Smooth Animations**: Powered by GSAP for fluid motion and transitions
- **Material Design UI**: Clean, modern interface with intuitive controls
- **Atmospheric Audio**: Engine sounds, refueling audio, and ambient effects

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm package manager

### Installation

1. Clone the repository:
```
git clone <repository-url>
cd air_force_one_rescue
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173/air-force-one-rescue/` (or the port shown in your terminal)

### Building for Deploy

```
npm run deploy
```


The built files will be available in the `dist` directory.

## 🎯 How to Play

### Controls

| Key | Action |
|-----|--------|
| ↑ | Move plane down |
| ↓ | Move plane up |
| ← | Move plane left |
| → | Move plane right |
| A | Increase speed |
| Z | Decrease speed |
| P | Pause/Unpause |

### Game Mechanics

#### Flight System
- **Speed Control**: Balance speed for optimal fuel consumption and maneuverability
- **Altitude Management**: Navigate through different flight levels to avoid threats
- **Physics-Based Movement**: Realistic aircraft response to player inputs

#### Fuel Management
- **Fuel Consumption**: Monitor your fuel gauge constantly
- **Aerial Refueling**: Connect with tanker aircraft when fuel is low (≤98%)
- **Refueling Process**: Position your aircraft precisely behind the tanker
- **Fuel Limitations**: Running out of fuel ends your mission

#### Enemy System
- **Alien Spaceships**: Dodge various types of hostile alien vessels
- **Missiles**: Avoid incoming projectiles and hostile fire
- **Dynamic Threats**: Enemy patterns that adapt to your flight path

#### Scoring & Progress
- **Distance Tracking**: Your progress measured in miles
- **Lives System**: Limited lives - avoid collisions and enemy fire
- **Game Over**: Mission ends when lives or fuel are depleted

### Aerial Refueling Guide

1. **Tanker Approach**: A refueling tanker will approach when your fuel is low
2. **Positioning**: Fly directly behind the tanker aircraft
3. **Connection**: Maintain precise position within the refueling zone
4. **Refueling**: Fuel will automatically transfer when properly connected
5. **Completion**: Tanker departs when refueling is complete or times out

## 🏗️ Project Structure

```
air_force_one_rescue/
├── src/
│   ├── lang/           # Language files for i18n (40+ languages)
│   ├── credits.js      # Credits and about information
│   ├── enemies.js      # Enemy aircraft and missiles logic
│   ├── game.js         # Main game logic and state management
│   ├── i18n.js         # Internationalization system
│   ├── main.js         # Main entry point
│   ├── opening.js      # Opening sequence and intro
│   ├── player.js       # Player aircraft controls and physics
│   ├── rockets.js      # Missile/rocket mechanics
│   ├── scripts.js      # Main script coordination
│   ├── style.css       # Game styling
│   ├── tanker.js       # Aerial refueling system
│   └── ui.js           # User interface management
├── assets/
│   ├── css/            # Stylesheets
│   ├── models/         # 3D aircraft models
│   └── sounds/         # Audio files
├── public/             # Static assets
├── index.html          # Main HTML file
├── package.json        # Project dependencies
└── README.md           # This file
```


## 🛠️ Technologies Used

- **[Three.js](https://threejs.org/)** (v0.176.0) - 3D graphics library for rendering
- **[GSAP](https://greensock.com/gsap/)** (v3.13.0) - Animation library for smooth transitions
- **[Vite](https://vitejs.dev/)** (v6.3.5) - Build tool and development server
- **Vanilla JavaScript** - Core game logic and mechanics
- **CSS3** - Styling, UI animations, and responsive design
- **HTML5** - Game structure and semantic markup
- **Web Audio API** - Sound effects and audio management

## 🌍 Internationalization

The game supports complete localization in 40+ languages:

### Supported Languages
- **European**: English, Spanish, French, German, Italian, Portuguese, Dutch, Polish, Czech, Slovak, Croatian, Estonian, Finnish, Danish, Norwegian, Icelandic, Lithuanian, Romanian, Slovenian, Hungarian
- **Asian**: Chinese (Simplified & Traditional), Japanese, Korean, Hindi, Bengali, Indonesian, Filipino
- **Middle Eastern**: Arabic, Hebrew, Turkish, Urdu, Persian
- **Other**: Russian, Ukrainian, Serbian, Macedonian, Georgian, Uzbek, Punjabi, Esperanto

Language files are modularly organized in `src/lang/` directory with complete UI translations.

## 🎨 Game Features Deep Dive

### Aerial Refueling System
- **Smart Approach**: Tankers automatically approach when fuel is critically low
- **Precision Mechanics**: Requires accurate positioning for successful connection
- **Realistic Process**: Gradual fuel transfer with visual and audio feedback
- **Timeout System**: Limited time window for refueling operations
- **Cooldown Period**: Strategic timing between refueling opportunities

### Enemy AI System
- **Dynamic Spawning**: Enemies appear based on distance and difficulty
- **Varied Threats**: Different enemy types with unique behaviors
- **Missile System**: Projectiles with tracking and collision detection
- **Escalating Difficulty**: Enemy density increases as you progress

### Performance Optimization
- **Delta Time**: Frame-rate independent animations and physics
- **Model Loading**: Efficient 3D model management and disposal
- **Audio Management**: Smart audio loading and playback optimization
- **Memory Management**: Proper cleanup of resources and objects

## 🎵 Audio System

- **Engine Sounds**: Realistic aircraft engine audio
- **Refueling Audio**: Fuel transfer sound effects
- **Ambient Effects**: Environmental and atmospheric audio
- **Sound Control**: Toggle audio on/off in settings
- **3D Audio**: Spatial audio positioning for immersive experience

## 🤝 Contributing
Please see [CONTRIBUTING](CONTRIBUTING.md) for details.

### Security
If you discover any security-related issues, please email jonasschen@gmail.com instead of using the issue tracker. Please do not email any questions, open an issue if you have a question.


### Development Guidelines
- Follow ES6+ standards;
- Maintain consistent code formatting;
- Add comments for complex game mechanics;
- Test across different browsers;
- Ensure responsive design compatibility;

## 📝 License
This project is licensed under the [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) — non-commercial use, attribution required.

## 🐛 Troubleshooting

- **Game not loading**: Ensure all dependencies are installed with `npm install`
- **Performance issues**: Try running in a modern browser with WebGL support
- **Audio not working**: Check browser audio permissions and game settings
- **3D models not appearing**: Verify WebGL is enabled in your browser
- **Language not changing**: Clear browser cache and reload the game

## 🏆 Game Tips

- **Fuel Management**: Always monitor your fuel gauge - refueling opportunities are limited
- **Speed Strategy**: Higher speeds consume more fuel but help avoid enemies
- **Positioning**: Master precise aircraft positioning for successful refueling
- **Enemy Patterns**: Learn enemy movement patterns to navigate safely
- **Distance Goals**: Set progressive distance milestones to track improvement

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

## 🙏 Credits

- **Images**: All images generated with AI
- **3D Models Library**: https://sketchfab.com
- **Sound Library**: https://mixkit.co/
- **Development**: Built with modern web technologies for optimal performance

---

**Ready for takeoff? The President's life and humanity's future depend on your piloting skills!** ✈️
