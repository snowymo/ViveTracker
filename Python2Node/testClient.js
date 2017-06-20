const holojam = require('holojam-node')(['emitter','sink']);

holojam.on('update', (flakes, scope, origin) => {
  console.log(flakes);
  console.log(flakes[0].vector3s[0]);
});