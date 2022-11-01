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
  cameraMatrix = identity();

  cameraMatrix = rotateX(cameraMatrix, u_cameraRot.x);
  cameraMatrix = rotateY(cameraMatrix, u_cameraRot.y);
  //cameraMatrix = rotateZ(cameraMatrix, u_cameraRot.z);

  gl_Position = position;
}