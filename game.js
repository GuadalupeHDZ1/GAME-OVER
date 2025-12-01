const canvas = document.getElementById("canvas");
const canvasContext = canvas.getContext("2d");
const pacmanFrames = document.getElementById("animation");
const ghostFrames = document.getElementById("ghosts");

// Tamaño fijo del juego para mantener la funcionalidad
let oneBlockSize = 20;
let gameWidth = oneBlockSize * 21; // 21 columnas
let gameHeight = oneBlockSize * 23 + 40; // 23 filas + espacio para UI

// Función para ajustar el canvas manteniendo las proporciones
function resizeCanvas() {
    const gameContainer = document.getElementById('game-container');
    const containerWidth = gameContainer.clientWidth;
    const containerHeight = window.innerHeight * 0.8;
    
    // Calcular escala manteniendo relación de aspecto
    const scaleX = containerWidth / gameWidth;
    const scaleY = containerHeight / gameHeight;
    const scale = Math.min(scaleX, scaleY, 1.5);
    
    const displayWidth = gameWidth * scale;
    const displayHeight = gameHeight * scale;
    
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    canvas.style.imageRendering = 'pixelated';
}

let createRect = (x, y, width, height, color) => {
    canvasContext.fillStyle = color;
    canvasContext.fillRect(x, y, width, height);
};

const DIRECTION_RIGHT = 4;
const DIRECTION_UP = 3;
const DIRECTION_LEFT = 2;
const DIRECTION_BOTTOM = 1;
let lives = 5;
let ghostCount = 4;
let gameOver = false;
let gamePaused = false;
let gameWon = false;
let ghostImageLocations = [
    { x: 0, y: 0 },
    { x: 176, y: 0 },
    { x: 0, y: 121 },
    { x: 176, y: 121 },
];

// Game variables
let fps = 30;
let pacman;
let score = 0;
let ghosts = [];
let wallSpaceWidth = oneBlockSize / 1.6;
let wallOffset = (oneBlockSize - wallSpaceWidth) / 2;
let wallInnerColor = "black";

// Mapa (21x23)
let map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1],
    [2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2],
    [1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1],
    [1, 1, 2, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 2, 1, 1],
    [1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

let randomTargetsForGhosts = [
    { x: 1 * oneBlockSize, y: 1 * oneBlockSize },
    { x: 1 * oneBlockSize, y: (map.length - 2) * oneBlockSize },
    { x: (map[0].length - 2) * oneBlockSize, y: oneBlockSize },
    {
        x: (map[0].length - 2) * oneBlockSize,
        y: (map.length - 2) * oneBlockSize,
    },
];

// Configurar canvas con tamaño fijo del juego
canvas.width = gameWidth;
canvas.height = gameHeight;

// Función para actualizar el score en la UI superior
function updateScoreDisplay() {
    const scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay) {
        scoreDisplay.textContent = score;
    }
}

// Función para actualizar las vidas en la UI superior
function updateLivesDisplay() {
    const livesDisplay = document.getElementById('lives-display');
    if (livesDisplay) {
        livesDisplay.textContent = lives;
    }
}

// Función para actualizar toda la UI
function updateGameUI() {
    updateScoreDisplay();
    updateLivesDisplay();
}

let createNewPacman = () => {
    pacman = new Pacman(
        oneBlockSize,
        oneBlockSize,
        oneBlockSize,
        oneBlockSize,
        oneBlockSize / 5
    );
};

let gameLoop = () => {
    if (!gamePaused && !gameOver && !gameWon) {
        update();
    }
    draw();
    updateButtons();
};

let gameInterval = setInterval(gameLoop, 1000 / fps);

let restartPacmanAndGhosts = () => {
    createNewPacman();
    createGhosts();
};

let onGhostCollision = () => {
    lives--;
    updateGameUI();
    if (lives <= 0) {
        gameOver = true;
    } else {
        restartPacmanAndGhosts();
    }
};

// Función simplificada para verificar victoria
let checkWinCondition = () => {
    let foodLeft = false;
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[0].length; j++) {
            if (map[i][j] == 2) {
                foodLeft = true;
                break;
            }
        }
        if (foodLeft) break;
    }
    
    if (!foodLeft) {
        gameWon = true;
        score += lives * 100;
        updateGameUI();
    }
};

let resetGame = () => {
    lives = 5;
    score = 0;
    gameOver = false;
    gamePaused = false;
    gameWon = false;
    updateGameUI();
    
    // Resetear el mapa (volver a poner la comida)
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[0].length; j++) {
            if (map[i][j] == 3) {
                map[i][j] = 2;
            }
        }
    }
    
    restartPacmanAndGhosts();
};

let update = () => {
    pacman.moveProcess();
    pacman.eat();
    updateGhosts();
    if (pacman.checkGhostCollision(ghosts)) {
        onGhostCollision();
    }
    checkWinCondition();
};

let drawFoods = () => {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[0].length; j++) {
            if (map[i][j] == 2) {
                createRect(
                    j * oneBlockSize + oneBlockSize / 3,
                    i * oneBlockSize + oneBlockSize / 3,
                    oneBlockSize / 3,
                    oneBlockSize / 3,
                    "#FEB897"
                );
            }
        }
    }
};

let drawPauseButton = () => {
    const buttonSize = 30;
    const buttonX = gameWidth - 40;
    const buttonY = gameHeight - 35;
    
    // Dibujar botón
    createRect(buttonX, buttonY, buttonSize, buttonSize, "#342DCA");
    canvasContext.fillStyle = "white";
    canvasContext.font = "12px Arial";
    canvasContext.textAlign = "center";
    canvasContext.fillText(gamePaused ? "▶" : "⏸", buttonX + buttonSize/2, buttonY + buttonSize/2 + 4);
};

let drawGameOver = () => {
    // Fondo semitransparente
    canvasContext.fillStyle = "rgba(0, 0, 0, 0.8)";
    canvasContext.fillRect(0, 0, gameWidth, gameHeight - 40);
    
    // Texto GAME OVER
    canvasContext.font = "30px Arial";
    canvasContext.fillStyle = "red";
    canvasContext.textAlign = "center";
    canvasContext.fillText("GAME OVER", gameWidth / 2, (gameHeight - 40) / 2 - 30);
    
    // Puntuación final
    canvasContext.font = "16px Arial";
    canvasContext.fillStyle = "white";
    canvasContext.fillText(`Score: ${score}`, gameWidth / 2, (gameHeight - 40) / 2);
    
    // Instrucción para reiniciar
    canvasContext.font = "14px Arial";
    canvasContext.fillStyle = "yellow";
    canvasContext.fillText("Reiniciar", gameWidth / 2, (gameHeight - 40) / 2 + 30);
};

let drawWinScreen = () => {
    // Fondo semitransparente
    canvasContext.fillStyle = "rgba(0, 0, 0, 0.8)";
    canvasContext.fillRect(0, 0, gameWidth, gameHeight - 40);
    
    // Texto de victoria
    canvasContext.font = "30px Arial";
    canvasContext.fillStyle = "gold";
    canvasContext.textAlign = "center";
    canvasContext.fillText("¡VICTORIA!", gameWidth / 2, (gameHeight - 40) / 2 - 40);
    
    // Mensaje de felicitación
    canvasContext.font = "18px Arial";
    canvasContext.fillStyle = "lightgreen";
    canvasContext.fillText("Congratulations! You ate all food", gameWidth / 2, (gameHeight - 40) / 2 - 10);
    
    // Puntuación final
    canvasContext.font = "16px Arial";
    canvasContext.fillStyle = "white";
    canvasContext.fillText(`Final Score: ${score}`, gameWidth / 2, (gameHeight - 40) / 2 + 20);
    
    // Instrucción para reiniciar
    canvasContext.font = "14px Arial";
    canvasContext.fillStyle = "yellow";
    canvasContext.fillText("Jugar de nuevo", gameWidth / 2, (gameHeight - 40) / 2 + 50);
};

let drawPauseScreen = () => {
    // Fondo semitransparente
    canvasContext.fillStyle = "rgba(0, 0, 0, 0.7)";
    canvasContext.fillRect(0, 0, gameWidth, gameHeight - 40);
    
    // Texto PAUSA
    canvasContext.font = "30px Arial";
    canvasContext.fillStyle = "yellow";
    canvasContext.textAlign = "center";
    canvasContext.fillText("PAUSA", gameWidth / 2, (gameHeight - 40) / 2 - 10);
    
    // Instrucción
    canvasContext.font = "14px Arial";
    canvasContext.fillStyle = "white";
    canvasContext.fillText("Continuar", gameWidth / 2, (gameHeight - 40) / 2 + 30);
};

let draw = () => {
    // Limpiar solo el área del juego (no la UI)
    canvasContext.clearRect(0, 0, gameWidth, gameHeight - 40);
    createRect(0, 0, gameWidth, gameHeight - 40, "black");
    
    if (gameOver) {
        drawGameOver();
    } else if (gameWon) {
        drawWinScreen();
    } else if (gamePaused) {
        drawWalls();
        drawFoods();
        drawGhosts();
        pacman.draw();
        drawPauseScreen();
    } else {
        drawWalls();
        drawFoods();
        drawGhosts();
        pacman.draw();
    }
    
    drawPauseButton();
};

let drawWalls = () => {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[0].length; j++) {
            if (map[i][j] == 1) {
                createRect(
                    j * oneBlockSize,
                    i * oneBlockSize,
                    oneBlockSize,
                    oneBlockSize,
                    "#342DCA"
                );
                if (j > 0 && map[i][j - 1] == 1) {
                    createRect(
                        j * oneBlockSize,
                        i * oneBlockSize + wallOffset,
                        wallSpaceWidth + wallOffset,
                        wallSpaceWidth,
                        wallInnerColor
                    );
                }

                if (j < map[0].length - 1 && map[i][j + 1] == 1) {
                    createRect(
                        j * oneBlockSize + wallOffset,
                        i * oneBlockSize + wallOffset,
                        wallSpaceWidth + wallOffset,
                        wallSpaceWidth,
                        wallInnerColor
                    );
                }

                if (i < map.length - 1 && map[i + 1][j] == 1) {
                    createRect(
                        j * oneBlockSize + wallOffset,
                        i * oneBlockSize + wallOffset,
                        wallSpaceWidth,
                        wallSpaceWidth + wallOffset,
                        wallInnerColor
                    );
                }

                if (i > 0 && map[i - 1][j] == 1) {
                    createRect(
                        j * oneBlockSize + wallOffset,
                        i * oneBlockSize,
                        wallSpaceWidth,
                        wallSpaceWidth + wallOffset,
                        wallInnerColor
                    );
                }
            }
        }
    }
};

let createGhosts = () => {
    ghosts = [];
    for (let i = 0; i < ghostCount * 2; i++) {
        let newGhost = new Ghost(
            9 * oneBlockSize + (i % 2 == 0 ? 0 : 1) * oneBlockSize,
            10 * oneBlockSize + (i % 2 == 0 ? 0 : 1) * oneBlockSize,
            oneBlockSize,
            oneBlockSize,
            oneBlockSize / 8,
            ghostImageLocations[i % 4].x,
            ghostImageLocations[i % 4].y,
            124,
            116,
            6 + i
        );
        ghosts.push(newGhost);
    }
};

// Función para actualizar visibilidad de botones
function updateButtons() {
    const pauseBtn = document.getElementById('pause-btn');
    const restartBtn = document.getElementById('restart-btn');
    
    if (gameOver || gameWon) {
        pauseBtn.style.display = 'none';
        restartBtn.style.display = 'block';
        restartBtn.textContent = 'Jugar de Nuevo';
    } else {
        pauseBtn.style.display = 'block';
        pauseBtn.textContent = gamePaused ? 'Continuar' : 'Pausa';
        restartBtn.style.display = 'none';
    }
}

// Función para pausar/reanudar
function togglePause() {
    if (!gameOver && !gameWon) {
        gamePaused = !gamePaused;
    }
}

// Inicializar el juego
function init() {
    createNewPacman();
    createGhosts();
    resizeCanvas();
    updateButtons();
    updateGameUI();
}

init();

// --- CONTROLES POR DESLIZAMIENTO ---
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", function(e) {
    if (gameOver || gameWon) {
        resetGame();
        return;
    }
    
    if (gamePaused) {
        togglePause();
        return;
    }
    
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    e.preventDefault();
});

canvas.addEventListener("touchmove", function(e) {
    if (gamePaused || gameOver || gameWon) return;

    const touch = e.touches[0];
    let deltaX = touch.clientX - touchStartX;
    let deltaY = touch.clientY - touchStartY;

    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            pacman.nextDirection = deltaX > 0 ? DIRECTION_RIGHT : DIRECTION_LEFT;
        } else {
            pacman.nextDirection = deltaY > 0 ? DIRECTION_BOTTOM : DIRECTION_UP;
        }
    }

    e.preventDefault();
});

// Event listener para teclado (para computadora)
window.addEventListener("keydown", (event) => {
    let k = event.keyCode;
    
    if ([37, 38, 39, 40, 65, 87, 68, 83, 32, 80].includes(k)) {
        event.preventDefault();
    }
    
    // Tecla P para pausar
    if (k == 80) {
        togglePause();
        return;
    }
    
    // Reiniciar con ESPACIO
    if ((gameOver || gameWon) && k == 32) {
        resetGame();
        return;
    }
    
    if (gamePaused || gameOver || gameWon) return;
    
    setTimeout(() => {
        if (k == 37 || k == 65) {
            pacman.nextDirection = DIRECTION_LEFT;
        } else if (k == 38 || k == 87) {
            pacman.nextDirection = DIRECTION_UP;
        } else if (k == 39 || k == 68) {
            pacman.nextDirection = DIRECTION_RIGHT;
        } else if (k == 40 || k == 83) {
            pacman.nextDirection = DIRECTION_BOTTOM;
        }
    }, 1);
});

// Botones de control
document.getElementById("pause-btn").addEventListener("click", togglePause);
document.getElementById("restart-btn").addEventListener("click", resetGame);

// Redimensionar cuando cambia el tamaño de la ventana
window.addEventListener('resize', resizeCanvas);
