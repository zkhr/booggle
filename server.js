const crypto = require("crypto");
const https = require("https");
const fs = require("fs");

const bggl = require("./public/js/common/bggl.js");

const WebSocket = require('ws');

const State = {
  STOPPED: 0,
  IN_PROGRESS: 1
};

const BOARD_SIZE = 4;

const ENGLISH_WORDS = loadDictionary();

const TILES = ["DEXLIR", "TUICOM", "OTTAOW", "ZNRNLH", "POHCAS", "LTYRET",
    "RLVEDY", "TVRHWE", "GEWHNE", "JBOAOB", "TYTDIS", "IENSEU", "UMHQIN",
    "NAEAGE", "FAKPSF", "ESTISO"];

const game = {
  // State of the game
  state: State.STOPPED,

  // List of 16 letters
  letters: null,

  // Map from player token to the set of valid words for that player.
  words: {}
};

/**
 * A mapping from the users token to their nickname.
 */
const nickMap = {}

const server = new https.createServer({
  cert: fs.readFileSync('/etc/letsencrypt/live/ariblumenthal.com/fullchain.pem'),
  key: fs.readFileSync('/etc/letsencrypt/live/ariblumenthal.com/privkey.pem')
}).listen(9000);
const wss = new WebSocket.Server({server});
wss.on('connection', client => {
  client.on('message', data => {
    const packet = JSON.parse(data);
    switch (packet.action) {
      case bggl.actions.SIGNUP:
        handleSignup(client, packet.token, packet.nick);
        break;
      case bggl.actions.NICK:
        registerNick(client, packet.token, packet.nick);
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

  if (game.state == State.IN_PROGRESS) {
    send(client, {
      action: bggl.actions.START,
      letters: game.letters
    });
  }
});


function handleSignup(client, token, nick) {
  if (token && nick) {
    nickMap[token] = nick;
    return;
  }

  const newToken = crypto.randomBytes(16).toString('hex');
  send(client, {action: bggl.actions.SIGNUP, token: newToken});
}

function registerNick(client, token, nick) {
  nickMap[token] = nick;
  send(client, {action: bggl.actions.NICK, nick: nick});
}


function startGame(startingClient) {
  if (game.state == State.IN_PROGRESS) {
    send(startingClient, {response: 'nope'});
    return;
  }

  game.state = State.IN_PROGRESS;
  game.letters = getRandomLetters();
  game.words = {};
  setTimeout(endGame,  3 * 60 * 1000); // 3 min
  wss.clients.forEach(client => {
    send(client, {
      action: bggl.actions.START,
      letters: game.letters,
    });
  });
}


function endGame() {
  const playerNickMap = {};
  for (const token in game.words) {
    playerNickMap[token] = nickMap[token];
  }

  broadcast({
    action: bggl.actions.END,
    words: game.words,
    points: scorePoints(),
    nicks: playerNickMap
  });
  game.state = State.STOPPED;
}


function scorePoints() {
  const pointsMap = {}
  for (token in game.words) {
    pointsMap[token] = game.words[token].reduce((score, word) => {
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
  }
  return pointsMap;
}


function handleWord(client, token, word) {
  if (game.state == State.STOPPED) {
    send(client, {response: 'nope'});
    return;
  }

  // Enroll the player in the game.
  if (!game.words[token]) {
    game.words[token] = [];
  }

  word = word.toLowerCase();
  const valid = isValidWord(word, token);
  if (valid) {
    game.words[token].push(word);
  }
  send(client, {
    action: bggl.actions.SEND_WORD,
    valid: valid,
    word: word
  });
}


function isValidWord(word, token) {
  return word.length >= 3 && game.words[token].indexOf(word) < 0 &&
      isDictionaryWord(word) && isReachableWord(word);
}


function isDictionaryWord(word) {
  return ENGLISH_WORDS[word];
}


function isReachableWord(word) {
  word = word.toUpperCase();
  let possiblePaths = [];
  let prevLetter = word[0];
  game.letters.forEach((letter, index) => {
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
            game.letters[index] == word[i] && path.indexOf(index) < 0) {
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
