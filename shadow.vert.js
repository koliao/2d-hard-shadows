const vert = `
attribute vec4 vertex;
uniform vec2 baseResolution;
uniform vec2 light;
varying vec2 uvs;

void main() {
    vec2 clip_coords = ((vertex.xy / baseResolution) - 0.5) * 2.0;
    vec2 light_clip_coords = ((light / baseResolution) - 0.5) * 2.0;
    uvs = clip_coords.xy;
    gl_Position = vec4(clip_coords - light_clip_coords*vertex.z, 0.0, 1.0 - vertex.z);
}
`