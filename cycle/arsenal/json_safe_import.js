"use strict";

/* =========================================================
   慢慢的倉庫｜Safe Import v1.0.0
   通用安全匯入流程核心：
   - prepare：先準備匯入資料
   - validate：提交前驗證
   - commit：驗證成功後才真正寫入／覆蓋
   - rollback：commit 失敗時可選擇復原

   不負責：
   - JSON 檔案讀取／解析
   - schema 定義
   - localStorage / IndexedDB
   - UI / confirm
========================================================= */

(function(global){
  "use strict";

  async function run({
    prepare,
    validate,
    commit,
    rollback
  } = {}){
    if(typeof prepare !== "function"){
      throw new TypeError("prepare must be a function");
    }

    if(validate != null && typeof validate !== "function"){
      throw new TypeError("validate must be a function");
    }

    if(typeof commit !== "function"){
      throw new TypeError("commit must be a function");
    }

    if(rollback != null && typeof rollback !== "function"){
      throw new TypeError("rollback must be a function");
    }

    let prepared;

    try{
      prepared = await prepare();

      if(validate){
        const valid = await validate(prepared);

        if(valid === false){
          throw new Error("匯入資料驗證失敗。");
        }
      }
    }catch(error){
      return {
        ok: false,
        stage: "prepare",
        error,
        prepared
      };
    }

    try{
      const value = await commit(prepared);

      return {
        ok: true,
        stage: "done",
        prepared,
        value
      };
    }catch(error){
      if(!rollback){
        return {
          ok: false,
          stage: "commit",
          error,
          prepared
        };
      }

      try{
        const rollbackValue = await rollback(error, prepared);

        return {
          ok: false,
          stage: "commit",
          error,
          prepared,
          rolledBack: true,
          rollbackValue
        };
      }catch(rollbackError){
        return {
          ok: false,
          stage: "rollback",
          error,
          prepared,
          rolledBack: false,
          rollbackError
        };
      }
    }
  }

  global.SafeImport = Object.freeze({
    version: "1.0.0",
    run
  });
})(window);
