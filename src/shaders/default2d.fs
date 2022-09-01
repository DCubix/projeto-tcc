#version 300 es
precision highp float;

out vec4 fragColor;

in vec2 vs_uv;
in vec4 vs_color;

uniform sampler2D u_tex;

void main() {
    fragColor = texture(u_tex, vs_uv) * vs_color;
}
