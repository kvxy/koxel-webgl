#version 300 es
precision mediump float;

uniform camera {
  vec2 u_resolution;
  vec3 u_cameraPos;
  vec3 u_cameraRot;
  float u_fov;
};

mat4 translate(mat4 mat, float tx, float ty, float tz) {
  return mat * mat4(
    1, 0, 0, tx,
    0, 1, 0, ty,
    0, 0, 1, tz,
    0, 0, 0, 1
  );
}

mat4 rotateX(mat4 mat, float d) {
  return mat * mat4(
    1, 0,       0,      0,
    0, cos(d), -sin(d), 0,
    0, sin(d),  cos(d), 0,
    0, 0,       0,      1
  );
}

mat4 rotateY(mat4 mat, float d) {
  return mat * mat4(
    cos(d),  0, sin(d), 0,
    0,       1, 0,      0,
    -sin(d), 0, cos(d), 0,
    0,       0, 0,      1
  );
}

mat4 rotateZ(mat4 mat, float d) {
  return mat * mat4(
    cos(d), -sin(d), 0, 0,
    sin(d), cos(d),  0, 0,
    0,      0,       1, 0,
    0,      0,       0, 1
  );
}

layout (location = 0) in vec4 position;

out mat4 cameraMatrix;

void main() {
  cameraMatrix = mat4(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  );

  //cameraMatrix = translate(cameraMatrix, u_cameraPos.x, u_cameraPos.y, u_cameraPos.z);
  cameraMatrix = rotateX(cameraMatrix, u_cameraRot.x);
  cameraMatrix = rotateY(cameraMatrix, u_cameraRot.y);
  cameraMatrix = rotateZ(cameraMatrix, u_cameraRot.z);

  gl_Position = position;
}