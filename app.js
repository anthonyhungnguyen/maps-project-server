const WebSocketServer = require('websocket').server
const mqtt = require('mqtt')
const http = require('http')
const PORT = process.env.PORT || 8080
// HOME
// const WEBSOCKET_URL = 'http://13.82.183.46:1883'

// TEACHER
const WEBSOCKET_URL = 'http://52.230.1.253:1883'
const OPTIONS = {
	connectTimeout: 4000,

	// Authentication
	clientId: 'thedominators',
	// username: 'emqx',
	// password: 'emqx',

	keepalive: 60,
	clean: true
}

const client = mqtt.connect(WEBSOCKET_URL, OPTIONS)

client.on('connect', () => {
	console.log('Connect Success')
	client.subscribe('Topic/GPS')
})

client.on('message', (topic, message) => {
	const receivedData = JSON.parse(message)
	const newMessage = [ receivedData[0]['values'][0], receivedData[0]['values'][1] ]
	console.log('Received form', newMessage)
	wsServer.broadcast(
		JSON.stringify({
			latitude: newMessage[1],
			longitude: newMessage[0]
			// latitude: 16.060648,
			// longitude: 108.222513
		})
	)
})

client.on('connect', () => {
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
		if (msg === 'TURN LIGHT ON') {
			client.publish(
				'Topic/LightD',
				JSON.stringify([
					{
						device_id: 'Light_D',
						values: [ '1', '100' ]
					}
				])
			)
		} else {
			client.publish(
				'Topic/LightD',
				JSON.stringify([
					{
						device_id: 'Light_D',
						values: [ '0', '0' ]
					}
				])
			)
		}
	})

	connection.on('close', function(connection) {
		// close user connection
	})
})
