/* JSON import/export is deliberately independent from storage and backend. */
(function(global){"use strict";
  const C=global.CycleCore;
  function payload(data){const checked=C.validate(data);if(!checked.ok)throw new Error(checked.errors.join(" "));return global.DataBackup.createPayload({app:"cycle_v1",version:1,data:JSON.parse(JSON.stringify(data))});}
  function validateBackup(input){
    if(!input||typeof input!=="object"||Array.isArray(input)||input.meta?.app!=="cycle_v1"||input.meta?.version!==1)throw new Error("不是 Cycle v1 的備份檔。");
    const data=global.DataBackup.extractData(input,{allowRaw:false});const checked=C.validate(data);if(!checked.ok)throw new Error(checked.errors.join(" "));return data;
  }
  function filename(){const stamp=global.Timestamp?.create?.();if(!/^\d{17}$/.test(stamp||""))throw new Error("軍火庫時間戳尚未載入。");return "cycle_v1_"+stamp.slice(0,8)+"_"+stamp.slice(8,14)+".json";}
  function init({store,getData,onRestored,notify}){
    const $=id=>document.getElementById(id), dialog=$("backup-dialog"),status=$("backup-status"),preview=$("backup-preview");let pending=null;
    $("backup-open").onclick=()=>dialog.showModal();$("backup-close").onclick=()=>dialog.close();
    $("export-button").onclick=()=>{try{global.DataBackup.downloadJson(filename(),payload(getData()));notify("已建立 JSON 備份");}catch(error){status.textContent=error.message;}};
    $("import-file").onchange=()=>{pending=null;preview.hidden=true;$("import-button").disabled=true;status.textContent="請先驗證檔案。";};
    $("validate-import").onclick=async()=>{
      const file=$("import-file").files[0];if(!file){status.textContent="請先選擇 JSON 檔案。";return;}
      if(file.size>5*1024*1024){status.textContent="檔案超過 5 MB，已停止匯入。";return;}
      try{pending=validateBackup(await global.DataBackup.readJsonFile(file));preview.hidden=false;
        preview.textContent=`已驗證：${pending.periods.length} 筆月經紀錄、${Object.keys(pending.daily).length} 筆每日紀錄。\n此操作會完整覆蓋目前資料；請先下載現有備份。`;
        $("import-button").disabled=false;status.textContent="驗證通過，尚未寫入。";
      }catch(error){pending=null;preview.hidden=true;$("import-button").disabled=true;status.textContent=error.message;}
    };
    $("import-button").onclick=async()=>{
      if(!pending)return;
      const yes=await global.SlowlyConfirm.show({title:"確認還原",message:"這會完整覆蓋目前的週期與每日紀錄。請確認已備份現有資料。",confirmText:"覆蓋並還原"});if(!yes)return;
      const snapshot=store.snapshot();
      const result=await global.SafeImport.run({prepare:async()=>pending,validate:next=>C.validate(next).ok,commit:async next=>{const saved=await store.replace(next);onRestored(saved);return saved;},rollback:async()=>store.restore(snapshot)});
      if(result.ok){pending=null;$("import-button").disabled=true;dialog.close();notify("備份已還原");}
      else status.textContent=result.rolledBack?"匯入失敗，已還原原本資料。":"匯入失敗；請保留現有瀏覽器資料。";
    };
  }
  global.CycleBackup=Object.freeze({init,payload,validateBackup,filename});
})(window);
