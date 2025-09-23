import "jsr:@std/dotenv/load";
import { randomBytes } from "node:crypto";
import Dictionary from "./dictionary.ts";
import Lobby from "./lobby.ts";
import { GAME_LENGTH_MS } from "../common/constants.ts";
import type {
  EndGameResults,
  JoinRequest,
  Player,
  RequestPacket,
  ResponsePacket,
  RosterId,
  Score,
  Token,
  World,
} from "../common/types.ts";
import { buildGameResults } from "./game.ts";

interface Client {
  socket: WebSocket | null;
  token: Token;
  rosterId: RosterId;
  nick: string;
  color: number;
}

// Clients that have registered with this server. This is reset on server restart.
const clients = new Map<Token, Client>();

// The dictionary to use for checking word validity.
const dictionary = new Dictionary();

// The lobby to manage game state. Note that there is currently only one lobby
// for all users.
const lobby = new Lobby(dictionary);

Deno.serve(
  buildServerOptionsFromEnv(),
  (req) => {
    if (req.headers.get("upgrade") != "websocket") {
      return new Response(null, { status: 426 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    let activeClient: Client | null = null;

    socket.addEventListener("message", (event) => {
      const packet = JSON.parse(event.data) as RequestPacket;
      switch (packet.action) {
        case "join":
          activeClient = handleJoin(socket, packet as JoinRequest);
          break;
        case "start":
          return startGame(activeClient);
        case "sendword":
          return handleWord(activeClient, packet.token, packet.word);
      }
    });

    socket.addEventListener("close", () => handleLeave(activeClient));

    return response;
  },
);

function handleJoin(socket: WebSocket, request: JoinRequest): Client {
  const token = request.token || randomBytes(16).toString("hex");
  const existingClient = clients.get(token);
  const rosterId = existingClient
    ? existingClient.rosterId
    : randomBytes(16).toString("hex");
  // TODO: Also, gracefully log out existing clients for the user.
  const client = {
    socket,
    rosterId,
    token,
    nick: request.nick || "Unnamed Boo",
    color: request.color || 0,
  };
  clients.set(token, client);

  if (existingClient && existingClient.nick !== client.nick) {
    log(`${existingClient.nick} is now known as ${client.nick}`);
  }
  log(`%c${client.nick}%c has joined.`, "color:red", "");

  const world: World = {
    state: lobby.state,
    players: toClientPlayers(),
    letters: lobby.letters,
    timeElapsed: Date.now() - lobby.startTime,
    rosterId,
  };
  send(client, {
    action: "join",
    token: client.token,
    nick: client.nick,
    color: client.color,
    world,
  });
  broadcast({
    action: "addplayer",
    rosterId,
    nick: client.nick,
    color: client.color,
  });
  return client;
}

function handleLeave(client: Client | null) {
  if (client) {
    log(`%c${client.nick}%c has left.`, "color:red", "");
    client.socket = null;
    broadcast({ action: "rmplayer", rosterId: client.rosterId });
  } else {
    log("an unknown user has left.");
  }
}

function toClientPlayers(): Player[] {
  return [...clients.values()]
    .filter((client) => client.socket !== null)
    .map((client) => ({
      nick: client.nick,
      color: client.color,
      rosterId: client.rosterId,
    }));
}

function startGame(client: Client | null) {
  if (!client) {
    log("Recieved [start] from user before [join]ing.");
    return;
  }

  if (lobby.state == "Running") {
    // If there is already a game running, it is possible two users hit
    // start at the same time. Since they should get a broadcast from the
    // other user's [start], we can safely ignore this message.
    return;
  }

  // Initialize the lobby.
  lobby.startGame();

  // Register a callback to end the game after a specified duration.
  setTimeout(endGame, GAME_LENGTH_MS);

  // Let users know the game has started.
  broadcast({ action: "start", letters: lobby.letters });
}

function endGame() {
  const scores: Score[] = buildGameResults(lobby.words, lobby.scoringMap)
    .map((computedScore) => {
      const client = clients.get(computedScore.token);
      if (!client) {
        return null;
      }
      return {
        nick: client.nick,
        color: client.color,
        rosterId: client.rosterId,
        words: computedScore.words,
        points: computedScore.points,
      };
    }).filter((s) => s !== null);

  const results: EndGameResults = {
    letters: lobby.letters,
    telemetryMap: Array.from(lobby.telemetryMap.entries()),
    scores,
  };
  broadcast({ action: "end", results });
  lobby.endGame();
}

function handleWord(client: Client | null, token: Token, word: string) {
  if (!client) {
    log("Recieved [sendword] from user before [join]ing.");
    return;
  }

  if (lobby.state == "Stopped") {
    // If there isn't a game running, ignore any words sent to the server.
    return;
  }

  word = word.toLowerCase();
  const isValid = lobby.handleWord(token, client.rosterId, word);
  send(client, { action: "sendword", valid: isValid, word });
}

function broadcast(packet: ResponsePacket) {
  for (const client of clients.values()) {
    send(client, packet);
  }
}

function send(client: Client, packet: ResponsePacket) {
  if (client.socket) {
    client.socket.send(JSON.stringify(packet));
  }
}

function log(message: string, ...cssStrings: string[]) {
  const now = new Date().toISOString();
  console.log(`[${now}] ${message}`, ...cssStrings);
}

function buildServerOptionsFromEnv():
  | Deno.ServeTcpOptions
  | (Deno.ServeTcpOptions & Deno.TlsCertifiedKeyPem) {
  const port = parseInt(Deno.env.get("API_PORT") || "");
  if (!port) {
    throw new Error("Missing API_PORT flag.");
  }

  const sslCertFilename = Deno.env.get("SSL_CERT_FILENAME");
  const sslKeyFilename = Deno.env.get("SSL_KEY_FILENAME");
  if (sslCertFilename && sslKeyFilename) {
    return {
      port,
      cert: Deno.readTextFileSync(sslCertFilename),
      key: Deno.readTextFileSync(sslKeyFilename),
    };
  }
  return { port };
}
