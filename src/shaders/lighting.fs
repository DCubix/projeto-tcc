#version 300 es
precision highp float;

in vec2 v_uv;
layout (location = 0) out vec3 o_color;
layout (location = 1) out float o_specular;

struct Light {
    vec3 position;
    vec3 color;
    float intensity;
    float radius; // in world units
    int type; // 0: directional, 1: point
};

float sqr2(float x) { return x * x; }

uniform sampler2D u_normalTexture;
uniform sampler2D u_positionTexture;
uniform vec2 u_resolution;

uniform Light u_light;
uniform vec3 u_ambientColor;

uniform vec3 u_eyePosition;

void main() {
    vec3 N = texture(u_normalTexture, v_uv).rgb * 2.0 - 1.0;
    vec3 P = texture(u_positionTexture, v_uv).rgb;
    vec3 V = normalize(u_eyePosition - P);

    vec3 L = vec3(0.0);
    float att = 1.0;
    vec3 Lp = u_light.position;

    vec3 lighting = u_ambientColor;
    float specularIntensity = 0.0;

    if (u_light.intensity > 0.0) {
        if (u_light.type == 0) {
            L = normalize(-Lp);
        } else if (u_light.type == 1) {
            L = Lp - P;
            float dist = length(L);
            L = normalize(L);

            if (dist < u_light.radius) {
                att = sqr2(clamp(1.0 - dist / u_light.radius, 0.0, 1.0));
            } else {
                att = 0.0;
            }
        }

        float NoLf = dot(N, L);
        float NoL = max(NoLf, 0.0);
        if (att > 0.0) {
            float fact = NoL * att;
            fact = smoothstep(0.2, 0.35, fact);
            //fact = dither4x4(v_uv * u_resolution, fact);

            lighting = u_light.color * u_light.intensity * fact;

            vec3 R = -reflect(L, N);
            float RoV = max(dot(V, R), 0.0);
            specularIntensity = u_light.intensity * pow(RoV, 25.0) * NoL;
        }
    }

    // clamp
    lighting = clamp(lighting, 0.0, 1.0);
    o_color = lighting;
    o_specular = specularIntensity;
}