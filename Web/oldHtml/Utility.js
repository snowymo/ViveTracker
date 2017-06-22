"use strict";

var server = new Server();
var socket = server.connectSocket();

var pq = [0,0,0,0,0,0,1];
var prePQ = [0,0,0,0,0,0,1];

function Server() {
	this.socket = null;

    this.connectSocket = function() {

		this.socket = new WebSocket("ws://" + window.location.hostname + ":22346");
		this.socket.binaryType = "arraybuffer";

		var that = this;
		this.socket.onmessage = function(event) {
			//console.log("ws receive " + event.data);

			var obj = JSON.parse(event.data);

			if (obj.vive) {
				pq = obj.value;
			}

			if (obj.global) {
				//console.log("global:" + obj.global + " value:" + obj.value);
				
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

var scale_of_p = 1;
var scale_of_q = 1;
function customizeScale(pq){
  return [pq[0] * scale_of_p, pq[1] * scale_of_p, pq[2] * scale_of_p, 
  pq[3] * scale_of_q, pq[4] * scale_of_q, pq[5] * scale_of_q, pq[6] * scale_of_q];//1];
}

   // Warn if overriding existing method
if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
	Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});

function simpleInvert(src, dst) {

         //----- INVERT A 4x4 THAT WAS CREATED BY TRANSLATIONS+ROTATIONS+SCALES

         // COMPUTE ADJOINT COFACTOR MATRIX FOR THE ROTATION+SCALE 3x3

         for (var i = 0 ; i < 3 ; i++)
         for (var j = 0 ; j < 3 ; j++) {
            var i0 = (i+1) % 3;
            var i1 = (i+2) % 3;
            var j0 = (j+1) % 3;
            var j1 = (j+2) % 3;
            dst[j+4*i] = src[i0+4*j0] * src[i1+4*j1] - src[i0+4*j1] * src[i1+4*j0];
         }

         // RENORMALIZE BY DETERMINANT TO GET ROTATION+SCALE 3x3 INVERSE

         var determinant = src[0+4*0] * dst[0+4*0]
                         + src[1+4*0] * dst[0+4*1]
                         + src[2+4*0] * dst[0+4*2] ;
         for (var i = 0 ; i < 3 ; i++)
         for (var j = 0 ; j < 3 ; j++)
            dst[i+4*j] /= determinant;

         // COMPUTE INVERSE TRANSLATION

         for (var i = 0 ; i < 3 ; i++)
            dst[i+4*3] = - dst[i+4*0] * src[0+4*3]
                         - dst[i+4*1] * src[1+4*3]
                         - dst[i+4*2] * src[2+4*3] ;
}


