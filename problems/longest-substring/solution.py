def lengthOfLongestSubstring(s: str) -> int:
    """
    Find the length of the longest substring without repeating characters.

    Uses sliding window technique with a dictionary to track character positions.
    Time Complexity: O(n) where n is the length of the string
    Space Complexity: O(min(m, n)) where m is the size of the character set

    Args:
        s: Input string

    Returns:
        Length of the longest substring without repeating characters
    """
    if not s:
        return 0

    # Dictionary to store the most recent index of each character
    char_index_map = {}
    max_length = 0
    left = 0  # Left pointer of the sliding window

    # Right pointer of the sliding window
    for right in range(len(s)):
        current_char = s[right]

        # If character is already in the current window, move left pointer
        # to the position right after the previous occurrence
        if current_char in char_index_map and char_index_map[current_char] >= left:
            left = char_index_map[current_char] + 1

        # Update the character's most recent index
        char_index_map[current_char] = right

        # Calculate current window length and update max if needed
        current_length = right - left + 1
        max_length = max(max_length, current_length)

    return max_length


if __name__ == '__main__':
    import sys

    # Read all input lines
    input_lines = sys.stdin.read().strip().split('\n')

    # Process each test case
    for line in input_lines:
        if line:  # Skip empty lines
            s = line.strip()
            result = lengthOfLongestSubstring(s)
            print(result)
