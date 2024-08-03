import { useState, useEffect } from 'react';

export default function WebWorkerExample() {
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPythonLoaded, setIsPythonLoaded] = useState(false);

    useEffect(() => {
        const worker = new Worker('/js/pyodideWorker.js');

        const runPythonCode = () => {
            setResult(null);
            setError(null);

            const pythonCode = `
import numpy as np

result = np.sin(np.pi / 2)
print(f"sin(π/2) = {result}")
      `;

            worker.postMessage({ pythonCode, jsonData: {} });
        };

        worker.onmessage = (event) => {
            const { type, message } = event.data;
            switch (type) {
                case 'INFO':
                    if (message === 'PYTHON_LOADED') {
                        setIsPythonLoaded(true);
                        setIsLoading(false);
                        runPythonCode();
                    }
                    break;
                case 'OUTPUT':
                    setResult(prevResult => (prevResult ? prevResult + '\n' : '') + message);
                    break;
                case 'ERROR':
                    setError(message);
                    setIsLoading(false);
                    break;
                case 'DONE':
                    if (message === 'TRUE') {
                        setIsLoading(false);
                    }
                    break;
            }
        };

        return () => {
            worker.terminate();
        };
    }, []);

    return (
        <div>
            <h1>Web Worker Python Example</h1>
            <h2>Calculating sin(π/2) using NumPy</h2>
            {isLoading && <p>Loading Python environment...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {isPythonLoaded && !result && !error && <p>Executing Python code...</p>}
            {result && (
                <pre style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
                    {result}
                </pre>
            )}
        </div>
    );
}