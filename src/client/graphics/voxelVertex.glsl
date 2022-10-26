#version 300 es
precision mediump float;

layout (location = 0) in vec4 position;

void main() {
  gl_Position = position;
}