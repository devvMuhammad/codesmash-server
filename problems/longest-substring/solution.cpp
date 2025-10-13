#include <iostream>
#include <string>
#include <unordered_set>
#include <algorithm>

using namespace std;

int lengthOfLongestSubstring(string s) {
    int n = s.length();
    if (n == 0) return 0;

    unordered_set<char> charSet;
    int maxLength = 0;
    int left = 0;

    for (int right = 0; right < n; right++) {
        while (charSet.find(s[right]) != charSet.end()) {
            charSet.erase(s[left]);
            left++;
        }

        charSet.insert(s[right]);
        maxLength = max(maxLength, right - left + 1);
    }

    return maxLength;
}

int main() {
    string s;
    getline(cin, s);

    int result = lengthOfLongestSubstring(s);
    cout << result << endl;

    return 0;
}
