'use strict';

const net = require('net');

let client = function(){
  let host;
  let uri;
  let method;
  let validMethods = [
    'GET', 
    'HEAD', 
    'POST', 
    'PUT', 
    'DELETE', 
    'CONNECT', 
    'OPTIONS', 
    'TRACE'
  ];
  let port;
  let headerOnly = false;
  let request;
  let responseHeaderTable = [];

  if (process.argv.length <= 2){
    process.stdout.write('Must specify a Host and/or URI following file specification\n');
    process.stdout.write('Example: localhost, www.espn.com');
    process.stdout.write('Options: <method> <port> <header only> (ho)');
    return;
  }
  
  if (process.argv[2].indexOf('/') === -1){
    host = process.argv[2];
    uri = '/';
  } else {
    host = process.argv[2].slice(0, process.argv[2].indexOf('/'));
    uri = process.argv[2].slice(process.argv[2].indexOf('/'));
  }

  if (process.argv[3]){
    method = process.argv[3].toString();
  } else {
    method = 'GET';
  }
  if (!validMethods.includes(method)){
    throw new Error('Invalid HTTP request');
  }
  
  if (!process.argv[4]){
    port = 80;
  } else { 
    port = parseInt(process.argv[4]);
  }
  if (!Number.isInteger(port)){
    throw new Error('Invalid port argument');
  }

  if (process.argv[5] && process.argv[5] === 'ho'){
    headerOnly = true;
  } else {
    headerOnly = false;
  }
  
  request = `${method} ${uri} HTTP/1.1`;
  request += `\nHost: ${host}`;
  request += `\nDate: ${new Date().toString()}`;
  request += '\nUser-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36';
  request += '\n\n';
  
  const socket = net.createConnection(port, host, () => {
    socket.setEncoding('utf-8');
    socket.write(request);
  });

  socket.on('data', (data) => {
    if (!data.slice(0, data.indexOf('\n\n')).includes('HTTP/1.1')){
      throw new Error('Bad Response');
    }
    if (!data.slice(0, data.indexOf('\n\n')).includes('Date:')){
      throw new Error('Bad Response');
    }
    if (!data.slice(0, data.indexOf('\n\n')).includes('Content-Type:')){
      throw new Error('Bad Response');
    }
    if (!data.slice(0, data.indexOf('\n\n')).includes('Content-Length:')){
      throw new Error('Bad Response');
    }

    let responseHeader = data.slice(0, data.indexOf('\n\n')).split('\n');
    let obj = {};
    responseHeader.forEach((part, index) => {
      if (index === 0){
        obj.message = part.slice(0, part.length - 1);
        return;
      }
      obj[part.slice(0, part.indexOf(' '))] = part.slice(part.indexOf(' ') + 1);
    });
    responseHeaderTable.push(obj);

    let x = parseInt(obj.message.slice(obj.message.indexOf(' ') + 1, obj.message.indexOf(' ') + 4));//parseInt(obj.message.slice(obj.message.indexOf(' '), 5));
    if (x >= 400 && x <= 499 && x !== 404){
      process.stdout.write('Client Error: ', x.toString());
      return;
    }
    if (x >= 500 && x <= 599){
      process.stdout.write('Server Error: ', x.toString());
      return;
    }
    if (headerOnly){
      process.stdout.write('RESPONSE:\n', data.slice(0, data.indexOf('\n\n')));
    } else {
      process.stdout.write(data + '\n');
    } 
  });

  socket.on('error', (error) => {
    if (error.code === 'ENOTFOUND'){
      process.stdout.write('ERROR: Host could not be reached!\n');
      process.stdout.write(error.code + '\n');
      return;
    }
    if (error.code === 'ECONNREFUSED'){
      process.stdout.write('ERROR: Could not connect to host on given port!\n');
      process.stdout.write(error.code + '\n');
      return;
    }
  });
}();