import { type Request, type Response } from 'express';
import { Problem } from '../models/Problem';
import { executeCode } from '../services/judge0Service';
import {
  type SubmitCodeRequest,
  type SubmitCodeResponse,
  type TestResult,
  type SupportedLanguage
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
    // Compare output line by line
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
      success: true,
      totalTests,
      passedTests,
      failedTests,
      executionTime: judge0Result.time,
      memory: judge0Result.memory,
      testResults,
      allTestsPassed
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error submitting code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};