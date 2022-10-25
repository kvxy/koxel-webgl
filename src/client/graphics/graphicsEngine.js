// Everything WebGL goes here:
const GraphicsEngine = (function()  {

  function GraphicsEngine() {
    // resolution calculations
    this.pixelSize = 3;
    this.width = Math.floor(window.innerWidth / this.pixelSize);
    this.height = Math.floor(window.innerHeight / this.pixelSize);
  }
  
  GraphicsEngine.prototype.init = function() {
    const canvas = document.getElementById('glcanvas');
    const gl = this.gl = canvas.getContext('webgl2');
    if (!gl) {
      return console.error('no WebGL2 :(');
    }

    const renderer = new GPUResource(gl, voxelVertexGLSL, voxelFragmentGLSL);
    const program = renderer.program;
    renderer.bind(); // useProgram

    // uniforms
    const timeLocation = this.timeLocation = gl.getUniformLocation(program, 'time');
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');
    gl.uniform2f(resolutionLocation, this.width, this.height);

    // screen quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1,-1, -1, 1, 1, 1,
      1, 1, 1, -1, -1, -1
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // resize
    canvas.width = this.width;
    canvas.height = this.height;
    gl.viewport(0, 0, this.width, this.height);
  };

  GraphicsEngine.prototype.draw = function() {
    const gl = this.gl;
    if (!this.n) this.n = 0; // TEMP
    gl.uniform1f(this.timeLocation, this.n += 1 / 60)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  return GraphicsEngine;

})();