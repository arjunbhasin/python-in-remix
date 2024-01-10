import { useEffect, useRef } from "react";

/*
    Source: https://matplotlib.org/stable/tutorials/artists.html#sphx-glr-tutorials-artists-py
*/

const pythonCode = `
import matplotlib.pyplot as plt
import numpy as np

fig = plt.figure()
fig.subplots_adjust(top=0.8)
ax1 = fig.add_subplot(211)
ax1.set_ylabel('Voltage [V]')
ax1.set_title('A sine wave')

t = np.arange(0.0, 1.0, 0.01)
s = np.sin(2*np.pi*t)
line, = ax1.plot(t, s, color='blue', lw=2)

# Fixing random state for reproducibility
np.random.seed(19680801)

ax2 = fig.add_axes([0.15, 0.1, 0.7, 0.3])
n, bins, patches = ax2.hist(np.random.randn(1000), 50, facecolor='yellow', edgecolor='yellow')
ax2.set_xlabel('Time [s]')

plt.show()
`;

export default function MatplotlibExample() {
    const chartRef = useRef(null);
    const isChartRendered = useRef(false);

    useEffect(() => {
        (async () => {
            // only run once
            if(!isChartRendered.current){

                isChartRendered.current = true;
                
                // load pyodide and required packages
                let pyodide = await loadPyodide();
                // required for matplotlib to render in 'target' div
                document.pyodideMplTarget = chartRef.current;

                await pyodide.loadPackage('pandas');
                await pyodide.loadPackage('matplotlib');
                
                // run python code
                pyodide.runPython(pythonCode);
            }
        })();
        
        // cleanup
        return () => {};
    }, []);

    return (
        <div>
            <h1>Matplotlib Example</h1>
            <div ref={chartRef} id="target" />
        </div>
    );
}