# booggle

https://ari.blumenthal.dev/booggle/ is a fictional ghost inspired web
implementation of a popular word game involving a 4x4 grid of letters.

## Project structure

Let's walk through the key files and folders in this project:

```
booggle/
├── api/                          # Backend API Server
│   ├── dictionary.ts             # Loads the dictionary and checks word validity
│   ├── dictionary.txt            # English dictionary (one word per line)
│   ├── game.ts                   # Contains logic for handling game behavior
│   ├── letters.ts                # Generates board state for a new game
│   ├── lobby.ts                  # Tracks game state
│   ├── main.ts                   # Entry point to the API server
├── common/
│   ├── constants.ts              # Defines shared constants (for API and FE)
│   ├── types.ts                  # Defines shared types (for API and FE)
├── dist/                         # Generated static content when building the FE 
├── src/                          # React frontend (FE)
│   ├── components/
│   │  ├── Board.{tsx,css}        # Renders the game board
│   │  ├── Boo.tsx                # Renders a Boo icon
│   │  └── BooPicker.{tsx,css}    # Renders the Boo color selector.
│   ├── pages/
│   │  ├── GamePage.{tsx,css}     # Game page when playing booggle
│   │  ├── LobbyPage.{tsx,css}    # Lobby page after the user has logged in
│   │  ├── LoginPage.{tsx,css}    # Login page when the user first hits the app
│   │  └── PostGamePage.{tsx,css} # Game results after the game has completed
│   ├── static/                   # Additional static content to be served by the FE
│   ├── App.tsx                   # Main app with routing
│   ├── App.css                   # Global app styles
│   ├── main.tsx                  # React app entry point
│   └── ResponsePacketRouter.ts   # Handles websocket responses from the API 
├── .gitignore                    # Files that aren't tracked by git
├── deno.json                     # Deno (runtime & package mgr) config and tasks
├── deno.lock                     # Deno lock file for checking module integrity
├── eslint.config.js              # ESLint (static analyzer for TS) config
├── index.html                    # Root html which loads the React frontend
├── package.json                  # npm dependencies for Vite
├── tsconfig.app.json             # TypeScript compiler options (for FE)
├── tsconfig.json                 # TypeScript compiler options
├── tsconfig.node.json            # TypeScript compiler options (for Vite config)
└── vite.config.ts                # Vite (build tool & dev server) configuration
```

## Prerequisites

booggle is run with the [Deno](https://docs.deno.com) JS runtime.

### dictionary

Create a `dictionary.txt` file and place it in the `api/` directory. The format
is one word per line in lowercase. For example, I'm using the NWL 2023 word
list.

### env variables

Create an `.env` file to populate several environmental variables. For example,
in local development I have:

```sh
DEV_FE_PORT=9000
API_PORT=9001
VITE_WEBSOCKET_URL="ws://localhost:9001"
```

and in prod I use:

```sh
DEV_FE_PORT=9000
API_PORT=9001
VITE_WEBSOCKET_URL="wss://ari.blumenthal.dev:9001"
SSL_CERT_FILENAME="/path/to/fullchain.pem"
SSL_KEY_FILENAME="/path/to/privkey.pem"
```

## Testing and development

For running the server in your local environment, run:

```sh
$ deno run dev
```

This will spun up a Vite dev server for your FE (on port 9000) and your API server (on port 9001).

## Running the FE

The frontend can be served by any system that serves static content. For example, I 
have an nginx server that sets:

```
server {
    server_name ari.blumenthal.dev;

    [...]

    location /booggle {
      alias /path/to/booggle/dist/;
      try_files $uri $uri/ /index.html =404;
    }
}
```

To generate the `dist` directory, run:

```sh
$ deno run build
```

This should generate an `index.html` file, as well as CSS and JS assets. Note
that this is also run automatically when starting the API server (as defined in
the `deno.json` config).

## Running the API server

For running the server in production, run:

```sh
$ deno run serve
```

This builds the static content for your FE and runs your API server (on port 9001).