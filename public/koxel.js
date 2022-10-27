
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
    this.pixelSize = 1;
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

    // scene uniforms
    const sceneUB = this.sceneUB = new UniformBuffer(gl, program, ['u_time', 'u_resolution', 'u_cameraPos', 'u_cameraDir', 'u_fov'], 'scene', 0);
    sceneUB.bind();
    // general scene stuff
    sceneUB.updateVariable('u_resolution', this.width, this.height);
    sceneUB.updateVariable('u_time', 1);
    // camera
    sceneUB.updateVariable('u_cameraPos', 0, 0, 0);
    sceneUB.updateVariable('u_cameraDir', 0, 0, -0.8);
    sceneUB.updateVariable('u_fov', 100 * Math.PI / 180.0);

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
    if (!this.n) this.n = 0; // TEMP
    this.sceneUB.updateVariable('u_time', this.n += 1 / 60);
    this.sceneUB.updateVariable('u_cameraPos', Math.cos(this.n / 2) + 0.5, 0, Math.sin(this.n / 2) + 0.5);
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
    vec3 u_cameraPos;
    vec3 u_cameraDir;
    float u_fov;
  };
  
  vec3 getVoxel(vec3 pos, out bool air) {
    air = !(length(vec3(pos.x, pos.y + 10.0, pos.z + 40.0)) < 20.0);
    return pos / 40.0 + 0.5; // color
  }
  
  // Amanatides & Woo's fast voxel traversal algorithm
  vec3 voxelTrace(vec3 rayOri, vec3 rayDir) {
    vec3 voxelPos = floor(rayOri);
    vec3 step = sign(rayDir);
  
    vec3 tMax = sign(step + 1.0) - voxelPos * -step; 
    vec3 tDelta = step / rayDir;
  
    float lighting = 0.0;
  
    int maxSteps = 100;
    for (int i = 0; i < maxSteps; i ++) {
      bool air;
      vec3 voxel = getVoxel(voxelPos, air);
      if (!air) {
        return voxel * lighting;
      }
  
      if (tMax.x < tMax.y && tMax.x < tMax.z) {
        voxelPos.x += step.x;
        tMax.x += tDelta.x;
        lighting = 0.6;
      }
      else if (tMax.y < tMax.z) {
        voxelPos.y += step.y;
        tMax.y += tDelta.y;
        lighting = 1.0;
      }
      else {
        voxelPos.z += step.z;
        tMax.z += tDelta.z;
        lighting = 0.4;
      }
    }
  
    return vec3(0.0, 0.0, 0.0);
  }
  
  out vec4 outColor;
  
  void main() {
    // don't use matrix camera
    vec2 screenPoint = 2.0 * gl_FragCoord.xy / u_resolution - 1.0;
    vec2 cameraPoint = screenPoint * tan(u_fov * 0.5);
    cameraPoint.x *= u_resolution.x / u_resolution.y;
  
    vec3 rayOri = u_cameraPos;
    vec3 rayDir = vec3(cameraPoint.xy, -1.0) - rayOri;
    rayDir = normalize(rayDir);
  
    outColor = vec4(voxelTrace(rayOri, rayDir), 1.0);
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



