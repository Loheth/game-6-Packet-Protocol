const RAD = Math.PI / 180;
const scrn = document.getElementById("canvas");
const sctx = scrn.getContext("2d");
scrn.tabIndex = 1;

// Original game dimensions
const ORIGINAL_WIDTH = 276;
const ORIGINAL_HEIGHT = 414;

// Scale canvas to fit screen while maintaining aspect ratio
function resizeCanvas() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate scale to fit screen
    const scaleX = windowWidth / ORIGINAL_WIDTH;
    const scaleY = windowHeight / ORIGINAL_HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    
    // Set canvas display size (scaled)
    scrn.style.width = (ORIGINAL_WIDTH * scale) + 'px';
    scrn.style.height = (ORIGINAL_HEIGHT * scale) + 'px';
    
    // Keep internal resolution at original size
    scrn.width = ORIGINAL_WIDTH;
    scrn.height = ORIGINAL_HEIGHT;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

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
      state.curr = state.getReady;
      bird.speed = 0;
      bird.y = 100;
      pipe.pipes = [];
      UI.score.curr = 0;
      SFX.played = false;
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
        state.curr = state.getReady;
        bird.speed = 0;
        bird.y = 100;
        pipe.pipes = [];
        UI.score.curr = 0;
        SFX.played = false;
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
    this.y = parseFloat(scrn.height - this.sprite.height);
    
    // Tile the ground to cover the entire screen width
    const spriteWidth = this.sprite.width;
    const startX = this.x % spriteWidth;
    
    // Draw ground tiles to cover entire screen width
    for (let x = startX - spriteWidth; x < scrn.width + spriteWidth; x += spriteWidth) {
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
    // Scale and fit the background to fill the entire canvas
    sctx.drawImage(this.sprite, 0, 0, scrn.width, scrn.height);
    // Darken the background with a semi-transparent black overlay
    sctx.fillStyle = "rgba(0, 0, 0, 0.3)"; // Adjust opacity (0.0 to 1.0) to control darkness
    sctx.fillRect(0, 0, scrn.width, scrn.height);
  },
};
const pipe = {
  top: { sprite: new Image() },
  bot: { sprite: new Image() },
  gap: 85,
  moved: true,
  pipes: [],
  draw: function () {
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
        x: parseFloat(scrn.width),
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
    // Add glow effect
    sctx.shadowBlur = 15;
    sctx.shadowColor = "rgba(255, 255, 200, 0.8)";
    sctx.shadowOffsetX = 0;
    sctx.shadowOffsetY = 0;
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
  draw: function () {
    switch (state.curr) {
      case state.getReady:
        // Ensure image has loaded before drawing
        if (this.getReady.sprite.complete && this.getReady.sprite.naturalWidth > 0) {
          // Scale down if image is too large for canvas
          const maxWidth = scrn.width * 0.9;
          const maxHeight = scrn.height * 0.5;
          let drawWidth = this.getReady.sprite.width;
          let drawHeight = this.getReady.sprite.height;
          
          // Scale down if needed to fit on canvas
          if (drawWidth > maxWidth || drawHeight > maxHeight) {
            const scale = Math.min(maxWidth / drawWidth, maxHeight / drawHeight);
            drawWidth = drawWidth * scale;
            drawHeight = drawHeight * scale;
          }
          
          this.y = parseFloat(scrn.height - drawHeight) / 2;
          this.x = parseFloat(scrn.width - drawWidth) / 2;
          this.tx = parseFloat(scrn.width - this.tap[0].sprite.width) / 2;
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
        this.y = parseFloat(scrn.height - scaledHeight) / 2;
        this.x = parseFloat(scrn.width - scaledWidth) / 2;
        this.tx = parseFloat(scrn.width - this.tap[0].sprite.width) / 2;
        this.ty =
          this.y + scaledHeight - this.tap[0].sprite.height;
        sctx.drawImage(this.gameOver.sprite, this.x, this.y, scaledWidth, scaledHeight);
        sctx.drawImage(this.tap[this.frame].sprite, this.tx, this.ty);
        break;
    }
    this.drawScore();
  },
  drawScore: function () {
    sctx.fillStyle = "#FFFFFF";
    sctx.strokeStyle = "#000000";
    switch (state.curr) {
      case state.Play:
        sctx.lineWidth = "2";
        sctx.font = "35px Squada One";
        sctx.fillText(this.score.curr, scrn.width / 2 - 5, 50);
        sctx.strokeText(this.score.curr, scrn.width / 2 - 5, 50);
        break;
      case state.gameOver:
        sctx.lineWidth = "2";
        sctx.font = "40px Squada One";
        let sc = `SCORE :     ${this.score.curr}`;
        try {
          this.score.best = Math.max(
            this.score.curr,
            localStorage.getItem("best")
          );
          localStorage.setItem("best", this.score.best);
          let bs = `BEST  :     ${this.score.best}`;
          sctx.fillText(sc, scrn.width / 2 - 80, scrn.height / 2 + 0);
          sctx.strokeText(sc, scrn.width / 2 - 80, scrn.height / 2 + 0);
          sctx.fillText(bs, scrn.width / 2 - 80, scrn.height / 2 + 30);
          sctx.strokeText(bs, scrn.width / 2 - 80, scrn.height / 2 + 30);
        } catch (e) {
          sctx.fillText(sc, scrn.width / 2 - 85, scrn.height / 2 + 15);
          sctx.strokeText(sc, scrn.width / 2 - 85, scrn.height / 2 + 15);
        }

        break;
    }
  },
  update: function () {
    if (state.curr == state.Play) return;
    this.frame += frames % 10 == 0 ? 1 : 0;
    this.frame = this.frame % this.tap.length;
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
  sctx.fillStyle = "#30c0df";
  sctx.fillRect(0, 0, scrn.width, scrn.height);
  bg.draw();
  pipe.draw();

  bird.draw();
  gnd.draw();
  UI.draw();
}

setInterval(gameLoop, 20);
