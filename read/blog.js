(function () {
  "use strict";

  const SUPABASE_URL = "https://kscbrnmhqugcwfohczve.supabase.co";
  const SUPABASE_KEY = "sb_publishable_E00oHxUzDH-P_26ippQb5Q_d8X0-MMG";
  const ADMIN_EMAIL = "xiayian505@gmail.com";
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const elements = Object.fromEntries(["posts","status","post-count","auth-button","new-post-button","admin-badge","login-dialog","login-form","login-email","login-password","login-error","editor-dialog","editor-form","editor-title","editor-error","post-id","post-title","post-content","post-published"].map(function (id) { return [id, document.getElementById(id)]; }));
  let session = null;
  let posts = [];

  function isAdmin() { return session?.user?.email?.toLowerCase() === ADMIN_EMAIL; }
  function formatDate(value) { return new Intl.DateTimeFormat("zh-TW", { year:"numeric", month:"long", day:"numeric" }).format(new Date(value)); }
  function setBusy(form, busy) { form.querySelectorAll("button,input,textarea").forEach(function (node) { node.disabled = busy; }); }
  function message(error) { return error?.message || "發生未預期的錯誤，請稍後再試。"; }

  function render() {
    elements.posts.replaceChildren();
    elements.status.hidden = posts.length > 0;
    if (!posts.length) { elements.status.textContent = "目前還沒有文章。"; elements.status.classList.remove("error"); }
    elements["post-count"].textContent = posts.length ? `${posts.length} 篇文章` : "";
    posts.forEach(function (post) {
      const article = document.createElement("article"); article.className = "post-card";
      const meta = document.createElement("div"); meta.className = "post-meta";
      const time = document.createElement("time"); time.dateTime = post.created_at; time.textContent = formatDate(post.created_at); meta.append(time);
      if (!post.published) { const badge = document.createElement("span"); badge.className = "draft"; badge.textContent = "草稿"; meta.append(badge); }
      const title = document.createElement("h3"); title.textContent = post.title;
      const content = document.createElement("div"); content.className = "post-content"; content.textContent = post.content;
      article.append(meta, title, content);
      if (isAdmin()) {
        const actions = document.createElement("div"); actions.className = "post-actions";
        const edit = document.createElement("button"); edit.className = "button button-quiet"; edit.type = "button"; edit.textContent = "編輯"; edit.addEventListener("click", function () { openEditor(post); });
        const remove = document.createElement("button"); remove.className = "button button-quiet"; remove.type = "button"; remove.textContent = "刪除"; remove.addEventListener("click", function () { deletePost(post); });
        actions.append(edit, remove); article.append(actions);
      }
      elements.posts.append(article);
    });
  }

  async function loadPosts() {
    elements.status.hidden = false; elements.status.textContent = "正在讀取文章…"; elements.status.classList.remove("error");
    const { data, error } = await db.from("posts").select("id,title,content,published,created_at,updated_at").order("created_at", { ascending:false });
    if (error) { elements.status.textContent = "暫時無法讀取文章，請稍後重新整理。"; elements.status.classList.add("error"); return; }
    posts = data || []; render();
  }

  function updateAuthUI() {
    const admin = isAdmin();
    elements["new-post-button"].hidden = !admin; elements["admin-badge"].hidden = !admin;
    elements["auth-button"].textContent = session ? "登出" : "管理者登入";
    render();
  }

  function openEditor(post) {
    elements["editor-form"].reset(); elements["editor-error"].textContent = "";
    elements["post-id"].value = post?.id || ""; elements["post-title"].value = post?.title || ""; elements["post-content"].value = post?.content || ""; elements["post-published"].checked = post ? post.published : true;
    elements["editor-title"].textContent = post ? "編輯文章" : "新增文章"; elements["editor-dialog"].showModal(); elements["post-title"].focus();
  }

  async function deletePost(post) {
    if (!confirm(`確定要刪除「${post.title}」嗎？此操作無法復原。`)) return;
    const { error } = await db.from("posts").delete().eq("id", post.id);
    if (error) { alert(`刪除失敗：${message(error)}`); return; }
    await loadPosts();
  }

  elements["auth-button"].addEventListener("click", async function () {
    if (session) { await db.auth.signOut(); return; }
    elements["login-form"].reset(); elements["login-error"].textContent = ""; elements["login-email"].value = ADMIN_EMAIL; elements["login-dialog"].showModal(); elements["login-password"].focus();
  });
  elements["new-post-button"].addEventListener("click", function () { openEditor(null); });

  elements["login-form"].addEventListener("submit", async function (event) {
    event.preventDefault(); setBusy(elements["login-form"], true); elements["login-error"].textContent = "";
    const { data, error } = await db.auth.signInWithPassword({ email:elements["login-email"].value.trim(), password:elements["login-password"].value });
    setBusy(elements["login-form"], false);
    if (error) { elements["login-error"].textContent = "登入失敗，請確認帳號與密碼。"; return; }
    if (data.user?.email?.toLowerCase() !== ADMIN_EMAIL) { await db.auth.signOut(); elements["login-error"].textContent = "此帳號沒有管理權限。"; return; }
    elements["login-dialog"].close();
  });

  elements["editor-form"].addEventListener("submit", async function (event) {
    event.preventDefault(); const title = elements["post-title"].value.trim();
    if (!title) { elements["editor-error"].textContent = "請輸入文章標題。"; return; }
    setBusy(elements["editor-form"], true); elements["editor-error"].textContent = "";
    const values = { title, content:elements["post-content"].value, published:elements["post-published"].checked };
    const id = elements["post-id"].value;
    const { error } = id ? await db.from("posts").update(values).eq("id", id) : await db.from("posts").insert(values);
    setBusy(elements["editor-form"], false);
    if (error) { elements["editor-error"].textContent = `儲存失敗：${message(error)}`; return; }
    elements["editor-dialog"].close(); await loadPosts();
  });

  db.auth.onAuthStateChange(function (_event, currentSession) { session = currentSession; updateAuthUI(); window.setTimeout(loadPosts, 0); });
  db.auth.getSession().then(function (result) { session = result.data.session; updateAuthUI(); loadPosts(); });
})();
