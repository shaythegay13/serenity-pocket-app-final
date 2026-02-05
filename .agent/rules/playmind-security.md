---
trigger: always_on
---

* Never hard-code API keys, betting odds data, or user psychology metrics.
* Use environment variables for all Supabase/Vercel connections.
* Validate all betting slip inputs client-side before API submission.
* Add error handling for all Gemini 3 model inference calls.
* Log behavioral nudge effectiveness without storing personal user data.