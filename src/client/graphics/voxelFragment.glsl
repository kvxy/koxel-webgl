#version 300 es
precision mediump float;

uniform camera {
  vec2 u_resolution;
  vec3 u_cameraPos;
  vec3 u_cameraRot;
  float u_fov;
  float u_near;
  float u_far;
  float u_time;
};

vec3 getVoxel(vec3 pos, out bool air) {
  vec3 ballPos = vec3(int(pos.x) % 100, int(pos.y) % 100, int(pos.z) % 100);
  if (length(ballPos) + cos(u_time / 20.0) * 5.0 < 20.0) {
    air = false;
    return ballPos / 50.0 + 0.5;
  }
  else if (pos.y == -25.0) {
    air = false;
    return vec3(float(abs(int(pos.x + pos.z + pos.y)) % 2) * 0.3 + 0.7);
  }
  air = true;
  return vec3(0.0, 0.0, 0.0);
}

// Amanatides & Woo's fast voxel traversal algorithm
vec3 voxelTrace(vec3 rayOri, vec3 rayDir) {
  vec3 voxelPos = floor(rayOri);
  vec3 step = sign(rayDir);

  vec3 tDelta = step / rayDir;
  vec3 tMax = tDelta * (sign(step + 1.0) + fract(rayOri) * -step);

  float lighting = 0.0;

  int maxSteps = 800;
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

  rayOri = rayOri * cameraMatrix;
  rayDir = cameraMatrix * rayDir;
  //rayDir = normalize(rayDir);

  outColor = vec4(voxelTrace(rayOri, rayDir), 1.0);
}