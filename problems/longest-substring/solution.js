/**
 * Finds the length of the longest substring without repeating characters
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
  if (!s || s.length === 0) return 0;

  let maxLength = 0, left = 0;
  const charSet = new Set();

  for (let right = 0; right < s.length; right++) {
    while (charSet.has(s[right])) {
      charSet.delete(s[left]);
      left++;
    }
    charSet.add(s[right]);
    maxLength = Math.max(maxLength, right - left + 1);
  }

  return maxLength;
}

function main() {
  const fs = require('fs');
  const input = fs.readFileSync(0, 'utf8').trim().split(/\s+/);
  let index = 0;

  while (index < input.length) {
    const s = input[index++].trim();
    const result = lengthOfLongestSubstring(s);
    console.log(result);
  }
}

main();
