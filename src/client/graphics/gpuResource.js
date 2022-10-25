// for rendering/computation over the GPU
const GPUResource = (function () {

  function GPUResource(gl, vertSource, fragSource) {
    this.gl = gl;

    // create shaders
    const vertShader = createShader(gl, gl.VERTEX_SHADER, vertSource);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragSource);
    
    const program = this.program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
    }
  }

  // load fragment/vertex shader
  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader)
    }
    return shader;
  }

  GPUResource.prototype.bind = function() {
    this.gl.useProgram(this.program);
  };

  return GPUResource;

})();