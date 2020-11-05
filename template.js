var blob = atob('${BLOB}');

var memory = new WebAssembly.Memory({initial:2});

var HEAP8 = new Int8Array(memory.buffer);
var HEAPU8 = new Uint8Array(memory.buffer);
var HEAP16 = new Int16Array(memory.buffer);
var HEAPU16 = new Uint16Array(memory.buffer);
var HEAP32 = new Uint32Array(memory.buffer);
var HEAPU32 = new Uint32Array(memory.buffer);
var HEAPF32 = new Float32Array(memory.buffer);
var HEAPF64 = new Float64Array(memory.buffer);

let dec = new TextDecoder( "utf-8" );
function cstos(ptr, len) {
	return dec.decode(HEAPU8.subarray(ptr, ptr+len));
}

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

let wasmExports;
const DATA_ADDR = 16; // Where the unwind/rewind data structure will live.
let sleeping = false;

const obj = {
	env: {
		draw_line: (x1, y1, x2, y2) => {
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
		},
		clear: () => {
			ctx.clearRect(0, 0, 200, 200);
		},
		sleep: (ms) => {
			if (!sleeping) {
				// We are called in order to start a sleep/unwind.
				console.log('sleep...');
				// Fill in the data structure. The first value has the stack location,
				// which for simplicity we can start right after the data structure itself.
				HEAP32[DATA_ADDR >> 2] = DATA_ADDR + 8;
				// The end of the stack will not be reached here anyhow.
				HEAP32[DATA_ADDR + 4 >> 2] = 1024;
				wasmExports.asyncify_start_unwind(DATA_ADDR);
				sleeping = true;
				// Resume after the proper delay.
				setTimeout(function() {
					wasmExports.asyncify_start_rewind(DATA_ADDR);
					// The code is now ready to rewind; to start the process, enter the
					// first function that should be on the call stack.
					wasmExports.main();
				}, ms);
			} else {
				// We are called as part of a resume/rewind. Stop sleeping.
				wasmExports.asyncify_stop_rewind();
				sleeping = false;
			}
		},
		memory: memory,
		print: console.log,
		draw: () => {},
		printc: (str, len) => { console.log(utf8decoder.decode(HEAPU8.subarray(str, str+len))) },
	}
};
(async () => {
	const fetchPromise = fetch('main.wasm');
	let {instance} = await WebAssembly.instantiateStreaming(fetchPromise, obj);
	
	wasmExports = instance.exports;
	console.log(instance);
	instance.exports.main();

	/*const arr = [1, 2, 3, 4, 5];
	const ptr = instance.exports.malloc(arr.length * 4);
	HEAPU8[ptr] = 0xff;
	HEAPU32[ptr / 4] = 0xff;
	const cArray = new Uint32Array(
	memory.buffer,
		cArrayPointer,
		jsArray.length
	);
	
	//HEAP.set(arr);
	console.log(ptr);
	console.log(instance.exports.sum(ptr, arr.length));
	console.log(HEAPU8);*/
})();
