// Everything WebGL goes here:
function GraphicsEngine() {
  
}

GraphicsEngine.prototype.init = function() {
  const canvas = document.getElementById('glcanvas');
  const gl = this.gl = canvas.getContext('webgl2');
  if (!gl) {
    return console.error('no WebGL2 :(');
  }

  // init vertex shader
  const vertShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertShader, voxelVertexGLSL);
  gl.compileShader(vertShader);

  if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
    return console.log(gl.getShaderInfoLog(vertShader));
  }

  // init fragment shader
  const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragShader, voxelFragmentGLSL);
  gl.compileShader(fragShader);

  if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    return console.log(gl.getShaderInfoLog(fragShader));
  }
  
  // init program
  const program = this.program = gl.createProgram();
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return console.log(gl.getProgramInfoLog(program));
  }

  // uniforms
  //const cameraLocation = gl.getUniformLocation(program, 'camera');
  
}