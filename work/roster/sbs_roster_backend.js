(() => {
  'use strict';

  const PROJECT_URL = 'https://kscbrnmhqugcwfohczve.supabase.co';
  const API_URL = `${PROJECT_URL}/functions/v1/roster-admin`;

  class RosterApiError extends Error {
    constructor(message, { status = 0, code = 'network_error', response = null, diagnostic = null } = {}) {
      super(message);
      this.name = 'RosterApiError';
      this.status = status;
      this.code = code;
      this.response = response;
      this.diagnostic = diagnostic;
    }
  }

  async function request(path, { method = 'GET', sessionToken = '', body, diagnostic = {} } = {}) {
    const headers = { Accept: 'application/json' };
    if (sessionToken) headers['x-roster-session'] = sessionToken;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const endpoint = `${API_URL}${path}`;
    const safeDiagnostic = { endpoint, method, ...diagnostic };
    let serializedBody;
    try {
      serializedBody = body === undefined ? undefined : JSON.stringify(body);
    } catch (error) {
      throw new RosterApiError(error?.message || '遠端 request 無法序列化。', {
        code: 'serialization_error',
        diagnostic: safeDiagnostic
      });
    }

    let response;
    try {
      response = await fetch(endpoint, {
        method,
        headers,
        body: serializedBody
      });
    } catch (error) {
      throw new RosterApiError(error?.message || '無法連線至班表服務。', {
        diagnostic: safeDiagnostic
      });
    }

    let payload = null;
    try {
      payload = await response.json();
    } catch (_error) {
      // A non-JSON response is never a valid roster-admin contract response.
    }
    if (!response.ok) {
      throw new RosterApiError(payload?.error?.message || `班表服務回應錯誤（${response.status}）。`, {
        status: response.status,
        code: payload?.error?.code || 'server_error',
        response: payload,
        diagnostic: { ...safeDiagnostic, status: response.status }
      });
    }
    return payload;
  }

  const authenticated = (path, method, sessionToken, body, diagnostic) => request(path, {
    method,
    sessionToken,
    body,
    diagnostic
  });

  window.ShiftRosterBackend = Object.freeze({
    PROJECT_URL,
    RosterApiError,
    login: (password) => request('/login', { method: 'POST', body: { password } }),
    session: (token) => authenticated('/session', 'GET', token),
    logout: (token) => authenticated('/logout', 'POST', token),
    bootstrap: (token) => authenticated('/bootstrap', 'GET', token),
    getMonth: (token, monthId) => authenticated(`/months/${encodeURIComponent(monthId)}`, 'GET', token),
    saveMonth: (token, monthId, snapshot, expectedRevision, publish) => authenticated(
      `/months/${encodeURIComponent(monthId)}`,
      'PUT',
      token,
      { snapshot, expected_revision: expectedRevision, publish: Boolean(publish) },
      {
        monthId,
        expectedRevision,
        publish: Boolean(publish),
        snapshotMonth: snapshot?.month
      }
    ),
    saveSettings: (token, settings) => authenticated('/settings', 'PUT', token, { data: settings }),
    saveEmployees: (token, employees) => authenticated('/employees', 'PUT', token, { data: employees }),
    saveSpecialDays: (token, year, specialDays) => authenticated(
      `/special-days/${encodeURIComponent(String(year))}`,
      'PUT',
      token,
      { data: specialDays }
    ),
    replaceAll: (token, backup) => authenticated('/replace-all', 'POST', token, { payload: backup }),
    cleanup: (token, before) => authenticated(`/months?before=${encodeURIComponent(before)}`, 'DELETE', token),
    changePassword: (token, currentPassword, newPassword) => authenticated('/password', 'POST', token, {
      current_password: currentPassword,
      new_password: newPassword
    })
  });
})();
