import { signInWithGoogle, signInWithGitHub } from '@/app/actions/auth';

interface OAuthFormProps {
  provider: 'google' | 'github';
  disabled?: boolean;
  children: React.ReactNode;
}

export function OAuthForm({ provider, disabled, children }: OAuthFormProps) {
  const action = provider === 'google' ? signInWithGoogle : signInWithGitHub;

  return (
    <form
      action={action}
      onSubmit={disabled ? (e) => e.preventDefault() : undefined}
    >
      {children}
    </form>
  );
}
