function hexToRGBVec(color) {
    const r = Number(`0x${color[1]}${color[2]}`) / 255
    const g = Number(`0x${color[3]}${color[4]}`) / 255
    const b = Number(`0x${color[5]}${color[6]}`) / 255

    return [r, g, b]
}

function V2(x, y) {
    return {x, y}
}

function segment(a, b) {
    return {a, b}
}

function rectOfSegments(x, y, width, height) {
    return [
        segment(V2(x, y), V2(x + width, y)),
        segment(V2(x + width, y), V2(x + width, y + height)),
        segment(V2(x + width, y + height), V2(x, y + height)),
        segment(V2(x, y + height), V2(x, y)),
    ]
}

const segments = [
    ...rectOfSegments(20, 20, 50, 50),
    ...rectOfSegments(80, 30, 50, 50),
    ...rectOfSegments(280, 80, 50, 50),
    ...rectOfSegments(240, 200, 50, 50),
    ...rectOfSegments(280, 300, 50, 50),
    ...rectOfSegments(680, 300, 50, 50),
    ...rectOfSegments(680, 400, 50, 50),
    ...rectOfSegments(680, 500, 50, 50),
    ...rectOfSegments(380, 300, 200, 50),
]

const segmentsMesh = segments.flatMap( s => (
    [
        s.a.x, s.a.y, 0.0,
        s.a.x, s.a.y, 1.0,
        s.b.x, s.b.y, 1.0,

        s.a.x, s.a.y, 0.0,
        s.b.x, s.b.y, 0.0,
        s.b.x, s.b.y, 1.0,
    ]
) )

function resizeCanvasToDisplaySize(canvas, multiplier) {
	multiplier = multiplier || 1;
	const width = canvas.clientWidth * multiplier | 0;
	const height = canvas.clientHeight * multiplier | 0;
	if (canvas.width !== width || canvas.height !== height) {
		canvas.width = width;
		canvas.height = height;
		return true;
	}
	return false;
}

let canvas = document.getElementById("drawbox")

let gl = canvas.getContext("webgl", {
    premultipliedAlpha: false,
})
if (!gl) {
	console.log("no wegbl")
}

function createShader(gl, type, source) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}

	console.log(gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
}

let vertexShaderSource = vert
let fragmentShaderSource = frag

let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

let lightFragmentShaderSource = lightMaskFrag
let lightVertexShaderSource = lightMaskVert
let lightVertexShader = createShader(gl, gl.VERTEX_SHADER, lightVertexShaderSource);
let lightFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, lightFragmentShaderSource);

function createProgram(gl, vertexShader, fragmentShader) {
	let program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	let success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}

	console.log(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}

let program = createProgram(gl, vertexShader, fragmentShader);

let positionAttributeLocation = gl.getAttribLocation(program, "vertex");
let positionBuffer = gl.createBuffer();

let lightMask = createProgram(gl, lightVertexShader, lightFragmentShader);

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

resizeCanvasToDisplaySize(gl.canvas);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

let light_x = 0
let light_y = 0

function drawRect() {

}

let input = {
	left: false,
	right: false,
	up: false,
	down: false,
}

function handleKeyDown(keyEvent) {
	switch(keyEvent.key) {
		case "ArrowLeft": {
			input.left = true
			break;
		}
		case "ArrowRight": {
			input.right = true
			break;
		}
		case "ArrowUp": {
			input.up = true
			break;
		}
		case "ArrowDown": {
			input.down = true
			break;
		}
	}
}

function handleKeyUp(keyEvent) {
	switch(keyEvent.key) {
		case "ArrowLeft": {
			input.left = false
			break;
		}
		case "ArrowRight": {
			input.right = false
			break;
		}
		case "ArrowUp": {
			input.up = false
			break;
		}
		case "ArrowDown": {
			input.down = false
			break;
		}
	}
}

function updateLightPos() {
    const v = 4.0
	light_x = input.left  ? light_x - v : light_x
	light_x = input.right ? light_x + v : light_x
	light_y = input.up    ? light_y + v : light_y
	light_y = input.down  ? light_y - v : light_y
}

document.addEventListener("keydown", handleKeyDown)
document.addEventListener("keyup", handleKeyUp)

function render() {
	updateLightPos()

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(segmentsMesh), gl.STATIC_DRAW);

	// Clear the canvas
	gl.clearColor(1, 1, 1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Tell it to use our program (pair of shaders)
	gl.useProgram(program);

	const baseResolution = gl.getUniformLocation(program, "baseResolution");
	gl.uniform2fv(baseResolution, new Float32Array([800, 800]));

	let light = gl.getUniformLocation(program, "light");
	gl.uniform2fv(light, new Float32Array([light_x, light_y]));

	gl.enableVertexAttribArray(positionAttributeLocation);

	// Bind the position buffer. good practice I supose
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	
	// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
	let size = 3;          // 2 components per iteration
	let type = gl.FLOAT;   // the data is 32bit floats
	let normalize = false; // don't normalize the data
	let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
	let offset = 0;        // start at the beginning of the buffer
	gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)

	let primitiveType = gl.TRIANGLES;
	offset = 0;
	let count = Math.floor(segmentsMesh.length / 3);
	gl.drawArrays(primitiveType, offset, count);

    // draw light mask
    const screenQuad = [
        -1, -1,
        -1, 1,
        1, 1,

        1, 1,
        1, -1,
        -1, -1,
    ]


    // pass new triangles
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(screenQuad), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
	size = 2;          // 2 components per iteration
	type = gl.FLOAT;   // the data is 32bit floats
	normalize = false; // don't normalize the data
	stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
	offset = 0;        // start at the beginning of the buffer

    gl.enable(gl.BLEND)
    gl.blendEquation(gl.FUNC_ADD)
    gl.blendFunc(gl.DST_COLOR, gl.ZERO)

	gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)
	gl.useProgram(lightMask);
	light = gl.getUniformLocation(lightMask, "light");
	gl.uniform2fv(light, new Float32Array([light_x, light_y]));

    const selectedColor = document.getElementById("light-color").value
	let lightColor = gl.getUniformLocation(lightMask, "light_color");
	gl.uniform3fv(lightColor, new Float32Array(hexToRGBVec(selectedColor)));

	primitiveType = gl.TRIANGLES;
	offset = 0;
	count = 6;
	gl.drawArrays(primitiveType, offset, count);

    gl.disable(gl.BLEND)

	window.requestAnimationFrame(render)
}

window.requestAnimationFrame(render)