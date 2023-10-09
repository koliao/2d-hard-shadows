const lightMaskFrag = `
precision mediump float;

uniform vec2 light;
uniform vec3 light_color;

void main() {
    vec2 uvs = gl_FragCoord.xy / 400.0;
    vec2 centered_uvs = (uvs - 0.5)*2.0;
    vec2 light_uvs = light / 400.0;
    vec2 centered_light = (light_uvs - 0.5)*2.0;

    float distance = length(centered_uvs - centered_light);
    float color = 1.0 - smoothstep(0.0, 0.5, distance);
    vec3 active_light = light_color * (1.0 - step(0.1, distance));

    gl_FragColor = vec4(light_color*color + active_light, 1.0);
}
`
