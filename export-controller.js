/**
 * Vidya Wave — Enterprise Teacher Export Studio V3
 * Module: export-controller.js (Orchestration Pipeline & Registry Router)
 * Version: 4.2.0 (Enterprise Architecture — Ultimate Final Locked)
 * 
 * Architecture Rules:
 * - Strict ES5 Compliance (No const, let, arrow functions).
 * - Orchestrates: Calls Compile (Data) -> Controller (Registry Route) -> Exporter.
 * - Dynamic Late-Binding Registry Pattern with Startup Validation & Safe Fallbacks.
 */

window.ExportStudio = window.ExportStudio || {};
window.ExportStudio.controller = window.ExportStudio.controller || {};
window.ExportStudio.controller._bootstrapped = window.ExportStudio.controller._bootstrapped || false;

/**
 * Centralized Internal Logger & Safe Toast UI Wrapper (Point 2)
 */
function controllerLogWarn(msg, context) {
  if (typeof console !== "undefined" && typeof console.warn === "function") {
    console.warn("[ExportStudio Controller Warn]: " + msg, context || "");
  }
}

function safeToast(msg) {
  if (typeof window.toast === "function") {
    window.toast(msg);
  }
}

/**
 * Safe Promise Fallback Resolver (Point 1)
 */
function safePromiseNull() {
  return (typeof Promise !== "undefined") ? Promise.resolve(null) : null;
}

/**
 * ENTERPRISE ROUTING REGISTRY
 */
window.ExportStudio.controller.routes = {
  "WORKSHEET_PDF":   { module: "pdf",  builderName: "buildWorksheetHTML", exporterName: "generatePDF", suffix: "", extension: ".pdf", mime: "application/pdf" },
  "SOLUTION_PDF":    { module: "pdf",  builderName: "buildSolutionsHTML", exporterName: "generatePDF", suffix: "Solution", extension: ".pdf", mime: "application/pdf" },
  "ANSWER_KEY_PDF":  { module: "pdf",  builderName: "buildAnswerKeyHTML", exporterName: "generatePDF", suffix: "Key", extension: ".pdf", mime: "application/pdf" },
  
  "WORKSHEET_WORD":  { module: "word", builderName: "buildWorksheetHTML", exporterName: "generateWord", suffix: "", extension: ".doc", mime: "application/msword" },
  "SOLUTION_WORD":   { module: "word", builderName: "buildSolutionsHTML", exporterName: "generateWord", suffix: "Solution", extension: ".doc", mime: "application/msword" },
  "ANSWER_KEY_WORD": { module: "word", builderName: "buildAnswerKeyHTML", exporterName: "generateWord", suffix: "Key", extension: ".doc", mime: "application/msword" }
};

/**
 * Startup Registry Validator (Fail-Fast Architecture - Point 4)
 * Ensures all registered routes have proper string metadata before execution.
 */
function validateRegistry(routes) {
  for (var key in routes) {
    if (Object.prototype.hasOwnProperty.call(routes, key)) {
      var r = routes[key];
      if (typeof r.module !== "string" || typeof r.builderName !== "string" || typeof r.exporterName !== "string") {
        controllerLogWarn("Startup Validator Failed: Invalid route configuration for key -> " + key);
        return false;
      }
    }
  }
  return true;
}

/**
 * Core Base Dependency Guard System.
 */
function checkBaseDependencies() {
  if (typeof Promise === "undefined") {
    controllerLogWarn("CRITICAL ABORT: Native Promise object missing.");
    return false;
  }

  var utils = ["el", "toast", "prog", "resetProgress"];
  for (var i = 0; i < utils.length; i++) {
    if (typeof window[utils[i]] !== "function") {
      controllerLogWarn("Pipeline Intercepted: Missing utility helper -> " + utils[i]);
      return false;
    }
  }
  
  if (!window.ExportStudio.compiler || typeof window.ExportStudio.compiler.buildExportPackage !== "function") {
    controllerLogWarn("Pipeline Intercepted: Missing Central Compiler engine.");
    return false;
  }
  
  return true;
}

/**
 * DRY Execution Engine for resolving and executing the registered route.
 */
function executeExportRoute(route, packagePayload) {
  try {
    var targetModule = window.ExportStudio[route.module];
    if (!targetModule) {
      safeToast("❌ " + String(route.module).toUpperCase() + " ડ્રાઇવર ઉપલબ્ધ નથી.");
      return safePromiseNull();
    }

    var builderFn = targetModule[route.builderName];
    var exporterFn = targetModule[route.exporterName];

    if (typeof builderFn !== "function" || typeof exporterFn !== "function") {
      controllerLogWarn("Invalid route execution: Missing method -> " + route.builderName + " or " + route.exporterName);
      safeToast("❌ એક્સપોર્ટ મોડ્યુલ કન્ફિગરેશનમાં ભૂલ છે.");
      return safePromiseNull();
    }

    window.prog("દસ્તાવેજ બનાવવામાં આવી રહ્યો છે...", 50);

    var rawHtml = builderFn(packagePayload);
    var baseName = packagePayload.packageId || "VidyaWave_Export";
    var targetName = route.suffix ? baseName + "_" + route.suffix : baseName;
    
    window.prog("ફાઇલ ડાઉનલોડ થઈ રહી છે...", 90);

    return exporterFn(rawHtml, targetName).then(function(res) {
      window.prog("સફળતાપૂર્વક પૂર્ણ!", 100);
      return res;
    }).catch(function(err) {
      controllerLogWarn("Async Rejection handled inside routing pipeline:", err);
      window.resetProgress();
      safeToast("❌ ફાઇલ સેવ કરવામાં નિષ્ફળતા.");
      return null;
    });

  } catch (syncErr) {
    controllerLogWarn("Synchronous breakdown caught inside rendering pipeline:", syncErr);
    window.resetProgress();
    safeToast("❌ રેન્ડરિંગ દરમિયાન અનપેક્ષિત ભૂલ.");
    return safePromiseNull();
  }
}

/**
 * Main Orchestration Entry Point.
 */
window.ExportStudio.controller.initiateExport = function(type, options) {
  if (!checkBaseDependencies()) return safePromiseNull();

  try {
    window.resetProgress();
    window.prog("ડેટા પેકેજ તૈયાર થઈ રહ્યું છે...", 10);
    
    var packagePayload = window.ExportStudio.compiler.buildExportPackage(type, options);
    if (!packagePayload) {
      window.resetProgress();
      safeToast("❌ એક્સપોર્ટ પેકેજ બનાવવામાં નિષ્ફળતા.");
      return safePromiseNull();
    }
    
    var exportType = String(type || "").toUpperCase().trim();
    
    if (Object.prototype.hasOwnProperty.call(window.ExportStudio.controller.routes, exportType)) {
      var routeConfig = window.ExportStudio.controller.routes[exportType];
      return executeExportRoute(routeConfig, packagePayload);
    } else {
      controllerLogWarn("Unsupported export type identifier:", type);
      window.resetProgress();
      safeToast("⚠️ આ ફીચર હજુ પ્રોસેસમાં છે.");
      return safePromiseNull();
    }
    
  } catch (err) {
    controllerLogWarn("Pipeline catastrophic execution breakdown:", err);
    window.resetProgress();
    safeToast("❌ પ્રક્રિયા દરમિયાન તકનીકી ખામી સર્જાઈ.");
    return safePromiseNull();
  }
};

/**
 * UI Action Binding Registry.
 */
window.ExportStudio.controller.bootstrapActions = function() {
  if (window.ExportStudio.controller._bootstrapped) return;

  if (!window.ExportStudio.registerAction || !window.ExportStudio.freezeArchitectureCore) {
    controllerLogWarn("Bootstrap Aborted: Core Action Registry layer missing.");
    return;
  }

  // Pre-flight Registry Validation
  if (!validateRegistry(window.ExportStudio.controller.routes)) {
    controllerLogWarn("Bootstrap Aborted: Route Registry failed validation.");
    return;
  }

  try {
    // PDF Actions
    window.ExportStudio.registerAction("runWorksheetExport", function() {
      window.ExportStudio.controller.initiateExport("WORKSHEET_PDF", { enableWatermark: true, subjectFilter: typeof el === "function" && el("subj") ? String(el("subj").value) : "" });
    });
    window.ExportStudio.registerAction("runSolutionExport", function() {
      window.ExportStudio.controller.initiateExport("SOLUTION_PDF", { enableWatermark: true });
    });
    window.ExportStudio.registerAction("runAnswerKeyExport", function() {
      window.ExportStudio.controller.initiateExport("ANSWER_KEY_PDF", { enableWatermark: false });
    });

    // Word Actions
    window.ExportStudio.registerAction("runWorksheetWordExport", function() {
      window.ExportStudio.controller.initiateExport("WORKSHEET_WORD", { enableWatermark: true, subjectFilter: typeof el === "function" && el("subj") ? String(el("subj").value) : "" });
    });
    window.ExportStudio.registerAction("runSolutionWordExport", function() {
      window.ExportStudio.controller.initiateExport("SOLUTION_WORD", { enableWatermark: true });
    });
    window.ExportStudio.registerAction("runAnswerKeyWordExport", function() {
      window.ExportStudio.controller.initiateExport("ANSWER_KEY_WORD", { enableWatermark: false });
    });
    
    // Freeze core objects
    window.ExportStudio.freezeArchitectureCore();
    
    // Set Bootstrap flag only upon complete success (Point 3)
    window.ExportStudio.controller._bootstrapped = true;
  } catch (err) {
    controllerLogWarn("Bootstrap registry mapping execution failed:", err);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function() { window.ExportStudio.controller.bootstrapActions(); });
} else {
  window.ExportStudio.controller.bootstrapActions();
}
