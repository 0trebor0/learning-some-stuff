
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');
var startButton = document.getElementById('startButton');
var stopButton = document.getElementById('stopButton');
var WebsocketHistory = document.getElementById('WebsocketHistory');
var websocket = new WebSocket("ws://192.168.137.1:8080");
var localStream;
var connectionPeer = new RTCPeerConnection({ "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }] });
connectionPeer.onicecandidate = ( event )=>{
	if( event.candidate ){
		wSend( {"type":"candidate","candidate":event.candidate} );
	}
}
connectionPeer.onaddstream = ( event )=>{
	remoteVideo.srcObject = event.stream;
	remoteVideo.play();
}
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
	}
	console.log( connectionPeer );
}
getCameraVideo();
function start(){
	startButton.disabled = true;
	stopButton.disabled = false;
	connectionPeer.createOffer( ( offer )=>{
		wSend( {"type":"offer","offer":offer} );
		connectionPeer.setLocalDescription( offer );
	}, ( err )=>{
		console.log( err );
		document.getElementById('errorMsg').innerHTML = err;
	} );
}
async function getCameraVideo(){
	await navigator.getUserMedia({video: true}, gotSTream, ( err )=>{
		console.log( err );
	});
}
function stop(){
	stopButton.disabled = true;
	startButton.disabled = false;
	localVideo.srcObject = null;
}
function gotSTream( stream ){
	localStream = stream;
	localVideo.srcObject = stream;
	localVideo.play();
	connectionPeer.addStream( localStream );
}
function wSend( message ){
	websocket.send( JSON.stringify( message ) );
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
function onAnswer( answer ){
	connectionPeer.setRemoteDescription( new RTCSessionDescription( answer ) );
}
function onIcecandidate( candidate ){
	connectionPeer.addIceCandidate( new RTCIceCandidate( candidate ) );
}