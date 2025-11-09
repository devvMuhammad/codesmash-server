import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = 'codesmash';

const twoSumPython = `def twoSum(nums, target):
    """
    Find two indices in nums that add up to target.
    
    Args:
        nums: List of integers
        target: Target sum
    
    Returns:
        List of two indices [i, j] where nums[i] + nums[j] == target
    """
    # Write your code here
    pass


if __name__ == '__main__':
    import sys
    
    data = sys.stdin.read().strip().split()
    i = 0
    
    while i < len(data):
        n = int(data[i])
        nums = list(map(int, data[i+1:i+1+n]))
        target = int(data[i+1+n])
        result = twoSum(nums, target)
        print(f"{result[0]} {result[1]}")
        i += n + 2`;

const longestSubstringPython = `def lengthOfLongestSubstring(s: str) -> int:
    """
    Find the length of the longest substring without repeating characters.
    
    Args:
        s: Input string
    
    Returns:
        Length of the longest substring without repeating characters
    """
    # Write your code here
    pass


if __name__ == '__main__':
    import sys

    # Read all input lines
    input_lines = sys.stdin.read().strip().split('\\n')

    # Process each test case
    for line in input_lines:
        if line:  # Skip empty lines
            s = line.strip()
            result = lengthOfLongestSubstring(s)
            print(result)`;

const trappingRainWaterPython = `def trap(height):
    """
    Calculate the total amount of water that can be trapped after raining.
    
    Args:
        height: List of non-negative integers representing elevation map
    
    Returns:
        int: Total amount of water trapped
    """
    # Write your code here
    pass


if __name__ == '__main__':
    import sys
    
    data = sys.stdin.read().strip().split()
    i = 0
    
    while i < len(data):
        n = int(data[i])
        height = list(map(int, data[i+1:i+1+n]))
        result = trap(height)
        print(result)
        i += n + 1`;

async function updatePythonCodes() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DATABASE_NAME);
    const problemsCollection = db.collection('problems');

    // Update Two Sum
    const result1 = await problemsCollection.updateOne(
      { title: 'Two Sum' },
      {
        $set: {
          'initialCodes.python': twoSumPython,
          updatedAt: new Date()
        }
      }
    );
    console.log(`✅ Updated Two Sum: ${result1.modifiedCount} document(s)`);

    // Update Longest Substring
    const result2 = await problemsCollection.updateOne(
      { title: 'Longest Substring Without Repeating Characters' },
      {
        $set: {
          'initialCodes.python': longestSubstringPython,
          updatedAt: new Date()
        }
      }
    );
    console.log(`✅ Updated Longest Substring: ${result2.modifiedCount} document(s)`);

    // Update Trapping Rain Water
    const result3 = await problemsCollection.updateOne(
      { title: 'Trapping Rain Water' },
      {
        $set: {
          'initialCodes.python': trappingRainWaterPython,
          updatedAt: new Date()
        }
      }
    );
    console.log(`✅ Updated Trapping Rain Water: ${result3.modifiedCount} document(s)`);

    console.log('\n🎉 All Python starter codes updated successfully!');
  } catch (error) {
    console.error('Error updating documents:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

updatePythonCodes();

