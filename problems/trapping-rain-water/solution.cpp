#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int trap(vector<int>& height) {
    int n = height.size();

    // Edge case: if array is empty or has less than 3 elements, no water can be trapped
    if (n < 3) {
        return 0;
    }

    int left = 0;
    int right = n - 1;
    int leftMax = 0;
    int rightMax = 0;
    int totalWater = 0;

    // Two-pointer approach
    while (left < right) {
        if (height[left] < height[right]) {
            // Process left side
            if (height[left] >= leftMax) {
                // Update left max height
                leftMax = height[left];
            } else {
                // Water can be trapped at this position
                totalWater += leftMax - height[left];
            }
            left++;
        } else {
            // Process right side
            if (height[right] >= rightMax) {
                // Update right max height
                rightMax = height[right];
            } else {
                // Water can be trapped at this position
                totalWater += rightMax - height[right];
            }
            right--;
        }
    }

    return totalWater;
}

int main() {
    int n;
    cin >> n;

    vector<int> height(n);
    for (int i = 0; i < n; i++) {
        cin >> height[i];
    }

    int result = trap(height);
    cout << result << endl;

    return 0;
}
