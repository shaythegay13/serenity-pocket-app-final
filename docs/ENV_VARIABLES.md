# Environment Variables for A/B Testing

Add these to your `.env.local` file to configure Survey A/B testing:

```bash
# ============================================
# A/B Testing Configuration
# ============================================

# Enable or disable A/B testing
# Set to 'false' to always show Survey A
# Default: true
NEXT_PUBLIC_SURVEY_AB_TEST_ENABLED=true

# Percentage of users to assign to Survey B (0-100)
# 0 = Everyone gets Survey A
# 50 = 50/50 split (default)
# 100 = Everyone gets Survey B
# Default: 50
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=50
```

## Quick Configurations

### 50/50 Split (Recommended for A/B Testing)
```bash
NEXT_PUBLIC_SURVEY_AB_TEST_ENABLED=true
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=50
```

### Everyone Gets Survey A (Original)
```bash
NEXT_PUBLIC_SURVEY_AB_TEST_ENABLED=false
# OR
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=0
```

### Everyone Gets Survey B (New)
```bash
NEXT_PUBLIC_SURVEY_AB_TEST_ENABLED=true
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=100
```

### 70% Survey B, 30% Survey A
```bash
NEXT_PUBLIC_SURVEY_AB_TEST_ENABLED=true
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=70
```

## Notes

- Changes require app restart to take effect
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Default values are used if variables are not set
- For production, set these in your hosting platform's environment variables
