import { WebSocket, WebSocketServer } from "ws"

function sendJSON(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) {
    return false
  }
  socket.send(JSON.stringify(payload))
}

function broadcastJSON(wss, payload) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) {
      continue
    }

    client.send(JSON.stringify(payload))
  }
}

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({ server, path: "/ws", maxPayload: 1024 * 1024 })

  wss.on('connection', (socket) => {
    sendJSON(socket, {type: 'welcome'})

    socket.on('error', console.error)
  })
  
  function broadcastMatchCreated(match) {
    broadcastJSON(wss, {type: "match_created", data: match})
  }

  return { broadcastMatchCreated }
}
