/**
 * Vidya Wave — Enterprise Teacher Export Studio V3
 * Module: export-search.js (Dashboard Search, Favorites Management & Question Selection UI)
 * Version: 3.0.7 (Ultimate Hardened — Production Final & Immutable Lock)
 * 
 * Architecture Rules:
 * - Strict ES5 Compliance (No let, const, arrow functions, or template literals).
 * - Depends on: Global states and functions from export-utils.js v3.0.1.
 * - Layer Constraint: Handles UI state, search patterns, and selections. No compilation logic.
 */

// Explicit Deep State Initialization Guards to Prevent Null/Undefined Runtime Crashes
window.ExportStudio = window.ExportStudio || {};
window.ExportStudio.state = window.ExportStudio.state || {};
window.ExportStudio.state.cancel = typeof window.ExportStudio.state.cancel !== "undefined" ? window.ExportStudio.state.cancel : false;
window.ExportStudio.state.qr = typeof window.ExportStudio.state.qr !== "undefined" ? window.ExportStudio.state.qr : null;
window.ExportStudio.state.favs = window.ExportStudio.state.favs || {};
window.ExportStudio.state.selected = window.ExportStudio.state.selected || {};

// Safe Initialization to Prevent Overwriting Existing Cross-Module Data Structures
window.ExportStudio.data = window.ExportStudio.data || {};
window.ExportStudio.data.categories = window.ExportStudio.data.categories || {};
window.ExportStudio.data.test = window.ExportStudio.data.test || null;
window.ExportStudio.actions = window.ExportStudio.actions || {};
window.ExportStudio.eventsBound = window.ExportStudio.eventsBound || false;
window.ExportStudio.actionsLocked = window.ExportStudio.actionsLocked || false;

// Internal Debounce Timer Variable Latch
var searchDebounceTimer = null;

// Storage Namespace Versioning Configuration for Forward Migration Compatibility
var STORAGE_KEY_FAVS = "vw_export_favs_v1";

// Performance Optimization - Run Global Locale Detection Once During Bootstrap Phase
var SUPPORT_GU_LOCALE = true;
try {
  "અ".localeCompare("આ", "gu");
} catch (e) {
  SUPPORT_GU_LOCALE = false;
}

// Internal Immutable Search Map Configuration (Read-Only Convention)
var SEARCH_SYNONYMS = {
  "પેપર": "worksheet",
  "સોલ્યુશન": "solution",
  "જવાબ": "answer",
  "સૂત્રો": "formula",
  "બોર્ડ": "board"
};

/**
 * Centralized Production Logging Abstraction Wrapper.
 */
function logWarn(msg, context) {
  if (typeof console !== "undefined" && typeof console.warn === "function") {
    console.warn("[ExportStudio Warn]: " + msg, context || "");
  }
}

/**
 * Enterprise Secure Registration Helper to add verified callbacks to the Action Registry.
 */
window.ExportStudio.registerAction = function(key, callbackFn) {
  if (window.ExportStudio.actionsLocked || (typeof Object.isFrozen === "function" && Object.isFrozen(window.ExportStudio.actions))) {
    logWarn("Registry Is Frozen. Blocked registration attempt for key:", key);
    return;
  }
  if (key && typeof callbackFn === "function") {
    window.ExportStudio.actions[key] = callbackFn;
  } else {
    logWarn("Invalid registration parameter keys provided for action:", key);
  }
};

/**
 * Structural Finalization Bootstrapper.
 * Freezes Registry, Synonyms, and Categories objects recursively to make them strictly immutable.
 */
window.ExportStudio.freezeArchitectureCore = function() {
  window.ExportStudio.actionsLocked = true;
  if (typeof Object.freeze === "function") {
    try {
      Object.freeze(window.ExportStudio.actions);
      Object.freeze(SEARCH_SYNONYMS);
      if (window.ExportStudio.data && window.ExportStudio.data.categories) {
        Object.freeze(window.ExportStudio.data.categories);
      }
    } catch (e) {
      logWarn("Object.freeze interception handled during security lock sequence:", e);
    }
  }
};

/**
 * Polyfill fallback helper to find the closest matching element selector for older WebViews.
 */
function findClosestParent(element, selector) {
  if (!element) return null;
  if (typeof element.closest === "function") {
    return element.closest(selector);
  }
  var elNode = element;
  while (elNode && elNode !== document.documentElement) {
    var matchFn = elNode.matches || 
                  elNode.matchesSelector || 
                  elNode.msMatchesSelector || 
                  elNode.mozMatchesSelector || 
                  elNode.webkitMatchesSelector || 
                  elNode.oMatchesSelector;
                  
    if (matchFn && matchFn.call(elNode, selector)) {
      return elNode;
    }
    elNode = elNode.parentNode;
  }
  return null;
}

/**
 * Saves the current local favorites object state to the browser storage context.
 */
function saveFavorites() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(window.ExportStudio.state.favs));
    }
  } catch (e) {
    logWarn("Storage write restriction encountered in saveFavorites:", e);
  }
}

/**
 * Synchronizes the runtime favorites boundary with previously configured storage flags.
 */
function loadFavorites() {
  try {
    if (typeof localStorage !== "undefined") {
      var stored = localStorage.getItem(STORAGE_KEY_FAVS);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          window.ExportStudio.state.favs = parsed;
          return;
        }
      }
    }
  } catch (e) {
    logWarn("Storage read restriction encountered in loadFavorites:", e);
  }
  window.ExportStudio.state.favs = {};
}

/**
 * Toggles the favorite status indicator flags on individual dashboard options.
 */
function toggleFavorite(itemId) {
  if (!itemId) return;
  
  if (window.ExportStudio.state.favs[itemId]) {
    delete window.ExportStudio.state.favs[itemId];
    toast("⭐ ફેવરિટમાંથી દૂર કરવામાં આવ્યું.");
  } else {
    window.ExportStudio.state.favs[itemId] = true;
    toast("⭐ ફેવરિટમાં ઉમેરવામાં આવ્યું.");
  }
  
  saveFavorites();
  
  var searchInput = el("searchExport");
  renderExportDashboard(searchInput ? searchInput.value : "");
}

/**
 * Filters all registered items based on search queries and synonyms.
 */
function filterExportItems(cleanQuery, normQuery) {
  var matchedItems = [];
  var cats = window.ExportStudio.data.categories;
  
  for (var catKey in cats) {
    if (Object.prototype.hasOwnProperty.call(cats, catKey)) {
      var currentCat = cats[catKey];
      if (!currentCat || !currentCat.items || !currentCat.items.length) {
        continue;
      }
      for (var i = 0; i < currentCat.items.length; i++) {
        var item = currentCat.items[i];
        if (!item || !item.name) {
          continue;
        }
        
        var nameStr = String(item.name);
        var descStr = item.desc ? String(item.desc) : "";
        
        var matchDirect = nameStr.toLowerCase().indexOf(cleanQuery) !== -1 || 
                          descStr.toLowerCase().indexOf(cleanQuery) !== -1;
                          
        var matchNorm = normalize(nameStr).indexOf(normQuery) !== -1 || 
                        normalize(descStr).indexOf(normQuery) !== -1;
                        
        if (!cleanQuery || matchDirect || matchNorm) {
          matchedItems.push({
            id: item.id,
            name: nameStr,
            desc: descStr,
            format: item.format || "pdf",
            action: item.action,
            categoryName: currentCat.name,
            isFavorite: !!window.ExportStudio.state.favs[item.id]
          });
        }
      }
    }
  }
  return matchedItems;
}

/**
 * Sorts filtered dashboard tools based on favorites and language parameters.
 */
function sortExportItems(items) {
  items.sort(function(a, b) {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    if (SUPPORT_GU_LOCALE) {
      return a.name.localeCompare(b.name, "gu");
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Builds clean, XSS-safe HTML markup block utilizing corporate CSS theme classes.
 */
function buildExportCardHTML(items) {
  var html = '<div class="exp-category-title">Available Export Standard Formats</div>';
  html += '<div class="exp-grid">';
  
  for (var j = 0; j < items.length; j++) {
    var card = items[j];
    var favBtnClass = card.isFavorite ? "ex-card-favorite-icon active" : "ex-card-favorite-icon";
    var favChar = card.isFavorite ? "★" : "☆";
    
    var cardFormatClass = "pdf-format";
    if (card.format === "word") cardFormatClass = "word-format";
    if (card.format === "img") cardFormatClass = "img-format";
    
    html += '<div class="ex-card ' + cardFormatClass + '" data-action="' + esc(card.action) + '">';
    html += '  <span class="' + favBtnClass + '" data-fav-id="' + esc(card.id) + '">' + favChar + '</span>';
    html += '  <div>';
    html += '    <b>' + esc(card.name) + '</b>';
    html += '    <small>' + esc(card.desc) + '</small>';
    html += '  </div>';
    html += '  <i class="tag-format">' + esc(card.format) + '</i>';
    html += '</div>';
  }
  
  html += '</div>';
  return html;
}

/**
 * Orchestrates rendering pipelines across dashboard container components.
 */
function renderExportDashboard(filterText) {
  var container = el("expContainer");
  if (!container) return;
  
  var cleanQuery = (filterText || "").toLowerCase().trim();
  if (SEARCH_SYNONYMS[cleanQuery]) {
    cleanQuery = SEARCH_SYNONYMS[cleanQuery];
  }
  
  var normQuery = normalize(cleanQuery);
  var filteredItems = filterExportItems(cleanQuery, normQuery);
  
  if (filteredItems.length === 0) {
    container.innerHTML = '<div class="vw-no-results-alert">🔍 કોઈ પરિણામ મળ્યા નથી. કૃપા કરીને અન્ય કીવર્ડ સાથે સર્ચ કરો.</div>';
    return;
  }
  
  sortExportItems(filteredItems);
  container.innerHTML = buildExportCardHTML(filteredItems);
}

/**
 * Central event wrapper mapping for dashboard query changes.
 */
function filterExportCards(val) {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  searchDebounceTimer = setTimeout(function() {
    renderExportDashboard(val);
  }, 180);
}

/**
 * Recalculates user element constraints and refreshes structural interface numeric trackers.
 */
function updateSelectionCounter() {
  var totalCount = 0;
  var selectedCount = 0;
  var testData = window.ExportStudio.data.test;
  
  if (testData && testData.questions) {
    totalCount = testData.questions.length;
    for (var i = 0; i < testData.questions.length; i++) {
      var qId = testData.questions[i].qId;
      if (window.ExportStudio.state.selected[qId] !== false) {
        selectedCount++;
      }
    }
  }
  
  var counterEl = el("selCount");
  if (counterEl) {
    counterEl.textContent = "(" + selectedCount + " / " + totalCount + " પસંદ કરેલ)";
  }
}

/**
 * Toggles target processing status constraints globally across explicit question elements.
 */
function toggleQuestion(qId) {
  if (qId == null) return;
  window.ExportStudio.state.selected[qId] = !(window.ExportStudio.state.selected[qId] !== false);
  updateSelectionCounter();
}

/**
 * Batch overrides configuration selections across the active evaluation array context.
 */
function toggleAllQuestions() {
  var testData = window.ExportStudio.data.test;
  if (!testData || !testData.questions) return;
  
  var activeSubject = el("subj") ? el("subj").value : "";
  var i, q;
  
  var contextHasUnselected = false;
  for (i = 0; i < testData.questions.length; i++) {
    q = testData.questions[i];
    var qSubject = q && q.subject ? String(q.subject) : "";
    if (!activeSubject || qSubject === activeSubject) {
      if (window.ExportStudio.state.selected[q.qId] === false) {
        contextHasUnselected = true;
        break;
      }
    }
  }
  
  for (i = 0; i < testData.questions.length; i++) {
    q = testData.questions[i];
    var currentSubject = q && q.subject ? String(q.subject) : "";
    if (!activeSubject || currentSubject === activeSubject) {
      window.ExportStudio.state.selected[q.qId] = contextHasUnselected;
    }
  }
  
  var checkboxes = document.querySelectorAll(".q-chk-node");
  for (var j = 0; j < checkboxes.length; j++) {
    var chk = checkboxes[j];
    var currentId = chk.getAttribute("data-qid");
    if (window.ExportStudio.state.selected[currentId] !== false) {
      chk.checked = true;
    } else {
      chk.checked = false;
    }
  }
  
  var toggleBtn = el("selAllBtn");
  if (toggleBtn) {
    toggleBtn.textContent = contextHasUnselected ? "Deselect All" : "Select All";
  }
  
  updateSelectionCounter();
}

/**
 * Compiles structural selection nodes inside virtualized component windows based on content parameters.
 */
function renderQuestionList() {
  var container = el("qList");
  var testData = window.ExportStudio.data.test;
  if (!container || !testData || !testData.questions) return;
  
  var activeSubject = el("subj") ? el("subj").value : "";
  var html = "";
  
  for (var i = 0; i < testData.questions.length; i++) {
    var q = testData.questions[i];
    var qSubject = q && q.subject ? String(q.subject) : "";
    if (activeSubject && qSubject !== activeSubject) {
      continue;
    }
    
    var isChecked = window.ExportStudio.state.selected[q.qId] !== false ? "checked" : "";
    var hardFlag = (q.difficulty === "Hard" || q.errorRate > 60) ? '<span class="tag-hard-flag">⚠️ Hard</span>' : '';
    var safeText = esc(String(q.text || ""));
    
    html += '<div class="question-item-row" data-qid="' + esc(q.qId) + '">' +
            '  <input type="checkbox" id="chk_' + esc(q.qId) + '" data-qid="' + esc(q.qId) + '" class="q-chk-node" ' + isChecked + '>' +
            '  <span class="question-text-truncate"><b>Q' + esc(q.qId) + '.</b> ' + safeText + '</span>' +
            hardFlag +
            '</div>';
  }
  
  container.innerHTML = html || '<div class="vw-empty-subject-alert">આ વિષય અંતર્ગત કોઈ પ્રશ્નો ઉપલબ્ધ નથી.</div>';
  updateSelectionCounter();
}

/**
 * Handles cascading filter updates when the global subject dropdown changes.
 */
function filterQuestionsBySubject() {
  renderQuestionList();
  var toggleBtn = el("selAllBtn");
  if (toggleBtn) {
    toggleBtn.textContent = "Select All";
  }
}

/**
 * Centralized Security Event Delegation Initialization Routine.
 */
function initEventDelegation() {
  if (!document.querySelectorAll || !document.getElementById) {
    return;
  }
  
  if (window.ExportStudio.eventsBound) {
    return;
  }
  window.ExportStudio.eventsBound = true;

  var expContainer = el("expContainer");
  if (expContainer) {
    expContainer.addEventListener("click", function(e) {
      var target = e.target;
      
      var favId = target.getAttribute("data-fav-id");
      if (favId) {
        e.stopPropagation();
        toggleFavorite(favId);
        return;
      }
      
      var cardNode = findClosestParent(target, ".ex-card");
      if (cardNode) {
        var actionKey = cardNode.getAttribute("data-action");
        if (actionKey && Object.prototype.hasOwnProperty.call(window.ExportStudio.actions, actionKey) && typeof window.ExportStudio.actions[actionKey] === "function") {
          window.ExportStudio.actions[actionKey]();
        } else {
          logWarn("Secure Action Registry Intercepted or Rejected Token String Key:", actionKey);
        }
      }
    });
  }

  var qListContainer = el("qList");
  if (qListContainer) {
    qListContainer.addEventListener("click", function(e) {
      var target = e.target;
      
      var matchesClass = target.classList ? 
                         target.classList.contains("q-chk-node") : 
                         /(^|\s)q-chk-node(\s|$)/.test(target.className);
                         
      if (matchesClass) {
        var chkQId = target.getAttribute("data-qid");
        toggleQuestion(chkQId);
        return;
      }
      
      var rowNode = findClosestParent(target, ".question-item-row");
      if (rowNode) {
        var targetQId = rowNode.getAttribute("data-qid");
        var chkBox = el("chk_" + targetQId);
        if (chkBox) {
          chkBox.checked = !chkBox.checked;
          toggleQuestion(targetQId);
        }
      }
    });
  }
}

// Safe Initialization Guard targeting execution injection or delayed script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initEventDelegation);
} else {
  initEventDelegation();
}
