// User's function with runtime error
function twoSum(nums, target) {
    // This will cause an error - trying to call undefined function
    return someUndefinedFunction(nums, target);
}

const testCases = [
    {
        input: { nums: [2, 7, 11, 15], target: 9 },
        expected: [0, 1],
        description: "Basic case: [2,7,11,15], target 9"
    }
];

function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort((x, y) => x - y);
    const sortedB = [...b].sort((x, y) => x - y);
    return sortedA.every((val, idx) => val === sortedB[idx]);
}

const results = [];
testCases.forEach((testCase, index) => {
    try {
        const result = twoSum(testCase.input.nums, testCase.input.target);
        const passed = arraysEqual(result, testCase.expected);

        results.push({
            testCase: index + 1,
            description: testCase.description,
            input: testCase.input,
            expected: testCase.expected,
            actual: result,
            status: passed ? "PASS" : "FAIL"
        });
    } catch (error) {
        results.push({
            testCase: index + 1,
            description: testCase.description,
            input: testCase.input,
            expected: testCase.expected,
            actual: null,
            status: "ERROR",
            error: error.message
        });
    }
});

console.log("=== TEST_RESULTS_START ===");
console.log(JSON.stringify(results, null, 2));
console.log("=== TEST_RESULTS_END ===");