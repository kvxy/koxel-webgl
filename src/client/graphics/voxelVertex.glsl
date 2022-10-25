#version 300 es
precision highp float;

uniform float time;
uniform vec2 resolution;

layout (location = 0) in vec4 position;

out float iTime;
out vec2 iResolution;

void main() {
  gl_Position = position;
  iTime = time;
  iResolution = resolution;
}