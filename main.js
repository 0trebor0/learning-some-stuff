const http = require('http');
const fs = require('fs');
const mime = require('mime-types');
const url = require('url');
const parseformdata = require('parse-formdata');
let port = 80;
let htdocs = __dirname+'/htdocs/';
let users = {};
let request = {
    "/":function( req, res ){

    },
    "/user":function( req, res ){
        if( req.method == 'POST' ){
            parseformdata( req, ( err, data )=>{
                if( err ){
                    console.log( err );
                }
                if( Object.keys( data.fields ).length > 2 ){
                    if( users[ data.fields.username ] ){
                        res.writeHead( 400, {'Content-Type':'application/json'} );
                        res.write(JSON.stringify({"status":"error","msg":"username already exist"}));
                        res.end();
                    } else {
                        users[ data.fields.username ] = { "username":data.fields.username, "email":data.fields.email, "password":data.fields.password };
                        res.writeHead( 400, {'Content-Type':'application/json'} );
                        res.write(JSON.stringify({"status":"ok","msg":"account created"}));
                        res.end();
                    }
                } else {
                    res.writeHead( 400, {'Content-Type':'application/json'} );
                    res.write(JSON.stringify({"status":"error","msg":"values missing"}));
                    res.end();
                }
                console.log( users );
                //console.log( data );
                //console.log( Object.keys( data.fields ).length );
            } );
            /*res.writeHead( 200, {'Content-Type':'application/json'} );
            res.write(JSON.stringify({"status":"hey"}));
            res.end();*/
        } else if( req.method == 'GET' ){
            parseformdata( req, ( err, data )=>{
                console.log( data );
            });
        }
    }
}
try{
    const server = http.createServer();
    server.listen(port);
    server.on('listening', ()=>{
        console.log("   Server Started on PORT:"+port);
    });
    server.on(  'request', ( req, res )=>{
        let URL = url.parse( req.url, true );
        let ipAddress = req.connection.remoteAddress;
        console.log( "  "+ipAddress+" "+req.method+" "+req.url );
        if( request[ URL.pathname ] ){
            request[ URL.pathname ]( req, res );
        } else if( fs.existsSync( htdocs+URL.pathname ) ){
            fs.createReadStream( htdocs+URL.pathname ).pipe( res );
        }else{
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.write( "<head><title>404 not found</title></head><body><center><h1>404 Not Found</h1><p>"+URL.pathname+" not found</p></center></body>" );
            res.end();
        }
    });
}catch( error ){
    console.log( error );
}
