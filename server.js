const crypto = require("crypto");
const https = require("https");
const fs = require("fs");

const bggl = require("./public/js/common/bggl.js");

const WebSocket = require('ws');

const BOARD_SIZE = 4;

const ENGLISH_WORDS = loadDictionary();

const TILES = ["QQQQQQ", "TUICOM", "OTTAOW", "ZNRNLH", "POHCAS", "LTYRET",
    "RLVEDY", "TVRHWE", "GEWHNE", "JBOAOB", "TYTDIS", "IENSEU", "UMHQIN",
    "NAEAGE", "FAKPSF", "ESTISO"];
//const TILES = ["DEXLIR", "TUICOM", "OTTAOW", "ZNRNLH", "POHCAS", "LTYRET",
//    "RLVEDY", "TVRHWE", "GEWHNE", "JBOAOB", "TYTDIS", "IENSEU", "UMHQIN",
//    "NAEAGE", "FAKPSF", "ESTISO"];

// Global state, we only have a single in-memory lobby instance for now.
const lobby = {
  // State of the lobby.
  state: bggl.states.STOPPED,

  // List of 16 letters
  letters: null,

  // Map from player token to the set of valid words for that player.
  words: {},

  // Map from words to the number of players with that word.
  scoringMap: {},

  // Map from player token to the data for that user.
  users: {}
};

const server = new https.createServer({
  cert: fs.readFileSync('/etc/letsencrypt/live/ariblumenthal.com/fullchain.pem'),
  key: fs.readFileSync('/etc/letsencrypt/live/ariblumenthal.com/privkey.pem')
}).listen(9000);
const wss = new WebSocket.Server({server});
wss.on('connection', client => {
  client.on('message', data => {
    const packet = JSON.parse(data);
    switch (packet.action) {
      case bggl.actions.JOIN:
        handleJoin(client, packet.token, packet.nick, packet.boo);
        break;
      case bggl.actions.START:
        startGame(client);
        break;
      case bggl.actions.SEND_WORD:
        handleWord(client, packet.token, packet.word);
        break;
      default:
        console.log("[err] Unknown action:", packet.action);
    }
  });
  client.on('close', () => handleLeave(client, client.token));

  if (lobby.state == bggl.states.IN_PROGRESS) {
    send(client, {
      action: bggl.actions.START,
      letters: lobby.letters
    });
  }
});

function handleJoin(client, token, nick, boo = 1) {
  const rosterId = crypto.randomBytes(16).toString('hex')
  if (!nick) {
    nick = "Unnamed Boo";
  }
  if (!token) {
    token = crypto.randomBytes(16).toString('hex');
  }
  // todo - handle users with multiple clients.
  client.token = token;
  lobby.users[token] = {token, nick, boo, rosterId, here: true};

  const world = {
    state: lobby.state,
    players: toClientPlayers(),
    letters: lobby.letters,
    rosterId
  };
  send(client, {action: bggl.actions.JOIN, token, nick, boo, world});
  broadcast({action: bggl.actions.ADD_PLAYER, rosterId, nick, boo});
}

/**
 * Converts the lobby users mapping to a client-renderable list of players.
 */
function toClientPlayers() {
  const players = [];
  for (const token in lobby.users) {
    const serverPlayer = lobby.users[token];
    players.push({
      rosterId: serverPlayer.rosterId,
      nick: serverPlayer.nick,
      boo: serverPlayer.boo
    });
  }
  return players;
}

function handleLeave(client, token) {
  if (!token) {
    return;
  }

  if (lobby.state == bggl.states.IN_PROGRESS) {
    // If we're in game, wait to remove the user until the game is over.
    lobby.users[client.token].here = false;
  } else if (token in lobby.users) {
    // Otherwise, if they haven't already been removed, remove the user.
    const rosterId = lobby.users[token].rosterId;
    broadcast({action: bggl.actions.REMOVE_PLAYER, rosterId});
    delete lobby.users[client.token];
  }
}

function startGame(startingClient) {
  if (lobby.state == bggl.states.IN_PROGRESS) {
    send(startingClient, {response: 'nope'});
    return;
  }

  lobby.state = bggl.states.IN_PROGRESS;
  lobby.letters = getRandomLetters();
  lobby.words = {};
  lobby.scoringMap = {};
  setTimeout(endGame, 3 * 60 * 1000); // 3 min
  broadcast({
    action: bggl.actions.START,
    letters: lobby.letters,
  });
}


function endGame() {
  lobby.state = bggl.states.STOPPED;
  const results = buildGameResults();
  const players = toClientPlayers();

  const playerNickMap = {};
  for (const token in lobby.words) {
    playerNickMap[token] = lobby.users[token];
  }

  // Remove any users that have dropped since the game started.
  for (const token in lobby.users) {
    if (!lobby.users[token].here) {
      delete lobby.users[token];
    }
  }

  broadcast({action: bggl.actions.END, results, players});
}


function buildGameResults() {
  const results = {scores: [], cards: []};
  const pointsList = scorePoints();
  for (const [token, points] of pointsList) {
    const user = lobby.users[token];
    const words = lobby.words[token].sort();
    const wordsWithMetadata = [];
    for (const word of words) {
      wordsWithMetadata.push({word, unique: lobby.scoringMap[word] == 1});
    }
    results.scores.push({
      boo: user.boo,
      nick: user.nick,
      words: wordsWithMetadata,
      points
    });
  }
  return results;
}

function scorePoints() {
  const pointsList = [];
  for (const token in lobby.words) {
    const points = lobby.words[token].reduce((score, word) => {
      if (word.length == 3 || word.length == 4) {
        return score + 1;
      } else if (word.length == 5) {
        return score + 2;
      } else if (word.length == 6) {
        return score + 3;
      } else if (word.length == 7) {
        return score + 5;
      } else {
        return score + 11;
      }
    }, 0);
    pointsList.push([token, points]);
  }
  return pointsList.sort((a,b) => b[1] - a[1]);
}


function handleWord(client, token, word) {
  if (lobby.state == bggl.states.STOPPED) {
    send(client, {response: 'nope'});
    return;
  }

  // Enroll the player in the lobby.
  if (!lobby.words[token]) {
    lobby.words[token] = [];
  }

  word = word.toLowerCase();
  const valid = isValidWord(word, token);
  if (valid) {
    lobby.words[token].push(word);
    lobby.scoringMap[word] = lobby.scoringMap[word] + 1 || 1;
  }
  send(client, {
    action: bggl.actions.SEND_WORD,
    valid: valid,
    word: word
  });
}


function isValidWord(word, token) {
  return word.length >= 3 && lobby.words[token].indexOf(word) < 0 &&
      isDictionaryWord(word) && isReachableWord(word);
}


function isDictionaryWord(word) {
  return ENGLISH_WORDS[word];
}


function isReachableWord(word) {
  word = word.toUpperCase();
  let possiblePaths = [];
  let prevLetter = word[0];
  lobby.letters.forEach((letter, index) => {
    if (letter == word[0]) {
      possiblePaths.push([index])
    }
  });
  for (let i = 1; i < word.length; i++) {
    if (prevLetter == 'Q') {
      prevLetter = word[i];
      continue;
    }
    const newPaths = [];
    possiblePaths.forEach(path => {
      const lastIndex = path[path.length - 1];
      const xCoord = lastIndex % 4;
      const yCoord = Math.floor(lastIndex / 4);
      const validIndices = [];
      if (xCoord > 0) {
        validIndices.push(lastIndex - 1)
      }
      if (xCoord > 0 && yCoord > 0) {
        validIndices.push(lastIndex - BOARD_SIZE - 1);
      }
      if (xCoord > 0 && yCoord < BOARD_SIZE - 1) {
        validIndices.push(lastIndex + BOARD_SIZE - 1);
      }
      if (xCoord < BOARD_SIZE - 1) {
        validIndices.push(lastIndex + 1)
      }
      if (xCoord < BOARD_SIZE - 1 && yCoord > 0) {
        validIndices.push(lastIndex - BOARD_SIZE + 1);
      }
      if (xCoord < BOARD_SIZE - 1 && yCoord < BOARD_SIZE - 1) {
        validIndices.push(lastIndex + BOARD_SIZE + 1);
      }
      if (yCoord > 0) {
        validIndices.push(lastIndex - BOARD_SIZE);
      }
      if (yCoord < BOARD_SIZE - 1) {
        validIndices.push(lastIndex + BOARD_SIZE);
      }
      validIndices.forEach(index => {
        if (index >= 0 && index < BOARD_SIZE * BOARD_SIZE &&
            lobby.letters[index] == word[i] && path.indexOf(index) < 0) {
          const newPath = Array.from(path);
          newPath.push(index);
          newPaths.push(newPath);
        }
      });
    });
    if (!newPaths.length) {
      return false;
    }
    possiblePaths = newPaths;
    prevLetter = word[i];
  }
  return true;
}


function broadcast(packet) {
  wss.clients.forEach(client => {
    send(client, packet);
  });
}


function send(client, packet) {
  client.send(JSON.stringify(packet));
}


function getRandomLetters() {
  const tiles = Array.from(TILES);
  const letters = [];
  while (tiles.length) {
    const index = Math.floor(Math.random() * tiles.length);
    const offset = Math.floor(Math.random() * 6);
    const tile = tiles.splice(index, 1)[0];
    letters.push(tile[offset]);
  }
  return letters;
}

function loadDictionary() {
  process.stdout.write("Loading dictionary... ");
  const data = fs.readFileSync('/w/sandbox/booggle/ospd.txt', 'utf8');
  const words = data.split('\n');
  const wordMap = words.reduce((map, word) => {
    map[word] = true
    return map;
  }, {});
  console.log("Done");
  return wordMap;
}
