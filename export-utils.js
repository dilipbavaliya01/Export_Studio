/**
 * Vidya Wave — Enterprise Teacher Export Studio V3
 * Module: export-utils.js (Shared Low-Level Utility Helpers & Security Envelopes)
 * Version: 3.0.1 (Production Hardened)
 * 
 * Architecture Rules:
 * - Strict ES5 Compliance (No let, const, arrow functions, or template literals).
 * - Zero external module or file dependencies (No imports).
 * - Absolutely no domain business logic, layout templates, or platform routing.
 * - Bottom-layer module: Must never call core, search, or export engines.
 */

// Enterprise Unified Namespace Isolation to Prevent Global Pollution
window.ExportStudio = window.ExportStudio || {};
window.ExportStudio.state = window.ExportStudio.state || {};
window.ExportStudio.state.cancel = typeof window.ExportStudio.state.cancel !== "undefined" ? window.ExportStudio.state.cancel : false;
window.ExportStudio.state.qr = typeof window.ExportStudio.state.qr !== "undefined" ? window.ExportStudio.state.qr : null;
window.ExportStudio.state.favs = window.ExportStudio.state.favs || {};
window.ExportStudio.state.selected = window.ExportStudio.state.selected || {};

/**
 * Accesses a DOM element securely by its unique identifier string.
 */
function el(id) {
  return document.getElementById(id);
}

/**
 * Escapes unsafe diagnostic characters to neutralize Cross-Site Scripting (XSS) vectors.
 */
function esc(s) {
  if (s == null) {
    return "";
  }
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Normalizes Gujarati strings by stripping out vocalic diacritics (માત્રા ચિહ્નો).
 */
function normalize(s) {
  if (!s) {
    return "";
  }
  return String(s)
    .toLowerCase()
    .replace(/[ાિીુૂૃૅેૈૉોૌંઃઁ઼્]/g, "")
    .trim();
}

/**
 * Triggers a temporary contextual status notification across the application viewport.
 */
function toast(message) {
  var t = el("toast");
  if (!t) {
    return;
  }
  t.textContent = message;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(function () {
    t.classList.remove("show");
  }, 2800);
}

/**
 * Controls the central rendering progress monitor overlay interface metrics.
 */
function prog(text, percentage) {
  var pBlock = el("prog");
  var pTxt = el("pTxt");
  var pBar = el("pBar");

  if (!pBlock || !pTxt || !pBar) {
    return;
  }

  pBlock.style.display = "block";
  pTxt.textContent = text;
  pBar.style.width = percentage + "%";

  if (percentage >= 100) {
    setTimeout(function () {
      pBlock.style.display = "none";
    }, 900);
  }
}

/**
 * Resets the global tracking status values of the structural monitoring overlay.
 */
function resetProgress() {
  var pBlock = el("prog");
  var pBar = el("pBar");
  var pTxt = el("pTxt");
  
  window.ExportStudio.state.cancel = false;
  if (pBar) {
    pBar.style.width = "0%";
  }
  if (pTxt) {
    pTxt.textContent = "...";
  }
  if (pBlock) {
    pBlock.style.display = "none";
  }
}

/**
 * Halts ongoing file compilation pipelines by signaling a global execution break flag.
 */
function cancelExport() {
  window.ExportStudio.state.cancel = true;
  resetProgress();
  toast("⛔ એક્સપોર્ટ પ્રક્રિયા રદ કરવામાં આવી છે.");
}

/**
 * Wraps native setTimeout delays in an asynchronous Promise structure.
 */
function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

/**
 * Monitors cross-origin image loads recursively to protect against target canvas clipping.
 */
function waitImages(root) {
  if (!root) {
    return Promise.resolve();
  }
  var imgs = [].slice.call(root.querySelectorAll("img"));
  return Promise.all(
    imgs.map(function (img) {
      if (img.complete) {
        return Promise.resolve();
      }
      return new Promise(function (res) {
        function handler() {
          img.removeEventListener("load", handler);
          img.removeEventListener("error", handler);
          res();
        }
        img.addEventListener("load", handler);
        img.addEventListener("error", handler);
      });
    })
  );
}

/**
 * Asynchronously checks document canvas allocations until the live QR graphic asset stabilizes.
 */
function waitQR() {
  return new Promise(function (resolve) {
    var attempts = 0;
    var intervalId = setInterval(function () {
      var canvas = document.querySelector("#qrHolder canvas");
      var img = document.querySelector("#qrHolder img");
      attempts++;

      if (canvas) {
        clearInterval(intervalId);
        resolve(canvas.toDataURL("image/png"));
        return;
      } else if (img && img.src && img.src.indexOf("data:image") === 0) {
        clearInterval(intervalId);
        resolve(img.src);
        return;
      }

      if (attempts > 80) {
        clearInterval(intervalId);
        resolve(null);
      }
    }, 50);
  });
}

/**
 * Automatically safely clean up short-term file tracking tokens from local memory structures.
 */
function revokeBlobUrl(url) {
  if (url && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    setTimeout(function () {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn("Blob revocation exception handled:", e);
      }
    }, 1000);
  }
}

/**
 * Flushes temporary node stages and memory arrays to protect against client environment crashes.
 */
function cleanupMemory() {
  try {
    var stage = el("stage");
    if (stage) {
      stage.innerHTML = "";
    }

    var elements = document.querySelectorAll("#stage canvas, #stage svg");
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].parentNode) {
        elements[i].parentNode.removeChild(elements[i]);
      }
    }

    if (window.MathJax && typeof MathJax.typesetClear === "function") {
      MathJax.typesetClear();
    }
    
    window.ExportStudio.state.qr = null;
    
    if (window.gc) {
      window.gc();
    }
  } catch (err) {
    console.warn("Memory cleanup routine warning:", err);
  }
}

/**
 * Extracts all mathematical formulas matching standard block notation strings.
 */
function extractFormulas(q) {
  if (!q || !q.solution) {
    return ["No Formula Available"];
  }
  var matches = q.solution.match(/\$.*?\$/g) || [];
  if (matches.length === 0) {
    return ["No Formula Available"];
  }
  
  var uniqueMap = {};
  var uniqueList = [];
  for (var i = 0; i < matches.length; i++) {
    var item = matches[i];
    if (!uniqueMap[item]) {
      uniqueMap[item] = true;
      uniqueList.push(item);
    }
  }
  return uniqueList;
}

/**
 * Formats options data grids into structured, print-safe cross-column tables.
 */
function optionTable(options) {
  if (!options || !options.length) {
    return "";
  }
  var html = '<table class="vw-option-table" style="width:100%; border-collapse:collapse; margin-top:6px; font-size:11px;">';
  for (var i = 0; i < options.length; i += 2) {
    html += "<tr>";
    html += '<td style="width:50%; padding:4px 2px; vertical-align:top;"><b>(' + String.fromCharCode(65 + i) + ")</b> " + esc(options[i]) + "</td>";
    html += '<td style="width:50%; padding:4px 2px; vertical-align:top;">';
    if (options[i + 1]) {
      html += "<b>(" + String.fromCharCode(66 + i) + ")</b> " + esc(options[i + 1]);
    }
    html += "</td></tr>";
  }
  html += "</table>";
  return html;
}

/**
 * Constructs sanitized download file naming configurations.
 */
function fileBase(suffix) {
  var baseId = "Export";
  if (typeof TEST !== "undefined" && TEST && TEST.testId) {
    baseId = TEST.testId;
  }
  var formatted = ("GandivAcademy_" + baseId + "_" + suffix);
  var cleanName = formatted.replace(/[^\w\-]+/g, "_");
  return cleanName.substring(0, 120);
}

/**
 * Orchestrates rendering pipelines with MathJax configurations safely.
 */
function renderMath(doc) {
  if (!window.MathJax || !window.MathJax.startup) {
    return Promise.resolve();
  }
  return MathJax.startup.promise
    .then(function () {
      return MathJax.typesetPromise([doc]);
    })
    .then(function () {
      return new Promise(function (r) {
        setTimeout(r, 400);
      });
    })
    .catch(function (err) {
      console.warn("MathJax core compilation caught execution intercept:", err);
      return Promise.resolve();
    });
}
