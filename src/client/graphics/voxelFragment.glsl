#version 300 es
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
}