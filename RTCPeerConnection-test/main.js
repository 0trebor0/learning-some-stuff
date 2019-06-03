const http = require('http');
const fs = require('fs');
const mime = require('mime-types');
const url = require('url');
const WebSocket = require('ws');
let port = 80;
let htdocs = __dirname+'/htdocs/';
try{
    const server = http.createServer();
    const Wss = new WebSocket.Server( {port:8080} );
    server.listen(port);
    server.on('listening', ()=>{
        console.log("   Server Started on PORT:"+port);
    });
    server.on(  'request', ( req, res )=>{
        let URL = url.parse( req.url, true );
        let ipAddress = req.connection.remoteAddress;
        console.log( "  "+ipAddress+" "+req.method+" "+req.url );
        if( URL.pathname == '/' ){
			if( fs.existsSync( htdocs+"index.html" ) ){
				res.writeHead(200, {'Content-Type': mime.lookup( htdocs+URL.pathname )});
				fs.createReadStream( htdocs+"index.html" ).pipe( res );
			} else {
				res.writeHead(404, {'Content-Type': 'text/html'});
				res.write( "error 404" );
				res.end();
			}
		}else if( fs.existsSync( htdocs+URL.pathname ) ){
			res.writeHead(200, {'Content-Type': mime.lookup( htdocs+URL.pathname )});
            fs.createReadStream( htdocs+URL.pathname ).pipe( res );
        }else{
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.write( "<head><title>404 not found</title></head><body><center><h1>404 Not Found</h1><p>"+URL.pathname+" not found</p></center></body>" );
            res.end();
        }
    });
    Wss.on( 'connection', ( connection )=>{
		console.log( "new connection" );
        connection.on( 'message', ( message )=>{
            console.log( message );
            if( isJson( message ) == true ){
                let array = JSON.parse( message );
				Wss.clients.forEach( ( client )=>{
					if( client !== connection && client.readyState === WebSocket.OPEN ){
						client.send( message );
					}
				} );
            }
        } );
    } );
}catch( error ){
    console.log( error );
}
function isJson( message ){
    try{
        JSON.parse( message );
    } catch( err ){
        return false;
    }
    return true;
}