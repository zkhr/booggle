const socket = new WebSocket('wss://ariblumenthal.com:9000');

const startEl = document.getElementById('start');
const boardEl = document.getElementById('board');
const wordinputEl = document.getElementById('wordinput');
const wordsendEl = document.getElementById('wordsend');
const paperEl = document.getElementById('paper');
const signupEl = document.getElementById('signup');
const nickWrapperEl = document.getElementById('nickwrapper');

let TOKEN;
let NICK;
init();

socket.addEventListener('open', () => {
  const packet = {
    action: bggl.actions.SIGNUP,
  }
  if (TOKEN) {
    packet.token = TOKEN;
  }
  if (NICK) {
    packet.nick = NICK;
  }
  send(packet);
});


socket.addEventListener('message', event => {
  const packet = JSON.parse(event.data);
  console.log("[packet]", packet);
  switch (packet.action) {
    case bggl.actions.SIGNUP:
      TOKEN = packet.token;
      saveCookie("token", TOKEN);
      break;
    case bggl.actions.NICK:
      NICK = packet.nick;
      saveCookie("nick", NICK);
      nickWrapperEl.innerHTML = renderNick(packet.nick);
      break;
    case bggl.actions.START:
      boardEl.classList.remove('disabled');
      wordinputEl.disabled = false;
      wordsendEl.disabled = false;
      wordinputEl.focus();
      boardEl.innerHTML = renderLetters(packet.letters);
      paperEl.innerHTML = '';
      paperEl.classList.add('words');
      break;
    case bggl.actions.SEND_WORD:
      paperEl.innerHTML = renderWord(packet.word, packet.valid) +
          paperEl.innerHTML;
      break;
    case bggl.actions.END:
      boardEl.classList.add('disabled');
      wordinputEl.value = '';
      wordinputEl.disabled = true;
      wordsendEl.disabled = true;
      paperEl.classList.remove('words');
      paperEl.innerHTML = renderResults(
          packet.words, packet.points, packet.nicks);
      break;
    default:
      console.log("[err] Invalid message from server.", packet.action);
  }
});


startEl.addEventListener('click', () => {
  send({action: bggl.actions.START});
});


wordsendEl.addEventListener('click', handleWord);


wordinputEl.addEventListener('keypress', e => {
  if (e.which == 13) {
    handleWord();
  }
});


nickWrapperEl.addEventListener('click', event => {
  if (event.target.id == "signup" || event.target.id == "nick") {
    nickWrapperEl.innerHTML = renderNickPicker();
  } else if (event.target.id == "nicksend") {
    const nick = document.getElementById('nickinput').value;
    if (nick === "") {
      return;
    }
    send({action: bggl.actions.NICK, token: TOKEN, nick: nick});
  }
});


function handleWord() {
  const word = wordinputEl.value;
  wordinputEl.value = '';
  send({
    action: bggl.actions.SEND_WORD,
    token: TOKEN,
    word: word
  });
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


/**
 * Creates an element containg the letters provided by the server.
 * @param {!Array<string>} letters
 * @return {string}
 */
function renderLetters(letters) {
  let html = '';
  letters.forEach(letter => {
    if (letter == "Q") {
      letter += "u";
    }
    html += "<div class='cell'>" + letter + "</div>";
  });
  return html;
}


/**
 * Creates an element containing the word provided by the server.
 * @param {string} word The word that the user submitted.
 * @param {boolean} valid Whether the word is a valid word
 * @return {string}
 */
function renderWord(word, valid) {
  return "<div class='word" + (valid ? " valid" : "") + "'>" + word + "</div>";
}


/**
 * Creates an element rendering the results of a game.
 * @param {!Object<number, Set>} map A map from player token to that player's
 *    words.
 * @return {string}
 */
function renderResults(wordsMap, pointsMap, nickMap) {
  const allWordCounts = {};
  for (const token in wordsMap) {
    for (const word of wordsMap[token]) {
      allWordCounts[word]= allWordCounts[word] + 1 || 1;
    }
  }

  let html = '';
  for (const token in wordsMap) {
    const wordElements = wordsMap[token].sort().map(word => {
      return "<div class='solution" + (allWordCounts[word] > 1 ? " common" : "") +
          "'>" + word + "</div>";
    });
    html += "<div>[" + pointsMap[token] + "] " +
        (nickMap[token] ? nickMap[token] : "Player " + token) + ": " +
        wordElements.join(', ') + "</div>";
  }
  return html;
}


/**
 * Creates a signup button to register a nick.
 */
function renderSignup() {
  return "<input id='signup' class='button' type='button' value='Sign In'>" +
      "</input>";
}


/**
 * Creates an element for registering a nick.
 */
function renderNickPicker() {
  return "<input id='nickinput' class='textinput pair' type='text'" +
      "placeholder='nickname'></input>" +
      "<input id='nicksend' class='button pair' type='button' value='Save'>" +
      "</input>";
}


/**
 * Creates an element with the user's nickname that when clicked opens up the
 * nickname picker.
 */
function renderNick(nick) {
  return "<div id='nick' class='nickname'>" + nick + "</div>";
}


function init() {
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    const [key, value] = part.split("=");
    switch (key) {
      case "token":
        TOKEN = value;
        break;
      case "nick":
        NICK = value;
        break;
    }
  }

  if (NICK === undefined) {
    nickWrapperEl.innerHTML = renderSignup();
  } else {
    nickWrapperEl.innerHTML = renderNick(NICK);
  }
}


function saveCookie(key, value) {
  document.cookie = key + "=" + value +
      ";path=/;expires=Fri, 31 Dec 9999 23:59:59 GMT";
}
