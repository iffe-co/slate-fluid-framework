import io from "socket.io-client"
const socket = io("ws://localhost:7890", {reconnectionDelayMax: 10000})
socket.on('connect', function(){
    console.log('connect to server')
});
socket.on('model_created', function(data){
    console.log(data)
});
socket.on('disconnect', function(){
    console.log('disconnect to server')
});
socket.on('a', (data, fn) => {
    console.log('a', data)
})
