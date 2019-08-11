const socket = new WebSocket('wss://ariblumenthal.com:9000');

Handlebars.registerHelper('ifeq', function(a, b, options) {
  return (a == b) ? options.fn(this) : options.inverse(this);
});

const playerTmpl = compileHbs("player-tmpl");
Handlebars.registerPartial('player', playerTmpl);

const endgameTmpl = compileHbs("endgame-tmpl");
const gameTmpl = compileHbs("game-tmpl");
const prescreenTmpl = compileHbs("prescreen-tmpl");
const wordTmpl = compileHbs("word-tmpl");

const pageEl = document.getElementById('page');

// Whether the user has joined the lobby.
let joined = false;

// Elements used during the game phase.
let wordinputEl, paperEl;

// The players roster id, after joining the game.
let lobbyRosterId;

// A callback to the function that updates the timer at the top of the game.
let timerCallbackId;

// Persistent values stored in the cache.
let token, nick, boo;
initCookieData();
loadStartingPage();

const BOO_COLORS = [
  [], // no Boo 0
  ["#fdd7d4", "#f43f32"], // Boo 1
  ["#008000", "#00fe00"], // Boo 2
  ["#878700", "#fdfd00"], // Boo 3
  ["#5a0000", "#fa0000"], // Boo 4
  ["#00c3c3", "#00fefe"], // Boo 5
  ["#c78837", "#fcac46"], // Boo 6
  ["#990099", "#fe00fe"], // Boo 7
  ["#000088", "#0000fe"], // Boo 8
  ["#560f77", "#6d1496"], // Boo 9
  ["#254e1e", "#2e6226"], // Boo 10
  ["#3d0000", "#810000"], // Boo 10
  ["#a06e6e", "#feafaf"], // Boo 12
  ["#555555", "#939393"], // Boo 13
  ["#68405b", "#835073"], // Boo 14
  ["#555524", "#93923f"], // Boo 15
  ["#7377b6", "#9398e9"], // Boo 16
];

socket.addEventListener('message', event => {
  const packet = JSON.parse(event.data);
  console.log("[packet]", packet);
  if (!joined && packet.action != bggl.actions.JOIN) {
    console.log("[dropped]");
    return;
  }

  switch (packet.action) {
    case bggl.actions.JOIN:
      joined = true;
      saveAllCookies(packet);
      loadWorld(packet.world);
      break;
    case bggl.actions.ADD_PLAYER:
      addPlayer(packet.rosterId, packet.nick, packet.boo);
      break;
    case bggl.actions.REMOVE_PLAYER:
      removePlayer(packet.rosterId);
      break;
    case bggl.actions.START:
      loadGamePage(packet.letters, 0);
      break;
    case bggl.actions.SEND_WORD:
      const renderedWord = wordTmpl({word: packet.word, valid: packet.valid});
      paperEl.innerHTML = renderedWord + paperEl.innerHTML;
      break;
    case bggl.actions.END:
      loadEndGamePage(packet.results, packet.players);
      break;
    default:
      console.log("[err] Invalid message from server.", packet.action);
  }
});

function handleWord() {
  const word = wordinputEl.value;
  wordinputEl.value = '';
  send({action: bggl.actions.SEND_WORD, token, word});
};

/**
 * Sends a packet to the server via the websocket.
 * @param {Object} packet
 */
function send(packet) {
  const message = JSON.stringify(packet);
  console.log('sending', message);
  socket.send(message);
}

function loadStartingPage() {
  const joinEl = document.getElementById('join');
  joinEl.addEventListener('click', () => {
    const newNick = document.getElementById('nickinput').value;
    const newBoo = document.querySelector('.boo.selected').dataset.index;
    send({action: bggl.actions.JOIN, token, nick: newNick, boo: newBoo});
  });

  const boosEl = document.getElementById('boos');
  boosEl.addEventListener('click', evt => {
    const index = evt.target.dataset.index;
    if (index > 0) {
      const selectedEl = document.querySelector('.boo.selected');
      selectedEl.classList.remove('selected');
      evt.target.classList.add('selected');
    }
  });
}

/**
 * Takes the world data from the server and loads either the pre-game or
 * mid-game.
 */
function loadWorld(world) {
  lobbyRosterId = world.rosterId;
  if (world.state == bggl.states.IN_PROGRESS)  {
    loadGamePage(world.letters, world.timeElapsed);
  } else {
    loadPrescreenPage(world.players);
  }
}

function loadPrescreenPage(players) {
  // todo - add a check to verify player list. might be out of date.
  pageEl.innerHTML = prescreenTmpl({players});

  const startEl = document.getElementById('start');
  startEl.addEventListener('click', () => send({action: bggl.actions.START}));
}

function loadGamePage(letters, timeElapsed) {
  fixLetters(letters);
  pageEl.innerHTML = gameTmpl({letters});

  wordinputEl = document.getElementById('wordinput');
  wordinputEl.addEventListener('keypress', e => {
    if (e.which == 13) {
      handleWord();
    }
  });
  paperEl = document.getElementById('paper');

  // Update the page timer every second.
  const startTime = Date.now() - timeElapsed;
  const timerEl = document.getElementById('timer');
  timerCallbackId = window.setInterval(() => {
    const percent =
      (Date.now() - startTime) / bggl.GAME_LENGTH_MS * 100;
    timerEl.style.width = percent + "%";
  }, 1000);
}

function loadEndGamePage(results, players) {
  window.clearInterval(timerCallbackId);
  paperEl = null;
  wordInputEl = null;

  fixLetters(results.letters);
  pageEl.innerHTML = endgameTmpl({results});

  const closeEl = document.getElementById('close');
  closeEl.addEventListener('click', () => loadPrescreenPage(players));

  drawTelemetry(results);
}

function drawTelemetry(results) {
  const canvasEl = document.getElementById('canvas');
  const canvasCardEl = document.getElementById('canvascard');
  canvasEl.width = canvasCardEl.clientWidth;

  const ctx = canvas.getContext('2d');

  const maxScore = results.scores[0].points;

  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  for (const rosterId in results.telemetryMap) {
    const boo =
        results.scores.filter(s => s.rosterId == rosterId).map(s => s.boo);
    const gradient =
        ctx.createLinearGradient(0, 0, canvasEl.width, canvasEl.height);
    gradient.addColorStop(0, BOO_COLORS[boo][0]);
    gradient.addColorStop(1, BOO_COLORS[boo][1]);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(0, canvasEl.height);

    const pairs = results.telemetryMap[rosterId];
    let x, y;
    for (let i = 0; i < pairs.length; i++) {
      const msSinceStart = pairs[i][0];
      const score = pairs[i][1];

      x = (msSinceStart / bggl.GAME_LENGTH_MS) * canvasEl.width;
      // boo is 40 px, max score ends at half of boo height
      y = canvasEl.height - ((score / maxScore) * (canvasEl.height - 20));
      // Straddle pixels to make look less bad
      ctx.lineTo(x + 0.5, y + 0.5);
    }

    ctx.lineTo(canvasEl.width, y);
    ctx.stroke();
  }
}

function addPlayer(rosterId, nick, boo) {
  if (lobbyRosterId == rosterId) {
    return;
  }
  updatePlayerCount(1);
  const playersEl = document.getElementById('players');
  playersEl.innerHTML += playerTmpl({rosterId, nick, boo});
}

function removePlayer(rosterId) {
  if (lobbyRosterId == rosterId) {
    return;
  }
  updatePlayerCount(-1);
  const playerEl = document.querySelector(`[data-roster="${rosterId}"]`);
  playerEl.remove();
}

function updatePlayerCount(delta) {
  const numPlayersEl = document.getElementById("numPlayers");
  const count = parseInt(numPlayersEl.innerHTML, 10);
  numPlayersEl.innerHTML = count + delta;
}

function initCookieData() {
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    const [key, value] = part.split("=");
    switch (key) {
      case "token":
        token = value;
        break;
      case "nick":
        nick = value;
        break;
      case "boo":
        boo = value;
        break;
    }
  }
}

function saveAllCookies(packet) {
  token = packet.token;
  nick = packet.nick;
  boo = packet.boo;
  saveCookie("token", token);
  saveCookie("nick", nick);
  saveCookie("boo", boo);
}

function saveCookie(key, value) {
  document.cookie = key + "=" + value +
      ";path=/;expires=Fri, 31 Dec 9999 23:59:59 GMT";
}

function compileHbs(name) {
  // At some point I should pre-compile these...
  const source = document.getElementById(name).innerHTML
  return Handlebars.compile(source);
}

function fixLetters(letters) {
  for (let i = 0; i < letters.length; i++) {
    if (letters[i] == "Q") {
      letters[i] += "u";
    }
  }
}
