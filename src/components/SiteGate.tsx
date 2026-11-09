import { useState, type FormEvent, type ReactNode } from 'react';
import { hashPasscode } from '../data/store';

/**
 * Light site lock. Only a hash of the family password is stored here, never the password.
 * This keeps out people who stumble on the link; it is not real security (the repo and
 * database address are public). To change the password, replace this hash with
 * hashPasscode('<new password in lowercase>').
 */
const SITE_PASSWORD_HASH = 'e582547c02c0276d547aa49abedf5e82c2dc47e3cddf584bd413ba283978ac66';
const UNLOCK_KEY = 'care-blocks-site-unlock';

function isUnlocked() {
  try {
    return localStorage.getItem(UNLOCK_KEY) === SITE_PASSWORD_HASH;
  } catch {
    return false;
  }
}

export function lockThisDevice() {
  try {
    localStorage.removeItem(UNLOCK_KEY);
  } catch {
    /* ignore */
  }
  location.reload();
}

export function SiteGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  if (unlocked) return <>{children}</>;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password.trim()) return setError('Enter the family password.');
    setChecking(true);
    const hash = await hashPasscode(password.trim().toLowerCase());
    setChecking(false);
    if (hash !== SITE_PASSWORD_HASH) {
      setError('That password isn’t right. Check with Kevin, Brian or Angie.');
      return;
    }
    try {
      localStorage.setItem(UNLOCK_KEY, hash);
    } catch {
      /* private mode: stay unlocked for this visit only */
    }
    setUnlocked(true);
  };

  return (
    <main className="app gate">
      <form className="gate-card" onSubmit={submit}>
        <h1>Care Blocks</h1>
        <p className="gate-intro">Enter the family password to see the care schedule.</p>
        <div className="field">
          <label htmlFor="site-password">Family password</label>
          <div className="password-row">
            <input
              id="site-password"
              className="input"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline password-toggle"
              aria-pressed={show}
              onClick={() => setShow((s) => !s)}
            >
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-neutral btn-block gate-submit" disabled={checking}>
          {checking ? 'Checking…' : 'Open schedule'}
        </button>
      </form>
    </main>
  );
}
