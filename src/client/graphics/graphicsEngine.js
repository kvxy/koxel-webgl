// Everything WebGL goes here:
const GraphicsEngine = (function()  {

  function GraphicsEngine() {
    // resolution
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
    //const timeLocation = this.timeLocation = gl.getUniformLocation(program, 'time');
    //const resolutionLocation = gl.getUniformLocation(program, 'resolution');
    //gl.uniform2f(resolutionLocation, this.width, this.height);

    const sceneUB = this.sceneUB = new UniformBuffer(gl, program, ['u_time', 'u_resolution'], 'scene', 0);
    sceneUB.bind();
    sceneUB.updateVariable('u_resolution', new Float32Array([this.width, this.height]));
    sceneUB.updateVariable('u_time', new Float32Array(1));

    // vao
    const vao = this.vao = gl.createVertexArray();
    gl.bindVertexArray(vao); // don't unbind

    // fullscreen quad webgl moment :(
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, -1, 1, 1, 1,
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
    this.sceneUB.updateVariable('u_time', this.n += 1 / 60);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  return GraphicsEngine;

})();