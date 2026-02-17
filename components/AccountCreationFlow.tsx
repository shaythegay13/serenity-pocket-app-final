'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AccountCreationFlowProps {
  email: string;
  surveyId?: string;
  onComplete?: () => void;
}

export default function AccountCreationFlow({ email, surveyId, onComplete }: AccountCreationFlowProps) {
  const router = useRouter();
  const [emailValue, setEmailValue] = useState(email || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Calculate password strength
  const calculatePasswordStrength = (pwd: string): number => {
    let strength = 0;

    // Length check
    if (pwd.length >= 8) strength += 20;
    if (pwd.length >= 12) strength += 10;

    // Character type checks
    if (/[a-z]/.test(pwd)) strength += 15;
    if (/[A-Z]/.test(pwd)) strength += 15;
    if (/[0-9]/.test(pwd)) strength += 20;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 20;

    return Math.min(100, strength);
  };

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-destructive';
    if (passwordStrength < 60) return 'bg-yellow-500';
    if (passwordStrength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 60) return 'Fair';
    if (passwordStrength < 80) return 'Good';
    return 'Strong';
  };

  const handleCreateAccount = async () => {
    setError(null);

    if (!emailValue) {
      setError('Please enter your email');
      return;
    }

    // Validation
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (passwordStrength < 60) {
      setError('Please choose a stronger password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsCreating(true);

    try {
      // Check if username is already taken
      const { data: existingUser, error: usernameError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (usernameError) {
        console.error('Error checking username:', usernameError);
      }

      if (existingUser) {
        setError('Username is already taken. Please choose another one.');
        setIsCreating(false);
        return;
      }

      // Create account with Supabase
      const userMetadata: Record<string, any> = { username };
      if (surveyId) userMetadata.initial_survey_id = surveyId;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailValue,
        password,
        options: {
          data: userMetadata,
          emailRedirectTo: `${window.location.origin}/survey-link/confirm?email=${encodeURIComponent(emailValue)}`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      // Explicitly create user profile row immediately to ensure email is synced
      if (data.user) {
        try {
          console.log('📝 Creating/Syncing user profile for:', data.user.id);
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
              id: data.user.id,
              username: username,
              email: emailValue, // Explicitly assign email
              name: username,    // Default name to username
            }, { onConflict: 'id' });

          if (profileError) {
            console.error('Error syncing profile on signup:', profileError);
          } else {
            console.log('✅ Profile synced successfully on signup');
          }
        } catch (profileErr) {
          console.error('Unexpected error syncing profile:', profileErr);
        }
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required - show success message with instructions
        console.log('Email confirmation required for user:', data.user.id);

        // Store pending survey info in localStorage for after email confirmation
        if (typeof window !== 'undefined' && surveyId) {
          localStorage.setItem('pending_survey_link', JSON.stringify({
            email: emailValue,
            surveyId,
            timestamp: Date.now(),
          }));
        }

        // Show success message instead of error
        onComplete?.();
        router.push(`/signup-success?email=${encodeURIComponent(emailValue)}`);
        return;
      }

      // If we have a session, the user is automatically signed in (auto-confirm enabled)
      console.log('Account created successfully with auto-confirm');

      // Wait for session cookies to be properly set
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Link the survey to the new account
      try {
        console.log('Linking survey to account...');
        const linkResponse = await fetch('/api/gambling-survey/link-confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
          credentials: 'include',
        });

        if (linkResponse.ok) {
          console.log('Survey linked successfully');
        } else {
          console.warn('Survey linking failed, will be handled on first login');
        }
      } catch (linkError) {
        console.error('Survey linking error:', linkError);
      }

      // Navigate to the dedicated survey page
      onComplete?.();
      router.push('/survey');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Account creation error:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Create Your Account</h2>
        <p className="text-muted-foreground">
          Your survey has been saved. Create an account to view your results and track your progress.
        </p>
      </div>

      <div className="space-y-4">
        {/* Email (disabled) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            disabled={isCreating || !!email}
            className={(isCreating || !!email) ? "bg-muted" : ""}
          />
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            disabled={isCreating}
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              disabled={isCreating}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isCreating}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Password strength:</span>
                <span className="font-medium">{getPasswordStrengthText()}</span>
              </div>
              <Progress
                value={passwordStrength}
                className={`h-1 ${getPasswordStrengthColor()}`}
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1">
                  {password.length >= 8 ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-1">
                  {/[A-Z]/.test(password) && /[a-z]/.test(password) ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span>Upper and lowercase letters</span>
                </div>
                <div className="flex items-center gap-1">
                  {/[0-9]/.test(password) ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span>At least one number</span>
                </div>
                <div className="flex items-center gap-1">
                  {/[^a-zA-Z0-9]/.test(password) ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span>At least one special character</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              disabled={isCreating}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isCreating}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit button */}
        <Button
          onClick={handleCreateAccount}
          disabled={isCreating || !username || !password || !confirmPassword}
          className="w-full"
        >
          {isCreating ? 'Creating Account...' : 'Create Account'}
        </Button>

        {/* Sign in link */}
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:underline">
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
