# this is script to extract problems from deepmind/code_contests dataset and save them to a json file

from datasets import load_dataset
import json
from datetime import datetime

DIFFICULTY_CONFIG = {
    'easy': {'min_rating': 500, 'max_rating': 1400, 'count': 500},
    'medium': {'min_rating': 1400, 'max_rating': 2000, 'count': 1000},
    'hard': {'min_rating': 2000, 'max_rating': 5000, 'count': 500}
}

SELECTED_DIFFICULTY = 'easy'

def clean_title(name):
    parts = name.split('. ', 1)
    return parts[1].strip() if len(parts) > 1 else name.strip()

def generate_starter_codes(title):
    return {
        'python': f'''# {title}

def solve():
    pass

if __name__ == "__main__":
    solve()
''',
        'javascript': f'''// {title}

const readline = require('readline');
const rl = readline.createInterface({{
    input: process.stdin,
    output: process.stdout
}});

let lines = [];
rl.on('line', (line) => {{ lines.push(line); }});
rl.on('close', () => {{ solve(); }});

function solve() {{
}}
''',
        'java': f'''// {title}

import java.util.*;
import java.io.*;

public class Solution {{
    public static void main(String[] args) throws IOException {{
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        br.close();
    }}
}}
''',
        'cpp': f'''// {title}

#include <iostream>
#include <vector>
using namespace std;

int main() {{
    return 0;
}}
'''
    }

ds = load_dataset("deepmind/code_contests")
config = DIFFICULTY_CONFIG[SELECTED_DIFFICULTY]
problems = []

for problem in ds['train']:
    if len(problems) >= config['count']:
        break

    cf_rating = problem.get('cf_rating', 0)
    if cf_rating < config['min_rating'] or cf_rating >= config['max_rating']:
        continue

    if not problem.get('name') or not problem.get('description'):
        continue

    generated_tests = problem.get('generated_tests', {})
    public_tests = problem.get('public_tests', {})

    if (len(generated_tests.get('input', [])) > 0 and
        len(generated_tests.get('output', [])) > 0 and
        len(public_tests.get('input', [])) > 0 and
        len(public_tests.get('output', [])) > 0):

        title = clean_title(problem['name'])

        problems.append({
            'title': title,
            'description': problem['description'],
            'difficulty': SELECTED_DIFFICULTY,
            'testCases': '\n'.join(s.rstrip('\n') for s in generated_tests['input']),
            'sampleTestCases': '\n'.join(s.rstrip('\n') for s in public_tests['input']),
            'sampleTestCasesOutput': '\n'.join(s.rstrip('\n') for s in public_tests['output']),
            'initialCodes': generate_starter_codes(title),
            'correctOutput': '\n'.join(s.rstrip('\n') for s in generated_tests['output']),
            'createdAt': datetime.utcnow().isoformat(),
            'updatedAt': datetime.utcnow().isoformat()
        })

filename = f'{SELECTED_DIFFICULTY}_problems.json'
with open(filename, 'w') as f:
    json.dump(problems, f, indent=1)

print(f"Extracted {len(problems)} {SELECTED_DIFFICULTY} problems to {filename}")