
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


/** ./src/client/graphics/camera.js **/




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

    // scene uniforms
    const cameraUB = this.cameraUB = new UniformBuffer(gl, program, ['u_resolution', 'u_cameraPos', 'u_cameraRot', 'u_fov', 'u_near', 'u_far'], 'camera', 0);
    cameraUB.bind();
    cameraUB.updateVariable('u_resolution', this.width, this.height);
    cameraUB.updateVariable('u_cameraPos', 0, 0, 20);
    cameraUB.updateVariable('u_cameraRot', 0, 0, 0);
    cameraUB.updateVariable('u_fov', 90 * Math.PI / 180.0);
    cameraUB.updateVariable('u_near', 0.3);
    cameraUB.updateVariable('u_far', 2000);

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
    if (!this.n) this.n = 0;
    this.n += 0.02;
    this.cameraUB.updateVariable('u_cameraPos', 0, 5, 40 + Math.sin(this.n / 2) * 3);
    this.cameraUB.updateVariable('u_cameraRot', this.n / 10, this.n / 10, this.n / 10);
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
  
  uniform camera {
    vec2 u_resolution;
    vec3 u_cameraPos;
    vec3 u_cameraRot;
    float u_fov;
    float u_near;
    float u_far;
  };
  
  vec3 getVoxel(vec3 pos, out bool air) {
    air = !(length(pos) < 25.0);
    return pos / 50.0 + 0.5; // color
  }
  
  // Amanatides & Woo's fast voxel traversal algorithm
  vec3 voxelTrace(vec3 rayOri, vec3 rayDir) {
    vec3 voxelPos = floor(rayOri);
    vec3 step = sign(rayDir);
  
    vec3 tDelta = step / rayDir;
    vec3 tMax = tDelta * (sign(step + 1.0) + fract(rayOri) * -step);
  
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
        lighting = 0.8;
      }
      else if (tMax.y < tMax.z) {
        voxelPos.y += step.y;
        tMax.y += tDelta.y;
        lighting = 1.0;
      }
      else {
        voxelPos.z += step.z;
        tMax.z += tDelta.z;
        lighting = 0.6;
      }
    }
  
    return vec3(0.0, 0.0, 0.0);
  }
  
  in mat3 cameraMatrix;
  
  out vec4 outColor;
  
  void main() {
    vec2 coord = (gl_FragCoord.xy / u_resolution * 2.0 - 1.0) * tan(u_fov * 0.5);
    coord.x *= u_resolution.x / u_resolution.y;
  
    vec3 rayOri = u_cameraPos;
    vec3 rayDir = vec3(coord, -1.0);
  
    rayOri = cameraMatrix * rayOri;
    rayDir = cameraMatrix * rayDir;
    //rayDir = normalize(rayDir);
  
    outColor = vec4(voxelTrace(rayOri, rayDir), 1.0);
  }`;


/** ./src/client/graphics/voxelVertex.glsl **/

const voxelVertexGLSL = 
` #version 300 es
  precision mediump float;
  
  uniform camera {
    vec2 u_resolution;
    vec3 u_cameraPos;
    vec3 u_cameraRot;
    float u_fov;
    float u_near;
    float u_far;
  };
  
  mat3 identity() {
    return mat3(
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    );
  }
  
  mat3 rotateX(mat3 mat, float t) {
    return mat * mat3(
      1, 0,       0,     
      0, cos(t), -sin(t),
      0, sin(t),  cos(t)
    );
  }
  
  mat3 rotateY(mat3 mat, float t) {
    return mat * mat3(
      cos(t),  0, sin(t),
      0,       1, 0,
      -sin(t), 0, cos(t)
    );
  }
  
  mat3 rotateZ(mat3 mat, float t) {
    return mat * mat3(
      cos(t), -sin(t), 0,
      sin(t), cos(t),  0,
      0,      0,       1
    );
  }
  
  layout (location = 0) in vec4 position;
  
  out mat3 cameraMatrix;
  
  void main() {
    //cameraMatrix = inverse(projection(u_fov, u_resolution.x / u_resolution.y, u_near, u_far));
    cameraMatrix = identity();
  
    //cameraMatrix = translate(cameraMatrix, u_cameraPos.x, u_cameraPos.y, u_cameraPos.z);
    cameraMatrix = rotateX(cameraMatrix, u_cameraRot.x);
    cameraMatrix = rotateY(cameraMatrix, u_cameraRot.y);
    cameraMatrix = rotateZ(cameraMatrix, u_cameraRot.z);
  
    gl_Position = position;
  }`;


/** ./src/server/serverEngine.js **/



