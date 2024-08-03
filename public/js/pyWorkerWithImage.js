function processPythonCode(pythonCode) {
    const replacementCode = `
buf = io.BytesIO()
plt.savefig(buf, format='png')
buf.seek(0)
image_base64 = base64.b64encode(buf.read()).decode('utf-8')
buf.close()
pyOdidideImageOutput(image_base64)
`;
    pythonCode = pythonCode.replace(/plt.show\(\)/gm, replacementCode);

    return pythonCode;
}

function printOutput(s) {
    postMessage({type: 'OUTPUT', message: s});
}

function pyOdidideImageOutput(s) {
    postMessage({type: 'IMAGE_OUTPUT', message: s});
}

async function init() {
    if (!self.pyodide) {
        // Load Pyodide
        importScripts('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js');
        self.pyodide = await loadPyodide();
    }

    // Load packages
    await self.pyodide.loadPackage(['pandas','matplotlib']);

    postMessage({type: "INFO", message: 'PYTHON_LOADED'});

    // Listen for messages from the main thread
    self.addEventListener('message', async (event) => {
        let { jsonData, pythonCode } = event.data;

        // process the python code
        pythonCode = processPythonCode(pythonCode);

        try {
            // Run Python code
            let pyData = self.pyodide.toPy(jsonData);
            self.pyodide.globals.set('pyData', pyData);
            self.pyodide.globals.set('printOutput', printOutput);
            self.pyodide.globals.set('pyOdidideImageOutput', pyOdidideImageOutput);
            postMessage({type: 'DONE', message: 'FALSE'});

            self.pyodide.runPython(`
                import io
                import base64
                import js
                import sys
                from js import printOutput, pyOdidideImageOutput

                class Dud:
                    def __init__(self, *args, **kwargs) -> None:
                        return

                    def __getattr__(self, __name: str):
                        return Dud

                js.document = Dud()
                
                class JsOutput:
                    def write(self, s):
                        printOutput(s)
                    def flush(self):
                        pass

                sys.stdout = JsOutput()
                sys.stderr = JsOutput()
            `);

            console.log('Running Python code...');
            console.log(pythonCode);
            
            await self.pyodide.runPythonAsync(pythonCode);
            postMessage({type: 'DONE', message: 'TRUE'});

            // Free memory
            pyData.destroy();

        } catch (error) {
            // Handle errors and send back to main thread
            postMessage({type: 'ERROR', message: error.message});
        }
    });
}

init().catch(error => postMessage({type: 'ERROR', message: 'Failed to initialize: ' + error.message}));