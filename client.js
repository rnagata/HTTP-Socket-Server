'use strict';

const net = require('net');

//DONE:
//executes in node with a command and argument.
//listens for server response.
//displays responses and errors in console.
//transmits standard HTTP headers (Method, URI, HTTP, Host, User-Agent, Date).
//net.createConnection forms TCP connection to localhost, but nothing else.
//runs once then exits from success or error
//no arguments means display help messages
//

let client = function(){
  if (!process.argv[2]){
    console.log('Must specify a Host and/or URI following file specification');
    console.log('Example: node client.js www.espn.com');
    return;
  }

  let responseHeaderRecord = {};
  let uriStart = process.argv[2].indexOf('/');
  let socket;
  let port;
  let host;
  let uri;
  
  if (uriStart === -1){
    host = process.argv[2];
    uri = '/';
  } else {
    host = process.argv[2].slice(0, uriStart);
    uri = process.argv[2].slice(uriStart);
  }

  if (host === 'localhost'){
    port = 8080;
  } else {
    port = 80;
  }

  let request = `GET ${uri} HTTP/1.1`;
  request += '\nHost: ';
  request += host;
  let date = new Date();
  request += '\nDate: ';
  request += date.toString();
  let userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36';
  request += '\nUser-Agent: ';
  request += userAgent;
  request += '\n\n';
  
  console.log('REQUEST:\n', request);
  socket = net.createConnection(port, host, () => {
    console.log('<connected>\n');
    socket.setEncoding('utf-8');
    socket.write(request);
  });

  socket.on('data', (data) => {
    console.log('RESPONSE:\n', data);
    let responseHeaderEnd = data.indexOf('\n\n');
    let responseHeader = data.substring(0, responseHeaderEnd);
    let responseHeaderParts = responseHeader.split('\n');
    //console.log(responseHeaderParts);
    responseHeaderParts.forEach((part, index) => {
      if (index === 0){
        responseHeaderRecord.message = part;
        return;
      }
      let ws = part.indexOf(' ');
      Object.defineProperty(responseHeaderRecord, part.substring(0, ws), {
        value: part.substring(ws),
        writable: true,
        configurable: true,
        enumerable: true,
      });
    })
    console.log(responseHeaderRecord);
  });

  socket.on('error', (data) => {
    console.log(data);
  });
}();