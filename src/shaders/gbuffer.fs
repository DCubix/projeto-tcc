#version 300 es
precision highp float;

layout (location = 0) out vec4 o_color;
layout (location = 1) out vec3 o_normal;
layout (location = 2) out vec4 o_position;

uniform vec3 u_diffuseColor;
uniform sampler2D u_diffuseTexture;
uniform sampler2D u_emissionTexture;
uniform bool u_useDiffuseTexture;
uniform bool u_useEmissionTexture;

in vec3 v_normal;
in vec3 v_position;
in vec2 v_uv;

void main() {
    vec4 diffuse = vec4(u_diffuseColor, 1.0);
    float emission = 0.0;

    if (u_useDiffuseTexture) {
        diffuse *= texture(u_diffuseTexture, v_uv);
    }

    if (diffuse.a < 0.5) {
        discard;
    }

    if (u_useEmissionTexture) {
        emission = texture(u_emissionTexture, v_uv).r;
    }

    o_normal = normalize(v_normal) * 0.5 + 0.5;
    o_color.rgb = diffuse.rgb;
    o_color.a = emission;
    o_position = vec4(v_position, 1.0);
}
