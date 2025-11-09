"""
Trapping Rain Water - Two Pointer Approach
Time Complexity: O(n)
Space Complexity: O(1)

Algorithm:
1. Use two pointers starting from both ends of the array
2. Track the maximum height seen from left and right
3. Move the pointer with smaller max height inward
4. Calculate water trapped at each position based on the minimum of left and right max heights

The key insight: Water trapped at any position depends on the minimum of the maximum
heights to its left and right. By using two pointers, we can track these maximums
efficiently without extra space.
"""

def trap(height):
    """
    Calculate the total amount of water that can be trapped after raining.

    Args:
        height: List of non-negative integers representing elevation map

    Returns:
        int: Total amount of water trapped
    """
    if not height or len(height) == 0:
        return 0

    left = 0
    right = len(height) - 1
    left_max = 0
    right_max = 0
    water_trapped = 0

    while left < right:
        if height[left] < height[right]:
            # Process left side
            if height[left] >= left_max:
                # Current position is a peak, update left_max
                left_max = height[left]
            else:
                # Water can be trapped here
                water_trapped += left_max - height[left]
            left += 1
        else:
            # Process right side
            if height[right] >= right_max:
                # Current position is a peak, update right_max
                right_max = height[right]
            else:
                # Water can be trapped here
                water_trapped += right_max - height[right]
            right -= 1

    return water_trapped


if __name__ == '__main__':
    import sys
    
    data = sys.stdin.read().strip().split()
    i = 0
    
    while i < len(data):
        n = int(data[i])
        height = list(map(int, data[i+1:i+1+n]))
        result = trap(height)
        print(result)
        i += n + 1
