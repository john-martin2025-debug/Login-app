import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const PALETTES = ['indigo', 'emerald', 'sunset', 'ocean'];

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
    pill: 'JWT Session Active',
    title: 'You are all set.',
    text: 'Your session is active. Inspect your JWT, view PostgreSQL records, update your password, or sign out anytime.'
  },
  changePassword: {
    pill: 'Security Settings',
    title: 'Keep it fresh.',
    text: 'Update your account password anytime. Your new password is hashed with bcrypt before saving.'
  },
  database: {
    pill: 'PostgreSQL Inspector',
    title: 'Live Database View.',
    text: 'Search, export, or clean up test accounts directly from PostgreSQL. Passwords are always stored as one-way bcrypt hashes.'
  }
};

function getStoredToken() {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

function saveToken(token, remember) {
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_token');
  if (remember) localStorage.setItem('auth_token', token);
  else sessionStorage.setItem('auth_token', token);
}

function clearToken() {
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_token');
}

function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatLastLogin(timestamp) {
  if (!timestamp) return 'First time signing in!';
  return `Last login: ${new Date(timestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })}`;
}

function formatShortDate(timestamp) {
  if (!timestamp) return 'Today';
  return new Date(timestamp).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: '2-digit'
  });
}

function formatCountdown(expSeconds) {
  if (!expSeconds) return '--';
  const diff = Math.max(0, expSeconds - Math.floor(Date.now() / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
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
  const [autoCycle, setAutoCycle] = useState(true);
  const [paletteIndex, setPaletteIndex] = useState(0);

  const [currentUser, setCurrentUser] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [jwtPayload, setJwtPayload] = useState(null);
  const [showJwt, setShowJwt] = useState(false);
  const [sessionLeft, setSessionLeft] = useState('--');

  const [dbUsers, setDbUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [shaking, setShaking] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [genText, setGenText] = useState('Generate & Copy');

  const showToast = (text, isError = false) => {
    const id = Date.now();
    setToast({ id, text, isError });
    if (isError) {
      setShaking(false);
      requestAnimationFrame(() => setShaking(true));
    }
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3200);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', PALETTES[paletteIndex]);
  }, [paletteIndex]);

  useEffect(() => {
    if (!autoCycle) return;
    const timer = setInterval(() => {
      setPaletteIndex((prev) => (prev + 1) % PALETTES.length);
    }, 60000);
    return () => clearInterval(timer);
  }, [autoCycle]);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = setInterval(() => {
      setCooldownLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownLeft]);

  useEffect(() => {
    if (!jwtPayload?.exp) return;
    setSessionLeft(formatCountdown(jwtPayload.exp));
    const timer = setInterval(() => {
      setSessionLeft(formatCountdown(jwtPayload.exp));
    }, 1000);
    return () => clearInterval(timer);
  }, [jwtPayload]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setCurrentUser(data.user);
        setTotalUsers(data.totalUsers || 1);
        setJwtPayload(decodeJwt(token));
        setView('welcome');
      })
      .catch(() => clearToken());
  }, []);

  const switchView = (target) => {
    setView(target);
    setEmail('');
    setCurrentPassword('');
    setPassword('');
    setConfirmPassword('');
    setSearchQuery('');
  };

  const handleToggleAutoCycle = () => {
    setAutoCycle((prev) => {
      const next = !prev;
      showToast(next ? 'Auto-switching colours: ON' : 'Colour locked (constant)');
      return next;
    });
  };

  const handleOpenDatabase = async () => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDbUsers(data.users);
        setTotalUsers(data.users.length);
        switchView('database');
      } else {
        showToast(data.error, true);
      }
    } catch {
      showToast('Could not reach server', true);
    }
  };

  const handleInlineDelete = async (userId, userEmail) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API}/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (currentUser?.id === userId) {
          clearToken();
          setCurrentUser(null);
          setJwtPayload(null);
          switchView('login');
          showToast('Deleted your active account');
        } else {
          setDbUsers((prev) => prev.filter((u) => u.id !== userId));
          setTotalUsers((prev) => Math.max(0, prev - 1));
          showToast(`Removed ${userEmail}`);
        }
      } else {
        showToast(data.error, true);
      }
    } catch {
      showToast('Could not reach server', true);
    }
  };

  const handleExportCsv = () => {
    const header = 'ID,Email,Password_Hash,Created_At,Last_Login\n';
    const rows = filteredUsers
      .map((u) => `${u.id},"${u.email}","${u.password_hash}","${u.created_at || ''}","${u.last_login || ''}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'authportal_users.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported authportal_users.csv');
  };

  const handleLogout = () => {
    clearToken();
    setCurrentUser(null);
    setJwtPayload(null);
    setShowJwt(false);
    switchView('login');
    showToast('Signed out successfully');
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
    if (cooldownLeft > 0) return;
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        saveToken(data.token, rememberMe);
        setCurrentUser(data.user);
        setTotalUsers(data.totalUsers || 1);
        setJwtPayload(decodeJwt(data.token));
        setCooldownLeft(0);
        switchView('loading');
        setTimeout(() => setView('welcome'), 900);
      } else {
        if (data.retryAfter) setCooldownLeft(data.retryAfter);
        showToast(data.error, true);
      }
    } catch {
      showToast('Could not reach server', true);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return showToast('Passwords do not match', true);
    try {
      const res = await fetch(`${API}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        switchView('login');
        showToast(`${data.message}. You can now sign in.`);
      } else {
        showToast(data.error, true);
      }
    } catch {
      showToast('Could not reach server', true);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return showToast('Passwords do not match', true);
    try {
      const res = await fetch(`${API}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password })
      });
      const data = await res.json();
      if (res.ok) {
        switchView('login');
        showToast(data.message);
      } else {
        showToast(data.error, true);
      }
    } catch {
      showToast('Could not reach server', true);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return showToast('New passwords do not match', true);
    try {
      const token = getStoredToken();
      const res = await fetch(`${API}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword: password })
      });
      const data = await res.json();
      if (res.ok) {
        switchView('welcome');
        showToast(data.message);
      } else {
        showToast(data.error, true);
      }
    } catch {
      showToast('Could not reach server', true);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API}/delete-account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setShowDeleteModal(false);
      if (res.ok) {
        clearToken();
        setCurrentUser(null);
        setJwtPayload(null);
        switchView('login');
        showToast(data.message);
      } else {
        showToast(data.error, true);
      }
    } catch {
      setShowDeleteModal(false);
      showToast('Could not reach server', true);
    }
  };

  const strength = password ? getPasswordStrength(password) : null;
  const isMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const isMatch = confirmPassword.length > 0 && password === confirmPassword;
  const left = LEFT_CONTENT[view] || LEFT_CONTENT.login;
  const filteredUsers = dbUsers.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="layout">
      {toast && (
        <div className={`toast ${toast.isError ? 'error' : 'success'}`}>
          {toast.text}
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Account?</h3>
            <p>This will permanently remove <strong>{currentUser?.email}</strong> from PostgreSQL. This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="secondary" type="button" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="danger" type="button" onClick={handleDeleteAccount}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
            <span className="chip">JWT + Bcrypt</span>
            <span className="chip">PostgreSQL</span>
            <span className="chip">React + Express</span>
          </div>
        </div>

        <div className="left-footer">© 2026 AuthPortal. All rights reserved.</div>
      </section>

      <main className="right-panel">
        <div className="top-controls">
          <button
            className={`theme-toggle ${autoCycle ? 'cycle-on' : ''}`}
            type="button"
            onClick={handleToggleAutoCycle}
            title={autoCycle ? 'Auto-switch colours: ON (click to keep constant)' : 'Colour constant (click to auto-switch)'}
            aria-label="Toggle automatic colour switching"
          >
            {autoCycle ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
          </button>

          <button
            className="theme-toggle"
            type="button"
            onClick={() => setIsDark((d) => !d)}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode"
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
        </div>

        <div className={`auth-box ${view === 'database' ? 'wide' : ''} ${shaking ? 'shake' : ''}`} onAnimationEnd={() => setShaking(false)}>
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
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                <div className="auth-options-row">
                  <label className="remember-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember me
                  </label>
                  <button className="link-btn" type="button" onClick={() => switchView('forgot')}>
                    Forgot password?
                  </button>
                </div>
                <button className="primary" type="submit" disabled={cooldownLeft > 0}>
                  {cooldownLeft > 0 ? `Locked — ${cooldownLeft}s` : 'Sign In'}
                </button>
              </form>
              <p className="footer-text">
                Don&apos;t have an account?{' '}
                <button className="link-btn" type="button" onClick={() => switchView('signup')}>Sign up</button>
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
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                <div className="field-tools">
                  <span style={{ color: 'var(--text-muted)' }}>Need a strong password?</span>
                  <button type="button" className="gen-btn" onClick={handleGeneratePassword}>{genText}</button>
                </div>
                {strength && (
                  <div className="strength-container">
                    <div className="strength-track">
                      <div className="strength-fill" style={{ width: strength.width, backgroundColor: strength.color }} />
                    </div>
                    <div className="strength-meta">
                      <span>8+ chars, uppercase, number &amp; symbol</span>
                      <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
                    </div>
                  </div>
                )}
                <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" />
                <div className={`match-status ${isMatch ? 'match' : isMismatch ? 'mismatch' : ''}`}>
                  {isMatch ? '✓ Passwords match' : isMismatch ? '✕ Passwords do not match' : ''}
                </div>
                <button className="primary" type="submit" disabled={isMismatch}>Sign Up</button>
              </form>
              <p className="footer-text">
                Already have an account?{' '}
                <button className="link-btn" type="button" onClick={() => switchView('login')}>Sign in</button>
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
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New Password" />
                <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" />
                <div className={`match-status ${isMatch ? 'match' : isMismatch ? 'mismatch' : ''}`}>
                  {isMatch ? '✓ Passwords match' : isMismatch ? '✕ Passwords do not match' : ''}
                </div>
                <button className="primary" type="submit" disabled={isMismatch}>Reset Password</button>
              </form>
              <p className="footer-text">
                Remembered it?{' '}
                <button className="link-btn" type="button" onClick={() => switchView('login')}>Sign in</button>
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
              <p className="last-login">{formatLastLogin(currentUser?.last_login)}</p>

              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">Member Since</span>
                  <span className="stat-value">{formatShortDate(currentUser?.created_at)}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Total Users</span>
                  <span className="stat-value">{totalUsers}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Session Left</span>
                  <span className="stat-value">{sessionLeft}</span>
                </div>
              </div>

              {showJwt && jwtPayload && (
                <div className="jwt-panel">
                  <pre className="jwt-pre">
                    {JSON.stringify(
                      {
                        id: jwtPayload.id,
                        email: jwtPayload.email,
                        issued: new Date(jwtPayload.iat * 1000).toLocaleTimeString('en-IN'),
                        expires: new Date(jwtPayload.exp * 1000).toLocaleTimeString('en-IN')
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}

              <div className="welcome-actions">
                <button className="primary" type="button" onClick={handleOpenDatabase}>
                  View Database Users
                </button>
                <button className="secondary" type="button" onClick={() => setShowJwt((s) => !s)}>
                  {showJwt ? 'Hide My JWT' : 'View My JWT'}
                </button>
                <button className="secondary" type="button" onClick={() => switchView('changePassword')}>
                  Change Password
                </button>
                <button className="secondary" type="button" onClick={handleLogout}>
                  Sign Out
                </button>
                <button className="danger" type="button" onClick={() => setShowDeleteModal(true)}>
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {view === 'database' && (
            <div className="view">
              <h1>Database Users</h1>
              <p className="subtitle">Showing {filteredUsers.length} of {dbUsers.length} PostgreSQL records</p>

              <div className="db-toolbar">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email..."
                />
                <button className="secondary export-btn" type="button" onClick={handleExportCsv}>
                  Export CSV
                </button>
              </div>

              <div className="db-table-wrap">
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Email</th>
                      <th>Bcrypt Hash</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.email}</td>
                        <td className="hash-cell" title={u.password_hash}>
                          {u.password_hash.slice(0, 16)}...
                        </td>
                        <td>
                          <button
                            type="button"
                            className="icon-danger-btn"
                            title={`Delete ${u.email}`}
                            onClick={() => handleInlineDelete(u.id, u.email)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button className="secondary" type="button" onClick={() => switchView('welcome')}>
                Back to Dashboard
              </button>
            </div>
          )}

          {view === 'changePassword' && (
            <div className="view">
              <h1>Change Password</h1>
              <p className="subtitle">Update password for {currentUser?.email}</p>
              <form onSubmit={handleChangePassword}>
                <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current Password" />
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New Password" />
                <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" />
                <div className={`match-status ${isMatch ? 'match' : isMismatch ? 'mismatch' : ''}`}>
                  {isMatch ? '✓ Passwords match' : isMismatch ? '✕ Passwords do not match' : ''}
                </div>
                <button className="primary" type="submit" disabled={isMismatch}>Update Password</button>
                <button className="secondary" type="button" onClick={() => switchView('welcome')}>Cancel</button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
