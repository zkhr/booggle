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
  for (let i = 0; i < letters.length; i++) {
    if (letters[i] == "Q") {
      letters[i] += "u";
    }
  }
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

  pageEl.innerHTML = endgameTmpl({results});

  const closeEl = document.getElementById('close');
  closeEl.addEventListener('click', () => loadPrescreenPage(players));
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
