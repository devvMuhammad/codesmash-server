import { type Request, type Response } from 'express';
import { Problem } from '../models/Problem';
import { executeCode } from '../services/judge0Service';
import {
  type SubmitCodeRequest,
  type SubmitCodeResponse,
  type TestResult,
  type SupportedLanguage,
  type RunCodeRequest,
  type RunCodeResponse,
  type SampleTestResult,
  Judge0StatusId
} from '../types/problem';
import mongoose from 'mongoose';
import { LANGUAGE_IDS } from '../config/game';

/**
 * Submit code for a problem
 * POST /problems/:problemId/submit
 */
export const submitCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { problemId } = req.params;
    const { code, language }: SubmitCodeRequest = req.body;

    // Validate inputs
    if (!problemId || !code || !language) {
      res.status(400).json({ error: 'Missing required fields: problemId, code, language, userId' });
      return;
    }

    // Validate if problemId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      res.status(400).json({ error: 'Invalid problem ID format' });
      return;
    }

    // Validate language
    if (!LANGUAGE_IDS[language as SupportedLanguage]) {
      res.status(400).json({ error: `Unsupported language: ${language}` });
      return;
    }

    // Fetch problem from database
    const problem = await Problem.findById(problemId).lean();
    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    // Get language ID for Judge0
    const languageId = LANGUAGE_IDS[language as SupportedLanguage];

    // Execute code with Judge0
    const judge0Result = await executeCode(code, languageId, problem.testCases);

    // Check Judge0 status for errors
    const statusId = judge0Result.status.id;
    const statusDescription = judge0Result.status.description;

    // Handle Compilation Error
    if (statusId === Judge0StatusId.COMPILATION_ERROR) {
      const response: SubmitCodeResponse = {
        success: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        executionTime: judge0Result.time || "0",
        memory: judge0Result.memory || 0,
        testResults: [],
        allTestsPassed: false,
        compileError: judge0Result.compile_output || judge0Result.message || "Compilation failed",
        statusDescription
      };
      res.status(200).json(response);
      return;
    }

    // Handle Runtime Errors (status codes 7-12)
    if (statusId >= Judge0StatusId.RUNTIME_ERROR_SIGSEGV && statusId <= Judge0StatusId.RUNTIME_ERROR_OTHER) {
      const response: SubmitCodeResponse = {
        success: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        executionTime: judge0Result.time || "0",
        memory: judge0Result.memory || 0,
        testResults: [],
        allTestsPassed: false,
        runtimeError: judge0Result.stderr || judge0Result.message || "Runtime error occurred",
        statusDescription
      };
      res.status(200).json(response);
      return;
    }

    // Handle Time Limit Exceeded
    if (statusId === Judge0StatusId.TIME_LIMIT_EXCEEDED) {
      const response: SubmitCodeResponse = {
        success: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        executionTime: judge0Result.time || "0",
        memory: judge0Result.memory || 0,
        testResults: [],
        allTestsPassed: false,
        runtimeError: "Your solution exceeded the time limit",
        statusDescription
      };
      res.status(200).json(response);
      return;
    }

    // Handle Internal Error or Exec Format Error
    if (statusId === Judge0StatusId.INTERNAL_ERROR || statusId === Judge0StatusId.EXEC_FORMAT_ERROR) {
      const response: SubmitCodeResponse = {
        success: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        executionTime: judge0Result.time || "0",
        memory: judge0Result.memory || 0,
        testResults: [],
        allTestsPassed: false,
        runtimeError: judge0Result.message || "System error occurred",
        statusDescription
      };
      res.status(200).json(response);
      return;
    }

    // Process test results for ACCEPTED or WRONG_ANSWER status
    const actualOutput = judge0Result.stdout?.trim() || "";
    const expectedOutput = problem.correctOutput.trim();

    const actualLines = actualOutput.split('\n').map(line => line.trim());
    const expectedLines = expectedOutput.split('\n').map(line => line.trim());

    // Generate test results
    const testResults: TestResult[] = [];
    const totalTests = expectedLines.length;
    let passedTests = 0;

    for (let i = 0; i < totalTests; i++) {
      const actual = actualLines[i] || '';
      const expected = expectedLines[i] || '';
      const passed = actual === expected;

      if (passed) {
        passedTests++;
      }

      testResults.push({
        testCase: i + 1,
        input: `Test case ${i + 1}`, // Could be enhanced to show actual input
        expected: expected,
        actual: actual,
        status: passed ? 'PASS' : 'FAIL'
      });
    }

    const failedTests = totalTests - passedTests;
    const allTestsPassed = passedTests === totalTests;

    const response: SubmitCodeResponse = {
      success: allTestsPassed,
      totalTests,
      passedTests,
      failedTests,
      executionTime: judge0Result.time,
      memory: judge0Result.memory,
      testResults,
      allTestsPassed,
      statusDescription
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error submitting code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Run code with sample test cases only (for testing/debugging)
 * POST /problems/:problemId/run
 */
export const runCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { problemId } = req.params;
    const { code, language }: RunCodeRequest = req.body;

    // Validate inputs
    if (!problemId || !code || !language) {
      res.status(400).json({ error: 'Missing required fields: problemId, code, language' });
      return;
    }

    // Validate if problemId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      res.status(400).json({ error: 'Invalid problem ID format' });
      return;
    }

    // Validate language
    if (!LANGUAGE_IDS[language as SupportedLanguage]) {
      res.status(400).json({ error: `Unsupported language: ${language}` });
      return;
    }

    // Fetch problem from database
    const problem = await Problem.findById(problemId).lean();
    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    // Get language ID for Judge0
    const languageId = LANGUAGE_IDS[language as SupportedLanguage];

    // Execute code with Judge0 using SAMPLE test cases
    const judge0Result = await executeCode(code, languageId, problem.sampleTestCases);

    // Check Judge0 status for errors
    const statusId = judge0Result.status.id;
    const statusDescription = judge0Result.status.description;

    // Handle Compilation Error
    if (statusId === Judge0StatusId.COMPILATION_ERROR) {
      const response: RunCodeResponse = {
        success: false,
        stdout: "",
        sampleTestResults: [],
        executionTime: judge0Result.time || "0",
        memory: judge0Result.memory || 0,
        compileError: judge0Result.compile_output || judge0Result.message || "Compilation failed",
        statusDescription
      };
      res.status(200).json(response);
      return;
    }

    // Handle Runtime Errors (status codes 7-12)
    if (statusId >= Judge0StatusId.RUNTIME_ERROR_SIGSEGV && statusId <= Judge0StatusId.RUNTIME_ERROR_OTHER) {
      const response: RunCodeResponse = {
        success: false,
        stdout: judge0Result.stdout?.trim() || "",
        sampleTestResults: [],
        executionTime: judge0Result.time || "0",
        memory: judge0Result.memory || 0,
        runtimeError: judge0Result.stderr || judge0Result.message || "Runtime error occurred",
        statusDescription
      };
      res.status(200).json(response);
      return;
    }

    // Handle Time Limit Exceeded
    if (statusId === Judge0StatusId.TIME_LIMIT_EXCEEDED) {
      const response: RunCodeResponse = {
        success: false,
        stdout: judge0Result.stdout?.trim() || "",
        sampleTestResults: [],
        executionTime: judge0Result.time || "0",
        memory: judge0Result.memory || 0,
        runtimeError: "Your solution exceeded the time limit",
        statusDescription
      };
      res.status(200).json(response);
      return;
    }

    // Handle Internal Error or Exec Format Error
    if (statusId === Judge0StatusId.INTERNAL_ERROR || statusId === Judge0StatusId.EXEC_FORMAT_ERROR) {
      const response: RunCodeResponse = {
        success: false,
        stdout: judge0Result.stdout?.trim() || "",
        sampleTestResults: [],
        executionTime: judge0Result.time || "0",
        memory: judge0Result.memory || 0,
        runtimeError: judge0Result.message || "System error occurred",
        statusDescription
      };
      res.status(200).json(response);
      return;
    }

    // Process sample test results for ACCEPTED or WRONG_ANSWER status
    const actualOutput = judge0Result.stdout?.trim() || "";
    const expectedOutput = problem.sampleTestCasesOutput.trim();

    const actualLines = actualOutput.split('\n').map(line => line.trim());
    const expectedLines = expectedOutput.split('\n').map(line => line.trim());

    // Generate sample test results with line-by-line comparison
    const sampleTestResults: SampleTestResult[] = [];
    const totalSampleTests = expectedLines.length;
    let passedSampleTests = 0;

    for (let i = 0; i < totalSampleTests; i++) {
      const actual = actualLines[i] || '';
      const expected = expectedLines[i] || '';
      const passed = actual === expected;

      if (passed) {
        passedSampleTests++;
      }

      sampleTestResults.push({
        testCase: i + 1,
        input: `Sample test case ${i + 1}`,
        expectedOutput: expected,
        actualOutput: actual,
        passed: passed
      });
    }

    const allSampleTestsPassed = passedSampleTests === totalSampleTests;

    const response: RunCodeResponse = {
      success: allSampleTestsPassed,
      stdout: actualOutput,
      sampleTestResults,
      executionTime: judge0Result.time,
      memory: judge0Result.memory
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error running code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};