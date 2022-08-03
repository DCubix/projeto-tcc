#version 300 es
precision mediump float;

layout (location=0) in vec3 a_position;
layout (location=1) in vec3 a_normal;
layout (location=2) in vec2 a_uv;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

out vec3 v_normal;
out vec3 v_position;
out vec2 v_uv;

void main() {
    mat4 modelViewMatrix = u_viewMatrix * u_modelMatrix;

    gl_Position = u_projectionMatrix * modelViewMatrix * vec4(a_position, 1.0);

    v_normal = normalize((u_modelMatrix * vec4(a_normal, 0.0)).xyz);
    v_position = vec3(u_modelMatrix * vec4(a_position, 1.0));
    v_uv = a_uv;
}
