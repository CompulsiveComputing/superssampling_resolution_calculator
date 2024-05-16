importScripts('bigfraction.js');

self.onmessage = function(event) {
    const workload = event.data;
    const {
        operationName,
        floatOpStr,
        fractionOpStr,
        arrayA,
        arrayB,
        fractionsA,
        fractionsB,
        targetTime,
        confidenceLevel,
        sensitivity,
        iterations
    } = workload;

    const floatOp = new Function('return ' + floatOpStr)();
    const fractionOp = new Function('return ' + fractionOpStr)();

    function benchmarkOperation(operation, arrayA, arrayB, resultArray, iterations) {
        const times = [];
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            for (let j = 0; j < arrayA.length; j++) {
                resultArray[j] = operation(arrayA[j], arrayB[j]);
            }
            const end = performance.now();
            times.push(end - start);
        }
        return times;
    }

    function calculateStatistics(times) {
        const mean = times.reduce((a, b) => a + b, 0) / times.length;
        const variance = times.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / times.length;
        const stdDev = Math.sqrt(variance);
        return { mean, stdDev };
    }

    function calculateConfidenceInterval(mean, stdDev, confidenceLevel, n) {
        const z = 1.96; // for 95% confidence
        const marginOfError = z * (stdDev / Math.sqrt(n));
        return { lower: mean - marginOfError, upper: mean + marginOfError };
    }

    function binarySearchOptimalOperations(benchmarkFunction, arrayA, arrayB, resultArray, targetTime, confidenceLevel, sensitivity, iterations) {
        let low = 100;
        let high = Math.max(arrayA.length, 1000);
        let bestCount = 0;

        while ((high - low) > sensitivity) {
            const mid = Math.floor((low + high) / 2);
            const times = benchmarkFunction(arrayA.slice(0, mid), arrayB.slice(0, mid), resultArray, iterations);
            const { mean, stdDev } = calculateStatistics(times);
            const { lower, upper } = calculateConfidenceInterval(mean, stdDev, confidenceLevel, iterations);

            if (upper < targetTime) {
                bestCount = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        return bestCount;
    }

    const floatResultArray = new Array(arrayA.length);
    const fractionResultArray = new Array(arrayA.length);

    const numOperationsFloat = binarySearchOptimalOperations(
        (a, b, r, iters) => benchmarkOperation(floatOp, a, b, r, iters),
        arrayA, arrayB, floatResultArray, targetTime, confidenceLevel, sensitivity, iterations
    );

    const numOperationsFraction = binarySearchOptimalOperations(
        (a, b, r, iters) => benchmarkOperation(fractionOp, a, b, r, iters),
        fractionsA, fractionsB, fractionResultArray, targetTime, confidenceLevel, sensitivity, iterations
    );

    self.postMessage({
        operationName,
        numOperationsFloat,
        numOperationsFraction
    });
};
