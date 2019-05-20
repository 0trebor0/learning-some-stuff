const http = require('http');
const fs = require('fs');
const mime = require('mime-types');
const url = require('url');
const querystring = require('querystring');
const crypto = require('crypto');
let htdocs = __dirname+'/htdocs/';
let users = {};
let userLoginSession = {};
let request = {
    "/":function( req, res ){
        res.writeHead(200, {"Content-Type":"text/html"});
        fs.createReadStream( htdocs+"index.html" ).pipe( res );
    },
    "/user":function( req, res ){
        if( req.method == 'POST' ){
            let data = "";
            req.on( 'data', ( chunk )=>{
                //console.log( chunk.toString() );
                data += chunk.toString();
            });
            req.on( 'end', ()=>{
                data = JSON.parse( data );
                if( data.register ){
                    if( Object.keys( data.register ).length > 2 ){
                        if( users[ data.register.username ] ){
                            res.writeHead( 200, {'Content-Type':'application/json'} );
                            res.write(JSON.stringify({"status":"error","msg":"username exist"}));
                            res.end();
                        } else {
                            users[ data.register.username ] = {"username":data.register.username,"email":data.register.email,"password":data.register.password};
                            res.writeHead( 201, {'Content-Type':'application/json'} );
                            res.write(JSON.stringify({"status":"ok","msg":"account created"}));
                            res.end();
                        }
                        //console.log( users );
                    } else {
                        res.writeHead( 200, {'Content-Type':'application/json'} );
                        res.write(JSON.stringify({"status":"error","msg":"missing values"}));
                        res.end();
                    }
                } else if( data.login ){
                    if( Object.keys( data.login ).length > 1 ){
                        if( users[ data.login.username ] ){
                            hash = crypto.createHash('sha256').update(new Date().toString()).digest('hex');
                            userLoginSession[ hash ] = { "username":data.login.username,"hash":hash,"date":new Date() };
                            res.writeHead( 200, {'Content-Type':'application/json'} );
                            res.write(JSON.stringify({"status":"ok","hash":hash,"msg":"logged in"}));
                            res.end();
                        } else {
                            res.writeHead( 200, {'Content-Type':'application/json'} );
                            res.write(JSON.stringify({"status":"error","msg":"username not found"}));
                            res.end();
                        }
                    } else {
                        res.writeHead( 200, {'Content-Type':'application/json'} );
                        res.write(JSON.stringify({"status":"error","msg":"missing values"}));
                        res.end();
                    }
                }else {
                    res.writeHead( 404, {'Content-Type':'application/json'} );
                    res.write(JSON.stringify({"status":"error","msg":"bad"}));
                    res.end();
                }
                //res.end(JSON.stringify({"status":"hey"}));

            });
            /*res.writeHead( 200, {'Content-Type':'application/json'} );
            res.write(JSON.stringify({"status":"hey"}));
            res.end();*/
        }
    }
}
try{
    const server = http.createServer();
    server.listen(8080);
    server.on('listening', ()=>{
        console.log("   Server Started on PORT:8080");
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
