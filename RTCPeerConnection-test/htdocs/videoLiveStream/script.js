document.body.onload = ()=>{
	videoPlayer.src = "./videoLiveStream/video.mp4";
}
var startButton = document.getElementById('startButton');
var stopButton = document.getElementById('stopButton');
var videoPlayer = document.getElementById('videoPlayer');
var clientPlayer = document.getElementById('clientPlayer');
var WebsocketHistory = document.getElementById('WebsocketHistory');
var websocket = new WebSocket("ws://192.168.137.1:8080");
var videoStream = null;
var connectionPeer;
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
			clientPlayer.srcObject = null;
		break;
	}
}
videoPlayer.oncanplay = ()=>{
	videoStream = videoPlayer.captureStream();
	connectionPeer = new RTCPeerConnection({ "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }] });
	connectionPeer.onicecandidate = ( event )=>{
		if( event.candidate ){
			wSend( {"type":"candidate","candidate":event.candidate} );
		}
	}
	connectionPeer.onaddstream = ( event )=>{
		clientPlayer.srcObject = event.stream;
		clientPlayer.oncanplay = ()=>{
			clientPlayer.play();
		}
	}
	connectionPeer.addStream( videoStream );
}
clientPlayer.oncanplay = ()=>{
	clientPlayer.play();
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
	clientPlayer.srcObject = null;
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