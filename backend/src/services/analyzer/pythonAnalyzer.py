import ast
import sys
import json

# ✅ Read source code from stdin
source_code = sys.stdin.read()

tree = ast.parse(source_code)

# Basic heuristics
loops = sum(isinstance(node, (ast.For, ast.While)) for node in ast.walk(tree))
ifs = sum(isinstance(node, ast.If) for node in ast.walk(tree))
recursions = sum(
    isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "solve"
    for node in ast.walk(tree)
)

time_complexity = "O(1)"
if loops == 1:
    time_complexity = "O(n)"
elif loops > 1:
    time_complexity = "O(n^2)"
if recursions > 0:
    time_complexity = "O(2^n)"

space_complexity = "O(n)" if loops or recursions else "O(1)"

output = {
    "time": time_complexity,
    "space": space_complexity,
    "explanation": f"Detected {loops} loops, {ifs} if-statements, and {recursions} recursive calls."
}

print(json.dumps(output))
