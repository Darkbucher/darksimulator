/*
    Falling sand simulation with velocity, water and walls
    by https://www.inriz.com

    Useful resource:
    https://thecodingtrain.com/challenges/180-falling-sand

*/

// Material types
const MAT_AIR = 0;
const MAT_SAND = 1;
const MAT_WATER = 2;
const MAT_WALL = 3;
const MAT_OIL = 4;
const MAT_FIRE = 5;
const MAT_SMOKE = 6;
const MAT_ICE = 7;
const MAT_LAVA = 8;
const MAT_STEAM = 9;
const MAT_ACID = 10;
const MAT_SALT = 11;
const MAT_WOOD = 12;
const MAT_METAL = 13;
const MAT_PLANT = 14;
const MAT_GLASS = 15;

// Material properties
const MATERIALS = {
    [MAT_AIR]: {
        name: 'Air',
        density: 0,
        temperature: 20,
        flammable: false,
        color: [10, 10, 20]
    },
    [MAT_SAND]: {
        name: 'Sand',
        density: 2,
        temperature: 20,
        flammable: false,
        color: [200, 170, 120]
    },
    [MAT_WATER]: {
        name: 'Water',
        density: 1,
        temperature: 20,
        flammable: false,
        color: [70, 120, 230]
    },
    [MAT_WALL]: {
        name: 'Wall',
        density: 999,
        temperature: 20,
        flammable: false,
        color: [200, 120, 120]
    },
    [MAT_OIL]: {
        name: 'Oil',
        density: 0.8,
        temperature: 20,
        flammable: true,
        ignitionTemp: 250,
        color: [50, 50, 50, 200]
    },
    [MAT_FIRE]: {
        name: 'Fire',
        density: -1.0,  // More negative for stronger upward movement
        temperature: 100,
        flammable: false,
        color: [255, 50, 0, 255]
    },
    [MAT_SMOKE]: {
        name: 'Smoke',
        density: -0.8,  // More negative for stronger upward movement
        temperature: 80,
        flammable: false,
        color: [100, 100, 100, 150]
    },
    [MAT_ICE]: {
        name: 'Ice',
        density: 0.9,
        temperature: -10,
        flammable: false,
        color: [200, 200, 255]
    },
    [MAT_LAVA]: {
        name: 'Lava',
        density: 1.5,
        temperature: 1000,
        flammable: false,
        color: [255, 100, 0, 255]
    },
    [MAT_STEAM]: {
        name: 'Steam',
        density: -0.5,
        temperature: 120,
        flammable: false,
        color: [200, 200, 255, 150]
    },
    [MAT_ACID]: {
        name: 'Acid',
        density: 1.2,
        temperature: 20,
        flammable: false,
        color: [0, 255, 0, 200]
    },
    [MAT_SALT]: {
        name: 'Salt',
        density: 1.8,
        temperature: 20,
        flammable: false,
        dissolves: true,
        color: [255, 255, 255, 255]
    },
    [MAT_WOOD]: {
        name: 'Wood',
        density: 0.7,
        temperature: 20,
        flammable: true,
        ignitionTemp: 200,
        color: [139, 69, 19, 255]
    },
    [MAT_METAL]: {
        name: 'Metal',
        density: 2.5,
        temperature: 20,
        flammable: false,
        conductsHeat: true,
        meltsAt: 1000,
        color: [192, 192, 192, 255]
    },
    [MAT_PLANT]: {
        name: 'Plant',
        density: 0.5,
        temperature: 20,
        flammable: true,
        grows: true,
        color: [34, 139, 34, 255]
    },
    [MAT_GLASS]: {
        name: 'Glass',
        density: 1.2,
        temperature: 20,
        flammable: false,
        breakable: true,
        color: [200, 200, 255, 150]
    }
};

// Simulation parameters
let gravity = 1.0;
let wind = 0.0;
let temperature = 20.0;
let brushSize = 3;
let isPaused = false;

// Add preset scenarios
const PRESETS = {
    waterfall: () => {
        // Create a waterfall effect
        for (let x = gridW / 2 - 10; x < gridW / 2 + 10; x++) {
            for (let y = 0; y < gridH / 3; y++) {
                materials[x + y * gridW] = MAT_WATER;
            }
        }
        // Add some walls
        for (let x = gridW / 2 - 15; x < gridW / 2 + 15; x++) {
            materials[x + (gridH / 3) * gridW] = MAT_WALL;
        }
    },
    sandcastle: () => {
        // Create a sand castle
        for (let x = gridW / 2 - 20; x < gridW / 2 + 20; x++) {
            for (let y = gridH - 40; y < gridH - 20; y++) {
                materials[x + y * gridW] = MAT_SAND;
            }
        }
        // Add some towers
        for (let x = gridW / 2 - 15; x < gridW / 2 - 5; x++) {
            for (let y = gridH - 60; y < gridH - 40; y++) {
                materials[x + y * gridW] = MAT_SAND;
            }
        }
        for (let x = gridW / 2 + 5; x < gridW / 2 + 15; x++) {
            for (let y = gridH - 60; y < gridH - 40; y++) {
                materials[x + y * gridW] = MAT_SAND;
            }
        }
    },
    lava: () => {
        // Create a lava lamp effect
        for (let x = gridW / 2 - 5; x < gridW / 2 + 5; x++) {
            for (let y = gridH - 100; y < gridH - 80; y++) {
                materials[x + y * gridW] = MAT_SAND;
                // Make it look like lava by using a reddish color
                sandColor = [255, 100, 0];
            }
        }
    }
};

const canvas = document.getElementById('canvas');
const CELL_SIZE = 4;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let gridW = Math.floor(canvas.width / CELL_SIZE);
let gridH = Math.floor(canvas.height / CELL_SIZE);

let rgbaTextureBuffer = new Uint8Array(gridW * gridH * 4); // 4 bytes per pixel

// indexed by: x + y * gridW
let materials = new Uint8Array(gridW * gridH); // stores the material type of each cell
let updated = new Uint8Array(gridW * gridH); // stores whether a cell has been updated this frame
let yVel = new Uint8Array(gridW * gridH); // stores the y velocity of each cell
let xVel = new Uint8Array(gridW * gridH); // stores the x velocity of each cell

let currentSelection = MAT_SAND;

let mousedown = false;
let mouseX = 0;
let mouseY = 0;
let prevMouseX = 0;
let prevMouseY = 0;

// Add new global variables
let sandColor = [200, 170, 120];
let waterColor = [70, 120, 230];

// Add history management for undo/redo
const MAX_HISTORY = 50;
let history = [];
let historyIndex = -1;

function saveState() {
    // Remove any future states if we're not at the end
    history = history.slice(0, historyIndex + 1);
    
    // Create a copy of the current state
    const state = {
        materials: new Uint8Array(materials),
        yVel: new Uint8Array(yVel),
        xVel: new Uint8Array(xVel),
        temperature: temperature,
        gravity: gravity,
        wind: wind
    };
    
    // Add to history
    history.push(state);
    historyIndex++;
    
    // Limit history size
    if (history.length > MAX_HISTORY) {
        history.shift();
        historyIndex--;
    }
    
    // Update undo/redo buttons
    updateUndoRedoButtons();
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        loadState(history[historyIndex]);
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        loadState(history[historyIndex]);
    }
}

function loadState(state) {
    materials = new Uint8Array(state.materials);
    yVel = new Uint8Array(state.yVel);
    xVel = new Uint8Array(state.xVel);
    temperature = state.temperature;
    gravity = state.gravity;
    wind = state.wind;
    
    // Update UI controls
    document.getElementById('temperature').value = temperature;
    document.getElementById('gravity').value = gravity;
    document.getElementById('wind').value = wind;
    
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    document.getElementById('undo').disabled = historyIndex <= 0;
    document.getElementById('redo').disabled = historyIndex >= history.length - 1;
}

function stepSimulation() {
    if (mousedown) {
        fillCircles(mouseX, mouseY, prevMouseX, prevMouseY, brushSize, currentSelection);
        // Save state after drawing
        saveState();
    }

    // mark all cells as not updated
    for (let i = 0; i < updated.length; i++) updated[i] = 0;

    // Update temperature effects
    updateTemperature();

    let hasChanges = false;

    for (let y = 0; y < gridH; y++) {
        const randMovement = Math.random() > 0.5 ? 0 : 1;

        for (let x = randMovement == 0 ? 0 : gridW; randMovement == 0 ? (x < gridW) : (x >= 0); randMovement == 0 ? x++ : x--) {
            const thisID = x + y * gridW;
            const matID = materials[thisID];
            
            if (matID > MAT_AIR && updated[thisID] == 0) {
                const material = MATERIALS[matID];
                
                // Apply gravity and wind
                yVel[thisID] += gravity;
                xVel[thisID] += wind;

                // Special behavior for different materials
                switch (matID) {
                    case MAT_FIRE:
                        hasChanges = handleFire(x, y, thisID) || hasChanges;
                        break;
                    case MAT_SMOKE:
                        hasChanges = handleSmoke(x, y, thisID) || hasChanges;
                        break;
                    case MAT_ICE:
                        hasChanges = handleIce(x, y, thisID) || hasChanges;
                        break;
                    case MAT_OIL:
                        hasChanges = handleOil(x, y, thisID) || hasChanges;
                        break;
                    case MAT_LAVA:
                        hasChanges = handleLava(x, y, thisID) || hasChanges;
                        break;
                    case MAT_STEAM:
                        hasChanges = handleSteam(x, y, thisID) || hasChanges;
                        break;
                    case MAT_ACID:
                        hasChanges = handleAcid(x, y, thisID) || hasChanges;
                        break;
                    case MAT_SALT:
                        hasChanges = handleSalt(x, y, thisID) || hasChanges;
                        break;
                    case MAT_WOOD:
                        hasChanges = handleWood(x, y, thisID) || hasChanges;
                        break;
                    case MAT_METAL:
                        hasChanges = handleMetal(x, y, thisID) || hasChanges;
                        break;
                    case MAT_PLANT:
                        hasChanges = handlePlant(x, y, thisID) || hasChanges;
                        break;
                    case MAT_GLASS:
                        hasChanges = handleGlass(x, y, thisID) || hasChanges;
                        break;
                    default:
                        hasChanges = handleStandardParticle(x, y, thisID, matID) || hasChanges;
                }
            }
        }
    }

    // Save state if there were significant changes
    if (hasChanges) {
        saveState();
    }
}

function handleFire(x, y, thisID) {
    let hasChanges = false;
    
    // Fire rises more aggressively with some randomness
    const riseForce = 2.0 + Math.random() * 0.5;
    yVel[thisID] -= riseForce * gravity;
    
    // Add some horizontal movement
    xVel[thisID] += (Math.random() - 0.5) * 0.3;
    
    // Try to move up first
    if (tryMove(0, -1, thisID)) {
        hasChanges = true;
        return hasChanges;
    }
    
    // Spread horizontally with more randomness and natural movement
    if (Math.random() < 0.4) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        if (tryMove(dir, 0, thisID)) {
            hasChanges = true;
            return hasChanges;
        }
    }
    
    // Add some diagonal movement
    if (Math.random() < 0.2) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        if (tryMove(dir, -1, thisID)) {
            hasChanges = true;
            return hasChanges;
        }
    }
    
    // Chance to turn into smoke with varying intensity
    if (Math.random() < 0.15) {
        materials[thisID] = MAT_SMOKE;
        yVel[thisID] = -1.5 - Math.random() * 1.0;
        xVel[thisID] = (Math.random() - 0.5) * 0.5;
        hasChanges = true;
    }
    
    // Chance to extinguish
    if (Math.random() < 0.02) {
        materials[thisID] = MAT_AIR;
        hasChanges = true;
    }
    
    return hasChanges;
}

function handleSmoke(x, y, thisID) {
    let hasChanges = false;
    
    // Add turbulence to smoke movement
    const turbulence = Math.sin(Date.now() * 0.001 + thisID) * 0.2;
    const riseForce = 1.2 + Math.random() * 0.3;
    
    // Update velocities with turbulence
    yVel[thisID] -= riseForce * gravity;
    xVel[thisID] += turbulence + (Math.random() - 0.5) * 0.2;
    
    // Limit maximum velocities
    yVel[thisID] = Math.max(-2, Math.min(2, yVel[thisID]));
    xVel[thisID] = Math.max(-1, Math.min(1, xVel[thisID]));
    
    // Try to move up with some randomness
    if (Math.random() < 0.7) {
        if (tryMove(0, -1, thisID)) {
            hasChanges = true;
            return hasChanges;
        }
    }
    
    // Add diagonal movement
    if (Math.random() < 0.3) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        if (tryMove(dir, -1, thisID)) {
            hasChanges = true;
            return hasChanges;
        }
    }
    
    // Add horizontal drift
    if (Math.random() < 0.4) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        if (tryMove(dir, 0, thisID)) {
            hasChanges = true;
            return hasChanges;
        }
    }
    
    // Gradually fade out
    if (Math.random() < 0.02) {
        materials[thisID] = MAT_AIR;
        hasChanges = true;
    }
    
    return hasChanges;
}

function handleIce(x, y, thisID) {
    let hasChanges = false;
    
    if (temperature > 0) {
        materials[thisID] = MAT_WATER;
        hasChanges = true;
        return hasChanges;
    }
    
    hasChanges = handleStandardParticle(x, y, thisID, MAT_ICE);
    return hasChanges;
}

function handleOil(x, y, thisID) {
    let hasChanges = false;
    
    // Check for fire nearby
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
                const neighborID = nx + ny * gridW;
                if (materials[neighborID] === MAT_FIRE) {
                    // Oil ignites when near fire
                    materials[thisID] = MAT_FIRE;
                    yVel[thisID] = -1.5;
                    xVel[thisID] = (Math.random() - 0.5) * 0.5;
                    hasChanges = true;
                    return hasChanges;
                }
            }
        }
    }
    
    // Check temperature for auto-ignition
    if (temperature >= MATERIALS[MAT_OIL].ignitionTemp) {
        if (Math.random() < 0.1) { // 10% chance to ignite at ignition temperature
            materials[thisID] = MAT_FIRE;
            yVel[thisID] = -1.5;
            xVel[thisID] = (Math.random() - 0.5) * 0.5;
            hasChanges = true;
            return hasChanges;
        }
    }
    
    const belowID = thisID + gridW;
    if (materials[belowID] === MAT_WATER) {
        if (Math.random() < 0.3) {
            const dir = Math.random() < 0.5 ? 1 : -1;
            const sideID = thisID + dir;
            if (materials[sideID] === MAT_WATER) {
                materials[sideID] = MAT_OIL;
                materials[thisID] = MAT_WATER;
                hasChanges = true;
                return hasChanges;
            }
        }
        
        materials[belowID] = MAT_OIL;
        materials[thisID] = MAT_WATER;
        hasChanges = true;
        return hasChanges;
    }
    
    hasChanges = handleStandardParticle(x, y, thisID, MAT_OIL);
    return hasChanges;
}

function handleLava(x, y, thisID) {
    let hasChanges = false;
    
    // Lava heats up surrounding materials
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
                const neighborID = nx + ny * gridW;
                const neighborMat = materials[neighborID];
                
                // Convert water to steam
                if (neighborMat === MAT_WATER) {
                    materials[neighborID] = MAT_STEAM;
                    yVel[neighborID] = -2;
                    xVel[neighborID] = (Math.random() - 0.5) * 0.5;
                    hasChanges = true;
                }
                // Melt ice
                else if (neighborMat === MAT_ICE) {
                    materials[neighborID] = MAT_WATER;
                    hasChanges = true;
                }
            }
        }
    }
    
    // Lava movement
    hasChanges = handleStandardParticle(x, y, thisID, MAT_LAVA) || hasChanges;
    return hasChanges;
}

function handleSteam(x, y, thisID) {
    let hasChanges = false;
    
    // Steam rises and cools
    yVel[thisID] -= 1.5;
    xVel[thisID] += (Math.random() - 0.5) * 0.2;
    
    // Try to move up
    if (tryMove(0, -1, thisID)) {
        hasChanges = true;
        return hasChanges;
    }
    
    // Add some horizontal movement
    if (Math.random() < 0.3) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        if (tryMove(dir, 0, thisID)) {
            hasChanges = true;
            return hasChanges;
        }
    }
    
    // Chance to condense back to water
    if (Math.random() < 0.02) {
        materials[thisID] = MAT_WATER;
        hasChanges = true;
    }
    
    return hasChanges;
}

function handleAcid(x, y, thisID) {
    let hasChanges = false;
    
    // Acid dissolves certain materials
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
                const neighborID = nx + ny * gridW;
                const neighborMat = materials[neighborID];
                
                // Acid dissolves walls and sand
                if (neighborMat === MAT_WALL || neighborMat === MAT_SAND) {
                    if (Math.random() < 0.1) {
                        materials[neighborID] = MAT_AIR;
                        hasChanges = true;
                    }
                }
            }
        }
    }
    
    // Acid movement
    hasChanges = handleStandardParticle(x, y, thisID, MAT_ACID) || hasChanges;
    return hasChanges;
}

function handleSalt(x, y, thisID) {
    let hasChanges = false;
    
    // Check for water to dissolve in
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
                const neighborID = nx + ny * gridW;
                if (materials[neighborID] === MAT_WATER) {
                    if (Math.random() < 0.1) {
                        materials[thisID] = MAT_AIR;
                        hasChanges = true;
                        return hasChanges;
                    }
                }
            }
        }
    }
    
    // Standard movement
    hasChanges = handleStandardParticle(x, y, thisID, MAT_SALT) || hasChanges;
    return hasChanges;
}

function handleWood(x, y, thisID) {
    let hasChanges = false;
    
    // Check for fire
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
                const neighborID = nx + ny * gridW;
                if (materials[neighborID] === MAT_FIRE) {
                    if (Math.random() < 0.2) {
                        materials[thisID] = MAT_FIRE;
                        yVel[thisID] = -1.5;
                        xVel[thisID] = (Math.random() - 0.5) * 0.5;
                        hasChanges = true;
                        return hasChanges;
                    }
                }
            }
        }
    }
    
    // Check if wood is in water (floating)
    const belowID = thisID + gridW;
    if (belowID < materials.length && materials[belowID] === MAT_WATER) {
        yVel[thisID] = -0.5; // Float upward
    }
    
    // Standard movement
    hasChanges = handleStandardParticle(x, y, thisID, MAT_WOOD) || hasChanges;
    return hasChanges;
}

function handleMetal(x, y, thisID) {
    let hasChanges = false;
    
    // Check temperature for melting
    if (temperature >= MATERIALS[MAT_METAL].meltsAt) {
        if (Math.random() < 0.1) {
            materials[thisID] = MAT_LAVA;
            hasChanges = true;
            return hasChanges;
        }
    }
    
    // Conduct heat to neighbors
    if (temperature > 20) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
                    const neighborID = nx + ny * gridW;
                    if (materials[neighborID] === MAT_WATER) {
                        if (Math.random() < 0.05) {
                            materials[neighborID] = MAT_STEAM;
                            yVel[neighborID] = -2;
                            xVel[neighborID] = (Math.random() - 0.5) * 0.5;
                        }
                    }
                }
            }
        }
    }
    
    // Standard movement
    hasChanges = handleStandardParticle(x, y, thisID, MAT_METAL) || hasChanges;
    return hasChanges;
}

function handlePlant(x, y, thisID) {
    let hasChanges = false;
    
    // Check for water to grow
    const belowID = thisID + gridW;
    const aboveID = thisID - gridW;
    const leftID = thisID - 1;
    const rightID = thisID + 1;
    
    // Count water neighbors
    let waterNeighbors = 0;
    if (belowID < materials.length && materials[belowID] === MAT_WATER) waterNeighbors++;
    if (aboveID >= 0 && materials[aboveID] === MAT_WATER) waterNeighbors++;
    if (leftID >= 0 && materials[leftID] === MAT_WATER) waterNeighbors++;
    if (rightID < materials.length && materials[rightID] === MAT_WATER) waterNeighbors++;
    
    // Grow if there's water nearby
    if (waterNeighbors > 0) {
        // Increased base growth chance (0.05 instead of 0.01)
        // Also increased multiplier for water neighbors (0.1 instead of 0.01)
        const growChance = 0.05 + (0.1 * waterNeighbors);
        
        if (Math.random() < growChance) {
            // Try to grow in a random direction
            const directions = [
                { dx: 0, dy: -1 }, // up
                { dx: 1, dy: 0 },  // right
                { dx: -1, dy: 0 }, // left
                { dx: 0, dy: 1 }   // down
            ];
            
            // Shuffle directions
            for (let i = directions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [directions[i], directions[j]] = [directions[j], directions[i]];
            }
            
            // Try each direction
            for (const dir of directions) {
                const newX = x + dir.dx;
                const newY = y + dir.dy;
                const newID = newX + newY * gridW;
                
                if (newX >= 0 && newX < gridW && newY >= 0 && newY < gridH) {
                    if (materials[newID] === MAT_AIR) {
                        materials[newID] = MAT_PLANT;
                        hasChanges = true;
                        break;
                    }
                }
            }
        }
    }
    
    // Check for fire
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
                const neighborID = nx + ny * gridW;
                if (materials[neighborID] === MAT_FIRE) {
                    if (Math.random() < 0.3) {
                        materials[thisID] = MAT_FIRE;
                        yVel[thisID] = -1.5;
                        xVel[thisID] = (Math.random() - 0.5) * 0.5;
                        hasChanges = true;
                        return hasChanges;
                    }
                }
            }
        }
    }
    
    // Standard movement
    hasChanges = handleStandardParticle(x, y, thisID, MAT_PLANT) || hasChanges;
    return hasChanges;
}

function handleGlass(x, y, thisID) {
    let hasChanges = false;
    
    // Check for impacts
    if (Math.abs(yVel[thisID]) > 5 || Math.abs(xVel[thisID]) > 5) {
        if (Math.random() < 0.3) {
            materials[thisID] = MAT_AIR;
            hasChanges = true;
            return hasChanges;
        }
    }
    
    // Standard movement
    hasChanges = handleStandardParticle(x, y, thisID, MAT_GLASS) || hasChanges;
    return hasChanges;
}

function handleStandardParticle(x, y, thisID, matID) {
    let hasChanges = false;
    const material = MATERIALS[matID];
    
    // Special handling for walls - make them completely static
    if (matID === MAT_WALL) {
        // Reset any velocity
        yVel[thisID] = 0;
        xVel[thisID] = 0;
        return false; // Walls don't move
    }
    
    // Special handling for water
    if (matID === MAT_WATER) {
        // Add pressure simulation
        let pressure = 0;
        let canMoveDown = false;
        
        // Check if there's water below
        const belowID = thisID + gridW;
        if (belowID < materials.length && materials[belowID] === MAT_WATER) {
            pressure += 1;
        }
        
        // Check if there's water to the sides
        const leftID = thisID - 1;
        const rightID = thisID + 1;
        if (leftID >= 0 && materials[leftID] === MAT_WATER) pressure += 0.5;
        if (rightID < materials.length && materials[rightID] === MAT_WATER) pressure += 0.5;
        
        // Check if we can move down
        if (belowID < materials.length && materials[belowID] === MAT_AIR) {
            canMoveDown = true;
        }
        
        // Apply pressure-based movement
        if (pressure > 0) {
            // Try to move down first
            if (canMoveDown) {
                if (tryMove(0, 1, thisID)) {
                    hasChanges = true;
                    return hasChanges;
                }
            }
            
            // Try to spread horizontally based on pressure
            const spreadChance = Math.min(0.8, pressure * 0.3);
            if (Math.random() < spreadChance) {
                const dir = Math.random() < 0.5 ? 1 : -1;
                if (tryMove(dir, 0, thisID)) {
                    hasChanges = true;
                    return hasChanges;
                }
                // Try the other direction if first direction failed
                if (tryMove(-dir, 0, thisID)) {
                    hasChanges = true;
                    return hasChanges;
                }
            }
        }
        
        // Standard water movement
        const gravityEffect = material.density > 0 ? gravity : -gravity;
        yVel[thisID] += gravityEffect;
        xVel[thisID] += wind;
        
        // Add some random movement for more natural flow
        xVel[thisID] += (Math.random() - 0.5) * 0.1;
        
        // Dampen velocities
        yVel[thisID] *= 0.95;
        xVel[thisID] *= 0.95;
        
        // Try to move down
        if (tryMove(0, 1, thisID)) {
            hasChanges = true;
            return hasChanges;
        }
        
        // Try to move diagonally down
        const dir = Math.random() < 0.5 ? 1 : -1;
        if (tryMove(dir, 1, thisID)) {
            hasChanges = true;
            return hasChanges;
        }
        if (tryMove(-dir, 1, thisID)) {
            hasChanges = true;
            return hasChanges;
        }
        
        // Try to move horizontally
        if (Math.random() < 0.3) {
            if (tryMove(dir, 0, thisID)) {
                hasChanges = true;
                return hasChanges;
            }
            if (tryMove(-dir, 0, thisID)) {
                hasChanges = true;
                return hasChanges;
            }
        }
        
        return hasChanges;
    }
    
    // Standard movement for other materials
    const gravityEffect = material.density > 0 ? gravity : -gravity;
    yVel[thisID] += gravityEffect;
    xVel[thisID] += wind;
    
    yVel[thisID] *= 0.95;
    xVel[thisID] *= 0.95;
    
    if (tryMove(0, Math.sign(material.density), thisID)) {
        hasChanges = true;
        return hasChanges;
    }
    
    const dir = Math.random() < 0.5 ? 1 : -1;
    if (tryMove(dir, Math.sign(material.density), thisID)) {
        hasChanges = true;
        return hasChanges;
    }
    if (tryMove(-dir, Math.sign(material.density), thisID)) {
        hasChanges = true;
        return hasChanges;
    }
    
    if (material.density < 0) {
        if (tryMove(0, -1, thisID)) {
            hasChanges = true;
            return hasChanges;
        }
    }
    
    return hasChanges;
}

function updateTemperature() {
    for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
            const thisID = x + y * gridW;
            const matID = materials[thisID];
            
            if (matID === MAT_FIRE) {
                // Heat up surrounding cells
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
                            const neighborID = nx + ny * gridW;
                            const neighborMat = materials[neighborID];
                            
                            // Ignite flammable materials
                            if (MATERIALS[neighborMat].flammable) {
                                if (neighborMat === MAT_OIL) {
                                    // Oil has a higher chance to ignite
                                    if (Math.random() < 0.05) {
                                        materials[neighborID] = MAT_FIRE;
                                        yVel[neighborID] = -1.0;
                                        xVel[neighborID] = (Math.random() - 0.5) * 0.3;
                                    }
                                } else if (Math.random() < 0.1) {
                                    materials[neighborID] = MAT_FIRE;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// draw a line between the previous mouse position and the current mouse position using the given radius and material
function fillCircles(mouseX, mouseY, prevMouseX, prevMouseY, radius, material) {
    const mouseCellX = Math.floor(mouseX / CELL_SIZE);
    const mouseCellY = Math.floor(mouseY / CELL_SIZE);
    const prevMouseCellX = Math.floor(prevMouseX / CELL_SIZE);
    const prevMouseCellY = Math.floor(prevMouseY / CELL_SIZE);

    const setCell = (x, y, material) => {
        if (x < 0 || x >= gridW || y < 0 || y >= gridH) return;
        const thisID = x + y * gridW;
        if (materials[thisID] == MAT_AIR || material == MAT_AIR || material == MAT_WALL)
            materials[thisID] = material;
        yVel[thisID] = 0;
    }

    const drawCircle = (x0, y0, radius, material) => {
        for (let x = -radius; x < radius; x++) {
            for (let y = -radius; y < radius; y++) {
                if (x * x + y * y <= radius * radius) {
                    setCell(x0 + x, y0 + y, material);
                }
            }
        }
    }

    const drawLine = (x0, y0, x1, y1, material) => {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = (x0 < x1) ? 1 : -1;
        const sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        for (let i = 0; i < 20; i++) {
            drawCircle(x0, y0, brushSize, material);

            if ((x0 == x1) && (y0 == y1)) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }

    drawLine(prevMouseCellX, prevMouseCellY, mouseCellX, mouseCellY, material);
}

// called every frame, updates the simulation and draws the texture to the screen
function draw() {
    if (!isPaused) {
        stepSimulation();
    }
    
    let p = 0;
    for (let y = gridH - 1; y >= 0; y--) {
        for (let x = 0; x < gridW; x++) {
            const cellMaterial = materials[x + y * gridW];
            const material = MATERIALS[cellMaterial];
            
            if (material) {
                if (cellMaterial === MAT_FIRE) {
                    // Add flickering effect to fire
                    const flicker = Math.random() * 30;
                    const time = Date.now() * 0.001;
                    const noise = Math.sin(time + x * 0.1) * Math.cos(time + y * 0.1) * 10;
                    
                    rgbaTextureBuffer[4 * p] = Math.min(255, material.color[0] + flicker + noise);
                    rgbaTextureBuffer[4 * p + 1] = Math.min(255, material.color[1] + flicker * 0.2 + noise * 0.2);
                    rgbaTextureBuffer[4 * p + 2] = Math.min(255, material.color[2] + noise * 0.1);
                    rgbaTextureBuffer[4 * p + 3] = material.color[3] || 255;
                } else if (cellMaterial === MAT_SMOKE) {
                    // Add swirling effect to smoke
                    const time = Date.now() * 0.001;
                    const noise = Math.sin(time + x * 0.05) * Math.cos(time + y * 0.05) * 15;
                    
                    rgbaTextureBuffer[4 * p] = Math.max(0, Math.min(255, material.color[0] + noise));
                    rgbaTextureBuffer[4 * p + 1] = Math.max(0, Math.min(255, material.color[1] + noise));
                    rgbaTextureBuffer[4 * p + 2] = Math.max(0, Math.min(255, material.color[2] + noise));
                    rgbaTextureBuffer[4 * p + 3] = Math.max(0, Math.min(255, (material.color[3] || 150) + noise));
                } else {
                    rgbaTextureBuffer[4 * p] = material.color[0];
                    rgbaTextureBuffer[4 * p + 1] = material.color[1];
                    rgbaTextureBuffer[4 * p + 2] = material.color[2];
                    rgbaTextureBuffer[4 * p + 3] = material.color[3] || 255;
                }
            } else {
                // Default to air color
                rgbaTextureBuffer[4 * p] = 10;
                rgbaTextureBuffer[4 * p + 1] = 10;
                rgbaTextureBuffer[4 * p + 2] = 20;
                rgbaTextureBuffer[4 * p + 3] = 255;
            }
            p++;
        }
    }

    // send CPU-generated texture to GPU
    gl.useProgram(program);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gridW, gridH, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgbaTextureBuffer);

    // draw the texture to the screen
    gl.drawArrays(gl.TRIANGLES, 0, 3 * 2);
    requestAnimationFrame(draw);
}



// WebGL and other setup:

const vertexShader = `
attribute vec2 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  gl_Position = vec4(aPosition, 0., 1.);
  vTexCoord = aTexCoord;
}`;

const fragShader = `
precision mediump float;

uniform sampler2D iPixelBuffer;
uniform vec2 iResolution;
varying vec2 vTexCoord;

float hash(vec2 cord) {
    return fract(sin(dot(cord.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec4 pc = texture2D(iPixelBuffer, vTexCoord.xy);

    if (pc.a > 0.8) {
        // make the sand pattern
        vec2 pixw = 4.0 / iResolution.xy;
        // blur the sand by averaging the surrounding pixels
        pc += texture2D(iPixelBuffer, vTexCoord.xy + vec2(-pixw.x, 0)) 
            + texture2D(iPixelBuffer, vTexCoord.xy + vec2(0, pixw.y)) 
            + texture2D(iPixelBuffer, vTexCoord.xy + vec2(0, -pixw.y)) 
            + texture2D(iPixelBuffer, vTexCoord.xy + vec2(pixw.x, 0));
        pc.rgb /= 5.0;
        float af = dot(normalize(pc.rgb), normalize(vec3(0.97647058823, 0.85882352941, 0.66274509803)));
        gl_FragColor.rgb = pc.rgb + hash(vTexCoord + vec2(pc.r, 0.0)) * clamp(pow(af, 50.0), 0.0, 1.0) / 4.0;
    } else {
        // Handle transparent materials
        gl_FragColor = pc;
    }

    gl_FragColor.a = pc.a;
}
`;


const gl = canvas.getContext('webgl');
if (!gl) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    throw "Unable to initialize WebGL. Your browser or machine may not support it.";
}

function createShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var info = gl.getShaderInfoLog(shader);
        throw 'Could not compile WebGL program \n\n' + info;
    }
    return shader;
}
const vert = createShader(gl, vertexShader, gl.VERTEX_SHADER);
const frag = createShader(gl, fragShader, gl.FRAGMENT_SHADER);
const program = gl.createProgram();

gl.attachShader(program, vert);
gl.attachShader(program, frag);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    var info = gl.getProgramInfoLog(program);
    throw 'Could not compile WebGL program \n\n' + info;
}

const positionLocation = gl.getAttribLocation(program, "aPosition");
const texcoordLocation = gl.getAttribLocation(program, "aTexCoord");

const positionBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

function setRectangle(gl, x, y, toX, toY) {
    const x1 = x;
    const x2 = toX;
    const y1 = y;
    const y2 = toY;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
    ]), gl.STATIC_DRAW);
}

setRectangle(gl, -1, -1, 1, 1);

const texcoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    0.0, 1.0,
    1.0, 0.0,
    1.0, 1.0,
]), gl.STATIC_DRAW);

const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

const resolutionLocation = gl.getUniformLocation(program, "iResolution");

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

gl.useProgram(program);
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

gl.enableVertexAttribArray(texcoordLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

gl.useProgram(program);
gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

canvas.addEventListener('mousedown', e => {
    mousedown = true;
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = e.clientX;
    mouseY = e.clientY;
});

canvas.addEventListener('mouseup', () => { mousedown = false; });

canvas.addEventListener('touchstart', e => {
    mousedown = true;
    prevMouseX = e.touches[0].clientX;
    prevMouseY = e.touches[0].clientY;
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', () => { mousedown = false; });

canvas.addEventListener('mousemove', e => {
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = e.clientX;
    mouseY = e.clientY;
});

canvas.addEventListener('touchmove', e => {
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
});

const setSandBtn = document.getElementById('set_sand');
const setWaterBtn = document.getElementById('set_water');
const setWallBtn = document.getElementById('set_wall');
const setEraserBtn = document.getElementById('set_eraser');

function setSand() {
    setSandBtn.classList.add('selected');
    setWaterBtn.classList.remove('selected');
    setWallBtn.classList.remove('selected');
    setEraserBtn.classList.remove('selected');
    currentSelection = MAT_SAND;
}

function setWater() {
    setSandBtn.classList.remove('selected');
    setWaterBtn.classList.add('selected');
    setWallBtn.classList.remove('selected');
    setEraserBtn.classList.remove('selected');
    currentSelection = MAT_WATER;
}

function setWall() {
    setSandBtn.classList.remove('selected');
    setWaterBtn.classList.remove('selected');
    setWallBtn.classList.add('selected');
    setEraserBtn.classList.remove('selected');
    currentSelection = MAT_WALL;
}

function setEraser() {
    setSandBtn.classList.remove('selected');
    setWaterBtn.classList.remove('selected');
    setWallBtn.classList.remove('selected');
    setEraserBtn.classList.add('selected');
    currentSelection = MAT_AIR;
}

setSandBtn.addEventListener('click', setSand);
setWaterBtn.addEventListener('click', setWater);
setWallBtn.addEventListener('click', setWall);
setEraserBtn.addEventListener('click', setEraser);
setSand();

// Add event listeners for new controls
document.getElementById('clear').addEventListener('click', () => {
    materials.fill(MAT_AIR);
    yVel.fill(0);
    xVel.fill(0);
});

document.getElementById('pause').addEventListener('click', function() {
    isPaused = !isPaused;
    this.textContent = isPaused ? 'Play' : 'Pause';
});

document.getElementById('brush-size').addEventListener('input', function() {
    brushSize = parseInt(this.value);
});

document.getElementById('sand-color').addEventListener('input', function() {
    const color = hexToRgb(this.value);
    sandColor = [color.r, color.g, color.b];
});

document.getElementById('water-color').addEventListener('input', function() {
    const color = hexToRgb(this.value);
    waterColor = [color.r, color.g, color.b];
});

// Helper function to convert hex color to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// draw to the default framebuffer (the screen)
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
requestAnimationFrame(draw);

// resize the canvas and buffers when the window is resized
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    const oldGridW = gridW;
    const oldGridH = gridH;

    gridW = Math.floor(canvas.width / CELL_SIZE);
    gridH = Math.floor(canvas.height / CELL_SIZE);

    const newCells = new Uint8Array(gridW * gridH);
    const newUpdated = new Uint8Array(gridW * gridH);
    const newYVel = new Uint8Array(gridW * gridH);
    const newXVel = new Uint8Array(gridW * gridH);
    const newRtexbuff = new Uint8Array(gridW * gridH * 4);

    for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
            const oldID = x + y * oldGridW;
            const newID = x + y * gridW;
            newCells[newID] = materials[oldID];
            newUpdated[newID] = updated[oldID];
            newYVel[newID] = yVel[oldID];
            newXVel[newID] = xVel[oldID];
            newRtexbuff[newID] = rgbaTextureBuffer[oldID];
        }
    }

    materials = newCells;
    updated = newUpdated;
    yVel = newYVel;
    xVel = newXVel;
    rgbaTextureBuffer = newRtexbuff;

}

window.addEventListener('resize', resize);

// Add welcome screen functionality
document.addEventListener('DOMContentLoaded', () => {
    const welcomeScreen = document.getElementById('welcome-screen');
    const startBtn = document.getElementById('start-btn');

    // Show welcome screen by default
    welcomeScreen.classList.remove('hidden');

    // Handle start button click
    startBtn.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden');
        // Initialize the simulation
        initializeSimulation();
    });
});

function initializeSimulation() {
    // Initialize the simulation state
    materials.fill(MAT_AIR);
    yVel.fill(0);
    xVel.fill(0);
    
    // Set initial material
    setCurrentMaterial(MAT_SAND);
    
    // Start the simulation loop
    requestAnimationFrame(draw);
}

// Add preset functionality
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        if (preset === 'clear') {
            materials.fill(MAT_AIR);
            yVel.fill(0);
            xVel.fill(0);
        } else if (PRESETS[preset]) {
            materials.fill(MAT_AIR);
            yVel.fill(0);
            xVel.fill(0);
            PRESETS[preset]();
        }
    });
});

// Save/Load functionality
function savePattern(name) {
    const pattern = {
        materials: Array.from(materials),
        temperature: temperature,
        gravity: gravity,
        wind: wind
    };
    localStorage.setItem(`pattern_${name}`, JSON.stringify(pattern));
}

function loadPattern(name) {
    const pattern = JSON.parse(localStorage.getItem(`pattern_${name}`));
    if (pattern) {
        materials = new Uint8Array(pattern.materials);
        temperature = pattern.temperature;
        gravity = pattern.gravity;
        wind = pattern.wind;
        
        // Update UI controls
        document.getElementById('temperature').value = temperature;
        document.getElementById('gravity').value = gravity;
        document.getElementById('wind').value = wind;
    }
}

// Event Listeners
document.getElementById('save-pattern').addEventListener('click', () => {
    const name = document.getElementById('pattern-name').value;
    if (name) {
        savePattern(name);
        alert('Pattern saved!');
    } else {
        alert('Please enter a pattern name');
    }
});

document.getElementById('load-pattern').addEventListener('click', () => {
    const name = document.getElementById('pattern-name').value;
    if (name) {
        loadPattern(name);
    } else {
        alert('Please enter a pattern name');
    }
});

// Material selection
document.getElementById('set_sand').addEventListener('click', () => setCurrentMaterial(MAT_SAND));
document.getElementById('set_water').addEventListener('click', () => setCurrentMaterial(MAT_WATER));
document.getElementById('set_wall').addEventListener('click', () => setCurrentMaterial(MAT_WALL));
document.getElementById('set_oil').addEventListener('click', () => setCurrentMaterial(MAT_OIL));
document.getElementById('set_fire').addEventListener('click', () => setCurrentMaterial(MAT_FIRE));
document.getElementById('set_smoke').addEventListener('click', () => setCurrentMaterial(MAT_SMOKE));
document.getElementById('set_ice').addEventListener('click', () => setCurrentMaterial(MAT_ICE));
document.getElementById('set_lava').addEventListener('click', () => setCurrentMaterial(MAT_LAVA));
document.getElementById('set_steam').addEventListener('click', () => setCurrentMaterial(MAT_STEAM));
document.getElementById('set_acid').addEventListener('click', () => setCurrentMaterial(MAT_ACID));
document.getElementById('set_salt').addEventListener('click', () => setCurrentMaterial(MAT_SALT));
document.getElementById('set_wood').addEventListener('click', () => setCurrentMaterial(MAT_WOOD));
document.getElementById('set_metal').addEventListener('click', () => setCurrentMaterial(MAT_METAL));
document.getElementById('set_plant').addEventListener('click', () => setCurrentMaterial(MAT_PLANT));
document.getElementById('set_glass').addEventListener('click', () => setCurrentMaterial(MAT_GLASS));
document.getElementById('set_eraser').addEventListener('click', () => setCurrentMaterial(0));

function setCurrentMaterial(material) {
    currentSelection = material;
    // Update UI
    document.querySelectorAll('.material-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    const materialName = MATERIALS[material].name.toLowerCase();
    const button = document.getElementById(`set_${materialName}`);
    if (button) {
        button.classList.add('selected');
    }
}

// Simulation controls
document.getElementById('gravity').addEventListener('input', function() {
    gravity = parseFloat(this.value);
});

document.getElementById('wind').addEventListener('input', function() {
    wind = parseFloat(this.value);
});

document.getElementById('temperature').addEventListener('input', function() {
    temperature = parseFloat(this.value);
});

// Tutorial
document.getElementById('close-tutorial').addEventListener('click', () => {
    document.getElementById('tutorial').classList.add('hidden');
});

// Add keyboard shortcuts
const shortcuts = {
    'KeyS': () => setCurrentMaterial(MAT_SAND),
    'KeyW': () => setCurrentMaterial(MAT_WATER),
    'KeyL': () => setCurrentMaterial(MAT_WALL),
    'KeyO': () => setCurrentMaterial(MAT_OIL),
    'KeyF': () => setCurrentMaterial(MAT_FIRE),
    'KeyM': () => setCurrentMaterial(MAT_SMOKE),
    'KeyI': () => setCurrentMaterial(MAT_ICE),
    'KeyV': () => setCurrentMaterial(MAT_LAVA),
    'KeyT': () => setCurrentMaterial(MAT_STEAM),
    'KeyA': () => setCurrentMaterial(MAT_ACID),
    'KeyC': () => setCurrentMaterial(MAT_SALT),  // C for Crystal (salt)
    'KeyD': () => setCurrentMaterial(MAT_WOOD),  // D for Wood
    'KeyR': () => setCurrentMaterial(MAT_METAL), // R for Metal
    'KeyP': () => setCurrentMaterial(MAT_PLANT), // P for Plant
    'KeyG': () => setCurrentMaterial(MAT_GLASS), // G for Glass
    'KeyE': () => setCurrentMaterial(MAT_AIR),
    'KeyZ': (e) => { if (e.ctrlKey || e.metaKey) undo(); },
    'KeyY': (e) => { if (e.ctrlKey || e.metaKey) redo(); },
    'KeyR': (e) => { if (e.ctrlKey || e.metaKey) resetSimulation(); },
    'KeyS': (e) => { if (e.ctrlKey || e.metaKey) savePattern(); },
    'KeyL': (e) => { if (e.ctrlKey || e.metaKey) loadPattern(); },
    'Escape': () => setCurrentMaterial(MAT_AIR)
};

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return; // Don't trigger shortcuts in input fields
    
    const shortcut = shortcuts[e.code];
    if (shortcut) {
        e.preventDefault();
        shortcut(e);
    }
});

// Add touch gesture support
let touchStartX = 0;
let touchStartY = 0;
let lastTouchDistance = 0;

canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        // Two finger touch - handle pinch gesture
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastTouchDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
    } else {
        // Single touch - handle drawing
        mousedown = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
        // Handle pinch gesture for brush size
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        
        const delta = distance - lastTouchDistance;
        brushSize = Math.max(1, Math.min(20, brushSize + delta * 0.1));
        document.getElementById('brush-size').value = brushSize;
        lastTouchDistance = distance;
    } else {
        // Handle drawing
        prevMouseX = mouseX;
        prevMouseY = mouseY;
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
    }
});

// Add pattern sharing functionality
function sharePattern() {
    const pattern = {
        materials: Array.from(materials),
        temperature: temperature,
        gravity: gravity,
        wind: wind
    };
    
    const patternString = btoa(JSON.stringify(pattern));
    const shareUrl = `${window.location.origin}${window.location.pathname}?pattern=${patternString}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Particle Simulation',
            text: 'Check out this cool particle simulation I created!',
            url: shareUrl
        });
    } else {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Pattern URL copied to clipboard!');
        });
    }
}

// Add UI panel management
function togglePanel(panel) {
    panel.classList.toggle('collapsed');
    const toggleBtn = document.querySelector(`#toggle-${panel.classList[0].split('-')[0]}s`);
    if (toggleBtn) {
        const icon = toggleBtn.querySelector('i');
        if (icon) {
            icon.style.transform = panel.classList.contains('collapsed') ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }
}

function hideAllPanels() {
    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.add('collapsed');
    });
}

// Add tutorial system
function showTutorial() {
    document.getElementById('tutorial').classList.remove('hidden');
}

function hideTutorial() {
    document.getElementById('tutorial').classList.add('hidden');
}

function toggleTutorial() {
    const tutorial = document.getElementById('tutorial');
    if (tutorial.classList.contains('hidden')) {
        showTutorial();
    } else {
        hideTutorial();
    }
}

// Add simulation controls
function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause').textContent = isPaused ? 'Play' : 'Pause';
}

function clearSimulation() {
    if (confirm('Are you sure you want to clear the simulation?')) {
        materials.fill(MAT_AIR);
        yVel.fill(0);
        xVel.fill(0);
        saveState();
    }
}

// Add event listeners for new UI elements
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);
document.getElementById('share-pattern').addEventListener('click', sharePattern);
document.getElementById('show-tutorial').addEventListener('click', toggleTutorial);

// Update panel toggle functionality
document.getElementById('toggle-materials').addEventListener('click', () => {
    const panel = document.querySelector('.material-panel');
    togglePanel(panel);
});

document.getElementById('toggle-controls').addEventListener('click', () => {
    const panel = document.querySelector('.control-panel');
    togglePanel(panel);
});

document.getElementById('toggle-settings').addEventListener('click', () => {
    const panel = document.querySelector('.settings-panel');
    togglePanel(panel);
});

// Remove old panel toggle buttons
document.querySelectorAll('.panel-toggle').forEach(btn => btn.remove());

// Update mobile layout handling
function handleMobileLayout() {
    const isMobile = window.innerWidth <= 768;
    const materialPanel = document.querySelector('.material-panel');
    const controlPanel = document.querySelector('.control-panel');
    const settingsPanel = document.querySelector('.settings-panel');

    if (isMobile) {
        // Collapse panels by default on mobile
        materialPanel.classList.add('collapsed');
        controlPanel.classList.add('collapsed');
        settingsPanel.classList.add('collapsed');
    } else {
        // Show panels by default on desktop
        materialPanel.classList.remove('collapsed');
        controlPanel.classList.remove('collapsed');
        settingsPanel.classList.remove('collapsed');
    }
}

// Call on load and resize
window.addEventListener('load', handleMobileLayout);
window.addEventListener('resize', handleMobileLayout);

// Helper functions for particle movement
function cellSolid(x, y, thisID) {
    const toID = thisID + x * 1 + y * gridW;
    if (toID < 0 || toID >= materials.length) return true;
    return materials[toID] === MAT_WALL;
}

function tryMove(dx, dy, thisID) {
    // Calculate movement based on velocity
    let dist = 1;
    let tdist = Math.abs(yVel[thisID]) / 18;
    
    // Add horizontal velocity influence
    if (dx !== 0) {
        tdist = Math.max(tdist, Math.abs(xVel[thisID]) / 18);
    }
    
    // Check if we can move to the target position
    while (dist <= tdist + 1) {
        const toID = thisID + dx * dist + dy * dist * gridW;
        
        // Check bounds
        if (toID < 0 || toID >= materials.length) break;
        
        // Check if the target cell is empty or can be replaced
        const targetMat = materials[toID];
        const thisMat = materials[thisID];
        
        // Special handling for walls
        if (targetMat === MAT_WALL) {
            break; // Can't move through walls
        }
        
        if (targetMat == MAT_AIR || 
            (targetMat == MAT_WATER && MATERIALS[thisMat].density > MATERIALS[MAT_WATER].density)) {
            dist++;
        } else {
            break;
        }
    }
    
    // If we can't move at all
    if (dist == 1) {
        yVel[thisID] = 0;
        xVel[thisID] = 0;
        return false;
    }
    
    dist--; // Move back one step to the last valid position
    
    const toID = thisID + dx * dist + dy * dist * gridW;
    materials[toID] = materials[thisID];
    yVel[toID] = yVel[thisID];
    xVel[toID] = xVel[thisID];
    updated[toID] = 1;
    
    if (thisID != toID) {
        materials[thisID] = MAT_AIR;
        return true;
    }
    
    return false;
}

// Initialize history
saveState();

// Load pattern from URL if present
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const patternParam = urlParams.get('pattern');
    
    if (patternParam) {
        try {
            const pattern = JSON.parse(atob(patternParam));
            materials = new Uint8Array(pattern.materials);
            temperature = pattern.temperature;
            gravity = pattern.gravity;
            wind = pattern.wind;
            
            // Update UI controls
            document.getElementById('temperature').value = temperature;
            document.getElementById('gravity').value = gravity;
            document.getElementById('wind').value = wind;
            
            saveState();
        } catch (e) {
            console.error('Failed to load pattern from URL:', e);
        }
    }
});
