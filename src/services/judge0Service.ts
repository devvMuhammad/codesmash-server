import type { Judge0Submission, Judge0Response } from "../types/problem";

const JUDGE0_URL = process.env.JUDGE0_URL
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST

if (!JUDGE0_URL || !RAPIDAPI_KEY || !RAPIDAPI_HOST) {
  throw new Error("Missing required environment variables for Judge0 API");
}

/**
 * Submit code to Judge0 and get result immediately (wait=true)
 * @param sourceCode - User's code with stdin parsing (HackerRank style)
 * @param languageId - Judge0 language ID
 * @param stdin - Test cases input
 * @returns Judge0 response with execution results
 */
export async function executeCode(
  sourceCode: string,
  languageId: number,
  stdin: string
): Promise<Judge0Response> {
  try {
    const submission: Judge0Submission = {
      source_code: sourceCode,
      language_id: languageId,
      stdin: stdin,
    };

    const response = await fetch(`${JUDGE0_URL}/submissions?wait=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": RAPIDAPI_KEY!,
        "X-RapidAPI-Host": RAPIDAPI_HOST!,
      },
      body: JSON.stringify(submission),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Judge0 API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as Judge0Response;
    return data;
  } catch (error) {
    console.error("Error executing code with Judge0:", error);
    throw error;
  }
}