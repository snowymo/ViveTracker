var udp = require('dgram');
//var Quaternion = require('quaternion');
var math3d = require('math3d');
var Vector3 = math3d.Vector3;
var Quaternion = math3d.Quaternion;
const holojam = require('holojam-node')(['relay'],'192.168.1.240');
// --------------------creating a udp server --------------------

// creating a udp server
var server = udp.createSocket('udp4');

// emits when any error occurs
server.on('error',function(error){
  console.log('Error: ' + error);
  server.close();
});

// var Vector3 = class Vector3 {
//   constructor(x, y, z) {
//     this.x = x;
//     this.y = y;
//     this.z = z;
//   }
//   constructor(arr) {
//     this.x = arr[0];
//     this.y = arr[1];
//     this.z = arr[2];
//   }
// };

// var Quaternion = class Quaternion {
//   constructor(qx, qy, qz, qw) {
//     this.qx = qx;
//     this.qy = qy;
//     this.qz = qz;
//     this.qw = qw;
//   }
// };

const SOURCE1 = "192.168.1.15";
const SOURCE2 = "192.168.1.131";
const LH4CALIB = "LHB-85889B70";

var lthsPos1 = new Vector3(0,0,0);
var lthsPos1Prime = new Vector3(0,0,0);
var lthsQuat1 = new Quaternion(0,0,0,1);
var lthsQuat1Prime = new Quaternion(0,0,0,1);
var deltaPos = new Vector3(0,0,0);

function assignLightHouse(info, jsonObj){
  console.log(info);
  for (var key in jsonObj) {
    //console.log("jsonObj[key].id",jsonObj[key].id,jsonObj[key].id.includes(LH4CALIB));
    
    if(jsonObj[key].id.includes(LH4CALIB)){
      console.log("assignLightHouse" ,info);
      if(info.includes(SOURCE1)){
        lthsPos1 = new Vector3(jsonObj[key].x, jsonObj[key].y, -jsonObj[key].z);
        lthsQuat1 = new Quaternion(jsonObj[key].qx, jsonObj[key].qy, -jsonObj[key].qz, -jsonObj[key].qw);
        console.log("lthsPos1",lthsPos1);
        //return true;
      } else if(info.includes(SOURCE2)){
        lthsPos1Prime = new Vector3(jsonObj[key].x, jsonObj[key].y, -jsonObj[key].z);
        lthsQuat1Prime = new Quaternion(jsonObj[key].qx, jsonObj[key].qy, -jsonObj[key].qz, -jsonObj[key].qw);
        console.log("lthsPos1Prime",lthsPos1Prime);
        //return true;
      }
      break;
    }
    
  }
  if(lthsPos1.magnitude > 0 && lthsPos1Prime.magnitude > 0){
    return true;
  }else{
    return false;
  }
}

// do calibration from one base station to another
function lightHouseCalib(info, trackerPos, trackerQuat){
  var newPos = new Vector3();
  var newQuat = new Quaternion();
  if(info.includes(SOURCE2)){
    tmpQuat = lthsQuat1.mul(lthsQuat1Prime.inverse());
    deltaPos = lthsPos1.sub( tmpQuat.mulVector3(lthsPos1Prime));
    console.log("lthsQuat1", lthsQuat1.eulerAngles, "lthsQuat1Prime", lthsQuat1Prime.eulerAngles, 
                "lthsPos1", lthsPos1.values, "lthsPos1Prime",lthsPos1Prime.values, 
                "deltaPos", deltaPos.values);
    var test = deltaPos.add(  tmpQuat.mulVector3(lthsPos1Prime));
    console.log("test",test.values);

    newPos = deltaPos.add(  tmpQuat.mulVector3(new Vector3(trackerPos.x,trackerPos.y,trackerPos.z)));
    console.log("trackerPos", trackerPos);
    console.log("newPos", newPos.values);
    newQuat = tmpQuat.mul(new Quaternion(trackerQuat.x, trackerQuat.y, trackerQuat.z, trackerQuat.w));
    //console.log(newQuat);
  }
  return [newPos, newQuat];
}


// emits on new datagram msg
server.on('message',function(msg,info){
  //console.log('Data received from client : ' + msg.toString());
  console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);
  //console.log('Data received from client : ' + msg);
  var jsonObj = JSON.parse(msg.toString());
  var liveObjs = []

  var isSuccess = assignLightHouse(info.address, jsonObj);
  console.log("parse light house", isSuccess, jsonObj);
  //console.log("parse light house", isSuccess, lthsPos1, lthsQuat1, lthsPos1Prime, lthsQuat1Prime);

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
    // only send information from SOURCE1
    if(info.address.includes(SOURCE1)){
      //console.log('live Obj to send' + JSON.stringify(liveObj.label) + "\n");
      liveObjs.push(liveObj);  
    }

    // just test LHB
    //if(liveObj.label.includes("LHB")){
      var newPQ = lightHouseCalib(info.address, liveObj.vector3s[0],liveObj.vector4s[0]);
      // console.log("new pos", newPQ[0]);
      // console.log("new quat", newPQ[1]);
      if(newPQ[0].magnitude > 0 && isSuccess){
        var liveObj2 = {
            label: 'VT2-'+jsonObj[key].id, 
            vector3s: [{x: newPQ[0].x, y: newPQ[0].y, z: newPQ[0].z}],
            vector4s: [{x: newPQ[1].x, y: newPQ[1].y, z: newPQ[1].z, w: newPQ[1].w}]
        };
        console.log('live Obj to send' + JSON.stringify(liveObj2) + "\n");
        liveObjs.push(liveObj2);  
      }  
    //}
    
    
  }
  //console.log(JSON.stringify(liveObjs));
  if(liveObjs.length > 0)
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