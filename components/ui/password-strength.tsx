'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { validatePasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor, type PasswordStrength } from '@/lib/auth/password-validation';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  showRequirements = true,
  className,
}: PasswordStrengthIndicatorProps) {
  const [strength, setStrength] = useState<PasswordStrength>({ score: 0, feedback: [], isValid: false });

  useEffect(() => {
    if (password) {
      setStrength(validatePasswordStrength(password));
    } else {
      setStrength({ score: 0, feedback: [], isValid: false });
    }
  }, [password]);

  const getProgressColor = () => {
    const colors = {
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      gray: 'bg-gray-300',
    };
    return colors[getPasswordStrengthColor(strength.score) as keyof typeof colors] || colors.gray;
  };

  const getTextColor = () => {
    const colors = {
      red: 'text-red-600',
      orange: 'text-orange-600',
      yellow: 'text-yellow-600',
      blue: 'text-blue-600',
      green: 'text-green-600',
      gray: 'text-gray-500',
    };
    return colors[getPasswordStrengthColor(strength.score) as keyof typeof colors] || colors.gray;
  };

  if (!password) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Password Strength</span>
        <span className={cn('text-sm font-medium', getTextColor())}>
          {getPasswordStrengthLabel(strength.score)}
        </span>
      </div>
      
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300', getProgressColor())}
          style={{ width: `${(strength.score + 1) * 20}%` }}
        />
      </div>

      {showRequirements && strength.feedback.length > 0 && (
        <ul className="space-y-1 text-xs">
          {strength.feedback.map((item, index) => {
            const isPositive = item.includes('Good') || item.includes('Excellent') || item.includes('meets requirements');
            const Icon = isPositive ? CheckCircle2 : AlertCircle;
            const textColor = isPositive ? 'text-green-600' : 'text-gray-600';
            
            return (
              <li key={index} className={cn('flex items-start space-x-1', textColor)}>
                <Icon className="h-3 w-3 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrength?: boolean;
  showToggle?: boolean;
}

export function PasswordInput({
  showStrength = false,
  showToggle = true,
  className,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        {/*
          `Input`, not a hand-rolled `<input>`. This used to carry its own copy
          of an older `Input` class string, and the copy went stale: it kept
          `h-9`, `rounded-md`, `bg-transparent` and a `shadow-xs` that
          `components/ui/input.tsx` has since dropped for `h-10`,
          `rounded-[16px]`, `bg-white` and no shadow. On the sign-in form that
          put a shorter, squarer, shadowed password field between an email field
          and an invitation-code field that both use `Input`. Rendering the
          primitive is the only version that cannot drift again.
        */}
        <Input
          {...props}
          type={showPassword ? 'text' : 'password'}
          className={cn(showToggle && 'pr-10', className)}
          onChange={handleChange}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {showStrength && <PasswordStrengthIndicator password={password} />}
    </div>
  );
}