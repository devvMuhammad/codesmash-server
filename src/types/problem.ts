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
  input: unknown;
  expected: unknown;
  actual: unknown;
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
  statusDescription?: string;
}

// Judge0 status codes from Judge0 CE API
export enum Judge0StatusId {
  IN_QUEUE = 1,
  PROCESSING = 2,
  ACCEPTED = 3,
  WRONG_ANSWER = 4,
  TIME_LIMIT_EXCEEDED = 5,
  COMPILATION_ERROR = 6,
  RUNTIME_ERROR_SIGSEGV = 7,
  RUNTIME_ERROR_SIGXFSZ = 8,
  RUNTIME_ERROR_SIGFPE = 9,
  RUNTIME_ERROR_SIGABRT = 10,
  RUNTIME_ERROR_NZEC = 11,
  RUNTIME_ERROR_OTHER = 12,
  INTERNAL_ERROR = 13,
  EXEC_FORMAT_ERROR = 14
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

