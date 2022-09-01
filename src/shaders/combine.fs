#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

// uniform vec2 u_resolution;

uniform sampler2D u_colorTexture;
uniform sampler2D u_lightingTexture;
uniform sampler2D u_specularTexture;
uniform sampler2D u_blurTexture;

vec3 gammaCorrect(vec3 color) {
    return pow(color, vec3(1.0 / 2.2));
}

void main() {
    vec4 color = texture(u_colorTexture, v_uv);
    vec3 lighting = texture(u_lightingTexture, v_uv).rgb;
    vec3 blur = texture(u_blurTexture, v_uv).rgb;
    float spec = texture(u_specularTexture, v_uv).r;
    vec3 specColor = lighting * spec;
    vec3 emitColor = color.rgb * color.a;
    vec4 finalColor = vec4((color.rgb * lighting + specColor) + emitColor + blur * 2.5, 1.0);
    fragColor = finalColor;
}