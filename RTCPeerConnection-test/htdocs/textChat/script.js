document.body.onload = ()=>{}
var startButton = document.getElementById('startButton');
var stopButton = document.getElementById('stopButton');
var messages = document.getElementById('messages');
var msgSendButton = document.getElementById('msgSendButton');
var WebsocketHistory = document.getElementById('WebsocketHistory');
var websocket = new WebSocket("ws://192.168.137.1:8080");
var connectionPeer = new RTCPeerConnection({ "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }] });
var dataChannel = connectionPeer.createDataChannel("channel1");
connectionPeer.ondatachannel = dataChannelCallBack;
connectionPeer.onicecandidate = ( event )=>{
	if( event.candidate ){
		wSend( {"type":"candidate","candidate":event.candidate} );
	}
}
connectionPeer.onaddstream = ( event )=>{}
websocket.onmessage = ( event )=>{
	WebsocketHistory.innerHTML += "<p style='margin:10px;background-color:lightblue;'>"+event.data+"</p>";
	let array = JSON.parse( event.data );
	console.log( array );
	switch( array.type ){
		case "offer":
			startButton.disabled = true;
			stopButton.disabled = false;
			onOffer( array.offer );
		break;
		case "answer":
			onAnswer( array.answer );
		break;
		case "candidate":
			onIcecandidate( array.candidate );
		break
		case "leave":
			startButton.disabled = false;
			stopButton.disabled = true;
		break;
	}
	console.log( connectionPeer );
}
start = ()=>{
	startButton.disabled = true;
	stopButton.disabled = false;
	if( connectionPeer !== null ){
		connectionPeer.createOffer( ( offer )=>{
			wSend( {"type":"offer","offer":offer} );
			connectionPeer.setLocalDescription( offer );
		}, ( err )=>{
			console.log( err );
			document.getElementById('errorMsg').innerHTML = err;
		} );
	}
}
stop = ()=>{
	startButton.disabled = false;
	stopButton.disabled = true;
	wSend( {"type":"leave"} );
}
function onIcecandidate( candidate ){
	connectionPeer.addIceCandidate( new RTCIceCandidate( candidate ) );
}
function wSend( message ){
	websocket.send( JSON.stringify( message ) );
}
function onAnswer( answer ){
	connectionPeer.setRemoteDescription( new RTCSessionDescription( answer ) );
}
function onOffer( offer ){
	connectionPeer.setRemoteDescription( new RTCSessionDescription( offer ) );
	connectionPeer.createAnswer( ( answer )=>{
		connectionPeer.setLocalDescription( answer );
		wSend( {"type":"answer","answer":answer} );
	},( err )=>{
		console.log( err );
		document.getElementById('errorMsg').innerHTML = err;
	} );
}
function sendMessage(){
	var msg = document.getElementById('messageToSend');
	dataChannel.send( msg.value );
	messages.innerHTML += "<p>"+msg.value+"</p>";

	msg.value = "";
	//console.log( document.getElementById('messageToSend').value );
}
function dataChannelStatusHandle( event ){
	if( dataChannel ){
		if( dataChannel.readyState == 'open' ){
			msgSendButton.disabled = false;
		} else {
			msgSendButton.disabled = false;
		}
	}
}
function dataChannelMesssageHandle( event ){
	messages.innerHTML += "<p>"+event.data+"</p>";
	console.log( event.data );
}
function dataChannelCallBack( event ){
	dataChannel = event.channel;
	dataChannel.onopen = dataChannelStatusHandle;
	dataChannel.onclose = dataChannelStatusHandle;
	dataChannel.onmessage = dataChannelMesssageHandle;
}