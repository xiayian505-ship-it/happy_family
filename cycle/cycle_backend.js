/* Frontend shell only. No credentials, network calls, or simulated sync. */
(function(global){"use strict";
  function init(){const status=document.getElementById("backend-status");if(status)status.textContent="尚未啟用｜目前僅儲存在這個瀏覽器";}
  global.CycleBackend=Object.freeze({init});
})(window);
