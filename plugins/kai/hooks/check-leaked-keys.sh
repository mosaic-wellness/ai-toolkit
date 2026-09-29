#!/bin/bash
# Checks stdin (piped tool output) for leaked API key patterns.
# Every alternative requires a literal value, so printing this script, the hook prompt, or any
# documentation that lists the patterns no longer trips it.
# Exit 0 = clean, Exit 2 = leaked key found (blocks continuation).

output=$(cat)

# Patterns covered:
#   sk-ant-api03-…       Anthropic API key
#   ANTHROPIC_API_KEY=…  Env-var form of Anthropic key
#   OPENAI_API_KEY=sk-…  OpenAI key
#   GEMINI_API_KEY=…     Google AI / Gemini key
#   ELEVENLABS_API_KEY=… ElevenLabs key
#   amk_…                Anthropic-managed key
#   NRAK-…               New Relic User API key
#   NEW_RELIC_API_KEY=…  Env-var form of NR key
#   MIXPANEL_SERVICE_ACCOUNT_TOKEN=…  Mixpanel SA token
#   NRII-…               New Relic Ingest license key (ingest-side; sensitive too)

if echo "$output" | grep -qE 'sk-ant-api03-[A-Za-z0-9_-]{20,}|ANTHROPIC_API_KEY=sk-[A-Za-z0-9_-]{20,}|OPENAI_API_KEY=sk-[A-Za-z0-9_-]{20,}|GEMINI_API_KEY=[A-Za-z0-9_-]{10,}|ELEVENLABS_API_KEY=[A-Za-z0-9_-]{10,}|amk_[A-Za-z0-9_-]{20,}|NRAK-[A-Za-z0-9]{20,}|NEW_RELIC_API_KEY=NRAK-[A-Za-z0-9]{20,}|NRII-[A-Za-z0-9]{20,}|MIXPANEL_SERVICE_ACCOUNT_TOKEN=[A-Za-z0-9]{20,}'; then
  echo "BLOCKED: Command output contains what looks like a real API key. Check the output and rotate the key if it was exposed." >&2
  exit 2
fi

exit 0
