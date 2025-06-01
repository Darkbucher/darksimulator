# Advanced Particle Simulator

An interactive web-based particle simulation that demonstrates various materials and their physical interactions. Built with HTML5, CSS3, and JavaScript, featuring WebGL for efficient rendering.

![Particle Simulator Demo](demo.gif)

## Features

- **Multiple Materials**: Sand, Water, Oil, Fire, Smoke, Ice, Lava, Steam, Acid, Salt, Wood, Metal, Plant, and Glass
- **Realistic Physics**: Gravity, wind, temperature, and material interactions
- **Interactive Controls**: 
  - Material selection with keyboard shortcuts
  - Adjustable gravity, wind, and temperature
  - Brush size control
  - Color customization
- **Advanced Features**:
  - Undo/Redo functionality
  - Pattern saving and loading
  - Pattern sharing via URL
  - Touch support for mobile devices
  - Responsive design

## Live Demo

[Try the simulator here](https://darkbucher.github.io/Falling-Sand-Water-Simulation)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/darkbucher/Falling-Sand-Water-Simulation.git
```

2. Open `index.html` in your web browser or serve it using a local server:
```bash
# Using Python
python -m http.server

# Using Node.js
npx serve
```

## Usage

### Controls

- **Mouse/Touch**: Draw materials
- **Keyboard Shortcuts**:
  - `S`: Sand
  - `W`: Water
  - `L`: Wall
  - `O`: Oil
  - `F`: Fire
  - `M`: Smoke
  - `I`: Ice
  - `V`: Lava
  - `T`: Steam
  - `A`: Acid
  - `C`: Salt
  - `D`: Wood
  - `R`: Metal
  - `P`: Plant
  - `G`: Glass
  - `E`: Eraser
  - `Ctrl/Cmd + Z`: Undo
  - `Ctrl/Cmd + Y`: Redo
  - `Ctrl/Cmd + S`: Save pattern
  - `Ctrl/Cmd + L`: Load pattern

### Material Interactions

- **Water**: Flows, freezes into ice, evaporates into steam
- **Fire**: Spreads to flammable materials, creates smoke
- **Oil**: Floats on water, flammable
- **Acid**: Dissolves certain materials
- **Plant**: Grows near water, flammable
- **Metal**: Conducts heat, melts at high temperatures
- **Glass**: Breaks on impact
- **Salt**: Dissolves in water

## Technical Details

- Uses WebGL for efficient rendering
- Implements a cellular automaton for particle simulation
- Responsive design with mobile-first approach
- Touch gesture support for mobile devices
- State management for undo/redo functionality

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Created by darkbucher
- Inspired by the falling sand game genre
- Built with [Font Awesome](https://fontawesome.com/) for icons
- Uses [WebGL](https://www.khronos.org/webgl/) for rendering

## Contact

darkbucher - [@darkbucher](https://github.com/darkbucher)

Project Link: [https://github.com/darkbucher/Falling-Sand-Water-Simulation](https://github.com/darkbucher/Falling-Sand-Water-Simulation) 