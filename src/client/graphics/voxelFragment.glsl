#version 300 es
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
}