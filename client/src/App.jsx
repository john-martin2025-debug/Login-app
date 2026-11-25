import { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

const LEFT_CONTENT = {
  login: {
    pill: 'Secure Portal',
    title: 'Welcome back.',
    text: 'Pick up right where you left off. Sign in with your email and password to jump back into your workspace.'
  },
  signup: {
    pill: 'Quick Setup',
    title: 'Start something new.',
    text: 'Create your account in a few seconds. Pick a strong password—or let us generate one for you—and you are good to go.'
  },
  forgot: {
    pill: 'Account Recovery',
    title: 'Happens to the best of us.',
    text: 'No stress—enter your registered email and set a fresh password to get right back in.'
  },
  loading: {
    pill: 'Verifying',
    title: 'Almost there...',
    text: 'Checking your encrypted credentials and preparing your session.'
  },
  welcome: {
    pill: 'Session Active',
    title: 'You are all set.',
    text: 'Your session is active and ready. Whenever you want to switch accounts, just hit Back.'
  }
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { width: '25%', label: 'Weak', color: '#ef4444' },
    { width: '50%', label: 'Fair', color: '#f59e0b' },
    { width: '75%', label: 'Good', color: '#3b82f6' },
    { width: '100%', label: 'Strong', color: '#10b981' }
  ];
  return levels[Math.max(0, score - 1)];
}

function BrandLogoSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function PasswordInput({ value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  const handleKey = (e) => {
    if (typeof e.getModifierState === 'function') {
      setCapsOn(e.getModifierState('CapsLock'));
    }
  };

  return (
    <div className="password-wrapper">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onKeyDown={handleKey}
        onKeyUp={handleKey}
        onBlur={() => setCapsOn(false)}
        placeholder={placeholder}
        required
      />
      {capsOn && <span className="caps-pill">CAPS</span>}
      <button
        type="button"
        className="toggle-password"
        onClick={() => setVisible((v) => !v)}
        aria-label="Toggle password visibility"
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('login');
  const [isDark, setIsDark] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [shaking, setShaking] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [genText, setGenText] = useState('Generate & Copy');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && view !== 'login' && view !== 'loading') {
        setCurrentUser(null);
        switchView('login');
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [view]);

  const showMessage = (text, isError = false) => {
    setMessage({ text, isError });
    if (isError) {
      setShaking(false);
      requestAnimationFrame(() => setShaking(true));
    }
  };

  const switchView = (target, nextMessage = { text: '', isError: false }) => {
    setView(target);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setMessage(nextMessage);
  };

  const handleGeneratePassword = async () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let generated = '';
    for (let i = 0; i < 14; i++) {
      generated += chars[Math.floor(Math.random() * chars.length)];
    }
    setPassword(generated);
    setConfirmPassword(generated);
    try {
      await navigator.clipboard.writeText(generated);
      setGenText('Copied!');
    } catch {
      setGenText('Generated!');
    }
    setTimeout(() => setGenText('Generate & Copy'), 1500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        switchView('loading');
        setTimeout(() => setView('welcome'), 1200);
      } else {
        showMessage(data.error, true);
      }
    } catch {
      showMessage('Could not reach server', true);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return showMessage('Passwords do not match', true);
    }
    try {
      const res = await fetch(`${API}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        switchView('login', { text: `${data.message}. You can now sign in.`, isError: false });
      } else {
        showMessage(data.error, true);
      }
    } catch {
      showMessage('Could not reach server', true);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return showMessage('Passwords do not match', true);
    }
    try {
      const res = await fetch(`${API}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password })
      });
      const data = await res.json();
      if (res.ok) {
        switchView('login', { text: data.message, isError: false });
      } else {
        showMessage(data.error, true);
      }
    } catch {
      showMessage('Could not reach server', true);
    }
  };

  const strength = password ? getPasswordStrength(password) : null;
  const isMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const isMatch = confirmPassword.length > 0 && password === confirmPassword;
  const left = LEFT_CONTENT[view] || LEFT_CONTENT.login;

  return (
    <div className="layout">
      <section className="left-space">
        <div className="grid-overlay" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />

        <div className="brand-mark">
          <div className="brand-icon">
            <BrandLogoSvg />
          </div>
          <span>AuthPortal</span>
        </div>

        <div className="placeholder-copy" key={view}>
          <div className="hero-pill">
            <span className="pill-dot" />
            {left.pill}
          </div>
          <h2>{left.title}</h2>
          <p>{left.text}</p>
          <div className="feature-chips">
            <span className="chip">Bcrypt Security</span>
            <span className="chip">PostgreSQL</span>
            <span className="chip">React + Express</span>
          </div>
        </div>

        <div className="left-footer">© 2026 AuthPortal. All rights reserved.</div>
      </section>

      <main className="right-panel">
        <button
          className="theme-toggle"
          type="button"
          onClick={() => setIsDark((d) => !d)}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        <div className={`auth-box ${shaking ? 'shake' : ''}`} onAnimationEnd={() => setShaking(false)}>
          <div className="mobile-brand">
            <div className="mobile-brand-icon">
              <BrandLogoSvg />
            </div>
            <span>AuthPortal</span>
          </div>

          {view === 'login' && (
            <div className="view">
              <h1>Sign In</h1>
              <p className="subtitle">Enter your credentials to continue</p>
              <form onSubmit={handleLogin}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoFocus
                  required
                />
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />
                <div className="row-right">
                  <button className="link-btn" type="button" onClick={() => switchView('forgot')}>
                    Forgot password?
                  </button>
                </div>
                <button className="primary" type="submit">Sign In</button>
              </form>
              <p className="footer-text">
                Don&apos;t have an account?{' '}
                <button className="link-btn" type="button" onClick={() => switchView('signup')}>
                  Sign up
                </button>
              </p>
            </div>
          )}

          {view === 'signup' && (
            <div className="view">
              <h1>Create Account</h1>
              <p className="subtitle">Sign up to get started</p>
              <form onSubmit={handleSignup}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoFocus
                  required
                />
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />
                <div className="field-tools">
                  <span style={{ color: 'var(--text-muted)' }}>Need a strong password?</span>
                  <button type="button" className="gen-btn" onClick={handleGeneratePassword}>
                    {genText}
                  </button>
                </div>
                {strength && (
                  <div className="strength-container">
                    <div className="strength-track">
                      <div
                        className="strength-fill"
                        style={{ width: strength.width, backgroundColor: strength.color }}
                      />
                    </div>
                    <div className="strength-meta">
                      <span>8+ chars, uppercase, number &amp; symbol</span>
                      <span className="strength-label" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                  </div>
                )}
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                />
                <div className={`match-status ${isMatch ? 'match' : isMismatch ? 'mismatch' : ''}`}>
                  {isMatch ? '✓ Passwords match' : isMismatch ? '✕ Passwords do not match' : ''}
                </div>
                <button className="primary" type="submit" disabled={isMismatch}>Sign Up</button>
              </form>
              <p className="footer-text">
                Already have an account?{' '}
                <button className="link-btn" type="button" onClick={() => switchView('login')}>
                  Sign in
                </button>
              </p>
            </div>
          )}

          {view === 'forgot' && (
            <div className="view">
              <h1>Reset Password</h1>
              <p className="subtitle">Enter your email and a new password</p>
              <form onSubmit={handleForgot}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Registered Email"
                  autoFocus
                  required
                />
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password"
                />
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                />
                <div className={`match-status ${isMatch ? 'match' : isMismatch ? 'mismatch' : ''}`}>
                  {isMatch ? '✓ Passwords match' : isMismatch ? '✕ Passwords do not match' : ''}
                </div>
                <button className="primary" type="submit" disabled={isMismatch}>Reset Password</button>
              </form>
              <p className="footer-text">
                Remembered it?{' '}
                <button className="link-btn" type="button" onClick={() => switchView('login')}>
                  Sign in
                </button>
              </p>
            </div>
          )}

          {view === 'loading' && (
            <div className="view">
              <div className="loading-box">
                <div className="spinner" />
                <p className="loading-text">Signing in...</p>
              </div>
            </div>
          )}

          {view === 'welcome' && (
            <div className="view">
              <div className="welcome-header">
                <div className="welcome-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h1>{getGreeting()}</h1>
                <p className="subtitle">You have signed in successfully</p>
              </div>
              <div className="badge">{currentUser?.email}</div>
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  setCurrentUser(null);
                  switchView('login');
                }}
              >
                Back
              </button>
            </div>
          )}

          {message.text && (
            <p className={`message ${message.isError ? 'error' : 'success'}`}>
              {message.text}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
