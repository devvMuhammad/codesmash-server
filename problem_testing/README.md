# Judge0 Test Harness Results

This directory contains the inputs and outputs for testing the Judge0 test harness approach for CodeSmash.

## Files:

### Input Files (JavaScript Code):
- `1_passing_case.js` - Correct Two Sum implementation with all test cases passing
- `2_failing_case.js` - Incorrect implementation that always returns [0, 0]
- `3_error_case.js` - Implementation with runtime error (undefined function)

### Output Files (Judge0 API Responses):
- `1_passing_output.json` - API response for passing case
- `2_failing_output.json` - API response for failing case
- `3_error_output.json` - API response for error case

## Key Findings:

✅ **Single Request**: One Judge0 call handles multiple test cases efficiently
✅ **Structured Output**: Clean JSON results between markers for easy parsing
✅ **Error Handling**: Runtime errors caught and reported per test case
✅ **Fast Performance**: Sub-25ms execution time for all scenarios

## Usage Pattern:

1. User submits function implementation
2. Backend generates test harness with all test cases
3. Single Judge0 API call with language_id: 63 (JavaScript)
4. Parse stdout between `=== TEST_RESULTS_START ===` markers
5. Broadcast results to both players via WebSocket

This approach is production-ready and much more efficient than one-request-per-test-case!