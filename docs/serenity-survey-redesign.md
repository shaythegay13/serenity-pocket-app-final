# Serenity Survey - Frontend UX Redesign Specification

## Component Structure

```
components/
├── survey-v2/
│   ├── SerenitySurveyWrapper.tsx     // Main container with overlay
│   ├── WelcomeScreen.tsx             // Initial welcome screen
│   ├── SurveyQuestions.tsx           // Question flow component
│   ├── AccountCreationPrompt.tsx     // Post-survey signup
│   ├── SurveyProgressBar.tsx         // Progress indicator
│   └── SurveyResults.tsx             // Results display component
```

---

## 1. Welcome Screen

### Layout
- **Container**: Centered modal overlay with semi-transparent backdrop (`rgba(0,0,0,0.6)`)
- **Modal**: Max-width 600px, white background with subtle shadow
- **Padding**: 48px on desktop, 24px on mobile

### Content Structure

```tsx
<div className="survey-welcome-modal">
  <div className="survey-header">
    <img src="/logo.png" alt="Serenity Pocket" className="w-16 h-16" />
    <h1 className="text-2xl font-bold mt-4">
      Welcome! Take our Serenity Survey to determine if you are truly a gambler or not!
    </h1>
  </div>
  
  <p className="text-gray-600 mt-4 text-center">
    This quick 2-minute survey helps us personalize your Serenity experience.
  </p>
  
  <div className="survey-actions mt-8">
    <button className="primary-button w-full">
      Take our Survey
    </button>
    
    <a href="/login" className="text-sm text-blue-600 hover:underline mt-4 block text-center">
      I already have an account. Take me to login page.
    </a>
  </div>
</div>
```

### Design Notes
- **Colors**: Calming blue-green palette (#0891B2 primary, #F0F9FF background)
- **Typography**: Clean sans-serif (Inter or system fonts)
- **Animation**: Gentle fade-in (300ms) when modal appears
- **Button hover state**: Slight scale (1.02) and shadow elevation

---

## 2. Survey Questions Screen

### Layout
- Same modal container as welcome screen
- Smooth transition between questions (slide left animation)
- Mobile-responsive with full-width on small screens

### Question Data Structure

```typescript
interface SurveyQuestion {
  id: string;
  question: string;
  options: {
    value: string;
    label: string;
    weight: number; // For scoring (hidden from UI)
  }[];
}

const surveyQuestions: SurveyQuestion[] = [
  {
    id: "frequency",
    question: "How often do you engage in gambling or betting activities?",
    options: [
      { value: "never", label: "Never or rarely", weight: 0 },
      { value: "monthly", label: "Once or twice a month", weight: 1 },
      { value: "weekly", label: "1-3 times per week", weight: 2 },
      { value: "daily", label: "4+ times per week", weight: 3 }
    ]
  },
  {
    id: "amounts",
    question: "Have you noticed yourself needing to bet larger amounts to feel the same excitement?",
    options: [
      { value: "no", label: "No, I keep consistent limits", weight: 0 },
      { value: "sometimes", label: "Sometimes I increase my bets", weight: 1 },
      { value: "often", label: "Yes, I often need bigger stakes", weight: 2 },
      { value: "always", label: "Always chasing bigger wins", weight: 3 }
    ]
  },
  {
    id: "control",
    question: "When you start a gambling session, how easy is it for you to stop?",
    options: [
      { value: "easy", label: "I can stop anytime easily", weight: 0 },
      { value: "moderate", label: "Usually can stop when planned", weight: 1 },
      { value: "difficult", label: "Often play longer than intended", weight: 2 },
      { value: "impossible", label: "Very hard to stop once I start", weight: 3 }
    ]
  },
  {
    id: "impact",
    question: "Has gambling affected your personal relationships or mental wellbeing?",
    options: [
      { value: "none", label: "No negative impact", weight: 0 },
      { value: "minor", label: "Minor stress occasionally", weight: 1 },
      { value: "moderate", label: "Some conflicts or anxiety", weight: 2 },
      { value: "severe", label: "Significant problems", weight: 3 }
    ]
  },
  {
    id: "attempts",
    question: "Have you tried to reduce or control your gambling habits?",
    options: [
      { value: "no_need", label: "Haven't felt the need to", weight: 0 },
      { value: "thought", label: "Thought about it", weight: 1 },
      { value: "tried", label: "Tried with some success", weight: 2 },
      { value: "failed", label: "Tried but couldn't maintain", weight: 3 }
    ]
  },
  {
    id: "chasing",
    question: "After losing money gambling, what do you typically do?",
    options: [
      { value: "accept", label: "Accept the loss and move on", weight: 0 },
      { value: "wait", label: "Wait before playing again", weight: 1 },
      { value: "sometimes_chase", label: "Sometimes try to win it back", weight: 2 },
      { value: "always_chase", label: "Usually go back to recover losses", weight: 3 }
    ]
  },
  {
    id: "affordability",
    question: "Do you gamble with money you can afford to lose?",
    options: [
      { value: "always", label: "Always within my budget", weight: 0 },
      { value: "usually", label: "Usually stay within limits", weight: 1 },
      { value: "sometimes", label: "Sometimes exceed my budget", weight: 2 },
      { value: "often", label: "Often bet money I need", weight: 3 }
    ]
  },
  {
    id: "interference",
    question: "Does gambling interfere with your daily responsibilities?",
    options: [
      { value: "never", label: "Never interferes", weight: 0 },
      { value: "rarely", label: "Rarely affects my schedule", weight: 1 },
      { value: "sometimes", label: "Sometimes causes issues", weight: 2 },
      { value: "often", label: "Frequently disrupts my life", weight: 3 }
    ]
  }
];
```

### UI Component Structure

```tsx
<div className="survey-questions-container">
  {/* Header with logo */}
  <div className="survey-header flex items-center justify-center mb-6">
    <img src="/logo.png" alt="Serenity Pocket" className="w-12 h-12 mr-3" />
    <h2 className="text-xl font-semibold">Serenity Survey</h2>
  </div>

  {/* Progress Bar */}
  <SurveyProgressBar current={currentQuestion} total={8} />
  
  {/* Question */}
  <div className="question-container mt-8">
    <h3 className="text-lg font-medium mb-6">
      Question {currentQuestion} of 8
    </h3>
    <p className="text-xl mb-8">
      {currentQuestionData.question}
    </p>
    
    {/* Options */}
    <div className="options-grid space-y-3">
      {currentQuestionData.options.map(option => (
        <label className="option-card">
          <input type="radio" name="current-question" />
          <span className="option-label">{option.label}</span>
        </label>
      ))}
    </div>
  </div>
  
  {/* Navigation */}
  <div className="navigation-buttons flex justify-between mt-8">
    <button className="secondary-button" disabled={currentQuestion === 1}>
      Previous
    </button>
    <button className="primary-button" disabled={!selectedOption}>
      {currentQuestion === 8 ? 'Complete Survey' : 'Next'}
    </button>
  </div>
</div>
```

### Progress Bar Component

```tsx
const SurveyProgressBar = ({ current, total }) => (
  <div className="progress-container">
    <div className="progress-bar bg-gray-200 h-2 rounded-full">
      <div 
        className="progress-fill bg-linear-to-r from-blue-400 to-green-400 h-2 rounded-full transition-all duration-300"
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
    <p className="text-sm text-gray-600 mt-2 text-center">
      {Math.round((current / total) * 100)}% Complete
    </p>
  </div>
);
```

### Design Notes
- **Option cards**: Light border, hover state with background color change
- **Selected state**: Blue border, light blue background
- **Transitions**: 300ms ease-in-out between questions
- **Mobile**: Stack options vertically, larger touch targets (min 44px height)

---

## 3. Post-Survey Account Creation Prompt

### Layout
- Same modal container
- Success animation (checkmark) before showing prompt

### Content Structure

```tsx
<div className="account-prompt-container">
  {/* Success Animation */}
  <div className="success-icon mb-6">
    <svg className="checkmark-animation" />
  </div>
  
  <h2 className="text-2xl font-bold text-center mb-4">
    Thank you for taking our survey!
  </h2>
  
  <p className="text-gray-600 text-center mb-8">
    If you wish to see your results, go ahead and make an account with us for free.
  </p>
  
  <button className="primary-button w-full" onClick={showAccountForm}>
    Create my account
  </button>
  
  {/* Account Creation Form (shown after button click) */}
  {showForm && (
    <form className="account-form mt-6 space-y-4">
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input 
          type="text" 
          id="name" 
          placeholder="Your full name"
          className="form-input"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input 
          type="text" 
          id="username" 
          placeholder="Choose a unique username"
          className="form-input"
        />
        <p className="text-xs text-gray-500 mt-1">
          This will be your display name
        </p>
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input 
          type="password" 
          id="password" 
          placeholder="Create a strong password"
          className="form-input"
        />
        <p className="text-xs text-gray-500 mt-1">
          At least 8 characters
        </p>
      </div>
      
      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input 
          type="password" 
          id="confirmPassword" 
          placeholder="Confirm your password"
          className="form-input"
        />
      </div>
      
      <button type="submit" className="primary-button w-full mt-6">
        Complete Registration
      </button>
    </form>
  )}
</div>
```

### Form Validation States
- **Error**: Red border, error message below field
- **Success**: Green checkmark icon in field
- **Loading**: Disabled button with spinner
- **Password strength indicator**: Visual bar showing weak/medium/strong

---

## 4. Results Display

### Profile Section Display

```tsx
<div className="survey-results-card bg-linear-to-br from-blue-50 to-green-50 p-6 rounded-lg">
  <h3 className="text-lg font-semibold mb-4">Your Serenity Assessment</h3>
  
  <div className="result-display flex items-center justify-between">
    <div className="score-section">
      <p className="text-sm text-gray-600">Serenity Addiction Rate</p>
      <p className="text-3xl font-bold text-blue-600">
        {score}/50
      </p>
    </div>
    
    <div className="risk-level">
      <span className={`
        risk-badge px-4 py-2 rounded-full text-sm font-medium
        ${getRiskLevelClass(score)}
      `}>
        {getRiskLevel(score)}
      </span>
    </div>
  </div>
  
  <div className="insights mt-4 pt-4 border-t border-gray-200">
    <p className="text-sm text-gray-700">
      {getPersonalizedMessage(score)}
    </p>
  </div>
</div>
```

### Header Token Display

```tsx
<div className="header-stats flex items-center gap-4">
  {/* Existing Serenity Tokens */}
  <div className="serenity-tokens">
    <span className="text-sm">Serenity Tokens: {tokens}</span>
  </div>
  
  {/* New Addiction Rate Display */}
  <div className="addiction-rate-badge flex items-center gap-2">
    <span className="text-xs text-gray-600">Addiction Rate:</span>
    <span className={`font-medium ${getRiskColorClass(score)}`}>
      {score}/50 - {getRiskLevel(score)}
    </span>
  </div>
</div>
```

### Risk Level Categories

```typescript
function getRiskLevel(score: number): string {
  if (score <= 10) return "Low";
  if (score <= 25) return "Medium";
  if (score <= 40) return "High";
  return "Very High";
}

function getRiskLevelClass(score: number): string {
  if (score <= 10) return "bg-green-100 text-green-800";
  if (score <= 25) return "bg-yellow-100 text-yellow-800";
  if (score <= 40) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

function getPersonalizedMessage(score: number): string {
  if (score <= 10) {
    return "You demonstrate healthy habits and good self-control. Keep maintaining these positive behaviors!";
  }
  if (score <= 25) {
    return "You show some signs that warrant attention. Consider setting clearer limits and tracking your habits.";
  }
  if (score <= 40) {
    return "Your responses indicate potential concerns. We recommend exploring our resources and considering professional guidance.";
  }
  return "Your survey indicates significant challenges. Please consider reaching out for professional support and utilizing our tools.";
}
```

---

## Button States & Interactions

### Primary Button States
```css
.primary-button {
  /* Default */
  background: linear-gradient(135deg, #0891B2 0%, #059669 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
  
  /* Hover */
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(8, 145, 178, 0.3);
  }
  
  /* Active */
  &:active {
    transform: translateY(0);
  }
  
  /* Disabled */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
}
```

### Routing Logic Flow

```typescript
enum SurveyFlow {
  WELCOME = 'welcome',
  QUESTIONS = 'questions',
  ACCOUNT_PROMPT = 'account_prompt',
  ACCOUNT_FORM = 'account_form',
  RESULTS = 'results'
}

const surveyFlowTransitions = {
  [SurveyFlow.WELCOME]: {
    primary: SurveyFlow.QUESTIONS,
    secondary: '/login'
  },
  [SurveyFlow.QUESTIONS]: {
    next: (currentQ: number) => 
      currentQ === 8 ? SurveyFlow.ACCOUNT_PROMPT : SurveyFlow.QUESTIONS,
    previous: (currentQ: number) => 
      currentQ === 1 ? SurveyFlow.WELCOME : SurveyFlow.QUESTIONS
  },
  [SurveyFlow.ACCOUNT_PROMPT]: {
    primary: SurveyFlow.ACCOUNT_FORM,
    skip: SurveyFlow.RESULTS // If user chooses not to create account
  },
  [SurveyFlow.ACCOUNT_FORM]: {
    success: SurveyFlow.RESULTS,
    error: SurveyFlow.ACCOUNT_FORM // Stay on form with error message
  }
};
```

---

## Responsive Design Guidelines

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Adaptations
- Full-screen modal on mobile (100vh, 100vw)
- Larger touch targets (min 44px)
- Simplified progress bar (dots instead of bar)
- Stack all form elements vertically
- Larger font sizes for questions (18px minimum)

### Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation support
- Focus indicators (blue outline)
- Screen reader friendly progress announcements
- High contrast mode support
- Minimum AA WCAG compliance

---

## Animation & Transitions

```css
/* Page transitions */
.slide-in-left {
  animation: slideInLeft 0.3s ease-out;
}

@keyframes slideInLeft {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Success checkmark */
.checkmark-animation {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: checkmark 0.5s ease-out forwards;
}

@keyframes checkmark {
  to {
    stroke-dashoffset: 0;
  }
}
```

---

## Color Palette

```scss
$colors: (
  primary: #0891B2,        // Calming teal
  secondary: #059669,      // Supportive green
  background: #F0F9FF,     // Soft blue-white
  surface: #FFFFFF,        // Pure white
  text-primary: #111827,   // Near black
  text-secondary: #6B7280, // Gray
  success: #10B981,        // Green
  warning: #F59E0B,        // Amber
  danger: #EF4444,         // Red
  info: #3B82F6           // Blue
);
```

---

## Implementation Notes

1. **State Management**: Use React Context or Zustand for survey state
2. **Persistence**: Store incomplete surveys in localStorage
3. **Analytics**: Track drop-off points and completion rates
4. **A/B Testing**: Prepare hooks for testing different question orders
5. **Error Handling**: Graceful fallbacks for network issues
6. **Loading States**: Skeleton screens while data loads
7. **Validation**: Real-time validation with debouncing
8. **Security**: Rate limiting on account creation
9. **Performance**: Code-split survey component for faster initial load
10. **Testing**: Unit tests for scoring logic, E2E for complete flow
