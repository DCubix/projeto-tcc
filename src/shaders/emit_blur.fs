#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_inputTexture;
uniform vec2 u_resolution;
uniform vec2 u_direction;

vec4 sampleEmit(vec2 uv) {
  vec4 col = texture(u_inputTexture, uv);
  return vec4(col.rgb * col.a, 1.0);
}

vec4 blur13(vec2 uv, vec2 resolution, vec2 direction) {
    vec4 color = vec4(0.0);
    vec2 off1 = vec2(1.411764705882353) * direction;
    vec2 off2 = vec2(3.2941176470588234) * direction;
    vec2 off3 = vec2(5.176470588235294) * direction;
    color += sampleEmit(uv) * 0.1964825501511404;
    color += sampleEmit(uv + (off1 / resolution)) * 0.2969069646728344;
    color += sampleEmit(uv - (off1 / resolution)) * 0.2969069646728344;
    color += sampleEmit(uv + (off2 / resolution)) * 0.09447039785044732;
    color += sampleEmit(uv - (off2 / resolution)) * 0.09447039785044732;
    color += sampleEmit(uv + (off3 / resolution)) * 0.010381362401148057;
    color += sampleEmit(uv - (off3 / resolution)) * 0.010381362401148057;
    return color;
}

void main() {
    fragColor = blur13(v_uv, u_resolution, u_direction);
}