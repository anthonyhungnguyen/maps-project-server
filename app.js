const WebSocketServer = require('websocket').server
const mqtt = require('mqtt')
const http = require('http')
const PORT = process.env.PORT || 8080
const WEBSOCKET_URL_PUBLISH = 'http://13.251.51.242:1883'
const WEBSOCKET_URL_SUBSCRIBE = 'http://13.82.183.46:1883'
const OPTIONS = {
	connectTimeout: 4000,

	// Authentication
	clientId: 'thedominators',
	// username: 'emqx',
	// password: 'emqx',

	keepalive: 60,
	clean: true
}

const publish_client = mqtt.connect(WEBSOCKET_URL_PUBLISH, OPTIONS)
const subscribe_client = mqtt.connect(WEBSOCKET_URL_SUBSCRIBE, OPTIONS)

subscribe_client.on('connect', () => {
	console.log('Connect Success')
	subscribe_client.subscribe('/hello')
})

subscribe_client.on('message', (topic, message) => {
	let newMessage = message.toString().split(' ')
	console.log('Received form', topic, ':', message.toString().split(' '))
	wsServer.broadcast(
		JSON.stringify({
			latitude: newMessage[0],
			longitude: newMessage[1]
		})
	)
})

publish_client.on('connect', () => {
	console.log('Publish Success')
})

wsServer = new WebSocketServer({
	httpServer: http.createServer().listen(PORT)
})

// WebSocket server
wsServer.on('request', function(request) {
	var connection = request.accept(null, request.origin)

	connection.on('message', function(message) {
		const { utf8Data } = message
		const { msg } = JSON.parse(utf8Data)
		publish_client.publish('/light', 'WOOWOWOW')
	})

	connection.on('close', function(connection) {
		// close user connection
	})
})
