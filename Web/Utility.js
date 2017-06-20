"use strict";

var server = new Server();
var socket = server.connectSocket();

var pq = [0,0,0,0,0,0,1];

function Server() {
	this.socket = null;

    this.connectSocket = function() {

		this.socket = new WebSocket("ws://" + window.location.hostname + ":22346");
		this.socket.binaryType = "arraybuffer";

		var that = this;
		this.socket.onmessage = function(event) {
			console.log("ws receive " + event.data);

			var obj = JSON.parse(event.data);

			if (obj.vive) {
				pq = obj.value;
			}

			if (obj.global) {
				console.log("global:" + obj.global + " value:" + obj.value);
				
			}

			// if (obj.code) {
			// 	try {
			// 	  eval(obj.code);
			// 	   }
			// 	catch (e) { }
			// 	return;
			// }
		};
		return this.socket;
	};
  }

  function pq2m(pq) { // CONVERT POSITION,QUATERNION TO MATRIX.
      var qx = pq[3], qy = pq[4], qz = pq[5], qw = pq[6];
      return [ 1 - 2 * qy * qy - 2 * qz * qz,     2 * qx * qy - 2 * qz * qw,     2 * qz * qx + 2 * qy * qw,  0,
                   2 * qx * qy + 2 * qz * qw, 1 - 2 * qx * qx - 2 * qz * qz,     2 * qy * qz - 2 * qx * qw,  0,
                   2 * qz * qx - 2 * qy * qw,     2 * qy * qz + 2 * qx * qw, 1 - 2 * qx * qx - 2 * qy * qy,  0,
                   pq[0], pq[1], pq[2], 1 ];
   }