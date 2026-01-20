const RAD = Math.PI / 180;
const scrn = document.getElementById("canvas");
const sctx = scrn.getContext("2d");
scrn.tabIndex = 1;

// Original game dimensions
const ORIGINAL_WIDTH = 276;
const ORIGINAL_HEIGHT = 414;

// Scale canvas to fit screen while maintaining aspect ratio with high-DPI support
function resizeCanvas() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate scale to fit screen
    const scaleX = windowWidth / ORIGINAL_WIDTH;
    const scaleY = windowHeight / ORIGINAL_HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    
    // Get device pixel ratio for high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas display size (scaled)
    scrn.style.width = (ORIGINAL_WIDTH * scale) + 'px';
    scrn.style.height = (ORIGINAL_HEIGHT * scale) + 'px';
    
    // Set internal resolution with high-DPI scaling for crisp rendering
    scrn.width = ORIGINAL_WIDTH * dpr;
    scrn.height = ORIGINAL_HEIGHT * dpr;
    
    // Reset transform and scale the context to match the device pixel ratio
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.scale(dpr, dpr);
    
    // Enable high-quality image smoothing
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = 'high';
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Ensure high-quality rendering after context is created
sctx.imageSmoothingEnabled = true;
sctx.imageSmoothingQuality = 'high';

scrn.addEventListener("click", () => {
  switch (state.curr) {
    case state.getReady:
      state.curr = state.Play;
      SFX.start.play();
      break;
    case state.Play:
      bird.flap();
      break;
    case state.gameOver:
      // Don't allow restart via click when modal is showing
      const modal = document.getElementById("nameModal");
      if (!modal || !modal.classList.contains("show")) {
        state.curr = state.getReady;
        bird.speed = 0;
        bird.y = 100;
        pipe.pipes = [];
        UI.score.curr = 0;
        SFX.played = false;
        UI.namePrompted = false;
      }
      break;
  }
});

scrn.onkeydown = function keyDown(e) {
  if (e.keyCode == 32 || e.keyCode == 87 || e.keyCode == 38) {
    switch (state.curr) {
      case state.getReady:
        state.curr = state.Play;
        SFX.start.play();
        break;
      case state.Play:
        bird.flap();
        break;
      case state.gameOver:
        // Don't allow restart via keyboard when modal is showing
        const modal = document.getElementById("nameModal");
        if (!modal || !modal.classList.contains("show")) {
          state.curr = state.getReady;
          bird.speed = 0;
          bird.y = 100;
          pipe.pipes = [];
          UI.score.curr = 0;
          SFX.played = false;
          UI.namePrompted = false;
        }
        break;
    }
  }
};

let frames = 0;
let dx = 2;
const state = {
  curr: 0,
  getReady: 0,
  Play: 1,
  gameOver: 2,
};
const SFX = {
  start: new Audio(),
  flap: new Audio(),
  score: new Audio(),
  hit: new Audio(),
  die: new Audio(),
  played: false,
};
const gnd = {
  sprite: new Image(),
  x: 0,
  y: 0,
  draw: function () {
    if (!this.sprite.complete || this.sprite.width === 0) return;
    this.y = parseFloat(ORIGINAL_HEIGHT - this.sprite.height);
    
    // Enable high-quality rendering for ground
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = 'high';
    
    // Tile the ground to cover the entire screen width
    const spriteWidth = this.sprite.width;
    const startX = this.x % spriteWidth;
    
    // Draw ground tiles to cover entire screen width
    for (let x = startX - spriteWidth; x < ORIGINAL_WIDTH + spriteWidth; x += spriteWidth) {
      sctx.drawImage(this.sprite, x, this.y);
    }
  },
  update: function () {
    if (state.curr != state.Play) return;
    this.x -= dx;
    // Keep x within reasonable bounds to prevent overflow
    const spriteWidth = this.sprite.complete && this.sprite.width > 0 ? this.sprite.width : 336;
    if (this.x <= -spriteWidth) {
      this.x += spriteWidth;
    }
  },
};
const bg = {
  sprite: new Image(),
  x: 0,
  y: 0,
  draw: function () {
    // Enable high-quality image smoothing for background
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = 'high';
    // Scale and fit the background to fill the entire canvas
    sctx.drawImage(this.sprite, 0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    // Enhanced darkening with gradient overlay for depth
    const gradient = sctx.createLinearGradient(0, 0, 0, ORIGINAL_HEIGHT);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.2)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.4)");
    sctx.fillStyle = gradient;
    sctx.fillRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
  },
};
const pipe = {
  top: { sprite: new Image() },
  bot: { sprite: new Image() },
  gap: 85,
  moved: true,
  pipes: [],
  draw: function () {
    // Enable high-quality rendering for pipes
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = 'high';
    for (let i = 0; i < this.pipes.length; i++) {
      let p = this.pipes[i];
      sctx.drawImage(this.top.sprite, p.x, p.y);
      sctx.drawImage(
        this.bot.sprite,
        p.x,
        p.y + parseFloat(this.top.sprite.height) + this.gap
      );
    }
  },
  update: function () {
    if (state.curr != state.Play) return;
    if (frames % 100 == 0) {
      this.pipes.push({
        x: parseFloat(ORIGINAL_WIDTH),
        y: -210 * Math.min(Math.random() + 1, 1.8),
      });
    }
    this.pipes.forEach((pipe) => {
      pipe.x -= dx;
    });

    if (this.pipes.length && this.pipes[0].x < -this.top.sprite.width) {
      this.pipes.shift();
      this.moved = true;
    }
  },
};
const bird = {
  animations: [
    { sprite: new Image() },
    { sprite: new Image() },
    { sprite: new Image() },
    { sprite: new Image() },
  ],
  rotatation: 0,
  x: 50,
  y: 100,
  speed: 0,
  gravity: 0.125,
  thrust: 2.5,
  frame: 0,
  width: 24,
  height: 34,
  scale: 0.17, // Scale factor to make bird smaller (adjust as needed)
  draw: function () {
    // Use sprite's natural dimensions to maintain proper aspect ratio
    const sprite = this.animations[this.frame].sprite;
    let w, h;
    
    if (sprite.complete && sprite.naturalWidth > 0 && sprite.naturalHeight > 0) {
      // Scale down the sprite while maintaining aspect ratio
      w = sprite.naturalWidth * this.scale;
      h = sprite.naturalHeight * this.scale;
    } else {
      // Fallback to default proportions (original Flappy Bird ratio: ~24x34)
      w = this.width * this.scale;
      h = this.height * this.scale;
    }
    
    sctx.save();
    sctx.translate(this.x, this.y);
    sctx.rotate(this.rotatation * RAD);
    // Enhanced glow effect for premium look
    sctx.shadowBlur = 20;
    sctx.shadowColor = "rgba(255, 255, 200, 0.9)";
    sctx.shadowOffsetX = 0;
    sctx.shadowOffsetY = 0;
    // Enable high-quality rendering
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = 'high';
    sctx.drawImage(sprite, -w / 2, -h / 2, w, h);
    sctx.restore();
  },
  update: function () {
    // Use average of width and height for collision radius to account for proper aspect ratio
    let r = (this.width + this.height) / 4;
    switch (state.curr) {
      case state.getReady:
        this.rotatation = 0;
        this.y += frames % 10 == 0 ? Math.sin(frames * RAD) : 0;
        this.frame += frames % 10 == 0 ? 1 : 0;
        break;
      case state.Play:
        this.frame += frames % 5 == 0 ? 1 : 0;
        this.y += this.speed;
        this.setRotation();
        this.speed += this.gravity;
        if (this.y + r >= gnd.y || this.collisioned()) {
          state.curr = state.gameOver;
        }

        break;
      case state.gameOver:
        this.frame = 1;
        if (this.y + r < gnd.y) {
          this.y += this.speed;
          this.setRotation();
          this.speed += this.gravity * 2;
        } else {
          this.speed = 0;
          this.y = gnd.y - r;
          this.rotatation = 90;
          if (!SFX.played) {
            SFX.die.play();
            SFX.played = true;
            // Prompt for player name when game ends
            if (!UI.namePrompted) {
              UI.namePrompted = true;
              setTimeout(() => {
                Leaderboard.promptPlayerName(UI.score.curr);
              }, 500);
            }
          }
        }

        break;
    }
    this.frame = this.frame % this.animations.length;
  },
  flap: function () {
    if (this.y > 0) {
      SFX.flap.play();
      this.speed = -this.thrust;
    }
  },
  setRotation: function () {
    if (this.speed <= 0) {
      this.rotatation = Math.max(-25, (-25 * this.speed) / (-1 * this.thrust));
    } else if (this.speed > 0) {
      this.rotatation = Math.min(90, (90 * this.speed) / (this.thrust * 2));
    }
  },
  collisioned: function () {
    if (!pipe.pipes.length) return false;
    // Use proper collision radius based on bird's actual dimensions
    let r = Math.max(this.width, this.height) / 2;
    let w = parseFloat(pipe.top.sprite.width);
    
    // Check collision with all pipes
    for (let i = 0; i < pipe.pipes.length; i++) {
      let p = pipe.pipes[i];
      let x = p.x;
      let y = p.y;
      let roof = y + parseFloat(pipe.top.sprite.height);
      let floor = roof + pipe.gap;
      
      // Check if bird is horizontally overlapping with this pipe
      if (this.x + r >= x && this.x - r <= x + w) {
        // Check if bird collides with top or bottom pipe
        if (this.y - r <= roof || this.y + r >= floor) {
          SFX.hit.play();
          return true;
        }
      }
      
      // Check scoring - bird passed the pipe
      if (i === 0 && this.x - r > x + w && pipe.moved) {
        UI.score.curr++;
        SFX.score.play();
        pipe.moved = false;
      }
    }
    return false;
  },
};
// Leaderboard functions
const Leaderboard = {
  get: function() {
    try {
      const stored = localStorage.getItem("leaderboard");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },
  save: function(leaderboard) {
    try {
      localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
    } catch (e) {
      console.error("Failed to save leaderboard:", e);
    }
  },
  addScore: function(name, score) {
    if (!name || name.trim() === "") return;
    
    const leaderboard = this.get();
    const normalizedName = name.trim();
    
    // Find existing entry (case-insensitive)
    const existingIndex = leaderboard.findIndex(
      entry => entry.name.toLowerCase() === normalizedName.toLowerCase()
    );
    
    if (existingIndex !== -1) {
      // Update score if new score is higher
      if (score > leaderboard[existingIndex].score) {
        leaderboard[existingIndex].score = score;
        // Preserve original case of the name
        leaderboard[existingIndex].name = normalizedName;
      }
    } else {
      // Add new entry
      leaderboard.push({ name: normalizedName, score: score });
    }
    
    // Sort by score (descending)
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Keep only top 10
    if (leaderboard.length > 10) {
      leaderboard.splice(10);
    }
    
    this.save(leaderboard);
  },
  promptPlayerName: function(score) {
    const modal = document.getElementById("nameModal");
    const nameInput = document.getElementById("playerNameInput");
    const submitBtn = document.getElementById("submitNameBtn");
    const restartBtn = document.getElementById("restartBtn");
    const quitBtn = document.getElementById("quitBtn");
    const scoreDisplay = document.getElementById("finalScore");
    const leaderboardContainer = document.getElementById("leaderboardList");
    
    // Set the score display
    scoreDisplay.textContent = score;
    
    // Populate leaderboard in modal
    this.updateLeaderboardDisplay(leaderboardContainer);
    
    // Show the modal
    modal.classList.add("show");
    nameInput.value = "";
    nameInput.focus();
    
    // Handle submit button click
    const handleSubmit = () => {
      const name = nameInput.value.trim();
      if (name !== "") {
        // Store last player name for highlighting
        try {
          localStorage.setItem("lastPlayerName", name);
        } catch (e) {
          // Ignore if localStorage fails
        }
        this.addScore(name, score);
        // Update leaderboard display after adding score
        this.updateLeaderboardDisplay(leaderboardContainer);
        // Keep modal open - don't close it
        // Remove event listeners
        submitBtn.removeEventListener("click", handleSubmit);
        nameInput.removeEventListener("keypress", handleKeyPress);
      }
    };
    
    // Handle Enter key press
    const handleKeyPress = (e) => {
      if (e.key === "Enter") {
        handleSubmit();
      }
    };
    
    // Handle restart button click
    const handleRestart = () => {
      // Close modal
      modal.classList.remove("show");
      // Reset game state
      state.curr = state.getReady;
      bird.speed = 0;
      bird.y = 100;
      pipe.pipes = [];
      UI.score.curr = 0;
      SFX.played = false;
      UI.namePrompted = false;
      // Remove all event listeners
      submitBtn.removeEventListener("click", handleSubmit);
      nameInput.removeEventListener("keypress", handleKeyPress);
      restartBtn.removeEventListener("click", handleRestart);
      quitBtn.removeEventListener("click", handleQuit);
    };
    
    // Handle quit button click
    const handleQuit = () => {
      // Close modal and leave game in game over state
      modal.classList.remove("show");
      // Remove all event listeners
      submitBtn.removeEventListener("click", handleSubmit);
      nameInput.removeEventListener("keypress", handleKeyPress);
      restartBtn.removeEventListener("click", handleRestart);
      quitBtn.removeEventListener("click", handleQuit);
    };
    
    submitBtn.addEventListener("click", handleSubmit);
    nameInput.addEventListener("keypress", handleKeyPress);
    restartBtn.addEventListener("click", handleRestart);
    quitBtn.addEventListener("click", handleQuit);
  },
  updateLeaderboardDisplay: function(container) {
    if (!container) return;
    
    const leaderboard = this.get();
    const lastPlayerName = localStorage.getItem("lastPlayerName") || "";
    
    if (leaderboard.length === 0) {
      container.innerHTML = '<div class="leaderboard-empty">No scores yet!</div>';
      return;
    }
    
    let html = '';
    const maxEntries = 5;
    const entriesToShow = Math.min(leaderboard.length, maxEntries);
    
    for (let i = 0; i < entriesToShow; i++) {
      const entry = leaderboard[i];
      const rank = i + 1;
      const isCurrentPlayer = entry.name.toLowerCase() === lastPlayerName.toLowerCase();
      const entryClass = isCurrentPlayer ? 'leaderboard-entry current-player' : 'leaderboard-entry';
      
      html += `<div class="${entryClass}">
        <span class="rank">${rank}.</span>
        <span class="name">${entry.name}</span>
        <span class="score">${entry.score}</span>
      </div>`;
    }
    
    container.innerHTML = html;
  }
};

const UI = {
  getReady: { sprite: new Image() },
  gameOver: { sprite: new Image() },
  tap: [{ sprite: new Image() }, { sprite: new Image() }],
  score: {
    curr: 0,
    best: 0,
  },
  x: 0,
  y: 0,
  tx: 0,
  ty: 0,
  frame: 0,
  namePrompted: false,
  draw: function () {
    switch (state.curr) {
      case state.getReady:
        // Ensure image has loaded before drawing
        if (this.getReady.sprite.complete && this.getReady.sprite.naturalWidth > 0) {
          // Scale down if image is too large for canvas
          const maxWidth = ORIGINAL_WIDTH * 0.9;
          const maxHeight = ORIGINAL_HEIGHT * 0.5;
          let drawWidth = this.getReady.sprite.width;
          let drawHeight = this.getReady.sprite.height;
          
          // Scale down if needed to fit on canvas
          if (drawWidth > maxWidth || drawHeight > maxHeight) {
            const scale = Math.min(maxWidth / drawWidth, maxHeight / drawHeight);
            drawWidth = drawWidth * scale;
            drawHeight = drawHeight * scale;
          }
          
          this.y = parseFloat(ORIGINAL_HEIGHT - drawHeight) / 2;
          this.x = parseFloat(ORIGINAL_WIDTH - drawWidth) / 2;
          this.tx = parseFloat(ORIGINAL_WIDTH - this.tap[0].sprite.width) / 2;
          this.ty = this.y + drawHeight + 15;
          sctx.drawImage(this.getReady.sprite, this.x, this.y, drawWidth, drawHeight);
          sctx.drawImage(this.tap[this.frame].sprite, this.tx, this.ty);
        }
        break;
      case state.gameOver:
        // Scale down the game over sprite
        const scale = 0.4; // Scale factor to make it smaller
        const scaledWidth = this.gameOver.sprite.width * scale;
        const scaledHeight = this.gameOver.sprite.height * scale;
        // Center the game over sprite vertically and horizontally
        this.y = parseFloat(ORIGINAL_HEIGHT - scaledHeight) / 2;
        this.x = parseFloat(ORIGINAL_WIDTH - scaledWidth) / 2;
        this.tx = parseFloat(ORIGINAL_WIDTH - this.tap[0].sprite.width) / 2;
        this.ty = ORIGINAL_HEIGHT - 40;
        sctx.drawImage(this.gameOver.sprite, this.x, this.y, scaledWidth, scaledHeight);
        sctx.drawImage(this.tap[this.frame].sprite, this.tx, this.ty);
        break;
    }
    this.drawScore();
  },
  drawScore: function () {
    // Enable text rendering hints for crisp text
    sctx.textBaseline = 'middle';
    sctx.textAlign = 'center';
    
    switch (state.curr) {
      case state.Play:
        // Bright, vibrant score display matching game UI
        sctx.font = "bold 40px Squada One";
        const scoreText = String(this.score.curr);
        
        // Draw multiple layers for depth and visibility
        // Outer glow/shadow
        sctx.shadowBlur = 12;
        sctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        sctx.shadowOffsetX = 0;
        sctx.shadowOffsetY = 0;
        sctx.fillStyle = "#FFFFFF";
        sctx.fillText(scoreText, ORIGINAL_WIDTH / 2, 50);
        
        // Bright white fill with slight glow
        sctx.shadowBlur = 8;
        sctx.shadowColor = "rgba(255, 255, 255, 0.6)";
        sctx.fillStyle = "#FFFFFF";
        sctx.fillText(scoreText, ORIGINAL_WIDTH / 2, 50);
        
        // Main bright text
        sctx.shadowBlur = 0;
        sctx.fillStyle = "#FFFFFF";
        sctx.fillText(scoreText, ORIGINAL_WIDTH / 2, 50);
        
        // Subtle outline for definition
        sctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        sctx.lineWidth = 1.5;
        sctx.strokeText(scoreText, ORIGINAL_WIDTH / 2, 50);
        break;
        
      case state.gameOver:
        // Score and best are no longer displayed on the game over screen
        // They are shown in the modal instead
        break;
    }
  },
  update: function () {
    if (state.curr == state.Play) return;
    this.frame += frames % 10 == 0 ? 1 : 0;
    this.frame = this.frame % this.tap.length;
  },
  drawLeaderboard: function() {
    // Leaderboard is now displayed in the modal, not on canvas
    // This function is kept for potential future use but not called
  },
};

gnd.sprite.src = "img/ground.png";
bg.sprite.src = "img/BG.jpg";
pipe.top.sprite.src = "img/toppipe.png";
pipe.bot.sprite.src = "img/botpipe.png";
UI.gameOver.sprite.src = "img/go.png";
UI.getReady.sprite.src = "img/getready.png";
UI.tap[0].sprite.src = "img/tap/t0.png";
UI.tap[1].sprite.src = "img/tap/t1.png";
bird.animations[0].sprite.src = "img/bird/b0.png";
bird.animations[1].sprite.src = "img/bird/b1.png";
bird.animations[2].sprite.src = "img/bird/b2.png";
bird.animations[3].sprite.src = "img/bird/b0.png";
SFX.start.src = "sfx/start.wav";
SFX.flap.src = "sfx/flap.wav";
SFX.score.src = "sfx/score.wav";
SFX.hit.src = "sfx/hit.wav";
SFX.die.src = "sfx/die.wav";

function gameLoop() {
  update();
  draw();
  frames++;
}

function update() {
  bird.update();
  gnd.update();
  pipe.update();
  UI.update();
}

function draw() {
  // Clear canvas with smooth background
  sctx.fillStyle = "#30c0df";
  sctx.fillRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
  
  // Ensure high-quality rendering throughout
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = 'high';
  
  bg.draw();
  pipe.draw();
  bird.draw();
  gnd.draw();
  UI.draw();
}

setInterval(gameLoop, 20);
