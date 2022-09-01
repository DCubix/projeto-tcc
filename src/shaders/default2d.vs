#version 300 es
precision highp float;

layout (location=0) in vec3 a_position;
layout (location=1) in vec3 a_normal;
layout (location=2) in vec2 a_uv;
layout (location=3) in vec3 a_tangent;
layout (location=4) in vec4 a_color;

uniform mat4 u_projectionMatrix;

out vec2 vs_uv;
out vec4 vs_color;

void main() {
    gl_Position = u_projectionMatrix * vec4(a_position, 1.0);
    vs_uv = a_uv;
    vs_color = a_color;
}
