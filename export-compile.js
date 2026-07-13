
/**
 * Vidya Wave — Enterprise Teacher Export Studio V3
 * Module: export-compile.js (Data Aggregator, Package Builder & Metadata Synthesizer)
 * Version: 3.0.1 (Enterprise Hardened — Production Final & Immutable Lock)
 * 
 * Architecture Rules:
 * - Strict ES5 Compliance (No let, const, arrow functions, or template literals).
 * - Depends on: window.ExportStudio.data & window.ExportStudio.state (from frozen modules).
 * - Layer Constraint: 100% Pure Data Processing. Zero DOM operations, zero rendering engine calls.
 */

window.ExportStudio = window.ExportStudio || {};
window.ExportStudio.compiler = window.ExportStudio.compiler || {};

/**
 * Centralized Compiler Internal Logger.
 */
function compilerLogWarn(msg, context) {
  if (typeof console !== "undefined" && typeof console.warn === "function") {
    console.warn("[ExportStudio Compiler Warn]: " + msg, context || "");
  }
}

/**
 * High-Performance Recursive Deep Freeze Utility Engine to guarantee absolute immutability.
 * @param {Object|Array} obj - The targeted object or data structure boundary.
 * @returns {Object|Array} The completely frozen immutable structure.
 */
function deepFreeze(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (typeof Object.freeze !== "function") {
    return obj;
  }
  
  var props = Object.getOwnPropertyNames(obj);
  for (var i = 0; i < props.length; i++) {
    var prop = props[i];
    if (obj[prop] !== null && typeof obj[prop] === "object") {
      deepFreeze(obj[prop]);
    }
  }
  return Object.freeze(obj);
}

/**
 * Universal safe timestamp generator targeting legacy Android WebViews.
 * @returns {string} Fully standardized ISO 8601 string representation.
 */
function safeGetISOString() {
  var d = new Date();
  if (typeof d.toISOString === "function") {
    return d.toISOString();
  }
  // Custom deterministic ISO execution fallback routine
  function pad(n) { return n < 10 ? "0" + n : n; }
  return d.getUTCFullYear() + "-" +
    pad(d.getUTCMonth() + 1) + "-" +
    pad(d.getUTCDate()) + "T" +
    pad(d.getUTCHours()) + ":" +
    pad(d.getUTCMinutes()) + ":" +
    pad(d.getUTCSeconds()) + "." +
    String((d.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5) + "Z";
}

/**
 * High-entropy random baseline algorithm to prevent Package ID collisions within a millisecond.
 * @returns {string} A alphanumeric prefix sequence token.
 */
function safeGetRandomSuffix() {
  var rand = Math.floor(Math.random() * 89999) + 10000;
  return String(rand);
}

/**
 * Phase 1: Validates incoming structural test components, active schemas, and arrays.
 * @param {Object} testData - The active test database state mapping template.
 * @returns {boolean} True if the structure passes all enterprise runtime checks.
 */
window.ExportStudio.compiler.validateTestData = function(testData) {
  if (!testData || typeof testData !== "object" || Array.isArray(testData)) {
    compilerLogWarn("Validation Failure: Test dataset is null or an invalid data type.");
    return false;
  }
  if (!testData.testId || !testData.questions || !Array.isArray(testData.questions)) {
    compilerLogWarn("Validation Failure: Missing critical fields (testId or questions array).");
    return false;
  }
  return true;
};

/**
 * Phase 2: Compiles, filters, and orders active questions based on subject hooks and status maps.
 * Handles granular subject slicing and hard-flag validations defensively.
 * @param {Object} config - Configuration object containing subject and difficulty overrides.
 * @returns {Array} List of standardized, deeply-verified matching question models.
 */
window.ExportStudio.compiler.compileFilterQuestions = function(config) {
  var compiledList = [];
  var testContext = window.ExportStudio.data.test;
  var selectedMap = window.ExportStudio.state.selected;
  
  if (!window.ExportStudio.compiler.validateTestData(testContext)) {
    return compiledList;
  }
  
  var activeSubject = config && config.subject ? String(config.subject).trim() : "";
  var activeDifficulty = config && config.difficulty ? String(config.difficulty).trim() : "";
  
  for (var i = 0; i < testContext.questions.length; i++) {
    var q = testContext.questions[i];
    if (!q || !q.qId) {
      continue;
    }
    
    // Intercept and skip items manually excluded by the instructor via the UI tree
    if (selectedMap && selectedMap[q.qId] === false) {
      continue;
    }
    
    // Enforce structural cascade boundaries across active subject properties
    if (activeSubject && String(q.subject || "").trim() !== activeSubject) {
      continue;
    }
    
    // Optional strict difficulty sorting block rules
    if (activeDifficulty && String(q.difficulty || "").trim() !== activeDifficulty) {
      continue;
    }
    
    // Clone properties safe from reference corruption down the processing stream
    compiledList.push({
      index: compiledList.length + 1,
      qId: String(q.qId),
      text: String(q.text || ""),
      options: Array.isArray(q.options) ? [].concat(q.options) : [],
      correctIndex: typeof q.correctIndex !== "undefined" ? Number(q.correctIndex) : -1,
      solution: String(q.solution || ""),
      difficulty: String(q.difficulty || "Medium"),
      errorRate: typeof q.errorRate !== "undefined" ? Number(q.errorRate) : 0,
      subject: String(q.subject || "")
    });
  }
  return compiledList;
};

/**
 * Phase 2: Generates the core unified answer keys and mapped solutions grids recursively.
 * @param {Array} compiledQuestions - The processed list extracted via Phase 2 operations.
 * @returns {Object} Mapped structural lists containing answers and formula definitions.
 */
window.ExportStudio.compiler.generateAnswerMatrix = function(compiledQuestions) {
  var matrix = {
    keys: [],
    solutionsMap: []
  };
  
  if (!compiledQuestions || !compiledQuestions.length) {
    return matrix;
  }
  
  for (var i = 0; i < compiledQuestions.length; i++) {
    var q = compiledQuestions[i];
    var cIndex = q.correctIndex;
    
    // Range Verification: Ensure index strictly maps inside bounds (0 to 25 mapping to A-Z)
    var charCodeAnswer = "N/A";
    if (cIndex >= 0 && cIndex < 26) {
      charCodeAnswer = String.fromCharCode(65 + cIndex);
    } else if (cIndex >= 26) {
      compilerLogWarn("Out of Range Warning: correctIndex values must never exceed 25. Found:", cIndex);
      charCodeAnswer = "(" + (cIndex + 1) + ")";
    }
    
    matrix.keys.push({
      questionNumber: q.index,
      qId: q.qId,
      answer: charCodeAnswer
    });
    
    matrix.solutionsMap.push({
      questionNumber: q.index,
      qId: q.qId,
      correctAnswer: charCodeAnswer,
      rawSolutionText: q.solution
    });
  }
  return matrix;
};

/**
 * Phase 3 & 4: The Ultimate Immutable Package Assembly Protocol.
 * Synthesizes decoupled metadata configurations, headers, and watermarks safely.
 * @param {string} optionType - Explicit export scheme selector target (e.g., "WORKSHEET").
 * @param {Object} configurations - Secondary optional parameters (Teacher adjustments, custom watermarks).
 * @returns {Object} The complete compiled immutable export document package profile dictionary.
 */
window.ExportStudio.compiler.buildExportPackage = function(optionType, configurations) {
  // Reactive Interrupt: Intercept instantly if the master workflow cancel state token registers true
  if (window.ExportStudio.state.cancel) {
    return null;
  }
  
  var typeKey = String(optionType || "").toUpperCase().trim();
  var opts = configurations || {};
  
  // Dynamic filter routing invocation based on parameters passed down from controllers
  var targetQuestions = window.ExportStudio.compiler.compileFilterQuestions({
    subject: opts.subjectFilter || "",
    difficulty: opts.difficultyFilter || ""
  });
  
  var testMeta = window.ExportStudio.data.test || {};
  
  // Multi-Academy ERP Hardening: Pull values directly from dynamic setup config or default gracefully
  var teacherName = opts.teacherNameOverride || "Gandiv Academy Core Faculty Team";
  var institutionBrandName = opts.institutionBrandOverride || "ગાંડિવ એકેડેમી - મહુવા";
  var globalVerifyDomain = opts.verifyDomainOverride || "https://vidyawave.in";
  
  var answerGrid = window.ExportStudio.compiler.generateAnswerMatrix(targetQuestions);
  var uniqueTimestamp = new Date().getTime() + "_" + safeGetRandomSuffix();
  
  // Synthesize complete structural manifest payload tracking fields cleanly
  var rawPackagePayload = {
    packageId: "VPK_" + String(testMeta.testId || "EXP") + "_" + uniqueTimestamp,
    exportType: typeKey,
    timestamp: safeGetISOString(),
    
    // Brand Header and Footer Tracking Layout Configuration Properties
    branding: {
      institution: institutionBrandName,
      author: teacherName,
      testTitle: String(testMeta.testName || "Vidya Wave Evaluation Series"),
      watermarkText: opts.enableWatermark ? "GANDIV ACADEMY" : ""
    },
    
    // Core Data Lists Payload Boundaries
    dataSet: {
      totalQuestionsCount: targetQuestions.length,
      questions: targetQuestions,
      answerKeys: answerGrid.keys,
      detailedSolutions: answerGrid.solutionsMap
    },
    
    // Secure Cryptographic or Verification Asset Tracking targets
    security: {
      verificationUrl: globalVerifyDomain.replace(/\/$/, "") + "/verify?pid=" + String(testMeta.testId || "0"),
      barcodePayload: String(testMeta.testId || "000000")
    }
  };
  
  // Fixed Bug: Removed non-existent formulas freeze execution line. Applied absolute Deep Freeze.
  return deepFreeze(rawPackagePayload);
};
