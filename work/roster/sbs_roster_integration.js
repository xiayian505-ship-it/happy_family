(() => {
  'use strict';

  const SESSION_KEY = 'sbs_roster_editor_session';
  const SESSION_EXPIRY_KEY = 'sbs_roster_editor_expires_at';
  const VALID_MODES = new Set(['standalone', 'public', 'editor']);
  const requestedMode = new URL(window.location.href).searchParams.get('mode');
  let mode = VALID_MODES.has(requestedMode) ? requestedMode : 'standalone';
  let token = '';
  let revisions = new Map();
  let currentPublished = false;
  let dirty = false;
  let mutationQueue = Promise.resolve();
  let pendingRemoteBackup = null;

  const byId = (id) => document.getElementById(id);
  const status = (message, kind = '') => {
    const element = byId('rosterRemoteStatus');
    if (!element) return;
    element.textContent = message;
    element.dataset.kind = kind;
  };

  function setModeUrl(nextMode) {
    const url = new URL(window.location.href);
    if (nextMode === 'standalone') url.searchParams.delete('mode');
    else url.searchParams.set('mode', nextMode);
    window.location.assign(url.toString());
  }

  function clearSession() {
    token = '';
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_EXPIRY_KEY);
    revisions.clear();
    currentPublished = false;
  }

  function saveSession(payload) {
    token = String(payload?.session_token || '');
    if (!token) throw new Error('登入回應缺少 session token。');
    sessionStorage.setItem(SESSION_KEY, token);
    if (payload.expires_at) sessionStorage.setItem(SESSION_EXPIRY_KEY, String(payload.expires_at));
  }

  function isUnauthorized(error) {
    return error?.status === 401 && error?.code === 'unauthorized';
  }

  function handleApiError(error, fallback = '遠端操作失敗。') {
    if (isUnauthorized(error)) {
      clearSession();
      window.location.reload();
      return;
    }
    status(error?.message || fallback, 'error');
    window.alert(error?.message || fallback);
  }

  function applyModeUi() {
    document.body.dataset.rosterMode = mode;
    document.querySelectorAll('[data-roster-mode]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.rosterMode === mode);
      button.addEventListener('click', () => setModeUrl(button.dataset.rosterMode));
    });

    const editor = mode === 'editor';
    const publicMode = mode === 'public';
    ['rosterRemoteSave', 'rosterPublishToggle', 'rosterPasswordButton', 'rosterLogoutButton'].forEach((id) => {
      byId(id).hidden = !editor;
    });
    byId('rosterPublicPng').hidden = !publicMode;
    byId('rosterPublicPrint').hidden = !publicMode;
    if (publicMode) {
      document.querySelector('.management-menu')?.remove();
      document.querySelector('.roster-secondary-row')?.remove();
      document.querySelector('.special-dates-reminder')?.remove();
      document.getElementById('settingsViewTab')?.remove();
      document.getElementById('rulesViewTab')?.remove();
      document.getElementById('settingsView')?.remove();
      document.getElementById('rulesView')?.remove();
      document.getElementById('publicLeaveInput')?.removeAttribute('contenteditable');
    }
  }

  function parseMonthId(monthId) {
    const match = String(monthId || '').match(/^(\d{4})-(0[1-9]|1[0-2])$/);
    return match ? { year: Number(match[1]), month: Number(match[2]) } : null;
  }

  function emptyPublicSnapshot(monthId, row = null) {
    return {
      month: monthId,
      people: row?.people || {},
      specialLeaveValues: [],
      rosterValues: row?.rosterValues || {},
      blockedVacationOverrides: {},
      specialShiftCells: [],
      nightShiftOverrides: {},
      leaveTypeValues: {},
      leaveNoteValues: {},
      manualNotes: {},
      extraLeaves: {},
      annualGrantDecisions: {},
      annualBalanceCalibrations: {},
      specialShiftTimes: {},
      nightShiftTimes: {},
      meetingDays: [],
      meetingNoteValues: {},
      supervisorLeaveDays: []
    };
  }

  async function loadPublicMonth(year, month) {
    const monthId = `${year}-${String(month).padStart(2, '0')}`;
    status(`讀取 ${monthId} 公開班表…`);
    try {
      const row = await window.ShiftRosterPublic.getMonth(monthId);
      window.ShiftRosterApp.loadSnapshot(year, month, emptyPublicSnapshot(monthId, row));
      status(row ? `${row.displayMonth}｜公開版本 ${row.revision}` : `${monthId} 尚未發布`, row ? 'success' : 'notice');
    } catch (error) {
      window.ShiftRosterApp.loadSnapshot(year, month, emptyPublicSnapshot(monthId));
      status(error?.message || '公開班表讀取失敗。', 'error');
    }
  }

  async function initializePublic() {
    window.ShiftRosterStorage.setMode('public');
    status('讀取公開班表…');
    let initial = null;
    try {
      const rows = await window.ShiftRosterPublic.listMonths();
      initial = rows[0] || null;
    } catch (error) {
      status(error?.message || '公開班表讀取失敗。', 'error');
    }
    const parsed = parseMonthId(initial?.monthId) || (() => {
      const date = new Date();
      return { year: date.getFullYear(), month: date.getMonth() + 1 };
    })();
    window.ShiftRosterApp.initialize({
      mode: 'public',
      year: parsed.year,
      month: parsed.month,
      snapshot: emptyPublicSnapshot(`${parsed.year}-${String(parsed.month).padStart(2, '0')}`, initial)
    });
    status(initial ? `${initial.displayMonth}｜公開版本 ${initial.revision}` : '目前沒有已發布班表', initial ? 'success' : 'notice');
  }

  function makeRemoteBackup(data) {
    const months = {};
    revisions = new Map();
    for (const [monthId, entry] of Object.entries(data.months || {})) {
      months[monthId] = entry.snapshot;
      revisions.set(monthId, { revision: Number(entry.revision) || 0, published: entry.published === true });
    }
    return {
      format: 'elitehotel-shift-roster-v3',
      schemaVersion: 3,
      settings: data.settings || {},
      employees: data.employees || {},
      months,
      specialDays: data.specialDays || {}
    };
  }

  function setEditorMutationListener() {
    window.ShiftRosterStorage.setChangeListener((kind, payload) => {
      if (kind === 'month') {
        dirty = true;
        status('尚未儲存至遠端', 'notice');
        return;
      }
      if (!token || !['settings', 'employees', 'specialDays'].includes(kind)) return;
      mutationQueue = mutationQueue.then(async () => {
        if (kind === 'settings') await window.ShiftRosterBackend.saveSettings(token, payload);
        else if (kind === 'employees') await window.ShiftRosterBackend.saveEmployees(token, payload);
        else await window.ShiftRosterBackend.saveSpecialDays(token, payload.year, payload.data);
        status('遠端資料已更新', 'success');
      }).catch((error) => handleApiError(error));
    });
  }

  function applyBootstrap(payload) {
    const data = payload?.data;
    if (!payload?.ok || data?.schemaVersion !== 3 || !data.months || Array.isArray(data.months)) {
      throw new Error('遠端 bootstrap 格式不符合 roster v3 contract。');
    }
    window.ShiftRosterStorage.setMode('editor');
    window.ShiftRosterStorage.hydrateRemote(makeRemoteBackup(data));
    const ids = [...revisions.keys()].sort().reverse();
    const initialId = ids[0] || (() => {
      const date = new Date();
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    })();
    const parsed = parseMonthId(initialId);
    window.ShiftRosterApp.initialize({ mode: 'editor', year: parsed.year, month: parsed.month });
    currentPublished = revisions.get(initialId)?.published === true;
    syncPublishedButton();
    dirty = false;
    setEditorMutationListener();
    status(`Editor 已連線｜${initialId} revision ${revisions.get(initialId)?.revision || 0}`, 'success');
  }

  async function bootstrapEditor() {
    status('驗證 Editor session…');
    await window.ShiftRosterBackend.session(token);
    status('載入遠端班表…');
    applyBootstrap(await window.ShiftRosterBackend.bootstrap(token));
    byId('rosterLoginDialog').hidden = true;
  }

  function showLogin(message = '') {
    window.ShiftRosterStorage.setMode('editor');
    byId('rosterLoginMessage').textContent = message;
    byId('rosterLoginDialog').hidden = false;
    status('需要 Editor 登入', 'notice');
    requestAnimationFrame(() => byId('rosterLoginPassword').focus());
  }

  async function initializeEditor() {
    token = sessionStorage.getItem(SESSION_KEY) || '';
    if (!token) return showLogin();
    try {
      await bootstrapEditor();
    } catch (error) {
      if (isUnauthorized(error)) {
        clearSession();
        showLogin('Editor session 已失效，請重新登入。');
      } else {
        status(error?.message || '遠端服務目前無法使用。', 'error');
        showLogin('無法驗證遠端 session；本機模式仍可獨立使用。');
      }
    }
  }

  function syncPublishedButton() {
    byId('rosterPublishToggle').textContent = currentPublished ? '取消發布' : '發布';
    byId('rosterPublishToggle').setAttribute('aria-pressed', String(currentPublished));
  }

  async function saveRemoteMonth(publish = currentPublished) {
    if (!token) return showLogin();
    window.ShiftRosterApp.saveCurrentMonth();
    const snapshot = window.ShiftRosterApp.buildCurrentMonthSnapshot();
    const metadata = revisions.get(snapshot.month) || { revision: 0, published: false };
    status(`儲存 ${snapshot.month}…`);
    try {
      const response = await window.ShiftRosterBackend.saveMonth(
        token,
        snapshot.month,
        snapshot,
        metadata.revision,
        publish
      );
      revisions.set(snapshot.month, { revision: response.revision, published: response.published === true });
      currentPublished = response.published === true;
      dirty = false;
      syncPublishedButton();
      status(`已儲存 revision ${response.revision}${currentPublished ? '｜已發布' : '｜未發布'}`, 'success');
    } catch (error) {
      if (error?.status === 409 && error?.code === 'revision_conflict') {
        byId('rosterRevisionMessage').textContent = `Server current revision：${error.response?.error?.current_revision ?? '未知'}。`;
        byId('rosterRevisionDialog').hidden = false;
        status('儲存衝突：遠端已有較新版本', 'error');
        return;
      }
      handleApiError(error, '遠端月份儲存失敗。');
    }
  }

  async function saveRemoteSnapshot(snapshot, publish = null) {
    const metadata = revisions.get(snapshot.month) || { revision: 0, published: false };
    const requestedPublish = publish == null ? metadata.published : Boolean(publish);
    try {
      const response = await window.ShiftRosterBackend.saveMonth(
        token,
        snapshot.month,
        snapshot,
        metadata.revision,
        requestedPublish
      );
      revisions.set(snapshot.month, { revision: response.revision, published: response.published === true });
      status(`${snapshot.month} 已儲存 revision ${response.revision}`, 'success');
      return response;
    } catch (error) {
      if (error?.status === 409 && error?.code === 'revision_conflict') {
        status(`${snapshot.month} 儲存衝突；未覆蓋遠端資料`, 'error');
      }
      throw error;
    }
  }

  async function loadEditorMonth(year, month, forceServer = false) {
    const monthId = `${year}-${String(month).padStart(2, '0')}`;
    if (forceServer) {
      try {
        const response = await window.ShiftRosterBackend.getMonth(token, monthId);
        window.ShiftRosterStorage.saveMonth(response.snapshot);
        revisions.set(monthId, { revision: response.revision, published: response.published === true });
      } catch (error) {
        if (error?.status !== 404 || error?.code !== 'not_found') return handleApiError(error);
      }
    }
    const snapshot = window.ShiftRosterStorage.ensureMonth(year, month);
    window.ShiftRosterApp.loadSnapshot(year, month, snapshot);
    currentPublished = revisions.get(monthId)?.published === true;
    dirty = false;
    syncPublishedButton();
    status(`${monthId}｜revision ${revisions.get(monthId)?.revision || 0}${currentPublished ? '｜已發布' : '｜未發布'}`);
  }

  async function navigateMonth(year, month) {
    if (mode === 'public') return loadPublicMonth(year, month);
    if (mode === 'editor') return loadEditorMonth(year, month);
    window.ShiftRosterApp.loadSnapshot(year, month, window.ShiftRosterStorage.ensureMonth(year, month));
  }

  async function remoteReplaceAll(payload) {
    pendingRemoteBackup = payload;
    byId('rosterRemoteImportDialog').hidden = false;
  }

  async function applyRemoteReplaceAll() {
    if (!pendingRemoteBackup) return;
    const payload = pendingRemoteBackup;
    pendingRemoteBackup = null;
    byId('rosterRemoteImportDialog').hidden = true;
    try {
      await window.ShiftRosterBackend.replaceAll(token, payload);
      window.location.reload();
    } catch (error) {
      if (error?.status === 400 && error?.code === 'invalid_request') {
        status('replace-all 遭 backend invalid_request 拒絕；已停止流程，未重試或繞過驗證。', 'error');
      }
      handleApiError(error, '遠端完整備份套用失敗。');
    }
  }

  async function remoteCleanup(before) {
    try {
      const response = await window.ShiftRosterBackend.cleanup(token, before);
      status(`已清除 ${response.removed} 個遠端月份`, 'success');
      return response;
    } catch (error) {
      if (error?.status === 400 && error?.code === 'invalid_request') {
        status('cleanup 遭 backend invalid_request 拒絕；已停止流程，未重試或繞過驗證。', 'error');
      }
      handleApiError(error, '遠端歷史月份清理失敗。');
      throw error;
    }
  }

  function bindUi() {
    byId('rosterPublicPng').addEventListener('click', async () => {
      try {
        await window.ShiftRosterExport?.previewPng?.();
      } catch (error) {
        window.alert(`PNG 預覽產生失敗：${error?.message || '未知錯誤'}`);
      }
    });
    byId('rosterPublicPrint').addEventListener('click', async () => {
      const cleanup = await window.ShiftRosterOutput?.prepare?.();
      try {
        window.print();
      } finally {
        if (typeof cleanup === 'function') cleanup();
      }
    });
    byId('rosterRemoteSave').addEventListener('click', () => saveRemoteMonth());
    byId('rosterPublishToggle').addEventListener('click', () => saveRemoteMonth(!currentPublished));
    byId('rosterLogoutButton').addEventListener('click', async () => {
      try {
        if (token) await window.ShiftRosterBackend.logout(token);
      } catch (error) {
        if (!isUnauthorized(error)) console.error(error);
      } finally {
        clearSession();
        window.location.reload();
      }
    });
    byId('rosterLoginForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const input = byId('rosterLoginPassword');
      const password = input.value;
      input.value = '';
      byId('rosterLoginMessage').textContent = '登入中…';
      try {
        saveSession(await window.ShiftRosterBackend.login(password));
        await bootstrapEditor();
      } catch (error) {
        clearSession();
        const retry = error?.response?.error?.retry_after;
        byId('rosterLoginMessage').textContent = error?.code === 'rate_limited'
          ? `嘗試次數過多，請在 ${retry ?? '稍後'} 秒後再試。`
          : (error?.message || '登入失敗。');
      }
    });
    byId('rosterPasswordButton').addEventListener('click', () => {
      byId('rosterPasswordMessage').textContent = '密碼變更後所有 Editor session 都會失效。';
      byId('rosterPasswordDialog').hidden = false;
    });
    byId('rosterPasswordCancel').addEventListener('click', () => {
      byId('rosterCurrentPassword').value = '';
      byId('rosterNewPassword').value = '';
      byId('rosterPasswordDialog').hidden = true;
    });
    byId('rosterPasswordForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const currentInput = byId('rosterCurrentPassword');
      const newInput = byId('rosterNewPassword');
      const currentPassword = currentInput.value;
      const newPassword = newInput.value;
      currentInput.value = '';
      newInput.value = '';
      try {
        const response = await window.ShiftRosterBackend.changePassword(token, currentPassword, newPassword);
        if (response.sessions_revoked) {
          clearSession();
          window.alert(response.warning === 'weak_password' ? '密碼已更新（強度較弱），請重新登入。' : '密碼已更新，請重新登入。');
          window.location.reload();
        }
      } catch (error) {
        byId('rosterPasswordMessage').textContent = error?.message || '密碼變更失敗。';
      }
    });
    byId('rosterRevisionKeep').addEventListener('click', () => {
      byId('rosterRevisionDialog').hidden = true;
      status('保留尚未儲存的目前畫面', 'notice');
    });
    byId('rosterRevisionReload').addEventListener('click', async () => {
      byId('rosterRevisionDialog').hidden = true;
      const current = window.ShiftRosterApp.getCurrentYearMonth();
      await loadEditorMonth(current.year, current.month, true);
    });
    byId('rosterRemoteImportCancel').addEventListener('click', () => {
      pendingRemoteBackup = null;
      byId('rosterRemoteImportDialog').hidden = true;
    });
    byId('rosterRemoteImportApply').addEventListener('click', applyRemoteReplaceAll);
  }

  async function start() {
    applyModeUi();
    bindUi();
    if (mode === 'public') await initializePublic();
    else if (mode === 'editor') await initializeEditor();
    else {
      window.ShiftRosterStorage.setMode('standalone');
      window.ShiftRosterApp.initialize({ mode: 'standalone' });
      window.ShiftRosterApp.saveCurrentMonth();
      status('本機模式｜資料只保存在這個瀏覽器', 'success');
    }
  }

  window.ShiftRosterIntegration = Object.freeze({
    getMode: () => mode,
    navigateMonth,
    remoteReplaceAll,
    remoteCleanup,
    saveRemoteSnapshot,
    isEditor: () => mode === 'editor',
    isPublic: () => mode === 'public',
    start
  });

  window.addEventListener('DOMContentLoaded', start, { once: true });
})();
