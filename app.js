const can = document.querySelector('canvas');
const ctx = can.getContext('2d');
const resetBtn = document.querySelector('#reset');
const livesBar = document.querySelector('#lives');
const levelBar = document.querySelector('#level');
const percentBar = document.querySelector('#percent');
const switchBtn = document.querySelector('#switch');
const overlay = document.querySelector('#overlay');
const message = document.querySelector('#message');

can.width = 400;
can.height = 400;

const cell = 20;
const rows = can.height / cell;
const cols = can.width / cell;

let lastTime = 0;
let balls = [];
let rays = [];

let horiz = false;
switchBtn.textContent = 'Cut ' + (horiz ? '↕️' : '↔️');

let lives = 3;
let level = 1;

let GAME_STATE = 'PLAY'; // PLAY | FINISH | LOSE

function handleSwitchDirection(e) {
  e && e.preventDefault();
  horiz = !horiz;
  can.classList.toggle('ew');
  switchBtn.textContent = 'Cut ' + (horiz ? '↕️' : '↔️');
  return false;
}

function showOverlay(msg) {
  message.textContent = msg;
  overlay.style.display = 'flex';
}

function hideOverlay() {
  overlay.style.display = 'none';
}

can.addEventListener('click', e => {
  e.preventDefault();
  if (e.button === 0) {
    // reset the rays and start 2 new ones
    const rect = can.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cell);
    const y = Math.floor((e.clientY - rect.top)  / cell);
    rays = [];
    rays.push(new Ray(x,y, horiz ? 'e' : 'n'));
    rays.push(new Ray(x,y, horiz ? 'w' : 's'));
  }
});

resetBtn.addEventListener('click', e => setLevel(1));
can.addEventListener('contextmenu', handleSwitchDirection);
switchBtn.addEventListener('click', handleSwitchDirection);

class Grid {
  constructor() {
    this.cells = new Array(rows * cols);
    this.cells.fill(false);
    this.needsFill = false;
  }
  
  check(x, y) {
    // true if occupied
    if (x < 0 || y < 0 || x >= cols || y >= rows) {
      //outside
      return true;
    }
    const gridCell = x + y * rows;
    return this.cells[gridCell];
  }

  get percent() {
    const clearedCells = this.cells.reduce((acc, item) => {
      return acc + (item ? 1 : 0);
    }, 0);
    return Math.round((clearedCells / this.cells.length) * 100);
  }
  
  fill() {
    const newCells = new Array(rows * cols);
    newCells.fill(true);
    
    const floodFill = (id) => {
      const queue = [id];
      while (queue.length) {
        const curr = queue.shift();
        if (newCells[curr]) {
          newCells[curr] = false;
          const x = curr % cols;
          const y = Math.floor(curr / cols);
          if (x > 0) {
            const w = curr - 1;
            if (!this.cells[w] && newCells[w]) {
              queue.push(w);
            }
          }
          if (x < cols - 1) {
            const e = curr + 1;
            if (!this.cells[e] && newCells[e]) {
              queue.push(e);
            }
          }
          if (y > 0) {
            const n = curr - cols;
            if (!this.cells[n] && newCells[n]) {
              queue.push(n);
            }
          }
          if (y < rows - 1) {
            const s = curr + cols;
            if (!this.cells[s] && newCells[s]) {
              queue.push(s);
            }
          }
          
        }
      }
    };
    
    balls.forEach(ball => {
      floodFill(ball.x + ball.y * cols);
    });
    
    this.cells = newCells;
    this.needsFill = false;
  }
  
  draw() {
    ctx.clearRect(0, 0, can.width, can.height);
    ctx.fillStyle = '#ccc';
    ctx.strokeStyle = '#666';
  
    for (let i=0; i < this.cells.length; i++) {
      if (this.cells[i]) continue;
      const x = (i % cols) * cell;
      const y = Math.floor(i / cols) * cell;
      ctx.fillRect(x, y, cell, cell);
      ctx.beginPath();
      ctx.moveTo(x + cell / 2, y);
      ctx.lineTo(x + cell / 2, y + cell);
      ctx.moveTo(x, y + cell / 2);
      ctx.lineTo(x + cell, y + cell / 2);
      ctx.stroke();
    }
  }
}

const grid = new Grid();

class Ray {
  constructor(x, y, dir) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.passed = [x + y * rows];
    this.dead = false;
  }
  
  check(x, y) {
    const id = x + y * cols;
    return this.passed.includes(id);
  }
  
  move() {
    let nx = this.x;
    let ny = this.y;
    switch(this.dir) {
      case 'n':
        ny += 1;
        break;
      case 's':
        ny -= 1;
        break;
      case 'e':
        nx += 1;
        break;
      case 'w':
        nx -= 1;
        break;
      default:
    }
    if (grid.check(nx, ny)) {
      this.passed.push(this.x + this.y * rows);
      // clear all passed cells
      this.passed.forEach(cellID => {
        grid.cells[cellID] = true;
      });
      this.dead = true;
      grid.needsFill = true;
    } else {
      // keep moving
      this.passed.push(this.x + this.y * rows);
      this.x = nx;
      this.y = ny;
    }
  }
  
  draw() {
    ctx.fillStyle = '#00f';
    ctx.globalAlpha = 0.5;
    this.passed.forEach(cellID => {
      const x = (cellID % cols) * cell;
      const y = Math.floor(cellID / cols) * cell;
      ctx.fillRect(x, y, cell, cell);
    });
    
    ctx.globalAlpha = 1;
  }
}

class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dx = Math.sign(Math.random() * 2 - 1);
    this.dy = Math.sign(Math.random() * 2 - 1);
  }
  
  move() {
    let tx = this.x + this.dx;
    let ty = this.y + this.dy;
    // update
    if (!grid.check(tx, ty)) {
      this.x += this.dx;
      this.y += this.dy;
    } else {
      if (grid.check(tx, this.y)) {
        this.dx = -this.dx;
      }else if (grid.check(this.x, ty)) {
        this.dy = -this.dy;
      } else {
        this.dx = -this.dx;
        this.dy = -this.dy;
      }
    }
    // check if destroyed any rays
    rays.forEach(ray => {
      if (ray.check(this.x, this.y)) {
        ray.dead = true;
        lives -= 1;
      }
    });
  }
  
  draw() {
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.arc(
      this.x * cell + cell / 2,
      this.y * cell + cell / 2,
      cell / 2,
      0,
      Math.PI * 2
    );
    ctx.closePath();
    ctx.fill();
  }
}

function updateScoreboard() {
  livesBar.textContent = `${lives} lives`;
  levelBar.textContent = `level ${level}`;
  percentBar.textContent = `cleared ${grid.percent}%`
}

function setLevel(newLevel) {
  balls = [];
  rays = [];
  level = newLevel;
  if (level == 1) {
    lives = 3;
  }
  grid.cells = new Array(rows * cols);
  grid.cells.fill(false);
  for (i=0; i<level; i++) {
    const x = Math.floor(Math.random() * cols);
    const y = Math.floor(Math.random() * rows);
    balls.push(new Ball(x, y));
  }
  GAME_STATE = 'PLAY';
  hideOverlay();
}

setLevel(1);
animate();

function animate(now) {
  requestAnimationFrame(animate);
  if (now - lastTime > 17) {
    if (GAME_STATE === 'PLAY') {
      rays = rays.filter(ray => !ray.dead);
      rays.forEach(ray => ray.move());
      balls.forEach(ball =>  ball.move());
      if (grid.needsFill) {
        grid.fill();
      }
      if (lives <= 0) {
        GAME_STATE = 'LOSE';
        showOverlay('Game Over')
        setTimeout(() => { setLevel(1) }, 3000);
      } else if(grid.percent >= 75) {
        GAME_STATE = 'FINISH';
        showOverlay(`Level ${level} Complete`);
        lives += 1 + Math.floor((grid.percent - 75)/7);
        setTimeout(() => { setLevel(level + 1) }, 3000);
      }
    }
    
    grid.draw();
    balls.forEach(ball => ball.draw());
    rays.forEach(ray => ray.draw());
    updateScoreboard();
    lastTime = now;
  }
}
