// Function to send the output to the main thread
function printOutput(s) {
    postMessage({type: 'OUTPUT', message: s});
}

// Function to initialize the worker
async function init() {
    // Check if Pyodide is already loaded
    if (!self.pyodide) {
        // Load Pyodide script
        importScripts('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js');
        // Initialize Pyodide
        self.pyodide = await loadPyodide();
    }

    // Load required Python packages
    await self.pyodide.loadPackage(['pandas', 'matplotlib']);

    // Notify the main thread that Python is loaded
    postMessage({type: "INFO", message: 'PYTHON_LOADED'});

    // Set up event listener for messages from the main thread
    self.addEventListener('message', async (event) => {
        let { jsonData, pythonCode } = event.data;

        try {
            // Convert JSON data to Python object
            let pyData = self.pyodide.toPy(jsonData);
            
            // Set global variables for use in Python code
            self.pyodide.globals.set('pyData', pyData);
            self.pyodide.globals.set('printOutput', printOutput);
            
            // Notify main thread that execution is starting
            postMessage({type: 'DONE', message: 'FALSE'});
            
            // Set up Python environment with custom stdout/stderr and dummy document object
            self.pyodide.runPython(`
                import io
                import js
                import sys
                from js import printOutput

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
            
            // Log the Python code being executed
            console.log('Running Python code...');
            console.log(pythonCode);
            
            // Execute the Python code
            await self.pyodide.runPythonAsync(pythonCode);
            
            // Notify main thread that execution is complete
            postMessage({type: 'DONE', message: 'TRUE'});

            // Clean up memory
            pyData.destroy();

        } catch (error) {
            // Handle and report any errors to the main thread
            postMessage({type: 'ERROR', message: error.message});
        }
    });
}

// Initialize the worker and handle any initialization errors
init().catch(error => postMessage({type: 'ERROR', message: 'Failed to initialize: ' + error.message}));