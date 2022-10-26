
/** ./src/client/client.js **/

// start client
(function() {
  // fps counter
  let then = 0;
  let tick = 0;
  const fpsElem = document.getElementById('fps');
  function fps(now) {
    now *= 0.001;
    const deltaTime = now - then;
    then = now;
    const fps = 1 / deltaTime * 60;
    fpsElem.textContent = fps.toFixed(1);
  }
  // initialize all of client
  function init() {
    const engine = window.engine = new ClientEngine();
    engine.graphicsEngine.init();

    draw();
    function draw(now) {
      if (tick % 60 === 0) fps(now);
      engine.graphicsEngine.draw();
      tick ++;
      requestAnimationFrame(draw);
    }
  }

  window.onload = init;
})();


/** ./src/client/clientEngine.js **/

function ClientEngine() {
  this.gameEngine = null;
  this.graphicsEngine = new GraphicsEngine();
  this.UIEngine = null;
}


/** ./src/client/graphics/gpuResource.js **/

// for rendering/computation over the GPU
const GPUResource = (function () {

  // gl:WebGL2RenderingContext, vertSource:String, fragSource:String
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
  // gl:WebGL2RenderingContext, type:WebGLShader, source:String
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


/** ./src/client/graphics/graphicsEngine.js **/

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


/** ./src/client/graphics/uniformBuffer.js **/

const UniformBuffer = (function()  {

  // gl:WebGL2RenderingContext, program:WebGLProgram, variableNames:String[], uniformBlockName:String, bindIndex:Number
  function UniformBuffer(gl, program, variableNames, uniformBlockName, bindIndex = 0) {
    this.gl = gl;

    const blockIndex = gl.getUniformBlockIndex(program, uniformBlockName);
    const blockSize = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_DATA_SIZE);

    const buffer = this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
    gl.bufferData(gl.UNIFORM_BUFFER, blockSize, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, bindIndex, buffer);

    const variableIndices = gl.getUniformIndices(program, variableNames);
    const variableOffsets = gl.getActiveUniforms(program, variableIndices, gl.UNIFORM_OFFSET);

    this.variableInfo = {};
    variableNames.forEach((name, index) => {
      this.variableInfo[name] = {
        index:  variableIndices[index],
        offset: variableOffsets[index]
      };
    });

    const uniformBlockIndex = gl.getUniformBlockIndex(program, uniformBlockName);
    gl.uniformBlockBinding(program, uniformBlockIndex, bindIndex);
  }

  // variable:String, data:Any
  UniformBuffer.prototype.updateVariable = function(variableName, ...data) {
    const gl = this.gl;
    this.gl.bufferSubData(
      gl.UNIFORM_BUFFER,
      this.variableInfo[variableName].offset,
      typeof data[0] === 'object' ? data[0] : new Float32Array(data),
      0);
  };

  // updates everything
  UniformBuffer.prototype.update = function() {};

  UniformBuffer.prototype.bind = function() {
    const gl = this.gl;
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer);
  };

  UniformBuffer.prototype.unbind = function() {
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  };

  return UniformBuffer;

})();


/** ./src/client/graphics/voxelFragment.glsl **/

const voxelFragmentGLSL = 
` #version 300 es
  precision mediump float;
  
  uniform scene {
    float u_time;
    vec2 u_resolution;
  };
  
  // algorithm from http://www.cse.yorku.ca/~amana/research/grid.pdf (by John Amanatides & Andrew Woo)
  vec3 voxelTrace(vec3 rayPos, vec3 rayDir) {
    
    vec3 voxelPos = floor(rayPos);
    vec3 step = sign(rayDir);
  
    //vec3 tDelta = 
    //vec3 tMax = 
  
  
    int maxSteps = 70;
    for (int i = 0; i < maxSteps; i ++) {
  
    }
  
    return vec3(gl_FragCoord.x / u_resolution.x, gl_FragCoord.y / u_resolution.y, 1.0 - gl_FragCoord.x / u_resolution.x);
  }
  
  out vec4 outColor;
  
  void main() {
    vec3 rayPos = vec3(0.0, 0.0, 0.0);
    vec3 rayDir = vec3(0.0, 0.0, 0.0);
    outColor = vec4(voxelTrace(rayPos, rayDir), 1.0);
  }`;


/** ./src/client/graphics/voxelVertex.glsl **/

const voxelVertexGLSL = 
` #version 300 es
  precision mediump float;
  
  layout (location = 0) in vec4 position;
  
  void main() {
    gl_Position = position;
  }`;


/** ./src/server/serverEngine.js **/



