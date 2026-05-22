#!/bin/bash
# PreToolUse:Bash hook — blocks destructive git operations
# Reads tool input JSON from stdin, checks for dangerous commands

# Read stdin (tool input JSON)
INPUT=$(cat)

# Extract the command field using jq
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# If jq failed or no command extracted, allow (don't block non-git commands)
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Block destructive git operations
if echo "$COMMAND" | grep -qE 'git[ ]+(push[ ]+--force|push[ ]+-f[[:space:]]|push[ ]+-f$|reset[ ]+--hard|checkout[ ]+\.|clean[ ]+-f|branch[ ]+-D)'; then
  echo "BLOCKED: Destructive git operation not allowed. Use safe alternatives." >&2
  exit 2
fi

# Block bare checkout to main/master (prevents accidental commits to protected branches)
if echo "$COMMAND" | grep -qE 'git[ ]+checkout[ ]+(main|master)[[:space:]]*$'; then
  echo "BLOCKED: Cannot checkout main/master for commits. Create a feature branch." >&2
  exit 2
fi

exit 0
