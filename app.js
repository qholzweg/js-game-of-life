// Settings:
const INIT_GRID_SIZE = { cols: 1000, rows: 1000 };
const INIT_SPEED = 150;

// Constants
const cellSize = 30;
const operations = [
  [0, 1], // right
  [0, -1], // left
  [1, -1], // top left
  [-1, 1], // top right
  [1, 1], // top
  [-1, -1], // bottom
  [1, 0], // bottom right
  [-1, 0], // bottom left
];

// UI Elements
const playButton = document.getElementById('play');
const randomButton = document.getElementById('random');
const clearButton = document.getElementById('clear');

// init
let running = false;
let grid = generateEmptyGrid(INIT_GRID_SIZE);
let step = 0;

// positions and sizes
const gridSize = INIT_GRID_SIZE;
let containerSize,
  viewPort,
  maxCells,
  visibleGridSize,
  gridOffset,
  left,
  visibleGrid,
  offset = [0, 0];
calcSizes();
calcVisibleZone();

// UI
// render
let gridNode = createGameNode(visibleGrid);
mount(gridNode);

// Buttons
playButton.addEventListener('click', () => togglePlay());
randomButton.addEventListener('click', () => {
  stop();
  grid = generateRandomTiles(INIT_GRID_SIZE);
  paintNewGrid();
  countCells();
});
clearButton.addEventListener('click', () => {
  stop();
  grid = generateEmptyGrid(INIT_GRID_SIZE);
  paintNewGrid();
})

// window events
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onResize);

setInterval(() => runSimulation(), INIT_SPEED);

// Functions

// runs the game, computing grid for the next generation
function runSimulation() {
  if (!running) {
    return;
  }

  let gridCopy = JSON.parse(JSON.stringify(grid));

  for (let i = 0; i < gridSize.rows; i++) {
    for (let j = 0; j < gridSize.cols; j++) {
      let neighbors = 0;

      operations.forEach(([x, y]) => {

        // calculate neighbors 
        const newI = i + x < 0 ?
          gridSize.rows - 1 :
          i + x > gridSize.rows - 1 ?
            0 : i + x;

        const newJ = j + y < 0 ?
          gridSize.cols - 1 :
          j + y > gridSize.cols - 1 ?
            0 : j + y;

        if (newI >= 0 && newI < gridSize.rows && newJ >= 0 && newJ < gridSize.cols) {
          neighbors += grid[newI][newJ];
        }
      });

      // apply rules for next generation
      if (neighbors < 2 || neighbors > 3) {
        gridCopy[i][j] = 0;
      } else if (grid[i][j] === 0 && neighbors === 3) {
        gridCopy[i][j] = 1;
      }
    }
  }
  grid = gridCopy;
  paintNewGrid();
  incrementStep();
  countCells();
}

function togglePlay() {
  running = !running;
  playButton.innerText = running ? 'Stop' : 'Play';
}
function stop() {
  running = false;
  playButton.innerText = 'Play';
}

// gets the sizes elements to position depending on viewport size
function calcSizes() {
  containerSize = {
    width: cellSize * gridSize.cols,
    height: cellSize * gridSize.rows
  }
  viewPort = {
    width: window.innerWidth,
    height: window.innerHeight - 100,
  }
  maxCells = {
    x: Math.floor(viewPort.width / cellSize),
    y: Math.floor(viewPort.height / cellSize),
  }
  visibleGridSize = {
    x: maxCells.x < gridSize.cols ? maxCells.x : gridSize.cols,
    y: maxCells.y < gridSize.rows ? maxCells.y : gridSize.rows
  }

  const fullCellSize = cellSize + 1;
  left = visibleGridSize.x * fullCellSize + 1 < viewPort.width ?
    (viewPort.width - visibleGridSize.x * fullCellSize + 1) / 2 :
    0;
}

// gets the size of the visible area of the grid and it's offset depending on scroll
function calcVisibleZone() {
  gridOffset = {
    x: Math.floor(offset[0] / cellSize) > 0 ? Math.floor(offset[0] / cellSize) : 0,
    y: Math.floor(offset[1] / cellSize) > 0 ? Math.floor(offset[1] / cellSize) : 0
  }
  visibleGrid = getVisibleZone(grid, gridOffset.x, visibleGridSize.x, gridOffset.y, visibleGridSize.y);
}

function onScroll() {
  offset = [window.pageXOffset, window.pageYOffset];
  calcVisibleZone();
  paintNewGrid();
}
function onResize () {
  calcSizes();
  calcVisibleZone();
  let gridNode = createGameNode(visibleGrid);
  mount(gridNode);
}

function incrementStep () {
  step++;
  document.getElementById('step').innerText = step;
}

function countCells() {
  document.getElementById('alive').innerText = grid.reduce(
    (acc, row) => acc + row.reduce(
      (acc, col) => acc + col, 0
    ), 0
  )
}


// -----
// DOM creation functions
// places game in DOM
function mount(node) {
  document.getElementById('root').replaceWith(node);
  return node;
};

// activates and deactivates cell in the grid
function cellClick(i, k) {
  if (!running) {
    grid[i + gridOffset.y][k + gridOffset.x] = grid[i + gridOffset.y][k + gridOffset.x] === 0 ? 1 : 0;
    const el = document.getElementById(`${i}-${k}`);
    el.classList.contains('active') ? el.classList.remove('active') : el.classList.add('active');
  }
}

// constructs the DOM object for the game
function createGameNode(grid) {
  // container of size of the full grid "pushes" scrolls
  let container = document.createElement('div');
  container.id = 'root';
  container.style.width = containerSize.width + 'px';
  container.style.height = containerSize.height + 'px';

  // container for the grid with central horizontal positioning (if the width is less then the viewport width)
  let gameNode = document.createElement('div');
  gameNode.className = 'game';
  gameNode.style.width = viewPort.width + cellSize * 2 + 'px';
  gameNode.style.height = viewPort.width + cellSize * 2 + 'px';
  gameNode.style.left = left + 'px';

  // grid node with grid template rule
  let gridNode = document.createElement('div');
  gridNode.className = "game-grid";
  gridNode.style.gridTemplateColumns = `repeat(${visibleGridSize.x}, ${cellSize}px)`;
  grid.map((rows, i) =>
    rows.map((col, k) => {
      //cell with click listener
      let cell = document.createElement('div');
      cell.id = `${i}-${k}`;
      cell.className = `game-cell ${grid[i][k] ? 'active' : ''}`;
      cell.addEventListener('click', () => cellClick(i, k))
      gridNode.appendChild(cell);
    })
  )

  gameNode.appendChild(gridNode);
  container.appendChild(gameNode);
  return container;
}

// gets new positions of cells and calls repaint grid func
function paintNewGrid() {
  const oldGrid = visibleGrid;
  calcVisibleZone();
  repaintGrid(oldGrid, visibleGrid);
}

// changes the class of the cell if it's status have changed
function repaintGrid(oldGrid, newGrid) {
  newGrid.forEach((rows, i) => {
    rows.forEach((cols, k) => {
      if (oldGrid[i, k] !== cols) {
        const el = findCell(i, k);
        cols ? el.classList.add('active') : el.classList.remove('active');
      }
    })
  })
}

// utils
//generates a grid of given size with random cells
function generateRandomTiles(size) {
  const rows = [];
  for (let i = 0; i < size.rows; i++) {
    rows.push(Array.from(Array(size.cols), () => (Math.random() > 0.7 ? 1 : 0)));
  }
  return rows;
};

//generates an empty grid of given size
function generateEmptyGrid(size) {
  const rows = [];
  for (let i = 0; i < size.rows; i++) {
    rows.push(Array.from(Array(size.cols), () => 0));
  }
  return rows;
};

function findCell(i, k) {
  return document.getElementById(`${i}-${k}`);
}

//get active, i.e. visible right now zone for the grid
function getVisibleZone(grid, xStart, xLength, yStart, yLength) {
  const zone = [];
  for (let i = yStart; i < yLength + yStart; i++) {
    zone.push(grid[i].slice(xStart, xLength + xStart));
  }
  return zone;
}