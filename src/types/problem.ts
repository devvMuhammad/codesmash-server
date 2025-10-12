import type { DifficultyType } from "./game";

export interface IProblem {
  _id?: string;
  title: string;
  description: string;
  difficulty: DifficultyType;
  testCases: string;
  initialCodes: {
    python: string;
    javascript: string;
    java: string;
    cpp: string;
  };
  correctOutput: string;
  createdAt: Date;
  updatedAt: Date;
}

// Language types for code submission
export type SupportedLanguage = "javascript" | "python" | "java" | "cpp";

// Test result status
export type TestStatus = "PASS" | "FAIL" | "ERROR";

// Single test case result
export interface TestResult {
  testCase: number;
  input: any;
  expected: any;
  actual: any;
  status: TestStatus;
  error?: string;
}

// Code submission request
export interface SubmitCodeRequest {
  code: string;
  language: SupportedLanguage;
  userId: string;
  gameId?: string;
}

// Code submission response
export interface SubmitCodeResponse {
  success: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  executionTime: string;
  memory: number;
  testResults: TestResult[];
  allTestsPassed: boolean;
  compileError?: string;
  runtimeError?: string;
}

// Judge0 API types
export interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
}

export interface Judge0Response {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  time: string;
  memory: number;
  status: {
    id: number;
    description: string;
  };
  token: string;
}

