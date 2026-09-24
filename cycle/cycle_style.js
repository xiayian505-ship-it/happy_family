(function () {
  "use strict";
  const C = window.CycleCore;
  const store = new CycleStorage.CycleStorage(window.localStorage);
  let calendar;
  let data = C.emptyData(), view = new Date(), selected = C.todayISO();
  const $ = id => document.getElementById(id);
  const pad = n => String(n).padStart(2, "0");
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const labelDate = value => value ? value.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1/$2/$3") : "尚未記錄";
  const toaster=SlowlyToast.create($("toast"),{duration:2600});
  function toast(message){toaster.show(message);}
  async function persist(next, message) { data = await store.save(next); render(); if (message) toast(message); }
  function renderCalendar(){if(calendar)calendar.refresh(data);}
  function render() {
    renderCalendar(); const s=C.cycleStats(data); let note=s.insufficient?"至少需要 3 次開始日期，平均值才較有參考性。":"依歷史開始日期間隔估算。";if(s.irregular)note="近期週期間隔差異超過 7 天，預估不確定性較高。";
    $("summary-content").innerHTML=`<div class="summary-grid"><div class="metric"><span>平均週期</span><strong>${s.average?s.average+" 天":"資料不足"}</strong></div><div class="metric"><span>下次粗估</span><strong>${labelDate(s.nextPeriod)}</strong></div></div><p class="form-help">${note}</p>`;
    $("manual-cycle").value=data.settings.manualCycleLength||""; const list=$("period-list");list.replaceChildren();
    if(!data.periods.length){const p=document.createElement("p");p.className="empty";p.textContent="還沒有紀錄。只要先記開始日期就好。";list.append(p);} data.periods.slice().reverse().forEach(p=>{const row=document.createElement("div");row.className="period-row";const span=document.createElement("span");span.textContent=`${labelDate(p.start)} → ${p.end?labelDate(p.end):"進行中"}`;const b=document.createElement("button");b.type="button";b.className="ghost edit-period";b.dataset.id=p.id;b.textContent="編輯";row.append(span,b);list.append(row);});
  }
  function openDay(date){selected=date;const entry=data.daily[date]||{};$("day-title").textContent=labelDate(date);$("day-flow").value=entry.flow||"";$("day-pain").value=entry.pain||"";$("day-note").value=entry.note||"";renderCalendar();$("day-dialog").showModal();}
  function openPeriod(period){$("period-id").value=period?.id||"";$("period-start").value=period?.start||selected;$("period-end").value=period?.end||"";$("period-title").textContent=period?"編輯月經紀錄":"新增月經紀錄";$("delete-period").hidden=!period;$("period-dialog").showModal();}

  $("day-form").addEventListener("submit",async e=>{e.preventDefault();try{await persist(C.saveDaily(data,selected,{flow:$("day-flow").value,pain:$("day-pain").value,note:$("day-note").value}),"當日紀錄已儲存");$("day-dialog").close();}catch(err){alert(err.message);}});
  $("clear-day").onclick=async()=>{if(confirm("清除這一天的身體紀錄？月經區間不受影響。")){await persist(C.saveDaily(data,selected,{}),"已清除當日紀錄");$("day-dialog").close();}};
  $("new-period").onclick=()=>openPeriod(null);$("period-list").onclick=e=>{const b=e.target.closest(".edit-period");if(b)openPeriod(data.periods.find(p=>p.id===b.dataset.id));};
  $("period-form").addEventListener("submit",async e=>{e.preventDefault();try{await persist(C.upsertPeriod(data,{id:$("period-id").value||undefined,start:$("period-start").value,end:$("period-end").value||null}),"月經紀錄已儲存");$("period-dialog").close();}catch(err){alert(err.message);}});
  $("delete-period").onclick=async()=>{const id=$("period-id").value;if(id&&confirm("刪除這筆月經紀錄？當日身體紀錄會保留。")){await persist(C.removePeriod(data,id),"月經紀錄已刪除");$("period-dialog").close();}};
  $("save-setting").onclick=async()=>{const raw=$("manual-cycle").value;const n=raw===""?null:Number(raw);if(n!==null&&(!Number.isInteger(n)||n<15||n>90)){alert("請輸入 15–90 的整數，或留空改用歷史平均。");return;}const next=JSON.parse(JSON.stringify(data));next.settings.manualCycleLength=n;await persist(next,"預估設定已更新");};
  // Layout only: keep existing page contents and feature handlers intact.
  const tabButtons=[...document.querySelectorAll(".cycle-tab")];
  function switchTab(name){
    tabButtons.forEach(button=>{const active=button.dataset.tab===name;button.classList.toggle("is-active",active);button.setAttribute("aria-selected",String(active));$("panel-"+button.dataset.tab).hidden=!active;});
    if(name==="calendar")renderCalendar();
  }
  tabButtons.forEach(button=>button.addEventListener("click",()=>switchTab(button.dataset.tab)));
  $("manage-open").addEventListener("click",()=>{const panel=$("manage-panel");const opening=panel.hidden;panel.hidden=!opening;$("manage-open").setAttribute("aria-expanded",String(opening));});
  $("backup-open").addEventListener("click",()=>{$("manage-panel").hidden=true;$("manage-open").setAttribute("aria-expanded","false");});
  try{calendar=new CycleCalendar($("calendar"),date=>{selected=date;openDay(date);});}catch(error){$("calendar").textContent=error.message;}
  CycleBackend.init();
  CycleBackup.init({store,getData:()=>data,onRestored:next=>{data=next;render();},notify:toast});
  store.load().then(value=>{data=value;render();}).catch(err=>{$("calendar").textContent="資料讀取失敗，已停止操作。";$("period-list").textContent=err.message;document.querySelectorAll("#new-period,#save-setting,#save-day,#delete-period,#clear-day,#export-button,#import-button").forEach(el=>el.disabled=true);});
})();
