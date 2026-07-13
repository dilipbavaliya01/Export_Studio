/**
 * Vidya Wave — Enterprise Teacher Export Studio V3
 * Module: export-pdf.js (Print-Safe HTML Generator & html2pdf.js Integration Driver)
 * Version: 3.0.3 (Enterprise Hardened — Ultimate Production Locked)
 * 
 * Architecture Rules:
 * - Strict ES5 Compliance (No let, const, arrow functions, or template literals).
 * - Depends on: export-utils.js v3.0.1 (el, esc, optionTable) & export-compile.js v3.0.2 payload.
 * - Layer Constraint: 100% Visual Renderer. No business logic, no data calculation.
 */

window.ExportStudio = window.ExportStudio || {};
window.ExportStudio.pdf = window.ExportStudio.pdf || {};

/**
 * Centralized Production Logging Abstraction Wrapper.
 */
function rendererLogWarn(msg, err) {
  if (typeof console !== "undefined" && typeof console.warn === "function") {
    console.warn("[ExportStudio Renderer Warn]: " + msg, err || "");
  }
}

/**
 * Robust Date Formatter targeting legacy Android environments lacking Gujarati Unicode locale properties.
 */
function safeGetPrintDate() {
  var d = new Date();
  try {
    return d.toLocaleDateString("gu-IN");
  } catch (e) {
    var months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    return d.getDate() + "/" + months[d.getMonth()] + "/" + d.getFullYear();
  }
}

/**
 * Filename Sanitizer Matrix to secure target operating systems against illegal character writes.
 */
function sanitizeOutputFilename(filename) {
  var cleanStr = String(filename || "Export_Document");
  return cleanStr.replace(/[\/\\:\*\?"<>\|]/g, "_").substring(0, 100);
}

/**
 * Generates unified layout style overrides to ensure CSS isolation inside print viewports.
 */
function getCorePrintStyles() {
  return '<style>' +
    '  .pdf-document-wrapper { font-family: "Noto Sans Gujarati", "Shruti", sans-serif; color: #111; line-height: 1.5; padding: 10px; position: relative; }' +
    '  .pdf-header-table { width: 100%; border-bottom: 2px solid #222; margin-bottom: 15px; padding-bottom: 5px; }' +
    '  .pdf-institution-title { font-size: 22px; font-weight: bold; color: #1e3a8a; text-align: center; margin: 0; }' +
    '  .pdf-meta-title { font-size: 14px; text-align: center; color: #475569; margin: 4px 0 0 0; font-weight: 600; }' +
    '  .pdf-meta-row { width: 100%; margin-bottom: 20px; font-size: 12px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px; }' +
    '  .pdf-question-block { margin-bottom: 18px; page-break-inside: avoid; break-inside: avoid; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }' +
    '  .pdf-question-text { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px; word-wrap: break-word; }' +
    '  .vw-option-table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 12px; }' +
    '  .vw-option-table td { width: 50%; padding: 4px 2px; vertical-align: top; }' +
    '  .pdf-section-divider { page-break-before: always; break-before: always; margin-top: 30px; border-top: 2px dashed #0284c7; padding-top: 10px; }' +
    '  .pdf-section-title { font-size: 16px; font-weight: bold; color: #0284c7; margin-bottom: 15px; border-bottom: 1px solid #0284c7; padding-bottom: 4px; }' +
    '  .pdf-answer-grid { width: 100%; border-collapse: collapse; margin-top: 10px; }' +
    '  .pdf-answer-grid th, .pdf-answer-grid td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 12px; text-align: center; }' +
    '  .pdf-answer-grid th { background-color: #f8fafc; font-weight: bold; }' +
    '  .pdf-solution-row { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; page-break-inside: avoid; break-inside: avoid; }' +
    '  .pdf-watermark { position: absolute; top: 40%; left: 15%; transform: rotate(-35deg); font-size: 75px; color: rgba(226, 232, 240, 0.35); font-weight: bold; pointer-events: none; z-index: -1; white-space: nowrap; }' +
    '  .pdf-footer { font-size: 10px; color: #94a3b8; text-align: center; margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 5px; }' +
    '</style>';
}

/**
 * Builds the visual brand header structure safely protected against XSS.
 */
function buildVisualHeader(branding) {
  var html = '<table class="pdf-header-table">';
  html += '  <tr><td>';
  html += '    <div class="pdf-institution-title">' + esc(branding.institution) + '</div>';
  html += '    <div class="pdf-meta-title">' + esc(branding.testTitle) + '</div>';
  html += '  </td></tr>';
  html += '</table>';
  
  html += '<table class="pdf-meta-row">';
  html += '  <tr>';
  html += '    <td style="width:50%;"><b>શિક્ષક:</b> ' + esc(branding.author) + '</td>';
  html += '    <td style="width:50%; text-align:right;"><b>તારીખ:</b> ' + esc(safeGetPrintDate()) + '</td>';
  html += '  </tr>';
  html += '</table>';
  
  return html;
}

/**
 * Action Renderer A: Question Paper Sheet HTML Layout Builder.
 */
window.ExportStudio.pdf.buildWorksheetHTML = function(pkg) {
  if (!pkg || !pkg.dataSet || !pkg.branding) return "";
  
  var html = '<div class="pdf-document-wrapper">';
  if (pkg.branding.watermarkText) {
    html += '<div class="pdf-watermark">' + esc(pkg.branding.watermarkText) + '</div>';
  }
  
  html += buildVisualHeader(pkg.branding);
  
  var questions = pkg.dataSet.questions;
  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    if (!q) continue;
    
    var activeOptions = Array.isArray(q.options) ? q.options : [];
    
    html += '<div class="pdf-question-block">';
    html += '  <div class="pdf-question-text"><b>પ્રશ્ન ' + q.index + '.</b> ' + esc(q.text) + '</div>';
    html +=    optionTable(activeOptions);
    html += '</div>';
  }
  
  html += '  <div class="pdf-footer">' + esc(pkg.branding.institution) + ' | Powered by Vidya Wave</div>';
  html += '</div>';
  return html;
};

/**
 * Action Renderer B: Answer Key Grid Layout Builder.
 */
window.ExportStudio.pdf.buildAnswerKeyHTML = function(pkg) {
  if (!pkg || !pkg.dataSet || !pkg.branding) return "";
  
  var html = '<div class="pdf-document-wrapper pdf-section-divider">';
  html += '  <div class="pdf-section-title">ઉત્તરાવલી (Answer Key)</div>';
  html += '  <table class="pdf-answer-grid">';
  html += '    <tr><th>પ્રશ્ન ક્રમાંક</th><th>સાચો વિકલ્પ</th></tr>';
  
  var keys = pkg.dataSet.answerKeys;
  for (var i = 0; i < keys.length; i++) {
    if (!keys[i]) continue;
    html += '    <tr>';
    html += '      <td>પ્રશ્ન ' + keys[i].questionNumber + '</td>';
    html += '      <td><b>' + esc(keys[i].answer) + '</b></td>';
    html += '    </tr>';
  }
  
  html += '  </table>';
  html += '</div>';
  return html;
};

/**
 * Action Renderer C: Detailed Solution Sheet Layout Builder.
 */
window.ExportStudio.pdf.buildSolutionsHTML = function(pkg) {
  if (!pkg || !pkg.dataSet || !pkg.branding) return "";
  
  var html = '<div class="pdf-document-wrapper pdf-section-divider">';
  html += '  <div class="pdf-section-title">વિગતવાર સોલ્યુશન (Detailed Solutions)</div>';
  
  var solutions = pkg.dataSet.detailedSolutions;
  var questions = pkg.dataSet.questions;
  
  for (var i = 0; i < solutions.length; i++) {
    var sol = solutions[i];
    if (!sol) continue;
    var rawQ = questions[i] || {};
    
    html += '<div class="pdf-solution-row">';
    html += '  <div><b>પ્રશ્ન ' + sol.questionNumber + '.</b> ' + esc(rawQ.text || "") + '</div>';
    html += '  <div style="margin:4px 0; color:#16a34a;"><b>સાચો જવાબ: ' + esc(sol.correctAnswer) + '</b></div>';
    html += '  <div style="color:#475569; background:#f8fafc; padding:6px; border-left:3px solid #cbd5e1;">';
    html += '    <b>સમજૂતી:</b> ' + esc(sol.rawSolutionText || "કોઈ વિગતવાર સમજૂતી ઉપલબ્ધ નથી.");
    html += '  </div>';
    html += '</div>';
  }
  
  html += '</div>';
  return html;
};

/**
 * Universal Unified High-Performance PDF Asynchronous Compiler Engine.
 */
window.ExportStudio.pdf.generatePDF = function(fullHtmlContent, filenameTarget) {
  if (typeof html2pdf === "undefined") {
    toast("❌ html2pdf.js લાઇબ્રેરી મળી નથી.");
    return Promise.resolve();
  }
  
  var stage = el("stage");
  if (!stage) return Promise.resolve();
  
  var safeFilename = sanitizeOutputFilename(filenameTarget);
  stage.innerHTML = getCorePrintStyles() + fullHtmlContent;
  
  var opt = {
    margin:       [10, 10, 10, 10],
    filename:     safeFilename + ".pdf",
    image:        { type: "jpeg", quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: "mm", format: "a4", orientation: "portrait" }
  };
  
  return html2pdf().set(opt).from(stage).save()
    .then(function() {
      stage.innerHTML = "";
    })
    .catch(function(err) {
      if (stage) {
        stage.innerHTML = "";
      }
      rendererLogWarn("Critical breakdown inside html2pdf driver routine execution:", err);
      toast("❌ PDF ફાઇલ જનરેશન અપૂર્ણ રહી.");
      // Patch: Resolved the promise thread down the orchestration sequence safely
      return Promise.resolve();
    });
};

