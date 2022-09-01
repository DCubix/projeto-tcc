#version 300 es
precision highp float;

layout (location = 0) out vec4 o_color;
layout (location = 1) out vec3 o_normal;
layout (location = 2) out vec4 o_position;

uniform vec3 u_diffuseColor;
uniform sampler2D u_diffuseTexture;
uniform sampler2D u_emissionTexture;
uniform sampler2D u_normalTexture;
uniform bool u_useDiffuseTexture;
uniform float u_useEmissionTexture;
uniform bool u_useNormalMap;

in vec3 v_normal;
in vec3 v_tangent;
in vec3 v_position;
in vec2 v_uv;
in mat3 v_tbn;

void main() {
    vec4 diffuse = vec4(u_diffuseColor, 1.0);
    float emission = 0.0;

    if (u_useDiffuseTexture) {
        diffuse *= texture(u_diffuseTexture, v_uv);
    }

    if (diffuse.a < 0.5) {
        discard;
    }

    if (u_useEmissionTexture > 0.0) {
        emission = texture(u_emissionTexture, v_uv).r * u_useEmissionTexture;
    }

    vec3 normal = vec3(0.0);
    if (u_useNormalMap) {
        vec3 N = texture(u_normalTexture, v_uv).rgb;
        N.y = 1.0 - N.y; // flip y axis
        normal = v_tbn * (N * 2.0 - 1.0);
    } else {
        normal = v_normal;
    }
    o_normal = normalize(normal) * 0.5 + 0.5;

    o_color = vec4(diffuse.rgb, emission);
    o_position = vec4(v_position, 1.0);
}
