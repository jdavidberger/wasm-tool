main.wasm: main.c
	clang main.c -nostdlib --target=wasm32 \
		-flto \
		-Wl,--lto-O3 \
		-Wl,--no-entry \
		-Wl,--export-all \
		-Wl,--allow-undefined \
		-Wl,--import-memory \
		-Wl,--strip-all \
		-o main.wasm
	wasm-opt --asyncify -Oz main.wasm -o main.wasm
	sh -c 'export BLOB=$$(cat main.wasm | base64 -w 0); envsubst < template.js > opt.js'
	uglifyjs opt.js -o opt.js

clean:
	rm main.wa*
