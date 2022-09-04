#version 300 es
precision highp float;

out vec4 fragColor;

in vec2 vs_uv;
in vec4 vs_color;

uniform sampler2D u_tex;

void main() {
    vec4 col = texture(u_tex, vs_uv) * vs_color;
    fragColor = /*col.a < 0.5 ? vec4(1.0, 0.0, 0.0, 1.0) : */col;
}
