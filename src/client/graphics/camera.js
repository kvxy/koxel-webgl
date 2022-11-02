const Camera = (function()  {

  function Camera(x, y, z) {
    this.position = [x, y, z];
    this.rotation = [0, 0, 0];

    this.speed = 1;
    this.sensitivity = 1;
  }

  const keymap = {
    87: 'forward', // w
    83: 'back',    // s
    65: 'left',    // a
    68: 'right',   // d
    32: 'up',      // space
    16: 'down',    // shift
    17: 'lock'     // ctrl
  };
  const input = Object.fromEntries(Object.entries(keymap).map(a => [a[1], false]));

  Camera.prototype.moveX = function(dir) {
    this.position[2] += Math.cos(this.rotation[1] + Math.PI / 2) * this.speed * dir;
    this.position[0] += Math.sin(this.rotation[1] + Math.PI / 2) * this.speed * dir;
  };

  Camera.prototype.moveY = function(dir) {
    this.position[1] += this.speed * dir;
  };

  Camera.prototype.moveZ = function(dir) {
    this.position[2] += Math.cos(this.rotation[1]) * this.speed * dir;
    this.position[0] += Math.sin(this.rotation[1]) * this.speed * dir;
  };

  Camera.prototype.tick = function() {
    this.moveX(input.right - input.left);
    this.moveY(input.up - input.down);
    this.moveZ(input.forward - input.back);
  };

  Camera.prototype.addEventListeners = function() {
    window.addEventListener('keydown', () => {
      input[keymap[event.keyCode]] = true;
      if (input.lock) document.getElementById('glcanvas').requestPointerLock();
    });
    window.addEventListener('keyup', () => {
      input[keymap[event.keyCode]] = false;
    });
    window.addEventListener('mousemove', e => {
      if (document.pointerLockElement !== null) {
        const rot = this.rotation;
        rot[1] += e.movementX / 500;
        rot[0] += e.movementY / 500;
        if (rot[0] > Math.PI / 2) rot[0] = Math.PI / 2;
        if (rot[0] < -Math.PI / 2) rot[0] = -Math.PI / 2;
      }
    });
  };

  return Camera;

})();