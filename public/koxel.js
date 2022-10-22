
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
  }

  window.onload = init;
})();


/** ./src/client/clientEngine.js **/

function ClientEngine() {
  this.gameEngine = null;
  this.graphicsEngine = new GraphicsEngine();
  this.UIEngine = null;
}


/** ./src/client/graphics/graphicsEngine.js **/

// Everything WebGL goes here:
function GraphicsEngine() {
  
}

GraphicsEngine.prototype.init = function() {
  const canvas = document.getElementById('glcanvas');
  const gl = this.gl = canvas.getContext('webgl2');
  if (!gl)
    return console.error('no WebGL2 :(');

  // vertex shader
  const vertShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertShader, voxelVertexGLSL);
  gl.compileShader(vertShader);

  if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS))
    return console.log(gl.getShaderInfoLog(vertShader));

  // fragment shader
  const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragShader, voxelFragmentGLSL);
  gl.compileShader(fragShader);

  if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS))
    return console.log(gl.getShaderInfoLog(fragShader));
  
  // program
  const program = this.program = gl.createProgram();
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    return console.log(gl.getProgramInfoLog(program));
}


/** ./src/client/graphics/voxelFragment.glsl **/

const voxelFragmentGLSL = 
` #version 300 es
  precision mediump float;
  
  vec2 iResolution = vec2(400, 300);
  float iTime = 1.0;
  
  const float pi = 3.141592;
  const float tau = 2.0*pi;
  
  //#define TIME (3.0*tau/4.0)
  #define TIME iTime/2.0
  
  const float sphereRadius = 15.0;
  const float camRadius = 2.0*sphereRadius;
  
  struct hit {
      bool didHit;
      vec3 col;
  };
  
  hit getVoxel(ivec3 p) {
      if (length(vec3(p)) < sphereRadius)
          return hit(true, vec3(p) / (sphereRadius * 2.0) + 0.6);
      else
          return hit(false, vec3(0,0,0));
  
  }
  
  vec3 lighting(vec3 norm, vec3 pos, vec3 rd, vec3 col) {
      vec3 lightDir = normalize(vec3(-1.0, 3.0, -1.0));
      float diffuseAttn = max(dot(norm, lightDir), 0.0);
      vec3 light = vec3(1.0,0.9,0.9);
      
      vec3 ambient = vec3(0.2, 0.2, 0.3);
      
      vec3 reflected = reflect(rd, norm);
      float specularAttn = max(dot(reflected, lightDir), 0.0);
      
      return col*(diffuseAttn*light*1.0 + specularAttn*light*0.6 + ambient);
  }
  
  // Voxel ray casting algorithm from "A Fast Voxel Traversal Algorithm for Ray Tracing" 
  // by John Amanatides and Andrew Woo
  // http://www.cse.yorku.ca/~amana/research/grid.pdf
  hit intersect(vec3 ro, vec3 rd) {
      //Todo: find out why this is so slow
      vec3 pos = floor(ro);
      
      vec3 step = sign(rd);
      vec3 tDelta = step / rd;
  
      
      float tMaxX, tMaxY, tMaxZ;
      
      vec3 fr = fract(ro);
      
      tMaxX = tDelta.x * ((rd.x>0.0) ? (1.0 - fr.x) : fr.x);
      tMaxY = tDelta.y * ((rd.y>0.0) ? (1.0 - fr.y) : fr.y);
      tMaxZ = tDelta.z * ((rd.z>0.0) ? (1.0 - fr.z) : fr.z);
  
      vec3 norm;
      const int maxTrace = 100;
      
      for (int i = 0; i < maxTrace; i++) {
          hit h = getVoxel(ivec3(pos));
          if (h.didHit) {
              return hit(true, lighting(norm, pos, rd, h.col));
          }
  
          if (tMaxX < tMaxY) {
              if (tMaxZ < tMaxX) {
                  tMaxZ += tDelta.z;
                  pos.z += step.z;
                  norm = vec3(0, 0,-step.z);
              } else {
                  tMaxX += tDelta.x;
              	pos.x += step.x;
                  norm = vec3(-step.x, 0, 0);
              }
          } else {
              if (tMaxZ < tMaxY) {
                  tMaxZ += tDelta.z;
                  pos.z += step.z;
                  norm = vec3(0, 0, -step.z);
              } else {
              	tMaxY += tDelta.y;
              	pos.y += step.y;
                  norm = vec3(0, -step.y, 0);
              }
          }
      }
  
   	return hit(false, vec3(0,0,0));
  }
  
  //in vec4 gl_FragCoord;
  out vec4 outColor;
  
  void main()
  {
      vec2 fragCoord = vec2(gl_FragCoord.x, gl_FragCoord.y);
      vec2 uv = fragCoord / iResolution.xy - 0.5;
      vec3 worldUp = vec3(0,1,0);
      vec3 camPos = vec3(camRadius*sin(TIME), 10, 1.0*camRadius*cos(TIME));
      vec3 lookAt = vec3(0,0,0);
      vec3 camDir = normalize(lookAt - camPos);
      vec3 camRight = normalize(cross(camDir, worldUp));
      vec3 camUp = cross(camRight, camDir);
      
      vec3 filmCentre = camPos + camDir*0.3;
      vec2 filmSize = vec2(1,iResolution.y / iResolution.x);
      
      vec3 filmPos = filmCentre + uv.x*filmSize.x*camRight + uv.y*filmSize.y*camUp;
      vec3 ro = camPos;
      vec3 rd = normalize(filmPos - camPos);
      
      hit h = intersect(ro, rd); 
  
      if(h.didHit) {
          outColor = vec4(h.col,0);
      } else{
          outColor = vec4(0,0,0,0);
      }
  }
  
  `;


/** ./src/client/graphics/voxelVertex.glsl **/

const voxelVertexGLSL = 
` #version 300 es
  
  in vec4 position;
  
  void main() {
    gl_Position = position;
  }`;


/** ./src/server/serverEngine.js **/



