import { useEffect, useState } from "react";

// Some data in JS (must be JSON)
const dataInJs = [
  { id: 1, name: 'Jhon Doe', age: 25, email: 'jhon@email.com' },
  { id: 2, name: 'Jane Doe', age: 24, email: 'jane@email.com' },
];

const pythonCode = `
import pandas as pd
df = pd.DataFrame(data_from_js)

print(df['age'].mean()) # prints to console

df['age'].mean() # returning this value
`;

export default function Index() {
  const [ result, setResult ] = useState('');

  // Note: useEffect runs twice in development mode
  useEffect(() => {
    (async () => {
      // load pyodide and required packages
      let pyodide = await loadPyodide();

      // convert data from JS to Python
      let dataFromJs = pyodide.toPy(dataInJs)
      // pass the data from JS to Python
      pyodide.globals.set('data_from_js', dataFromJs);
      // load pandas package
      await pyodide.loadPackage('pandas');
      // run python code and get the result
      let resultFromPython = pyodide.runPython(pythonCode);
      // set the result to the state
      setResult(resultFromPython);
    })();
    
    // cleanup
    return () => {};
}, []);


  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1" }}>
      <h4>Data in JS</h4>
      <pre>{JSON.stringify(dataInJs, null, 2)}</pre>

      <h4>Python Code</h4>
      <pre>{pythonCode}</pre>

      <h4>Output</h4>
      <pre id="output" />
      <pre>{result}</pre>
    </div>
  );
}
