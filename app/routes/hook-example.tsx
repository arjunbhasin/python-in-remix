import { useState } from 'react';
import usePythonRuntime from '~/hooks/usePyodide';

export default function WebWorkerExample() {
    const [output, setOutput] = useState('');
    const { result, loading, error, executePython } = usePythonRuntime();

    const runPythonCode = () => {
        const pythonCode = `
import numpy as np

result = np.sin(np.pi / 2)
print(f"sin(π/2) = {result}")
    `;

        executePython({}, pythonCode);
    };

    return (
        <div>
            <h1>Pyodide Web Worker Example</h1>
            <button onClick={runPythonCode} disabled={loading}>
                Compute sin(π/2)
            </button>
            {loading && <p>Loading...</p>}
            {error && <p>Error: {error}</p>}
            {result && (
                <div>
                    <h2>Result:</h2>
                    <pre>{result}</pre>
                </div>
            )}
        </div>
    );
}