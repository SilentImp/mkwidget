const express = require('express');
const { nanoid } = require('nanoid');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });
const http = require('http');
const { createTerminus, HealthCheckError } = require('@godaddy/terminus');
const PORT = 3000;

let isFinished = false;
let upvotes = 0;
let votes = 0;
let clients = [];

function eventsHandler(request, response, next) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  response.writeHead(200, headers);
  const data = `data: ${JSON.stringify({
    votes,
    upvotes,
    isFinished,
  })}\n\n`;
  response.write(data);
  const clientId = nanoid();
  const newClient = {
    id: clientId,
    response
  };
  clients.push(newClient);
  request.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter(client => client.id !== clientId);
  });
}

function sendEventsToAll() {
  clients.forEach(client => client.response.write(`data: ${JSON.stringify({
    votes,
    upvotes,
    isFinished,
  })}\n\n`));
}

async function vote(request, respsonse, next, isUpVote) {
  votes += 1;
  if (isUpVote) upvotes += 1;
  sendEventsToAll();
  if (request.body.ajax !== undefined) {
    respsonse.json({
      votes,
      upvotes,
      isFinished,
    });
  } else {
    respsonse.redirect(request.headers.referer || '/');
  }
  next();
}

async function finish(request, respsonse, next) {
  if (request.body.code === 'toasty') {
    isFinished = true;
  }
  sendEventsToAll();
  if (request.body.ajax !== undefined) {
    respsonse.json({
      votes,
      upvotes,
      isFinished,
    });
  } else {
    respsonse.redirect(request.headers.referer || '/');
  }
  next();
}

function healthCheck ({ state }) {
  return Promise.resolve();
}

const options = {
  healthChecks: {
    "/healthcheck": healthCheck,
    verbatim: true,
    __unsafeExposeStackTraces: true,
  },
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
  },
};

const upvote = async (request, respsonse, next) => vote(request, respsonse, next, true);
const downvote = async (request, respsonse, next) => vote(request, respsonse, next, false);

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));

app.get('/status', (request, response) => response.json({clients: clients.length}));
app.get('/events', eventsHandler);
app.post('/upvote', upload.none(), upvote);
app.post('/downvote', upload.none(), downvote);
app.post('/finish', upload.none(), finish);

const server = http.createServer(app);
createTerminus(server, options);

server.listen(PORT, () => {
  console.log(`Facts Events service listening at http://localhost:${PORT}`);
});