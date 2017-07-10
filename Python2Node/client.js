const holojam = require('holojam-node')(['emitter','sink']);

holojam.on('update', (flakes, scope, origin) => {
	console.log(flakes.length);
	
	flakes.forEach((flake) => {
		console.log(scope + "." + flake.label + "\n");
	});
});