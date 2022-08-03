#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

struct Light {
    vec3 position;
    vec3 color;
    float intensity;
    float radius; // in world units
    int type; // 0: directional, 1: point
};

float luma(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

float sqr2(float x) { return x * x; }

float dither4x4(vec2 position, float brightness) {
  int x = int(mod(position.x, 4.0));
  int y = int(mod(position.y, 4.0));
  int index = x + y * 4;
  float limit = 0.0;

  if (x < 8) {
    if (index == 0) limit = 0.0625;
    if (index == 1) limit = 0.5625;
    if (index == 2) limit = 0.1875;
    if (index == 3) limit = 0.6875;
    if (index == 4) limit = 0.8125;
    if (index == 5) limit = 0.3125;
    if (index == 6) limit = 0.9375;
    if (index == 7) limit = 0.4375;
    if (index == 8) limit = 0.25;
    if (index == 9) limit = 0.75;
    if (index == 10) limit = 0.125;
    if (index == 11) limit = 0.625;
    if (index == 12) limit = 1.0;
    if (index == 13) limit = 0.5;
    if (index == 14) limit = 0.875;
    if (index == 15) limit = 0.375;
  }

  return brightness < limit ? 0.0 : 1.0;
}

uniform sampler2D u_normalTexture;
uniform sampler2D u_positionTexture;
uniform vec2 u_resolution;

uniform Light u_light;
uniform vec3 u_ambientColor;

const float inv255 = 1.0 / 255.0;

void main() {
    vec3 N = texture(u_normalTexture, v_uv).rgb * 2.0 - 1.0;
    vec3 P = texture(u_positionTexture, v_uv).rgb;

    vec3 L = vec3(0.0);
    float att = 1.0;
    vec3 Lp = u_light.position;

    vec3 lighting = u_ambientColor;

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
            fact = smoothstep(0.1, 0.37, fact);
            fact = dither4x4(v_uv * u_resolution, fact);

            lighting += u_light.color * u_light.intensity * fact;

            // if (NoLf > 0.0) {
            //     vec3 R = reflect(L, N);
            //     vec3 V = normalize(-P);
            //     float RoV = max(dot(R, V), 0.0);
            //     vec3 specular = fact * u_light.color * u_light.intensity * pow(RoV, 32.0);
            //     lighting += specular;
            // }
        }
    }

    // gamma correction
    // lighting = pow(lighting, vec3(1.1 / 2.2));

    // clamp
    lighting = clamp(lighting, 0.0, 1.0);

    fragColor = vec4(lighting, 1.0);
}