"use strict";

var serverAddress = '192.168.1.69';	// wireless ip address

var trackermatrix = [0,0,0,0,  0,0,0,0,  0,0,0,0,  0,0,0,0];
trackermatrix = pq2m([0,0,0].concat([0,0,0,1]));

const holojam = require('holojam-node')(['emitter', 'sink']);	// wireless ip

// function toQuaternion( pitch,  roll,  yaw)
// {
//   var q = [0,0,0,1];
//   var t0 = cos(yaw * 0.5);
//   var t1 = sin(yaw * 0.5);
//   var t2 = cos(roll * 0.5);
//   var t3 = sin(roll * 0.5);
//   var t4 = cos(pitch * 0.5);
//   var t5 = sin(pitch * 0.5);

//   q[3] = t0 * t2 * t4 + t1 * t3 * t5;
//   q[0] = t0 * t3 * t4 - t1 * t2 * t5;
//   q[1] = t0 * t2 * t5 + t1 * t3 * t4;
//   q[2] = t1 * t2 * t4 - t0 * t3 * t5;
//   return q;
// }

function pq2m(pq) { // CONVERT POSITION,QUATERNION TO MATRIX.
  var qx = pq[3], qy = pq[4], qz = pq[5], qw = pq[6];
  return [ 1 - 2 * qy * qy - 2 * qz * qz,     2 * qx * qy - 2 * qz * qw,     2 * qz * qx + 2 * qy * qw,  0,
               2 * qx * qy + 2 * qz * qw, 1 - 2 * qx * qx - 2 * qz * qz,     2 * qy * qz - 2 * qx * qw,  0,
               2 * qz * qx - 2 * qy * qw,     2 * qy * qz + 2 * qx * qw, 1 - 2 * qx * qx - 2 * qy * qy,  0,
   pq[0], pq[1], pq[2], 1 ];
}

// function pr2m(p,r){
//   var q = toQuaternion(r.x, r.y, r.z);
//   var pq = [p.x, p.y, p.x, q[0], q[1], q[2], q[3]];
//   return pq2m(pq);
// }

holojam.on('update', (flakes, scope, origin) => {
  console.log(
    'Update received with ' + flakes.length
      + ' ' + (flakes.length == 1 ? 'flake' : 'flakes') + ':'
  );

  flakes.forEach((flake) => {
    if(flake.label == 'vivetracker'){
      trackermatrix = pq2m(flake.vector3s[0].concat(flake.vector4s[0]));
      
    }
    
  });

  //holojam.Send(holojam.BuildNotification('vivetracker.viewmatrix', 'my-notification'));
});
