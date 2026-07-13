/**
 * Vidya Wave — Enterprise Teacher Export Studio V3
 * Module: export-word.js (Word-Compatible Document Generator)
 * Version: 3.1.1 (Enterprise Hardened — Ultimate Production Frozen)
 * 
 * Architecture Rules & Constraints:
 * - Strict ES5 Syntax Compliance (No const, let, arrow functions).
 * - Environmental Prerequisite: Native `Promise` object OR Polyfill MUST exist in the global scope.
 * - Layer Constraint: Renderer & Blob Exporter. No business logic.
 * - Format: Generates Microsoft Word-compatible HTML wrapped in .doc envelope.
 * - API Parity: Strictly matches export-pdf.js public API for seamless Controller routing.
 */

window.ExportStudio = window.ExportStudio || {};
window.ExportStudio.word = window.ExportStudio.word || {};

/**
 * Centralized Internal Logger for Word Module.
 */
function wordLogWarn(msg, err) {
  if (typeof console !== "undefined" && typeof console.warn === "function") {
    console.warn("[ExportStudio Word Warn]: " + msg, err || "");
  }
}

/**
 * Filename Sanitizer Matrix.
 */
function sanitizeOutputFilename(filename) {
  var cleanStr = String(filename || "VidyaWave_Export");
  return cleanStr.replace(/[\/\\:\*\?"<>\|]/g, "_").substring(0, 100);
}

/**
 * Cross-browser ES5 Array Check.
 */
function isArraySafe(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
}

/**
 * Deep Text Sanitization & Newline Preserver.
 */
function safeText(text) {
  var rawText = (text == null) ? "" : String(text);
  var safeEsc = (typeof window.esc === "function") ? window.esc : function(s) { return s; };
  return safeEsc(rawText).replace(/\n/g, "<br>");
}

/**
 * Extracts and centralizes Microsoft Word MSO Styles.
 */
function getWordStyles() {
  var html = '<style>';
  html += '  @page WordSection1 { size: 21cm 29.7cm; margin: 1.5cm 2cm; mso-header-margin: 35.4pt; mso-footer-margin: 35.4pt; mso-paper-source: 0; }';
  html += '  div.WordSection1 { page: WordSection1; font-family: "Noto Sans Gujarati", "Shruti", sans-serif; font-size: 11pt; color: #000; }';
  html += '  h1, h2, h3, p { margin-top: 0; margin-bottom: 8pt; line-height: 1.3; }';
  html += '  table { border-collapse: collapse; width: 100%; mso-table-layout-alt: fixed; }';
  html += '  .vw-option-table td { width: 50%; padding: 4pt 2pt; vertical-align: top; }';
  html += '  .vw-answer-grid td, .vw-answer-grid th { border: 1pt solid #000; padding: 5pt; text-align: center; }';
  html += '  .header-table { width: 100%; border-bottom: 2pt solid #000; margin-bottom: 12pt; }';
  html += '  .header-table td { border: none; padding-bottom: 4pt; }';
  html += '  .meta-table { width: 100%; margin-bottom: 15pt; border-bottom: 1pt dashed #888; }';
  html += '  .meta-table td { border: none; padding-bottom: 4pt; font-size: 10pt; }';
  html += '  .question-block { margin-bottom: 15pt; }';
  html += '  .solution-block { margin-bottom: 15pt; border-bottom: 1pt solid #ccc; padding-bottom: 10pt; }';
  html += '  .page-break { page-break-before: always; clear: all; mso-special-character: line-break; }';
  html += '</style>';
  return html;
}

/**
 * Generates the essential Microsoft Word HTML wrapper.
 */
function wrapWordDocument(innerHtml) {
  var html = '<html xmlns:v="urn:schemas-microsoft-com:vml" ';
  html += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
  html += 'xmlns:w="urn:schemas-microsoft-com:office:word" ';
  html += 'xmlns:m="http://schemas.microsoft.com/office/2004/12/omml" ';
  html += 'xmlns="http://www.w3.org/TR/REC-html40">';
  
  html += '<head>';
  html += '<meta charset="utf-8">';
  html += '<title>Vidya Wave Export</title>';
  html += '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->';
  html += getWordStyles();
  html += '</head>';
  html += '<body><div class="WordSection1">';
  html += innerHtml;
  html += '</div></body></html>';
  
  return html;
}

/**
 * Shared Visual Header Builder for Word Documents.
 */
function buildWordHeader(branding, dateStr) {
  var brand = branding || {};
  var html = '<table class="header-table"><tr><td style="text-align:center;">';
  html += '<span style="font-size:16pt; font-weight:bold; color:#1e3a8a;">' + safeText(brand.institution || "Vidya Wave") + '</span><br>';
  html += '<span style="font-size:12pt; color:#444;">' + safeText(brand.testTitle || "Export Document") + '</span>';
  html += '</td></tr></table>';
  
  html += '<table class="meta-table"><tr>';
  html += '<td style="width:50%;"><b>શિક્ષક:</b> ' + safeText(brand.author || "Unknown") + '</td>';
  html += '<td style="width:50%; text-align:right;"><b>તારીખ:</b> ' + safeText(dateStr || "") + '</td>';
  html += '</tr></table>';
  
  return html;
}

/**
 * Action Renderer A: Worksheet Document Layout
 */
window.ExportStudio.word.buildWorksheetHTML = function(pkg) {
  if (!pkg || !pkg.dataSet) return "";
  
  var html = buildWordHeader(pkg.branding, pkg.timestamp);
  var questions = pkg.dataSet.questions || [];
  
  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    if (!q) continue;
    
    var displayIndex = q.index || (i + 1);
    var activeOptions = isArraySafe(q.options) ? q.options : [];
    
    html += '<div class="question-block">';
    html += '  <p><b>પ્રશ્ન ' + displayIndex + '.</b> ' + safeText(q.text) + '</p>';
    
    if (typeof window.optionTable === "function") {
      html += window.optionTable(activeOptions);
    } else if (activeOptions.length > 0) {
      html += '<table class="vw-option-table"><tr><td>(A) ' + safeText(activeOptions[0]) + '</td><td>(B) ' + safeText(activeOptions[1] || "") + '</td></tr></table>';
    }
    
    html += '</div>';
  }
  
  return html;
};

/**
 * Action Renderer B: Answer Key Document Layout
 */
window.ExportStudio.word.buildAnswerKeyHTML = function(pkg) {
  if (!pkg || !pkg.dataSet) return "";
  
  var html = '<h2 style="text-align:center;">ઉત્તરાવલી (Answer Key)</h2>';
  html += '<table class="vw-answer-grid">';
  html += '<tr><th style="background:#f0f0f0;">પ્રશ્ન ક્રમાંક</th><th style="background:#f0f0f0;">સાચો વિકલ્પ</th></tr>';
  
  var keys = pkg.dataSet.answerKeys || [];
  for (var i = 0; i < keys.length; i++) {
    if (!keys[i]) continue;
    html += '<tr>';
    html += '<td>પ્રશ્ન ' + (keys[i].questionNumber || (i + 1)) + '</td>';
    html += '<td><b>' + safeText(keys[i].answer) + '</b></td>';
    html += '</tr>';
  }
  
  html += '</table>';
  return html;
};

/**
 * Action Renderer C: Detailed Solutions Document Layout
 */
window.ExportStudio.word.buildSolutionsHTML = function(pkg) {
  if (!pkg || !pkg.dataSet) return "";
  
  var html = '<h2 style="text-align:center;">વિગતવાર સોલ્યુશન (Detailed Solutions)</h2>';
  
  var solutions = pkg.dataSet.detailedSolutions || [];
  var questions = pkg.dataSet.questions || [];
  
  for (var i = 0; i < solutions.length; i++) {
    var sol = solutions[i];
    if (!sol) continue;
    var rawQ = questions[i] || {};
    
    html += '<div class="solution-block">';
    html += '  <p><b>પ્રશ્ન ' + (sol.questionNumber || (i + 1)) + '.</b> ' + safeText(rawQ.text) + '</p>';
    html += '  <p style="color:#16a34a;"><b>સાચો જવાબ: ' + safeText(sol.correctAnswer) + '</b></p>';
    html += '  <div style="background:#f9f9f9; padding:8pt; border:1pt solid #ddd;">';
    html += '    <b>સમજૂતી:</b><br>' + safeText(sol.rawSolutionText || "કોઈ વિગતવાર સમજૂતી ઉપલબ્ધ નથી.");
    html += '  </div>';
    html += '</div>';
  }
  
  return html;
};

/**
 * Universal Unified Word Asynchronous Compiler Engine.
 * Features strict DOM Memory cleanup and legacy OS validations.
 * 
 * CONTRACT NOTE: The returned Promise resolves immediately when the browser successfully 
 * triggers the native download dialog/action. It does NOT guarantee that the user has 
 * finished downloading the file to disk, as browser security prevents monitoring file IO.
 */
window.ExportStudio.word.generateWord = function(innerHtmlContent, filenameTarget) {
  return new Promise(function(resolve, reject) {
    var downloadLink = null;
    var url = null;
    var URLObj = window.URL || window.webkitURL;
    
    try {
      if (typeof Blob === "undefined") {
        throw new Error("Blob API is not supported in this legacy environment.");
      }
      if (!URLObj) {
        throw new Error("URL API is not supported in this legacy environment.");
      }

      var safeFilename = sanitizeOutputFilename(filenameTarget) + ".doc";
      var fullWordHtml = wrapWordDocument(innerHtmlContent);
      var WORD_MIME = "application/msword;charset=utf-8";
      
      var blob = new Blob(['\ufeff', fullWordHtml], { type: WORD_MIME });
      url = URLObj.createObjectURL(blob);
      
      downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = safeFilename;
      downloadLink.style.display = "none";
      
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Contract Fulfillment: Resolves immediately upon download trigger.
      resolve(safeFilename);
      
    } catch (err) {
      wordLogWarn("Blob compilation or download execution failed.", err);
      reject(err);
    } finally {
      if (downloadLink && downloadLink.parentNode) {
        downloadLink.parentNode.removeChild(downloadLink);
      }
      if (url && URLObj) {
        setTimeout(function() {
          URLObj.revokeObjectURL(url);
        }, 150);
      }
    }
  });
};

