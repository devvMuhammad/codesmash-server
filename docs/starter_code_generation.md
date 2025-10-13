Got it ✅ — you want a **Markdown guide for preparing *starter templates*** (not full problem solutions) across Python, Java, JavaScript, and C++, so agents can consistently prepare correct base code before writing logic — including multiple test case handling, avoiding runtime errors (like segmentation faults), and following Judge0/online judge conventions.

Here’s that clean, focused guide 👇

---

# 🧩 Cross-Language Starter Code Preparation Guide

This document teaches how to **write reliable starter templates** (input/output skeletons) in **Python, Java, JavaScript, and C++**, so agents can start coding immediately **without runtime errors, missing test cases, or wrong class/file names**.

---

## ✅ Universal Rules Before You Start

1. **Assume multiple test cases** — judges often run multiple inputs in one go.
   → Always loop until EOF or `T` test cases.
2. **Never hardcode input structure** — handle both space and newline-separated tokens.
3. **Print results in correct format** — one line per test case.
4. **Avoid indexing or printing empty vectors/arrays.**
5. **Test your template with:**

   ```
   2
   4
   2 7 11 15
   9
   5
   1 2 3 4 5
   9
   ```

   It should read both cases cleanly.

---

## 🐍 Python Starter Template

```python
import sys

def solve():
    # TODO: implement problem logic
    pass

def main():
    data = sys.stdin.read().strip().split()
    it = iter(data)
    results = []
    while True:
        try:
            n = int(next(it))        # read number count
            nums = [int(next(it)) for _ in range(n)]
            target = int(next(it))   # example: another input value
            # Call solve() or process here
            # result = solve(nums, target)
            # results.append(result)
        except StopIteration:
            break

    # print results if collected
    # print("\n".join(map(str, results)))

if __name__ == "__main__":
    main()
```

### 🧠 Notes

* Uses `sys.stdin.read()` → handles EOF correctly.
* Converts to tokens for flexible spacing.
* Prevents `StopIteration` crash when input ends early.
* Suitable for all online judges.

---

## ☕ Java Starter Template

```java
import java.util.*;

public class Main {
    public static void solve(Scanner sc) {
        // Example input format:
        // int n = sc.nextInt();
        // int[] nums = new int[n];
        // for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        // int target = sc.nextInt();
        // TODO: add logic and print result
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        while (sc.hasNextInt()) {
            solve(sc); // process each test case
        }
        sc.close();
    }
}
```

### 🧠 Notes

* Class must be named **`Main`** for Judge0 or most OJ environments.
* `while (sc.hasNextInt())` → automatically reads until EOF.
* All logic goes inside `solve()` for clarity.

---

## 🟦 JavaScript (Node.js) Starter Template

```javascript
const fs = require('fs');
const tokens = fs.readFileSync(0, 'utf8').trim().split(/\s+/);
let idx = 0;

function solve() {
  // Example input reading:
  // const n = Number(tokens[idx++]);
  // const nums = tokens.slice(idx, idx + n).map(Number);
  // idx += n;
  // const target = Number(tokens[idx++]);
  // TODO: add logic and output
}

while (idx < tokens.length) {
  solve(); // run for each test case
}
```

### 🧠 Notes

* Reads **entire input once** — robust against both spaces and newlines.
* Works on Judge0, Codeforces, LeetCode (custom test input), etc.
* Prevents partial reads or broken input loops.

---

## 💠 C++ Starter Template

```cpp
#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n;
    if (!(cin >> n)) return;  // stop at EOF
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int target;
    cin >> target;
    // TODO: add logic and output
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    while (cin.peek() != EOF) {
        solve();
    }
    return 0;
}
```

### 🧠 Notes

* Uses `ios::sync_with_stdio(false)` and `cin.tie(nullptr)` for fast input.
* Stops safely at EOF instead of causing **segmentation faults**.
* Wraps everything in `solve()` for reusability and clarity.

---

## ⚠️ Common Pitfalls to Avoid

| Problem                            | Cause                          | Fix                                     |
| ---------------------------------- | ------------------------------ | --------------------------------------- |
| **Segmentation fault (C++)**       | Printed from empty vector      | Always check size before printing       |
| **Runtime Error (NZEC)**           | Reading past EOF               | Wrap reads in EOF-safe loops            |
| **Wrong Output (only first test)** | Forgot loop for multiple cases | Add `while (hasNext)` / `while True:`   |
| **Compilation failure in Java**    | Wrong class name               | Always use `public class Main`          |
| **No output**                      | Forgot to flush/print          | Ensure final `print` or `cout` executed |

---

## 🚀 Quick Checklist Before Submitting

* [ ] Can handle **multiple test cases**
* [ ] Uses **fast input** for large data
* [ ] Class/file name matches (Java)
* [ ] Works with both **space/newline** separated input
* [ ] Doesn’t crash on **empty/EOF input**
* [ ] Has clear placeholder for logic (`solve()` or comment)

---

Would you like me to include **example test inputs + expected output stubs** (like a quick test harness section) so agents can verify templates before coding?
