export const mockProblem = {
  id: "3123123123",
  title: "Two Sum", // Mock data
  description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
  difficulty: "hard",
  examples: [{
    input: "nums = [2,7,11,15], target = 9",
    output: "[0,1]",
    explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
  }],
  constraints: [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9"
  ],
  functionSignature: "function twoSum(nums, target) {\n  // Your solution here\n}"
}