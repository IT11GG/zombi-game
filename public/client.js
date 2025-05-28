const socket = io();

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let playerId = null;
let players = {};
let zombies = [];
let wave = 1;

let player = {
  x: 400,
  y: 300,
  size: 30,
  color: "blue",
  health: 100,
  maxHealth: 100,
  speed: 5,
};

const keys = {};

socket.on("welcome", (data) => {
  playerId = data.id;
  console.log("Player ID:", playerId);
});

socket.on("gameState", (state) => {
  players = state.players;
  zombies = state.zombies;
  wave = state.wave;
});

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
});
window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

function movePlayer() {
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  // Обмеження по межах канваса
  player.x = Math.max(player.size/2, Math.min(canvas.width - player.size/2, player.x));
  player.y = Math.max(player.size/2, Math.min(canvas.height - player.size/2, player.y));
}

function drawPlayer(p) {
  ctx.fillStyle = (p === player) ? "blue" : "green";
  ctx.fillRect(p.x - player.size/2, p.y - player.size/2, player.size, player.size);

  // Малюємо здоров'я
  ctx.fillStyle = "red";
  const hpWidth = (p.health / p.maxHealth) * player.size;
  ctx.fillRect(p.x - player.size/2, p.y - player.size/2 - 8, hpWidth, 5);
}

function drawZombies() {
  zombies.forEach(z => {
    ctx.fillStyle = "darkgreen";
    ctx.fillRect(z.x - 15, z.y - 15, 30, 30);
    // HP bar
    ctx.fillStyle = "red";
    const hpWidth = (z.health / z.maxHealth) * 30;
    ctx.fillRect(z.x - 15, z.y - 25, hpWidth, 5);
  });
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  movePlayer();

  // Відправляємо оновлення серверу
  socket.emit("playerUpdate", { x: player.x, y: player.y, health: player.health });

  // Оновлюємо свого гравця у глобальному списку (щоб малювати)
  if (playerId && players[playerId]) {
    players[playerId].x = player.x;
    players[playerId].y = player.y;
    players[playerId].health = player.health;
  }

  // Малюємо гравців
  Object.values(players).forEach(p => drawPlayer(p));

  // Малюємо зомбі
  drawZombies();

  // Малюємо хвилю
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Хвиля: " + wave, 10, 590);

  requestAnimationFrame(gameLoop);
}

gameLoop();
