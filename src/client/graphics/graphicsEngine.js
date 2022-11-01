// Everything WebGL goes here:
const GraphicsEngine = (function()  {

  function GraphicsEngine() {
    // resolution
    this.pixelSize = 2;
    this.width = Math.floor(window.innerWidth / this.pixelSize);
    this.height = Math.floor(window.innerHeight / this.pixelSize);
    this.time = 0;
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
    
    // temp camera
    this.camera = new Camera(0, -22, 0);
    this.camera.addEventListeners();

    // scene uniforms
    const cameraUB = this.cameraUB = new UniformBuffer(gl, program, ['u_resolution', 'u_cameraPos', 'u_cameraRot', 'u_fov', 'u_near', 'u_far', 'u_time'], 'camera', 0);
    cameraUB.bind();
    cameraUB.updateVariable('u_resolution', this.width, this.height);
    cameraUB.updateVariable('u_cameraPos', ...this.camera.position);
    cameraUB.updateVariable('u_cameraRot', 0, 0, 0);
    cameraUB.updateVariable('u_fov', 90 * Math.PI / 180.0);
    cameraUB.updateVariable('u_near', 0.3);
    cameraUB.updateVariable('u_far', 2000);
    cameraUB.updateVariable('u_time', 0);

    // vao
    const vao = this.vao = gl.createVertexArray();
    gl.bindVertexArray(vao); // don't unbind

    // fullscreen quad webgl moment :(
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      //-1, -1, -1, 3, 3, -1,
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
    this.time ++;
    this.camera.tick();

    this.cameraUB.updateVariable('u_time', this.time);
    //this.cameraUB.updateVariable('u_cameraRot', ...this.camera.rotation);
    this.cameraUB.updateVariable('u_cameraPos', ...this.camera.position);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  return GraphicsEngine;

})();