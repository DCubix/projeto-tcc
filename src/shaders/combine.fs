#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

// uniform vec2 u_resolution;

uniform sampler2D u_colorTexture;
uniform sampler2D u_lightingTexture;

void main() {
    vec4 color = texture(u_colorTexture, v_uv);
    vec4 lighting = texture(u_lightingTexture, v_uv);
    fragColor = color * lighting;
}