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
import { Game } from '../models/Game';
import { getUserRoleInGame } from '../utils/gameHelpers';
import { io } from '../../index';
import { gameTimerService } from '../services/gameTimerQueue';
import { GameStatus, GameResultReason } from '../types/game';
import { auraService } from '../services/auraService';

/**
 * Handle test progress update and game completion
 * Internal helper function for submitCode
 */
const handleTestProgressUpdate = async (
  gameId: string,
  userId: string,
  passedTests: number,
  totalTests: number
): Promise<void> => {
  try {
    // Securely get user role from database
    const role = await getUserRoleInGame(gameId, userId);

    if (!role || role === 'spectator') {
      console.log(`User ${userId} is not a valid participant in game ${gameId}`);
      return;
    }

    const game = await Game.findById(gameId);
    if (!game) {
      console.log(`Game ${gameId} not found`);
      return;
    }

    const field = role === 'host' ? 'hostTestsPassed' : 'challengerTestsPassed';
    const previousPassed = game[field];

    // Only update if improved
    if (passedTests <= previousPassed) {
      console.log(`No improvement for ${role} in game ${gameId}: ${passedTests} <= ${previousPassed}`);
      return;
    }

    // Update the test progress
    game[field] = passedTests;
    await game.save();

    const allTestsPassed = passedTests === totalTests;
    console.log(`User ${userId} (${role}) improved test progress in game ${gameId}: ${previousPassed} → ${passedTests}/${totalTests}`);

    // Award AURA for newly passed tests
    const newlyPassedTests = passedTests - previousPassed;
    await auraService.handleTestProgress(userId, newlyPassedTests);

    // If all tests passed, end the game
    if (allTestsPassed) {
      await gameTimerService.clearTimer(gameId);

      const result = {
        reason: GameResultReason.COMPLETED,
        winner: userId,
        message: `${role === 'host' ? 'Host' : 'Challenger'} solved the problem!`
      };

      game.status = GameStatus.COMPLETED;
      game.result = result;
      game.completedAt = new Date();
      await game.save();

      // Award AURA for match completion (winner/loser)
      const opponentId = role === 'host' ? game.challenger?.toString() : game.host.toString();
      if (opponentId) {
        await auraService.handleMatchCompletion(
          userId,        // Winner (solved all tests)
          opponentId,    // Loser (opponent)
          'Full solution'
        );
      }

      // Emit game finished to both players
      io.to(gameId).emit('game_finished', {
        result,
        gameStatus: 'completed'
      });

      console.log(`Game ${gameId} completed - ${role} solved all tests`);
    }

    // Emit progress update (if improved or all passed)
    io.to(gameId).emit('test_progress_update', {
      role,
      passedTests,
      totalTests,
      previousPassed,
      allTestsPassed
    });

    console.log(`Test progress update emitted for game ${gameId}: ${role} passed ${passedTests}/${totalTests} tests`);
  } catch (error) {
    console.error('Error handling test progress update:', error);
    // Don't throw - progress tracking is supplementary to code submission
  }
};

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

    // Handle test progress tracking if this is part of a game
    await handleTestProgressUpdate(
      req.body.gameId,
      req.body.userId,
      passedTests,
      totalTests
    );

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