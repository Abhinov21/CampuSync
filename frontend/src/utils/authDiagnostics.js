import api from './api';

/**
 * Diagnose authentication issues
 * Checks local token, user object, and database records
 */
export const diagnoseAuth = async () => {
  try {
    const localToken = localStorage.getItem('authToken');
    const localUser = JSON.parse(localStorage.getItem('user') || 'null');

    // Decode token
    const decodeToken = (token) => {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
      } catch (e) {
        return null;
      }
    };

    const tokenDecoded = decodeToken(localToken);

    // Fetch server diagnostics
    const serverDiag = await api.get('/api/sessions/debug/auth-info').catch(() => null);

    const report = {
      timestamp: new Date().toISOString(),
      localStorage: {
        hasToken: !!localToken,
        tokenLength: localToken?.length,
        user: localUser,
        userRole: localUser?.role,
      },
      tokenDecoded: {
        role: tokenDecoded?.role,
        userId: tokenDecoded?.userId,
        email: tokenDecoded?.email,
        exp: tokenDecoded?.exp ? new Date(tokenDecoded.exp * 1000).toISOString() : null,
        isExpired: tokenDecoded?.exp ? new Date(tokenDecoded.exp * 1000) < new Date() : null,
      },
      serverDiagnostics: serverDiag?.data?.data || null,
      issues: [],
      warnings: [],
    };

    // Check for issues
    if (!localToken) report.issues.push('No auth token in localStorage');
    if (!localUser) report.issues.push('No user object in localStorage');
    if (!tokenDecoded) report.issues.push('Token could not be decoded');
    
    if (localUser?.role !== tokenDecoded?.role) {
      report.issues.push(`Role mismatch: localStorage has "${localUser?.role}" but token has "${tokenDecoded?.role}"`);
    }

    if (serverDiag?.data?.data?.roleMatch?.issue) {
      report.issues.push(`Server database issue: ${serverDiag.data.data.roleMatch.issue}`);
    }

    if (tokenDecoded?.exp && new Date(tokenDecoded.exp * 1000) < new Date()) {
      report.warnings.push('Token is expired or expiring soon');
    }

    // Log report
    console.group('🔐 Authentication Diagnostics');
    console.log('Report:', report);
    if (report.issues.length > 0) {
      console.error('❌ ISSUES FOUND:', report.issues);
    }
    if (report.warnings.length > 0) {
      console.warn('⚠️  WARNINGS:', report.warnings);
    }
    console.groupEnd();

    return report;
  } catch (error) {
    console.error('Failed to diagnose auth:', error);
    return { error: error.message };
  }
};

/**
 * Fix authentication by forcing fresh login
 * Clears storage and redirects to login
 */
export const fixAuth = () => {
  console.warn('🔄 Fixing authentication - clearing storage and redirecting...');
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.href = '/login?next=' + window.location.pathname;
};

/**
 * Verify user can perform action
 */
export const verifyPermission = (requiredRole) => {
  const localUser = JSON.parse(localStorage.getItem('user') || 'null');
  const localToken = localStorage.getItem('authToken');

  if (!localToken || !localUser) {
    return { allowed: false, reason: 'Not logged in' };
  }

  if (localUser.role !== requiredRole) {
    return { allowed: false, reason: `Your role is "${localUser.role}" but "${requiredRole}" is required` };
  }

  return { allowed: true };
};
