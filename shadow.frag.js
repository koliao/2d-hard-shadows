const frag = `
precision mediump float;

varying vec2 uvs;

void main() {
    vec2 normal_uvs = uvs*0.5 + 0.5;
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`