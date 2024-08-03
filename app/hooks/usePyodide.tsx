import { useEffect, useRef, useState } from "react";

export default function usePyodide() {
    // State to store the result of Python execution
    const [result, setResult] = useState<string>("");
    // State to track if Python is loading
    const [loading, setLoading] = useState(true);
    // State to store any errors that occur
    const [error, setError] = useState<any>(null);
    // State to store raw image data (if any) produced by Python code
    const [imageRawData, setImageRawData] = useState<string>("");

    // Ref to hold the Web Worker instance
    const pythonWorker = useRef<Worker>();

    useEffect(() => {
        (async () => {
            // Initialize the Web Worker
            // @ts-ignore
            pythonWorker.current = new Worker(new URL("/js/pyodideWorker.js", import.meta.url));
            
            // Set up message handler for the Web Worker
            pythonWorker.current.onmessage = (event: any) => {
                console.log(event.data);
                let {type, message} = event.data;
                
                // Handle different message types from the worker
                if(type == "INFO" && message == "PYTHON_LOADED") {
                    // Python environment is fully loaded
                    console.info("Python Loaded");
                    setLoading(false);
                    setError(null);
                }
                else if (type == "OUTPUT") {
                    // Append text output from Python
                    setResult((r:string) => r + message);
                    setLoading(false);
                    setError(null);
                }
                else if (type == "IMAGE_OUTPUT") {
                    // Append image data from Python
                    setImageRawData((r:string) => r + message);
                }
                else if (type == "DONE" && message == "TRUE") {
                    // Python code execution completed successfully
                    setLoading(false);
                    setError(null);
                }
                else if (type == "DONE" && message == "FALSE") {
                    // Python code execution started
                    setLoading(false);
                    setError(null);
                }
                else if (type == "ERROR") {
                    // Handle any errors during execution
                    setError(message);
                    setLoading(false);
                }
                else {
                    // Log any unhandled messages
                    console.error(message);
                }
            }
        })();

        // Cleanup function to terminate the worker when the component unmounts
        return () => {
            if (pythonWorker.current) {
                pythonWorker.current.terminate();
            }
        };
    }, []);

    // Function to execute Python code
    const executePython = (
        jsonData: any,
        pythonCode: string
    ) => {
        if(!loading){
            console.log("Running Python");
            // Reset result and imageRawData before new execution
            setResult("");
            setImageRawData("");
            // Send data and code to the worker for execution
            pythonWorker?.current?.postMessage({
                jsonData,
                pythonCode,
            });
        }
        else {
            console.error("Python not loaded or still loading");
            setResult("");
            setImageRawData("");
            setError("Python not loaded or still loading");
        }
    }

    // Return the hook's interface
    return { result, loading, error, executePython, imageRawData };
}