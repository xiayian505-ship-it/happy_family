(() => {
  'use strict';

  const PROJECT_URL = 'https://kscbrnmhqugcwfohczve.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_E00oHxUzDH-P_26ippQb5Q_d8X0-MMG';
  const SELECT = 'month_id,display_month,people,roster_values,revision,published_at';

  async function select(query = '') {
    const response = await fetch(`${PROJECT_URL}/rest/v1/roster_public_months?select=${encodeURIComponent(SELECT)}${query}`, {
      headers: {
        apikey: PUBLISHABLE_KEY,
        Authorization: `Bearer ${PUBLISHABLE_KEY}`,
        Accept: 'application/json'
      }
    });
    let payload = null;
    try {
      payload = await response.json();
    } catch (_error) {
      // Handled below as an invalid response.
    }
    if (!response.ok || !Array.isArray(payload)) {
      const error = new Error(payload?.message || `公開班表讀取失敗（${response.status}）。`);
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  function normalizeRow(row) {
    if (!row || typeof row !== 'object') return null;
    const people = row.people && typeof row.people === 'object' && !Array.isArray(row.people) ? row.people : {};
    const rosterValues = row.roster_values && typeof row.roster_values === 'object' && !Array.isArray(row.roster_values)
      ? row.roster_values
      : {};
    return {
      monthId: String(row.month_id || ''),
      displayMonth: String(row.display_month || row.month_id || ''),
      people,
      rosterValues,
      revision: Number(row.revision) || 0,
      publishedAt: row.published_at || null
    };
  }

  window.ShiftRosterPublic = Object.freeze({
    listMonths: async () => (await select('&order=month_id.desc')).map(normalizeRow).filter(Boolean),
    getMonth: async (monthId) => {
      const rows = await select(`&month_id=eq.${encodeURIComponent(monthId)}&limit=1`);
      return rows.length ? normalizeRow(rows[0]) : null;
    }
  });
})();
