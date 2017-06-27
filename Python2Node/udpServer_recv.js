var udp = require('dgram');
const holojam = require('holojam-node')(['relay'],'192.168.1.126');
// --------------------creating a udp server --------------------

// creating a udp server
var server = udp.createSocket('udp4');

// emits when any error occurs
server.on('error',function(error){
  console.log('Error: ' + error);
  server.close();
});

// emits on new datagram msg
server.on('message',function(msg,info){
  //console.log('Data received from client : ' + msg.toString());
  //console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);
  //console.log('Data received from client : ' + msg);
  var jsonObj = JSON.parse(msg.toString());
  var liveObjs = []
  for (var key in jsonObj) {
	if (!jsonObj.hasOwnProperty(key)) {
	  continue;
	}
	if (key == 'time') {
		continue;
	}
	var liveObj = {
                  label: 'VT-'+jsonObj[key].id, 
				  vector3s: [{x: parseFloat(jsonObj[key].x), y: parseFloat(jsonObj[key].y), z: -parseFloat(jsonObj[key].z)}],
				  vector4s: [{x: parseFloat(jsonObj[key].qx), y: parseFloat(jsonObj[key].qy), z: -parseFloat(jsonObj[key].qz), w: -parseFloat(jsonObj[key].qw)}]
               };
    //console.log('live Obj to send' + JSON.stringify(liveObj));
    liveObjs.push(liveObj);
  }
  //console.log(JSON.stringify(liveObjs));
  holojam.Send(holojam.BuildUpdate('Vive',liveObjs));
//sending msg
// server.send(msg,info.port,'localhost',function(error){
//   if(error){
//     client.close();
//   }else{
//     console.log('Data sent !!!');
//   }

// });

});

//emits when socket is ready and listening for datagram msgs
server.on('listening',function(){
  var address = server.address();
  var port = address.port;
  var family = address.family;
  var ipaddr = address.address;
  console.log('Server is listening at port ' + port);
  console.log('Server ip :' + ipaddr);
  console.log('Server is IP4/IP6 : ' + family);
});

//emits after the socket is closed using socket.close();
server.on('close',function(){
  console.log('Socket is closed !');
});

server.bind(10000);

// setTimeout(function(){
// server.close();
// },8000);