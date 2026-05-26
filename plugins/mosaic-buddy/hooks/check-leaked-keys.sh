#!/bin/bash
# Checks stdin (piped tool output) for leaked API key patterns.
# Exit 0 = clean, Exit 2 = leaked key found (blocks continuation).

output=$(cat)

if echo "$output" | grep -qE 'sk-ant-api03-[A-Za-z0-9_-]{20,}|ANTHROPIC_API_KEY=sk-|OPENAI_API_KEY=sk-|GEMINI_API_KEY=[A-Za-z0-9_-]{10,}|ELEVENLABS_API_KEY=[A-Za-z0-9_-]{10,}|amk_[A-Za-z0-9_-]{20,}'; then
  echo "BLOCKED: Command output contains what looks like a real API key. Check the output and rotate the key if it was exposed." >&2
  exit 2
fi

exit 0
