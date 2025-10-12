import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Problem } from '../src/models/Problem';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codesmash';

/**
 * Seed Two Sum problem into database
 * HackerRank-style with stdin parsing and line-by-line output
 */
async function seedTwoSumProblem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if Two Sum already exists
    const existing = await Problem.findOne({ title: 'Two Sum' });
    if (existing) {
      console.log('Two Sum problem already exists. Skipping...');
      await mongoose.connection.close();
      return;
    }

    // Test cases in line-by-line format (like HackerRank)
    const testCases = `4
2 7 11 15
9
3
3 2 4
6
2
3 3
6
5
1 2 3 4 5
9`;

    // Expected output (line by line)
    const correctOutput = `0 1
1 2
0 1
3 4`;

    // JavaScript initial code (HackerRank style)
    const javascriptCode = `function twoSum(nums, target) {
    // Write your code here

}

function main() {
    const n = parseInt(readLine().trim());
    const nums = readLine().trim().split(' ').map(Number);
    const target = parseInt(readLine().trim());

    const result = twoSum(nums, target);
    console.log(result.join(' '));
}`;

    // Python initial code (HackerRank style)
    const pythonCode = `def twoSum(nums, target):
    # Write your code here
    pass

if __name__ == '__main__':
    n = int(input().strip())
    nums = list(map(int, input().strip().split()))
    target = int(input().strip())

    result = twoSum(nums, target)
    print(' '.join(map(str, result)))`;

    // Java initial code (HackerRank style)
    const javaCode = `import java.util.*;

public class Solution {
    public static int[] twoSum(int[] nums, int target) {
        // Write your code here
        return new int[]{};
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = scanner.nextInt();
        }
        int target = scanner.nextInt();

        int[] result = twoSum(nums, target);
        System.out.println(result[0] + " " + result[1]);
    }
}`;

    // C++ initial code (HackerRank style)
    const cppCode = `#include <iostream>
#include <vector>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Write your code here
    return {};
}

int main() {
    int n;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) {
        cin >> nums[i];
    }
    int target;
    cin >> target;

    vector<int> result = twoSum(nums, target);
    cout << result[0] << " " << result[1] << endl;

    return 0;
}`;

    // Create the problem
    const twoSumProblem = new Problem({
      title: 'Two Sum',
      description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

**Example 1:**
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

**Example 2:**
Input: nums = [3,2,4], target = 6
Output: [1,2]

**Example 3:**
Input: nums = [3,3], target = 6
Output: [0,1]

**Constraints:**
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.`,
      difficulty: 'easy',
      testCases,
      correctOutput,
      initialCodes: {
        javascript: javascriptCode,
        python: pythonCode,
        java: javaCode,
        cpp: cppCode
      }
    });

    await twoSumProblem.save();
    console.log('✅ Two Sum problem seeded successfully!');
    console.log('Problem ID:', twoSumProblem._id);

    await mongoose.connection.close();
    console.log('Database connection closed');

  } catch (error) {
    console.error('Error seeding Two Sum problem:', error);
    process.exit(1);
  }
}

// Run the seed function
seedTwoSumProblem();
