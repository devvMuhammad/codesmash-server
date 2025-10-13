/**
 * Two Sum Solution using HashMap
 * @param {number[]} nums - Array of integers
 * @param {number} target - Target sum
 * @return {number[]} - Indices of the two numbers that add up to target
 */
function twoSum(nums, target) {
  const map = {};

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    if (map.hasOwnProperty(complement)) {
      return [map[complement], i];
    }

    map[nums[i]] = i;
  }

  return [];
}

function main() {
  const fs = require('fs');
  const input = fs.readFileSync(0, 'utf8').trim().split(/\s+/);
  let index = 0;

  while (index < input.length) {
    const n = parseInt(input[index++], 10);
    
    if (isNaN(n) || index + n >= input.length) {
      break;
    }

    const nums = [];
    for (let i = 0; i < n; i++) {
      nums.push(parseInt(input[index++], 10));
    }
    
    const target = parseInt(input[index++], 10);
    const result = twoSum(nums, target);
    console.log(result.join(' '));
  }
}

main();
