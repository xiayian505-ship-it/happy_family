"use strict";

/* =========================================================
   慢慢的倉庫｜Data Backup v1.0.0
   通用 JSON 備份工具：
   - 下載 JSON
   - 讀取 JSON File
   - 建立帶 meta 的備份 payload
   - 從 payload / 純陣列 / 純物件中取出資料
========================================================= */

(function(global){
  function todayISO(date = new Date()){
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000)
      .toISOString()
      .slice(0, 10);
  }

  function downloadJson(filename, data){
    if(!filename) throw new Error("filename is required");

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function readJsonFile(file){
    return new Promise((resolve, reject) => {
      if(!(file instanceof Blob)){
        reject(new TypeError("file must be a File or Blob"));
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        try{
          resolve(JSON.parse(String(reader.result || "")));
        }catch(error){
          reject(new Error("JSON 檔案格式不正確。", { cause: error }));
        }
      };

      reader.onerror = () => {
        reject(reader.error || new Error("讀取檔案失敗。"));
      };

      reader.readAsText(file, "utf-8");
    });
  }

  function createPayload({
    app,
    version = 1,
    data,
    exportedAt = new Date().toISOString(),
    extraMeta = {}
  } = {}){
    if(!app) throw new Error("app is required");

    return {
      meta: {
        app,
        version,
        exportedAt,
        ...extraMeta
      },
      data
    };
  }

  function extractData(input, {
    key = "data",
    allowRaw = true
  } = {}){
    if(input == null){
      throw new Error("找不到可匯入的資料。");
    }

    if(
      typeof input === "object" &&
      !Array.isArray(input) &&
      Object.prototype.hasOwnProperty.call(input, key)
    ){
      return input[key];
    }

    if(allowRaw){
      return input;
    }

    throw new Error(`JSON 中找不到 ${key}。`);
  }

  global.DataBackup = Object.freeze({
    version: "1.0.0",
    todayISO,
    downloadJson,
    readJsonFile,
    createPayload,
    extractData
  });
})(window);