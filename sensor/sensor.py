import random
import socketio
import json

print("Sensor:Initializing")

sio = socketio.Client()

@sio.event
def connect():
    print('Sensor:connection established')

@sio.event
def disconnect():
    print('Sensor:disconnected from server')

@sio.event
def on_request_temperature():
    temperature = random.uniform(15.0, 30.0)
    sio.emit("response_temperature", temperature)

@sio.event
def on_request_humidity():
    humidity = random.uniform(0.0, 100.0)
    sio.emit("response_humidity", humidity)

sio.connect('http://localhost:3001')

sio.on("request_temperature",on_request_temperature)
sio.on("request_humidity",on_request_humidity)

