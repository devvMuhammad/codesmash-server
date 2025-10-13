def twoSum(nums, target):
    """
    Find two indices in nums that add up to target using O(n) time complexity.

    Args:
        nums: List of integers
        target: Target sum

    Returns:
        List of two indices [i, j] where nums[i] + nums[j] == target
    """
    num_map = {}

    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        num_map[num] = i

    return []


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
        i += n + 2
