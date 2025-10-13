/**
 * Trapping Rain Water - Two Pointer Approach
 * @param {number[]} height - Array of non-negative integers representing elevation map
 * @return {number} - Total amount of water trapped
 */
function trap(height) {
  if (!height || height.length === 0) return 0;

  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let waterTrapped = 0;

  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        waterTrapped += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        waterTrapped += rightMax - height[right];
      }
      right--;
    }
  }

  return waterTrapped;
}

function main() {
  const fs = require('fs');
  const input = fs.readFileSync(0, 'utf8').trim().split(/\s+/);
  let index = 0;

  while (index < input.length) {
    const n = parseInt(input[index++], 10);

    if (isNaN(n) || n === 0) {
      console.log(0);
      break;
    }

    const height = [];
    for (let i = 0; i < n; i++) {
      height.push(parseInt(input[index++], 10));
    }

    const result = trap(height);
    console.log(result);
  }
}

main();
