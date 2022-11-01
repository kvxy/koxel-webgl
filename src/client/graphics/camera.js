const Camera = (function()  {

  function Camera() {
    this.position = [0, 0, 0];
    this.rotation = [0, 0, 0];

    this.speed = 0.2;
    this.sensitivity = 1;
  }

  // temp movement for camera
  Camera.prototype.move = function(x, y, z) {
    this.position[0] += x * this.speed;
    this.position[1] += y * this.speed;
    this.position[2] += z * this.speed;
  };

  return Camera;

})();