const Camera = (function()  {

  function Camera(x, y, z) {
    this.position = [x, y, z];
    this.rotation = [0, 0, 0];

    this.speed = 0.05;
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

  // temp movement for camera
  Camera.prototype.move = function(x, y, z) {
    this.position[0] += x * this.speed;
    this.position[1] += y * this.speed;
    this.position[2] += z * this.speed;
  };

  Camera.prototype.tick = function() {
    this.move(input.right - input.left, input.up - input.down, input.back - input.forward);
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
        rot[1] -= e.movementX / 500;
        rot[0] += e.movementY / 500;
        if (rot[0] > Math.PI / 2) rot[0] = Math.PI / 2;
        if (rot[0] < -Math.PI / 2) rot[0] = -Math.PI / 2;
      }
    });
  };

  return Camera;

})();