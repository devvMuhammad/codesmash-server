import mongoose from 'mongoose';
import { Problem } from '../src/models/Problem';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codesmash';

async function insertProblems() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ===========================
    // MEDIUM: Longest Substring Without Repeating Characters
    // ===========================
    const mediumExists = await Problem.findOne({ title: 'Longest Substring Without Repeating Characters' });

    if (!mediumExists) {
      const mediumProblem = new Problem({
        title: 'Longest Substring Without Repeating Characters',
        description: `Given a string s, find the length of the longest substring without repeating characters.

**Example 1:**
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.

**Example 2:**
Input: s = "pwwkew"
Output: 3
Explanation: The answer is "wke", with the length of 3.
Notice that the answer must be a substring, "pwke" is a subsequence and not a substring.

**Example 3:**
Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with the length of 1.

**Example 4:**
Input: s = "dvdf"
Output: 3
Explanation: The answer is "vdf", with the length of 3.

**Constraints:**
- 0 <= s.length <= 5 * 10^4
- s consists of English letters, digits, symbols and spaces.`,
        difficulty: 'medium',
        testCases: `abcabcbb
pwwkew
bbbbb
dvdf
anviaj`,
        correctOutput: `3
3
1
3
5`,
        initialCodes: {
          javascript: `function lengthOfLongestSubstring(s) {
    // Write your code here
    
}

function main() {
    const s = readLine().trim();
    const result = lengthOfLongestSubstring(s);
    console.log(result);
}`,
          python: `def lengthOfLongestSubstring(s):
    # Write your code here
    pass

if __name__ == '__main__':
    s = input().strip()
    result = lengthOfLongestSubstring(s)
    print(result)`,
          java: `import java.util.*;

public class Solution {
    public static int lengthOfLongestSubstring(String s) {
        // Write your code here
        return 0;
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String s = scanner.nextLine().trim();
        
        int result = lengthOfLongestSubstring(s);
        System.out.println(result);
        
        scanner.close();
    }
}`,
          cpp: `#include <iostream>
#include <string>
using namespace std;

int lengthOfLongestSubstring(string s) {
    // Write your code here
    return 0;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    string s;
    getline(cin, s);
    
    int result = lengthOfLongestSubstring(s);
    cout << result << endl;
    
    return 0;
}`
        }
      });

      await mediumProblem.save();
      console.log('✅ Created: Longest Substring Without Repeating Characters (MEDIUM)');
      console.log(`   ID: ${mediumProblem._id}\n`);
    } else {
      console.log('ℹ️  Longest Substring Without Repeating Characters already exists\n');
    }

    // ===========================
    // HARD: Trapping Rain Water
    // ===========================
    const hardExists = await Problem.findOne({ title: 'Trapping Rain Water' });

    if (!hardExists) {
      const hardProblem = new Problem({
        title: 'Trapping Rain Water',
        description: `Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.

**Example 1:**
Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6
Explanation: The above elevation map (black section) is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water (blue section) are being trapped.

**Example 2:**
Input: height = [4,2,0,3,2,5]
Output: 9
Explanation: 9 units of water can be trapped.

**Example 3:**
Input: height = [3,0,2,0,4]
Output: 7
Explanation: 7 units of water can be trapped.

**Example 4:**
Input: height = [5]
Output: 0
Explanation: A single bar cannot trap any water.

**Constraints:**
- 1 <= n <= 2 * 10^4
- 0 <= height[i] <= 10^5

**Hint:**
Think about using two pointers approach or stack-based solution. For each position, the water level depends on the minimum of the maximum height to its left and right.`,
        difficulty: 'hard',
        testCases: `12
0 1 0 2 1 0 1 3 2 1 2 1
6
4 2 0 3 2 5
5
3 0 2 0 4
1
5
8
2 0 2 0 2 0 2 0`,
        correctOutput: `6
9
7
0
0`,
        initialCodes: {
          javascript: `function trap(height) {
    // Write your code here
    
}

function main() {
    const n = parseInt(readLine().trim());
    const height = readLine().trim().split(' ').map(Number);
    
    const result = trap(height);
    console.log(result);
}`,
          python: `def trap(height):
    # Write your code here
    pass

if __name__ == '__main__':
    n = int(input().strip())
    height = list(map(int, input().strip().split()))
    
    result = trap(height)
    print(result)`,
          java: `import java.util.*;

public class Solution {
    public static int trap(int[] height) {
        // Write your code here
        return 0;
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        int[] height = new int[n];
        for (int i = 0; i < n; i++) {
            height[i] = scanner.nextInt();
        }
        
        int result = trap(height);
        System.out.println(result);
        
        scanner.close();
    }
}`,
          cpp: `#include <iostream>
#include <vector>
using namespace std;

int trap(vector<int>& height) {
    // Write your code here
    return 0;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    int n;
    cin >> n;
    vector<int> height(n);
    for (int i = 0; i < n; i++) {
        cin >> height[i];
    }
    
    int result = trap(height);
    cout << result << endl;
    
    return 0;
}`
        }
      });

      await hardProblem.save();
      console.log('✅ Created: Trapping Rain Water (HARD)');
      console.log(`   ID: ${hardProblem._id}\n`);
    } else {
      console.log('ℹ️  Trapping Rain Water already exists\n');
    }

    console.log('🎉 All problems processed successfully!');

    await mongoose.connection.close();
    console.log('Database connection closed');

  } catch (error) {
    console.error('❌ Error inserting problems:', error);
    process.exit(1);
  }
}

insertProblems();

