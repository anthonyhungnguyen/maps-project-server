const WebSocketServer = require('websocket').server
const mqtt = require('mqtt')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const cors = require('cors')
const PORT = 8080
const WEBSOCKET_URL = 'http://13.76.250.158:1883'
const OPTIONS = {
	connectTimeout: 4000,

	// Authentication
	clientId: 'thedominators',
	// username: 'emqx',
	// password: 'emqx',

	keepalive: 60,
	clean: true
}

// Chat Section

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users')

const router = require('./router')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(cors())
app.use(router)

io.on('connect', (socket) => {
	socket.on('join', ({ name, room }, callback) => {
		const { error, user } = addUser({ id: socket.id, name, room })

		if (error) return callback(error)

		socket.join(user.room)

		socket.emit('message', { user: 'admin', text: `${user.name}, welcome to room ${user.room}.` })
		socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` })

		io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })

		callback()
	})

	socket.on('sendMessage', (message, callback) => {
		const user = getUser(socket.id)

		io.to(user.room).emit('message', { user: user.name, text: message })

		callback()
	})

	socket.on('disconnect', () => {
		const user = removeUser(socket.id)

		if (user) {
			io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` })
			io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })
		}
	})
})

server.listen(5000, () => console.log(`Server has started.`))

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
						values: [ '1', '100' ]
					}
				])
			)
		} else {
			client.publish(
				'Topic/LightD',
				JSON.stringify([
					{
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
