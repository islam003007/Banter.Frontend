import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { PrivateWindowNote } from '../../../components/ui/PrivateWindowNote';

interface PasswordLoginFormProps {
  pending: boolean;
  error: string | null;
  onLogin: (email: string, password: string) => void;
}

export function PasswordLoginForm({ pending, error, onLogin }: PasswordLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onLogin(email.trim(), password);
  };

  return (
    <>
      <form className="board-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label mono">email</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <div className="field">
          <label className="field__label mono" htmlFor="login-password">
            password
          </label>
          <span className="field__password">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
            />
            <button
              type="button"
              className="field__reveal"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={17} aria-hidden="true" />
              ) : (
                <Eye size={17} aria-hidden="true" />
              )}
            </button>
          </span>
        </div>

        <button
          type="submit"
          className="button button--ink board-form__submit"
          disabled={pending}
        >
          {pending && <Loader2 className="spin" size={16} aria-hidden="true" />}
          {pending ? 'Signing in…' : 'Sign in'}
        </button>

        {error && (
          <p className="form-error board-form-error" role="alert">
            {error}
          </p>
        )}
      </form>

      <div className="board-form__foot">
        <div className="board-form__links">
          <p>
            New here?{' '}
            <Link to="/register" className="inline-link">
              Create an account
            </Link>
          </p>
          <p className="mono">your session stays in this browser</p>
        </div>
        <PrivateWindowNote compact />
      </div>
    </>
  );
}
