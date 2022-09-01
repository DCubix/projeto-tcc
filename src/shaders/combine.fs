#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

// uniform vec2 u_resolution;

uniform sampler2D u_colorTexture;
uniform sampler2D u_lightingTexture;
uniform sampler2D u_specularTexture;
uniform sampler2D u_blurTexture;

void main() {
    vec4 color = texture(u_colorTexture, v_uv);
    vec3 lighting = texture(u_lightingTexture, v_uv).rgb;
    vec3 blur = texture(u_blurTexture, v_uv).rgb;
    float spec = texture(u_specularTexture, v_uv).r;
    vec3 specColor = lighting * spec;
    vec3 emitColor = color.rgb * color.a;
    fragColor = vec4((color.rgb * lighting + specColor) + emitColor + blur, 1.0);
}