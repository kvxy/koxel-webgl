#version 300 es
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
}