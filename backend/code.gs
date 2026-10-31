/**
 * masoulen - Code.gs
 * Registration backend (Registration System Spec v1). One file, paste into Apps Script.
 *
 * DEPLOY: Web app, Execute as "Me", Access "Anyone".
 *
 * appsscript.json must contain (Project Settings > show appsscript.json):
 *   "timeZone": "Asia/Kolkata",
 *   "runtimeVersion": "V8"        <- required: names use Unicode regex (\p{L}, u flag)
 *
 * SCRIPT PROPERTIES you add by hand (Project Settings > Script properties):
 *   ADMIN_SHEET_ID  id of the separate owner-only spreadsheet (must differ from this one)
 *   GROUP_LINK      the WhatsApp group link
 *   REG_CLOSE_AT    2026-11-17T23:59:59+05:30   (optional, invalid values are ignored)
 *   SENDER_NAME     masoulen                    (optional)
 *   EMAIL_ENABLED   FALSE while testing, TRUE at launch
 * setup() fills in any optional ones that are missing. It also stores MAIN_SHEET_ID,
 * TEAM_COUNTER, and uses CACHE_EPOCH (reset support). LAUNCHED is added by hand at launch.
 *
 * EDITOR FUNCTIONS (run from the editor, never callable from the web):
 *   setup()               once, then again after any code change that adds sheets/triggers
 *   createAdmin()         edit the 3 constants inside first; prints the password once in the log
 *   resetAdminPassword()  edit the ADMIN_ID constant inside first
 *   unlockAdmin()         edit the ADMIN_ID constant inside first
 *   healthCheck()         read-only status report in the log
 *   resetAllData()        pre-launch wipe; refuses once LAUNCHED = TRUE
 *   processEmailQueue(), dailyBackup()   run by triggers
 */
'use strict';

/* =============================================================================
 * 1. CONFIG AND LISTS  (single source of truth; the frontend reads them via get_config)
 * ========================================================================== */

var CFG = {
  EVENT_NAME: 'masoulen',
  EVENT_DATES: '21 and 22 November 2026',
  EVENT_DAY: { y: 2026, m: 11, d: 21 },
  EVENT_DAY_TEXT: '21 November 2026',
  DEFAULT_REG_CLOSE_AT: '2026-11-17T23:59:59+05:30',
  TEAM_SIZE: 4,
  MIN_AGE: 16,
  MAX_AGE: 30,
  MAX_BODY_CHARS: 20000,
  LOCK_WAIT_MS: 30000,
  IDEMPOTENCY_TTL_SEC: 21600,
  SESSION_TTL_SEC: 7200,
  REGISTER_MAX: 5, REGISTER_WINDOW_SEC: 600,              // per captain email key and per captain phone key
  REGISTER_GLOBAL_MAX: 60, REGISTER_GLOBAL_WINDOW_SEC: 60, // site-wide safety valve
  NAMECHECK_MAX: 120, NAMECHECK_WINDOW_SEC: 60,           // site-wide
  LOOKUP_FAIL_MAX: 5, LOOKUP_FAIL_WINDOW_SEC: 900,        // per Team ID
  LOOKUP_GLOBAL_MAX: 120, LOOKUP_GLOBAL_WINDOW_SEC: 60,   // site-wide
  ADMIN_FAIL_MAX: 5, ADMIN_LOCK_SEC: 900,
  EMAIL_MAX_TRIES: 3,
  EMAIL_BATCH: 30,
  BACKUPS_KEEP: 7
};

var SHEETS = { TEAMS: 'Teams', MEMBERS: 'Members', LOG: 'Admin_Log', ADMINS: 'Admins' };

var H = {
  TEAMS: ['TeamID', 'Timestamp', 'TeamName', 'NameKey', 'College', 'Address', 'City', 'State', 'PIN', 'HowHeard',
    'Status', 'CheckedIn', 'CheckedInAt', 'EmailStatus', 'EmailTries', 'EmailSentAt', 'UpdatedAt'],
  MEMBERS: ['TeamID', 'Role', 'FullName', 'Email', 'EmailKey', 'Phone', 'PhoneKey', 'DOB', 'AgeOnEvent', 'College',
    'Course', 'CourseOther', 'Branch', 'Year', 'ProfileLink', 'Active'],
  LOG: ['Timestamp', 'Actor', 'Action', 'TeamID', 'Detail'],
  ADMINS: ['AdminID', 'Name', 'Salt', 'PasswordHash', 'Role', 'Active']
};

var STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

var HOW_HEARD = ['Instagram', 'WhatsApp', 'Friend or classmate', 'College or teacher', 'LinkedIn', 'Other'];

var BRANCHES = ['CSE', 'IT', 'CS', 'AI/ML', 'Data Science', 'BT', 'ECE', 'EE', 'ME', 'Civil', 'Other'];

var COURSES = [
  { name: 'School', years: ['Class 10', 'Class 11', 'Class 12'], needsBranch: false, needsOther: false },
  { name: 'Diploma / Polytechnic', years: ['1st', '2nd', '3rd'], needsBranch: false, needsOther: false },
  { name: 'B.Tech / B.E.', years: ['1st', '2nd', '3rd', '4th'], needsBranch: true, needsOther: false },
  { name: 'BCA', years: ['1st', '2nd', '3rd'], needsBranch: false, needsOther: false },
  { name: 'B.Sc', years: ['1st', '2nd', '3rd'], needsBranch: false, needsOther: false },
  { name: 'BBA / B.Com / BA', years: ['1st', '2nd', '3rd'], needsBranch: false, needsOther: false },
  { name: 'M.Tech / M.E.', years: ['1st', '2nd'], needsBranch: true, needsOther: false },
  { name: 'MCA', years: ['1st', '2nd'], needsBranch: false, needsOther: false },
  { name: 'M.Sc / MBA / Other PG', years: ['1st', '2nd'], needsBranch: false, needsOther: false },
  { name: 'Other', years: ['1st', '2nd', '3rd', '4th', '5th'], needsBranch: false, needsOther: true }
];
var COURSE_BY_NAME = (function () {
  var m = Object.create(null);
  COURSES.forEach(function (c) { m[c.name] = c; });
  return m;
})();

// Unicode letters in any script. \p{M} (combining marks) is required, otherwise Hindi/Assamese/Tamil
// names with vowel signs would be rejected.
var NAME_RE = /^\p{L}[\p{L}\p{M}\p{N} .'&()-]*$/u;
var TEAM_RE = /^\p{L}[\p{L}\p{M}\p{N} _.&'!-]*$/u;
var PIN_RE = /^[1-9][0-9]{5}$/;
var PHONE_RE = /^[6-9]\d{9}$/;
var EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
var PROFILE_RE = /^https:\/\/(?:[a-z0-9-]+\.)*(?:github\.com|linkedin\.com)(?:[\/?#]\S*)?$/i;
var IDEM_RE = /^[A-Za-z0-9_-]{8,100}$/;
var CTRL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;

var TOP_FIELDS = {
  register: ['action', 'idempotencyKey', 'website', 'teamName', 'college', 'howHeard', 'consent', 'members']
};
var COLLEGE_FIELDS = ['name', 'address', 'city', 'state', 'pin'];
var CONSENT_FIELDS = ['data', 'venue'];
var MEMBER_FIELDS = ['fullName', 'email', 'phone', 'dob', 'college', 'course', 'courseOther', 'branch', 'year', 'profileLink'];
var EXPORT_KINDS = ['csv_all', 'csv_captains', 'copy_emails'];
var AGE_BUCKETS = [[16, 16, '16'], [17, 17, '17'], [18, 19, '18-19'], [20, 21, '20-21'], [22, 24, '22-24'], [25, 27, '25-27'], [28, 30, '28-30']];
var SPECIAL_CODES = { UNDERAGE: 1, OVERAGE: 1, TEAM_NAME_TAKEN: 1, DUPLICATE_PERSON: 1 };

/* =============================================================================
 * 2. ENTRY POINTS AND ROUTER
 * ========================================================================== */

var PROPS_ = null;
var SS_ = null;
var LOCK_DEPTH = 0;
var UNDO_ = [];

function beginExecution_() { PROPS_ = null; SS_ = null; LOCK_DEPTH = 0; UNDO_ = []; }

function nowMs_() { return Date.now(); }

var ACTIONS = {
  get_config:           { fields: ['action'], fn: actGetConfig_ },
  check_team_name:      { fields: ['action', 'teamName'], fn: actCheckTeamName_ },
  register:             { fields: TOP_FIELDS.register, fn: actRegister_ },
  lookup_status:        { fields: ['action', 'teamId', 'email'], fn: actLookupStatus_ },
  admin_login:          { fields: ['action', 'adminId', 'password'], fn: actAdminLogin_ },
  admin_get_data:       { fields: ['action', 'token'], auth: true, fn: actAdminGetData_ },
  admin_cancel:         { fields: ['action', 'token', 'teamId', 'note'], auth: true, write: true, fn: actAdminCancel_ },
  admin_swap_member:    { fields: ['action', 'token', 'teamId', 'oldEmail', 'newMember'], auth: true, write: true, fn: actAdminSwap_ },
  admin_change_captain: { fields: ['action', 'token', 'teamId', 'email'], auth: true, write: true, fn: actAdminChangeCaptain_ },
  admin_edit_member:    { fields: ['action', 'token', 'teamId', 'email', 'fields'], auth: true, write: true, fn: actAdminEditMember_ },
  admin_checkin:        { fields: ['action', 'token', 'teamId', 'checkedIn'], auth: true, write: true, fn: actAdminCheckin_ },
  admin_log_export:     { fields: ['action', 'token', 'kind', 'count'], auth: true, fn: actAdminLogExport_ },
  admin_logout:         { fields: ['action', 'token'], fn: actAdminLogout_ },
  admin_retry_email:    { fields: ['action', 'token', 'teamId'], auth: true, write: true, fn: actAdminRetryEmail_ }
};

function doGet() {
  beginExecution_();
  return json_({ success: true, service: CFG.EVENT_NAME + ' registration API', message: 'Send POST requests with a JSON body.' });
}

function doPost(e) {
  beginExecution_();
  var out;
  try {
    out = route_(e);
  } catch (err) {
    out = errorBody_(err);
  }
  return json_(out);
}

function route_(e) {
  var raw = (e && e.postData && typeof e.postData.contents === 'string') ? e.postData.contents : null;
  if (raw === null || raw === '') fail_('BAD_REQUEST', 'Empty request.');
  if (raw.length > CFG.MAX_BODY_CHARS) fail_('PAYLOAD_TOO_LARGE', 'The request is too large.');
  var body;
  try { body = JSON.parse(raw); } catch (x) { fail_('BAD_REQUEST', 'The request must be valid JSON.'); }
  if (!isPlain_(body)) fail_('BAD_REQUEST', 'The request must be a JSON object.');
  var action = body.action;
  if (typeof action !== 'string' || !hasOwn_(ACTIONS, action)) fail_('BAD_REQUEST', 'Unknown action.');
  var def = ACTIONS[action];
  var unknown = [];
  rejectUnknown_(body, def.fields, '', unknown);
  if (unknown.length) fail_('BAD_REQUEST', 'The request contains unexpected fields.', unknown);
  var ctx = { raw: raw, action: action };
  if (def.auth) {
    ctx.admin = authenticate_(body.token);
    if (def.write && ctx.admin.role !== 'owner') fail_('FORBIDDEN', 'Your account is view-only.');
  }
  return def.fn(body, ctx);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ApiError(code, message, errors) {
  this.isApiError = true;
  this.code = code;
  this.message = message;
  this.errors = errors || null;
}

function fail_(code, message, errors) { throw new ApiError(code, message, errors); }

function errorBody_(err) {
  if (err && err.isApiError) {
    var out = { success: false, error: err.code, message: err.message };
    if (err.errors) out.errors = err.errors;
    return out;
  }
  Logger.log('SERVER_ERROR: ' + (err && err.stack ? err.stack : err));
  return { success: false, error: 'SERVER_ERROR', message: 'Something went wrong on our side. Please try again.' };
}

/* =============================================================================
 * 3. SMALL HELPERS
 * ========================================================================== */

function isPlain_(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }
function hasOwn_(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
function isTrue_(v) { return String(v).toUpperCase() === 'TRUE'; }
function len_(s) { return Array.from(s).length; }
function pad2_(n) { return (n < 10 ? '0' : '') + n; }
function pad4_(n) { var s = String(n); while (s.length < 4) s = '0' + s; return s; }

function isoIST_(ms) { return new Date(ms + 19800000).toISOString().slice(0, 19) + '+05:30'; }
function todayIST_() { return new Date(nowMs_() + 19800000).toISOString().slice(0, 10); }

// Control characters removed, whitespace collapsed, trimmed, NFC-normalised.
function cleanText_(s) {
  var t = String(s).replace(CTRL_RE, '').replace(/\s+/g, ' ').trim();
  try { t = t.normalize('NFC'); } catch (e) { /* keep t */ }
  return t;
}

// Formula-injection guard: a text value starting with = + - @ gets a leading apostrophe on the way in
// and the apostrophe is removed again on the way out.
function safeCell_(v) {
  if (v === null || v === undefined) return '';
  var s = typeof v === 'string' ? v : String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function unsafeCell_(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return isoIST_(v.getTime());
  var s = typeof v === 'string' ? v : String(v);
  return /^'[=+\-@]/.test(s) ? s.slice(1) : s;
}

function sha256Hex_(s) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8);
  var hex = '';
  for (var i = 0; i < bytes.length; i++) {
    var b = bytes[i] & 0xff;
    hex += (b < 16 ? '0' : '') + b.toString(16);
  }
  return hex;
}

// Random hex from UUIDv4 (SecureRandom underneath); the fixed version/variant nibbles are skipped.
function randomHex_(n) {
  var out = '';
  while (out.length < n) {
    var u = Utilities.getUuid().replace(/-/g, '');
    out += u.slice(0, 12) + u.slice(13, 16) + u.slice(17);
  }
  return out.slice(0, n);
}

function randomPassword_() {
  var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  var hex = randomHex_(48), pw = '';
  for (var i = 0; i < 24; i++) pw += alphabet.charAt(parseInt(hex.substr(i * 2, 2), 16) & 63);
  return pw;
}

function safeEq_(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  var d = 0;
  for (var i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function dobBounds_() {
  var e = CFG.EVENT_DAY;
  var max = (e.y - CFG.MIN_AGE) + '-' + pad2_(e.m) + '-' + pad2_(e.d);
  var min = new Date(Date.UTC(e.y - CFG.MAX_AGE - 1, e.m - 1, e.d + 1)).toISOString().slice(0, 10);
  return { min: min, max: max };
}

function ageOnEvent_(y, m, d) {
  var e = CFG.EVENT_DAY;
  var age = e.y - y;
  if (m > e.m || (m === e.m && d > e.d)) age--;
  return age;
}

function nameKey_(s) {
  return s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu, '');
}

function validEmail_(e) {
  if (e.length > 254) return false;
  var at = e.indexOf('@');
  if (at < 1 || at > 64) return false;
  var local = e.slice(0, at);
  if (local.charAt(0) === '.' || local.charAt(local.length - 1) === '.' || local.indexOf('..') >= 0) return false;
  return EMAIL_RE.test(e);
}

// Gmail ignores dots and anything after + in the local part, and googlemail.com is gmail.com.
function emailKey_(e) {
  var at = e.lastIndexOf('@');
  var local = e.slice(0, at), dom = e.slice(at + 1);
  if (dom === 'gmail.com' || dom === 'googlemail.com') {
    var p = local.indexOf('+');
    if (p >= 0) local = local.slice(0, p);
    local = local.replace(/\./g, '');
    dom = 'gmail.com';
  }
  return local + '@' + dom;
}

function normPhone_(s) {
  var p = String(s).replace(/\s+/g, '');
  if (p.indexOf('+91') === 0) p = p.slice(3);
  else if (p.charAt(0) === '0') p = p.slice(1);
  return p;
}

function normTeamId_(s) {
  if (typeof s !== 'string') return '';
  var t = cleanText_(s).toUpperCase();
  return /^CASE-\d{4,}$/.test(t) ? t : '';
}

function memberLabel_(i) { return i === 0 ? 'Captain' : 'Member ' + (i + 1); }

function rejectUnknown_(obj, allowed, path, errors) {
  Object.keys(obj).forEach(function (k) {
    if (allowed.indexOf(k) < 0) errors.push({ field: path ? path + '.' + k : k, message: 'Unexpected field.', code: 'UNKNOWN_FIELD' });
  });
}

/* =============================================================================
 * 4. SCRIPT PROPERTIES, CACHE, THROTTLES
 * ========================================================================== */

function props_() {
  if (!PROPS_) PROPS_ = PropertiesService.getScriptProperties().getProperties();
  return PROPS_;
}
function prop_(k, dflt) {
  var v = props_()[k];
  return (v === undefined || v === null || v === '') ? (dflt === undefined ? '' : dflt) : String(v);
}
function setProp_(k, v) {
  PropertiesService.getScriptProperties().setProperty(k, String(v));
  if (PROPS_) PROPS_[k] = String(v);
}

// Every cache key is prefixed with CACHE_EPOCH so resetAllData() can invalidate all of them at once.
function ck_(k) { return 'm' + prop_('CACHE_EPOCH', '0') + ':' + k; }
function cacheGet_(k) {
  var v = CacheService.getScriptCache().get(ck_(k));
  if (!v) return null;
  try { return JSON.parse(v); } catch (e) { return null; }
}
function cachePut_(k, obj, ttlSec) {
  CacheService.getScriptCache().put(ck_(k), JSON.stringify(obj), Math.max(1, Math.min(21600, Math.ceil(ttlSec))));
}
function cacheDel_(k) { CacheService.getScriptCache().remove(ck_(k)); }

// Fixed window starting at the first hit. Windows are enforced from stored timestamps, not from cache TTL.
function throttleRec_(name, windowSec) {
  var now = nowMs_();
  var rec = cacheGet_('thr:' + name);
  if (!rec || typeof rec.c !== 'number' || now - rec.s >= windowSec * 1000) rec = { c: 0, s: now };
  return rec;
}
function throttleUnder_(name, max, windowSec) { return throttleRec_(name, windowSec).c < max; }
function throttleAdd_(name, windowSec) {
  var rec = throttleRec_(name, windowSec);
  rec.c++;
  cachePut_('thr:' + name, rec, (rec.s + windowSec * 1000 - nowMs_()) / 1000);
}
function throttleHit_(name, max, windowSec) {
  if (!throttleUnder_(name, max, windowSec)) return false;
  throttleAdd_(name, windowSec);
  return true;
}
function throttleRefund_(name, windowSec) {
  var rec = throttleRec_(name, windowSec);
  if (rec.c > 0) {
    rec.c--;
    cachePut_('thr:' + name, rec, (rec.s + windowSec * 1000 - nowMs_()) / 1000);
  }
}

/* =============================================================================
 * 5. DEADLINE
 * ========================================================================== */

// REG_CLOSE_AT overrides the default only when it is a well-formed ISO date with an explicit offset.
function regCloseMs_() {
  var p = prop_('REG_CLOSE_AT');
  if (p && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(p)) {
    var ms = Date.parse(p);
    if (!isNaN(ms)) return ms;
  }
  return Date.parse(CFG.DEFAULT_REG_CLOSE_AT);
}
function isOpenNow_() { return nowMs_() <= regCloseMs_(); }

/* =============================================================================
 * 6. SHEET ACCESS (everything goes through these so formula-guarding and plain-text cells are uniform)
 * ========================================================================== */

function mainSs_() {
  if (SS_) return SS_;
  var id = prop_('MAIN_SHEET_ID');
  SS_ = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!SS_) throw new Error('Main spreadsheet not found. Run setup() from the Apps Script editor.');
  return SS_;
}
function sheet_(name) {
  var sh = mainSs_().getSheetByName(name);
  if (!sh) throw new Error('Sheet "' + name + '" is missing. Run setup().');
  return sh;
}
function adminSs_() {
  var id = prop_('ADMIN_SHEET_ID');
  if (!id) throw new Error('Script Property ADMIN_SHEET_ID is not set.');
  return SpreadsheetApp.openById(id);
}

function readRows_(sheet, headers) {
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var vals = sheet.getRange(2, 1, last - 1, headers.length).getValues();
  var out = [];
  for (var i = 0; i < vals.length; i++) {
    var o = { _row: i + 2 };
    for (var c = 0; c < headers.length; c++) o[headers[c]] = unsafeCell_(vals[i][c]);
    if (o[headers[0]] === '') continue;
    out.push(o);
  }
  return out;
}

function appendRows_(sheet, headers, objs) {
  var n = objs.length, w = headers.length;
  var start = sheet.getLastRow() + 1;
  var needMax = start + n - 1;
  if (needMax > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), needMax - sheet.getMaxRows());
  var rows = objs.map(function (o) { return headers.map(function (h) { return safeCell_(o[h]); }); });
  var rg = sheet.getRange(start, 1, n, w);
  rg.setNumberFormat('@');
  rg.setValues(rows);
  return start;
}

function pushUndo_(fn) { UNDO_.push(fn); }

function appendRowsTx_(sheet, headers, objs) {
  var start = appendRows_(sheet, headers, objs);
  pushUndo_(function () { sheet.getRange(start, 1, objs.length, headers.length).clearContent(); });
  return start;
}

function updateRowTx_(sheet, headers, row, patch, noUndo) {
  var rg = sheet.getRange(row, 1, 1, headers.length);
  var oldRaw = rg.getValues()[0];
  var newRaw = oldRaw.slice();
  Object.keys(patch).forEach(function (k) {
    var idx = headers.indexOf(k);
    if (idx < 0) throw new Error('Unknown column ' + k);
    newRaw[idx] = safeCell_(patch[k]);
  });
  rg.setValues([newRaw]);
  if (!noUndo) pushUndo_(function () { sheet.getRange(row, 1, 1, headers.length).setValues([oldRaw]); });
}

function rollback_() {
  var steps = UNDO_;
  UNDO_ = [];
  for (var i = steps.length - 1; i >= 0; i--) {
    try { steps[i](); } catch (e) { Logger.log('ROLLBACK STEP FAILED: ' + e); }
  }
}

function withTx_(fn) {
  UNDO_ = [];
  try {
    var r = fn();
    UNDO_ = [];
    return r;
  } catch (e) {
    rollback_();
    throw e;
  }
}

function withLock_(fn) {
  if (LOCK_DEPTH > 0) return fn();
  var lock = LockService.getScriptLock();
  try { lock.waitLock(CFG.LOCK_WAIT_MS); } catch (e) { fail_('BUSY', 'The system is busy right now. Please try again in a moment.'); }
  LOCK_DEPTH = 1;
  try {
    return fn();
  } finally {
    LOCK_DEPTH = 0;
    try { SpreadsheetApp.flush(); } catch (e2) { /* ignore */ }
    lock.releaseLock();
  }
}

function loadTeams_() { return readRows_(sheet_(SHEETS.TEAMS), H.TEAMS); }
function loadMembers_() { return readRows_(sheet_(SHEETS.MEMBERS), H.MEMBERS); }

function activeMembersOf_(members, teamId) {
  var list = members.filter(function (m) { return m.TeamID === teamId && isTrue_(m.Active); });
  list.sort(function (a, b) {
    var ra = a.Role === 'captain' ? 0 : 1, rb = b.Role === 'captain' ? 0 : 1;
    return ra !== rb ? ra - rb : a._row - b._row;
  });
  return list;
}

// Emails/phones held by active members of confirmed (non-cancelled) teams. excludeRow lets an edit or swap ignore itself.
function activeIndex_(teams, members, excludeRow) {
  var confirmed = Object.create(null), byEmail = Object.create(null), byPhone = Object.create(null);
  teams.forEach(function (t) { if (t.Status === 'confirmed') confirmed[t.TeamID] = true; });
  members.forEach(function (m) {
    if (m._row === excludeRow) return;
    if (isTrue_(m.Active) && confirmed[m.TeamID]) { byEmail[m.EmailKey] = m; byPhone[m.PhoneKey] = m; }
  });
  return { byEmail: byEmail, byPhone: byPhone };
}

/* =============================================================================
 * 7. VALIDATION
 * ========================================================================== */

function addErr_(errors, field, message, code) { errors.push({ field: field, message: message, code: code || 'INVALID' }); }

function topCode_(errors) {
  var first = errors[0].code;
  if (!SPECIAL_CODES[first]) return 'VALIDATION_FAILED';
  for (var i = 1; i < errors.length; i++) if (errors[i].code !== first) return 'VALIDATION_FAILED';
  return first;
}

function throwErrors_(errors) {
  var code = topCode_(errors);
  var msg = errors.length === 1 ? errors[0].message
    : (code === 'VALIDATION_FAILED' ? 'Please fix the highlighted fields and try again.' : errors[0].message + ' (and ' + (errors.length - 1) + ' more)');
  fail_(code, msg, errors);
}

// Returns '' (optional and absent), null (error recorded) or the cleaned non-empty string.
function plainField_(obj, key, path, errors, label, required) {
  var field = path ? path + '.' + key : key;
  var raw = obj[key];
  if (raw === undefined || raw === null) {
    if (required) { addErr_(errors, field, label + ' is required.', 'REQUIRED'); return null; }
    return '';
  }
  if (typeof raw !== 'string') { addErr_(errors, field, label + ' must be text.', 'INVALID'); return null; }
  var v = cleanText_(raw);
  if (v === '') {
    if (required) { addErr_(errors, field, label + ' is required.', 'REQUIRED'); return null; }
    return '';
  }
  return v;
}

function fieldText_(obj, key, path, errors, o) {
  var v = plainField_(obj, key, path, errors, o.label, !!o.required);
  if (v === null || v === '') return v;
  var field = path ? path + '.' + key : key;
  var n = len_(v);
  if (n < o.min || n > o.max) { addErr_(errors, field, o.label + ' must be ' + o.min + ' to ' + o.max + ' characters.', 'INVALID'); return null; }
  if (o.re && !o.re.test(v)) { addErr_(errors, field, o.reMsg, 'INVALID'); return null; }
  return v;
}

function enumField_(obj, key, path, errors, label, list, required) {
  var v = plainField_(obj, key, path, errors, label, required);
  if (v === null || v === '') return v;
  if (list.indexOf(v) < 0) { addErr_(errors, path ? path + '.' + key : key, 'Choose a valid ' + label.toLowerCase() + '.', 'INVALID'); return null; }
  return v;
}

var NAME_RULE_TEXT = 'must start with a letter and use only letters, digits, spaces and . \' & ( ) -';

function validateMember_(raw, path, idx, errors) {
  var label = memberLabel_(idx);
  if (!isPlain_(raw)) { addErr_(errors, path, label + ' details are required.', 'REQUIRED'); return null; }
  var m = {};

  m.fullName = fieldText_(raw, 'fullName', path, errors, { label: label + ' name', required: true, min: 2, max: 60, re: NAME_RE, reMsg: label + ' name ' + NAME_RULE_TEXT + '.' });
  var who = m.fullName ? label + ' (' + m.fullName + ')' : label;

  // email
  m.email = null; m.emailKey = null;
  var em = plainField_(raw, 'email', path, errors, label + ' email', true);
  if (em !== null) {
    em = em.toLowerCase();
    if (!validEmail_(em)) addErr_(errors, path + '.email', 'Enter a valid email address for ' + who + '.', 'INVALID');
    else {
      var ek = emailKey_(em);
      if (ek.charAt(0) === '@') addErr_(errors, path + '.email', 'Enter a valid email address for ' + who + '.', 'INVALID');
      else { m.email = em; m.emailKey = ek; }
    }
  }

  // phone
  m.phone = null; m.phoneKey = null;
  var ph = plainField_(raw, 'phone', path, errors, label + ' phone', true);
  if (ph !== null) {
    var p10 = normPhone_(ph);
    if (!PHONE_RE.test(p10)) addErr_(errors, path + '.phone', 'Enter a valid 10-digit Indian mobile number for ' + who + '.', 'INVALID');
    else { m.phone = p10; m.phoneKey = p10; }
  }

  // date of birth and age rule
  m.dob = null; m.age = null;
  var dob = plainField_(raw, 'dob', path, errors, label + ' date of birth', true);
  if (dob !== null) {
    var mt = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
    var real = false, y = 0, mo = 0, d = 0;
    if (mt) {
      y = +mt[1]; mo = +mt[2]; d = +mt[3];
      var dt = new Date(Date.UTC(y, mo - 1, d));
      real = y >= 1900 && dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
    }
    if (!real) addErr_(errors, path + '.dob', 'Enter a real date of birth (YYYY-MM-DD) for ' + who + '.', 'INVALID');
    else if (dob > todayIST_()) addErr_(errors, path + '.dob', 'Date of birth of ' + who + ' cannot be in the future.', 'INVALID');
    else {
      var age = ageOnEvent_(y, mo, d);
      if (age < CFG.MIN_AGE) addErr_(errors, path + '.dob', who + ' must be at least ' + CFG.MIN_AGE + ' years old on ' + CFG.EVENT_DAY_TEXT + '.', 'UNDERAGE');
      else if (age > CFG.MAX_AGE) addErr_(errors, path + '.dob', who + ' must be no older than ' + CFG.MAX_AGE + ' on ' + CFG.EVENT_DAY_TEXT + '.', 'OVERAGE');
      else { m.dob = dob; m.age = age; }
    }
  }

  m.college = fieldText_(raw, 'college', path, errors, { label: label + ' college or school', required: true, min: 2, max: 80, re: NAME_RE, reMsg: label + ' college or school ' + NAME_RULE_TEXT + '.' });

  // course, year, branch, courseOther
  m.course = enumField_(raw, 'course', path, errors, 'Course', COURSES.map(function (c) { return c.name; }), true);
  var def = m.course ? COURSE_BY_NAME[m.course] : null;
  m.year = plainField_(raw, 'year', path, errors, label + ' year', true);
  if (m.year !== null && def && def.years.indexOf(m.year) < 0) {
    addErr_(errors, path + '.year', m.year + ' is not a valid year for ' + def.name + '.', 'INVALID');
    m.year = null;
  }
  m.branch = ''; m.courseOther = '';
  if (def) {
    var br = plainField_(raw, 'branch', path, errors, label + ' branch', def.needsBranch);
    if (br === null) m.branch = null;
    else if (def.needsBranch) {
      if (BRANCHES.indexOf(br) < 0) { addErr_(errors, path + '.branch', 'Choose a valid branch.', 'INVALID'); m.branch = null; }
      else m.branch = br;
    } else if (br !== '') {
      addErr_(errors, path + '.branch', 'Branch is not allowed for ' + def.name + '.', 'INVALID');
      m.branch = null;
    }
    var co = def.needsOther
      ? fieldText_(raw, 'courseOther', path, errors, { label: label + ' course name', required: true, min: 2, max: 40, re: NAME_RE, reMsg: label + ' course name ' + NAME_RULE_TEXT + '.' })
      : plainField_(raw, 'courseOther', path, errors, label + ' course name', false);
    if (co === null) m.courseOther = null;
    else if (!def.needsOther && co !== '') {
      addErr_(errors, path + '.courseOther', 'Course name is only allowed when the course is Other.', 'INVALID');
      m.courseOther = null;
    } else m.courseOther = co;
  }

  // profile link
  m.profileLink = '';
  var pl = plainField_(raw, 'profileLink', path, errors, label + ' profile link', false);
  if (pl === null) m.profileLink = null;
  else if (pl !== '') {
    if (len_(pl) > 200 || !PROFILE_RE.test(pl)) {
      addErr_(errors, path + '.profileLink', 'Profile link must be a https:// GitHub or LinkedIn link (max 200 characters).', 'INVALID');
      m.profileLink = null;
    } else m.profileLink = pl;
  }
  return m;
}

function validateRegistration_(body) {
  var errors = [];
  var data = { members: [] };

  data.teamName = fieldText_(body, 'teamName', '', errors, { label: 'Team name', required: true, min: 2, max: 40, re: TEAM_RE, reMsg: "Team name must start with a letter and use only letters, digits, spaces and - _ . & ' !" });
  data.nameKey = data.teamName ? nameKey_(data.teamName) : '';

  var col = body.college;
  data.college = {};
  if (!isPlain_(col)) addErr_(errors, 'college', 'College details are required.', 'REQUIRED');
  else {
    data.college.name = fieldText_(col, 'name', 'college', errors, { label: 'College or school name', required: true, min: 2, max: 80, re: NAME_RE, reMsg: 'College or school name ' + NAME_RULE_TEXT + '.' });
    var addr = plainField_(col, 'address', 'college', errors, 'Address', false);
    if (addr !== null && addr !== '' && (len_(addr) < 5 || len_(addr) > 150)) { addErr_(errors, 'college.address', 'Address must be 5 to 150 characters.', 'INVALID'); addr = null; }
    data.college.address = addr;
    data.college.city = fieldText_(col, 'city', 'college', errors, { label: 'City', required: true, min: 2, max: 50, re: NAME_RE, reMsg: 'City ' + NAME_RULE_TEXT + '.' });
    data.college.state = enumField_(col, 'state', 'college', errors, 'State', STATES, true);
    var pin = plainField_(col, 'pin', 'college', errors, 'PIN code', true);
    if (pin !== null && !PIN_RE.test(pin)) { addErr_(errors, 'college.pin', 'Enter a valid 6-digit PIN code.', 'INVALID'); pin = null; }
    data.college.pin = pin;
  }
  data.howHeard = enumField_(body, 'howHeard', '', errors, 'Option for how you heard about us', HOW_HEARD, true);

  var cons = body.consent;
  if (!isPlain_(cons)) addErr_(errors, 'consent', 'Both confirmations are required.', 'REQUIRED');
  else {
    if (cons.data !== true) addErr_(errors, 'consent.data', 'You must accept the data and rules confirmation.', 'REQUIRED');
    if (cons.venue !== true) addErr_(errors, 'consent.venue', 'You must accept the venue, age and photo ID confirmation.', 'REQUIRED');
  }

  var ms = body.members;
  if (!Array.isArray(ms) || ms.length !== CFG.TEAM_SIZE) {
    addErr_(errors, 'members', 'A team must have exactly ' + CFG.TEAM_SIZE + ' members.', 'INVALID');
  } else {
    ms.forEach(function (raw, i) { data.members.push(validateMember_(raw, 'members.' + i, i, errors)); });
    // the captain's college repeats the team college
    var cap = data.members[0];
    if (cap && cap.college && data.college.name && cap.college !== data.college.name) {
      addErr_(errors, 'members.0.college', "The captain's college must match the team college.", 'INVALID');
    }
    // duplicates inside this request
    var seenE = Object.create(null), seenP = Object.create(null);
    data.members.forEach(function (m, i) {
      if (!m) return;
      if (m.emailKey) {
        if (seenE[m.emailKey] !== undefined) addErr_(errors, 'members.' + i + '.email', memberLabel_(i) + ' uses the same email as ' + memberLabel_(seenE[m.emailKey]) + '.', 'DUPLICATE_PERSON');
        else seenE[m.emailKey] = i;
      }
      if (m.phoneKey) {
        if (seenP[m.phoneKey] !== undefined) addErr_(errors, 'members.' + i + '.phone', memberLabel_(i) + ' uses the same phone number as ' + memberLabel_(seenP[m.phoneKey]) + '.', 'DUPLICATE_PERSON');
        else seenP[m.phoneKey] = i;
      }
    });
  }
  if (errors.length) throwErrors_(errors);
  return data;
}

function memberRowFromData_(teamId, role, m) {
  return {
    TeamID: teamId, Role: role, FullName: m.fullName, Email: m.email, EmailKey: m.emailKey, Phone: m.phone, PhoneKey: m.phoneKey,
    DOB: m.dob, AgeOnEvent: String(m.age), College: m.college, Course: m.course, CourseOther: m.courseOther,
    Branch: m.branch, Year: m.year, ProfileLink: m.profileLink, Active: 'TRUE'
  };
}

/* =============================================================================
 * 8. PUBLIC ACTIONS
 * ========================================================================== */

function actGetConfig_() {
  var now = nowMs_(), close = regCloseMs_(), b = dobBounds_();
  var e = CFG.EVENT_DAY;
  return {
    success: true,
    eventName: CFG.EVENT_NAME,
    eventDates: CFG.EVENT_DATES,
    eventDay: e.y + '-' + pad2_(e.m) + '-' + pad2_(e.d),
    regCloseAt: isoIST_(close),
    serverTime: isoIST_(now),
    open: now <= close,
    teamSize: CFG.TEAM_SIZE,
    minAge: CFG.MIN_AGE,
    maxAge: CFG.MAX_AGE,
    dobMin: b.min,
    dobMax: b.max,
    courses: COURSES.map(function (c) { return { name: c.name, years: c.years.slice(), needsBranch: c.needsBranch, needsOther: c.needsOther }; }),
    branches: BRANCHES.slice(),
    states: STATES.slice(),
    howHeardOptions: HOW_HEARD.slice()
  };
}

function actCheckTeamName_(body) {
  if (!throttleHit_('name:all', CFG.NAMECHECK_MAX, CFG.NAMECHECK_WINDOW_SEC)) fail_('THROTTLED', 'Too many checks. Please wait a moment.');
  if (typeof body.teamName !== 'string') fail_('BAD_REQUEST', 'teamName must be text.');
  var name = cleanText_(body.teamName);
  var n = len_(name);
  if (n < 2 || n > 40 || !TEAM_RE.test(name)) {
    return { success: true, available: false, reason: 'FORMAT', message: "Team name must be 2 to 40 characters, start with a letter and use only letters, digits, spaces and - _ . & ' !" };
  }
  var key = nameKey_(name);
  var sh = sheet_(SHEETS.TEAMS);
  var last = sh.getLastRow();
  if (last >= 2) {
    var col = H.TEAMS.indexOf('NameKey') + 1;
    var vals = sh.getRange(2, col, last - 1, 1).getValues();
    for (var i = 0; i < vals.length; i++) {
      if (unsafeCell_(vals[i][0]) === key) return { success: true, available: false, reason: 'TEAM_NAME_TAKEN', message: 'That team name is already taken.' };
    }
  }
  return { success: true, available: true, message: 'Team name is available.' };
}

function actRegister_(body, ctx) {
  // 1. honeypot
  if (body.website !== undefined && body.website !== '') fail_('BAD_REQUEST', 'Invalid request.');
  // 2. idempotency key and strict nested whitelist
  var key = body.idempotencyKey;
  if (typeof key !== 'string' || !IDEM_RE.test(key)) fail_('BAD_REQUEST', 'Invalid request key.');
  var unknown = [];
  if (isPlain_(body.college)) rejectUnknown_(body.college, COLLEGE_FIELDS, 'college', unknown);
  if (isPlain_(body.consent)) rejectUnknown_(body.consent, CONSENT_FIELDS, 'consent', unknown);
  if (Array.isArray(body.members)) body.members.forEach(function (m, i) { if (isPlain_(m)) rejectUnknown_(m, MEMBER_FIELDS, 'members.' + i, unknown); });
  if (unknown.length) fail_('BAD_REQUEST', 'The request contains unexpected fields.', unknown);
  // 3. a repeat of an already-saved request returns the first result, even after the deadline
  var hash = sha256Hex_(ctx.raw);
  var cached = idemLookup_(key, hash);
  if (cached) return cached;
  // 4. deadline (first check)
  if (!isOpenNow_()) fail_('REGISTRATION_CLOSED', 'Registration is closed.');
  // 5. throttles
  var hits = registerThrottle_(body);
  try {
    var data = validateRegistration_(body);
    return withLock_(function () { return registerLocked_(data, key, hash); });
  } catch (err) {
    // a request that failed because of us (busy / crash) is not the user's attempt
    if (!(err && err.isApiError) || err.code === 'BUSY' || err.code === 'SERVER_ERROR') refundHits_(hits);
    throw err;
  }
}

function registerThrottle_(body) {
  var hits = [];
  function hit(name, max, win) {
    if (!throttleHit_(name, max, win)) {
      refundHits_(hits);
      fail_('THROTTLED', 'Too many attempts. Please wait a few minutes and try again.');
    }
    hits.push({ name: name, win: win });
  }
  hit('reg:all', CFG.REGISTER_GLOBAL_MAX, CFG.REGISTER_GLOBAL_WINDOW_SEC);
  var cap = Array.isArray(body.members) && isPlain_(body.members[0]) ? body.members[0] : null;
  if (cap) {
    if (typeof cap.email === 'string') {
      var em = cleanText_(cap.email).toLowerCase();
      if (validEmail_(em)) hit('reg:e:' + sha256Hex_(emailKey_(em)).slice(0, 32), CFG.REGISTER_MAX, CFG.REGISTER_WINDOW_SEC);
    }
    if (typeof cap.phone === 'string') {
      var p10 = normPhone_(cleanText_(cap.phone));
      if (PHONE_RE.test(p10)) hit('reg:p:' + p10, CFG.REGISTER_MAX, CFG.REGISTER_WINDOW_SEC);
    }
  }
  return hits;
}
function refundHits_(hits) { hits.forEach(function (h) { try { throttleRefund_(h.name, h.win); } catch (e) { /* ignore */ } }); }

function idemLookup_(key, hash) {
  var rec = cacheGet_('idem:' + key);
  if (!rec) return null;
  if (rec.h !== hash) fail_('BAD_REQUEST', 'This request key was already used for a different submission. Please reload the page and try again.');
  return rec.r;
}
function idemStore_(key, hash, resp) {
  try { cachePut_('idem:' + key, { h: hash, r: resp }, CFG.IDEMPOTENCY_TTL_SEC); } catch (e) { Logger.log('idem store failed: ' + e); }
}

function registerLocked_(data, key, hash) {
  // a double click queues two identical requests: the second one finds the first one's result here
  var cached = idemLookup_(key, hash);
  if (cached) return cached;
  // deadline (second check, inside the lock)
  if (!isOpenNow_()) fail_('REGISTRATION_CLOSED', 'Registration is closed.');

  var teams = loadTeams_();
  var members = loadMembers_();
  var errors = [];
  for (var t = 0; t < teams.length; t++) {
    if (teams[t].NameKey === data.nameKey) { addErr_(errors, 'teamName', 'This team name is already taken. Please choose another.', 'TEAM_NAME_TAKEN'); break; }
  }
  var idx = activeIndex_(teams, members, 0);
  data.members.forEach(function (m, i) {
    var who = memberLabel_(i) + ' (' + m.fullName + ')';
    if (idx.byEmail[m.emailKey]) addErr_(errors, 'members.' + i + '.email', who + ': this email is already registered in another team.', 'DUPLICATE_PERSON');
    if (idx.byPhone[m.phoneKey]) addErr_(errors, 'members.' + i + '.phone', who + ': this phone number is already registered in another team.', 'DUPLICATE_PERSON');
  });
  if (errors.length) throwErrors_(errors);

  return withTx_(function () {
    var counter = Number(prop_('TEAM_COUNTER', '0'));
    if (!isFinite(counter) || counter < 0) counter = 0;
    var maxExisting = 0;
    teams.forEach(function (tm) { var n = parseInt(String(tm.TeamID).replace(/^CASE-/, ''), 10); if (n > maxExisting) maxExisting = n; });
    var next = Math.max(counter, maxExisting) + 1;
    var teamId = 'CASE-' + pad4_(next);
    var prevCounter = prop_('TEAM_COUNTER', '0');
    setProp_('TEAM_COUNTER', next);
    pushUndo_(function () { setProp_('TEAM_COUNTER', prevCounter); });

    var ts = isoIST_(nowMs_());
    var memberRows = data.members.map(function (m, i) { return memberRowFromData_(teamId, i === 0 ? 'captain' : 'member', m); });
    // Members first, Teams last: a team row only ever exists with all four members already saved.
    appendRowsTx_(sheet_(SHEETS.MEMBERS), H.MEMBERS, memberRows);
    appendRowsTx_(sheet_(SHEETS.TEAMS), H.TEAMS, [{
      TeamID: teamId, Timestamp: ts, TeamName: data.teamName, NameKey: data.nameKey, College: data.college.name,
      Address: data.college.address, City: data.college.city, State: data.college.state, PIN: data.college.pin,
      HowHeard: data.howHeard, Status: 'confirmed', CheckedIn: 'FALSE', CheckedInAt: '', EmailStatus: 'pending',
      EmailTries: '0', EmailSentAt: '', UpdatedAt: ts
    }]);
    SpreadsheetApp.flush();

    var response = {
      success: true,
      teamId: teamId,
      teamName: data.teamName,
      status: 'confirmed',
      members: data.members.map(function (m, i) { return { role: i === 0 ? 'captain' : 'member', fullName: m.fullName }; }),
      emailStatus: 'pending',
      groupLink: prop_('GROUP_LINK')
    };
    idemStore_(key, hash, response);
    return response;
  });
}

function actLookupStatus_(body) {
  if (!throttleHit_('look:all', CFG.LOOKUP_GLOBAL_MAX, CFG.LOOKUP_GLOBAL_WINDOW_SEC)) fail_('THROTTLED', 'Too many requests. Please wait a moment.');
  var teamId = normTeamId_(body.teamId);
  var tKey = 'look:t:' + (teamId || ('x' + sha256Hex_(typeof body.teamId === 'string' ? body.teamId : '').slice(0, 16)));
  if (!throttleUnder_(tKey, CFG.LOOKUP_FAIL_MAX, CFG.LOOKUP_FAIL_WINDOW_SEC)) fail_('THROTTLED', 'Too many attempts. Please try again in 15 minutes.');

  var result = null;
  if (teamId && typeof body.email === 'string') {
    var em = cleanText_(body.email).toLowerCase();
    if (validEmail_(em)) {
      var team = null, teams = loadTeams_();
      for (var i = 0; i < teams.length; i++) if (teams[i].TeamID === teamId) { team = teams[i]; break; }
      if (team) {
        var ms = activeMembersOf_(loadMembers_(), teamId);
        var captain = ms.length && ms[0].Role === 'captain' ? ms[0] : null;
        if (captain && captain.EmailKey === emailKey_(em)) {
          result = {
            success: true, teamId: team.TeamID, teamName: team.TeamName, status: team.Status, checkedIn: isTrue_(team.CheckedIn),
            members: ms.map(function (m) { return { role: m.Role, fullName: m.FullName }; })
          };
        }
      }
    }
  }
  if (!result) {
    throttleAdd_(tKey, CFG.LOOKUP_FAIL_WINDOW_SEC);
    fail_('NOT_FOUND', "We couldn't find a registration with those details.");
  }
  return result;
}

/* =============================================================================
 * 9. ADMIN: ACCOUNTS, LOGIN, SESSIONS
 * ========================================================================== */

function readAdmins_() { return readRows_(adminSs_().getSheetByName(SHEETS.ADMINS) || fail_('SERVER_ERROR', 'x'), H.ADMINS); }
function getAdminRow_(id) {
  var rows = readAdmins_();
  for (var i = 0; i < rows.length; i++) if (String(rows[i].AdminID).toLowerCase() === id) return rows[i];
  return null;
}
function hashPassword_(salt, pw) { return sha256Hex_(salt + ':' + pw); }
function actorOf_(admin) { return admin.name + ' (' + admin.adminId + ')'; }

function actAdminLogin_(body) {
  var id = typeof body.adminId === 'string' ? cleanText_(body.adminId).toLowerCase() : '';
  var pw = typeof body.password === 'string' ? body.password : '';
  if (!/^[a-z0-9._-]{2,32}$/.test(id) || pw.length < 1 || pw.length > 200) fail_('AUTH_FAILED', 'Invalid Admin ID or password.');
  var now = nowMs_();
  var lock = cacheGet_('lock:adm:' + id);
  if (lock && lock.until > now) {
    logBestEffort_('anonymous (' + id + ')', 'login_locked', '', '');
    fail_('LOCKED', 'Too many failed attempts. Try again in ' + Math.max(1, Math.ceil((lock.until - now) / 60000)) + ' minute(s).');
  }
  var admin = getAdminRow_(id);
  var ok = !!admin && isTrue_(admin.Active) && safeEq_(hashPassword_(admin.Salt, pw), admin.PasswordHash);
  if (!ok) {
    var rec = cacheGet_('fail:adm:' + id);
    if (!rec || typeof rec.c !== 'number' || now - rec.s >= CFG.ADMIN_LOCK_SEC * 1000) rec = { c: 0, s: now };
    rec.c++;
    if (rec.c >= CFG.ADMIN_FAIL_MAX) {
      cachePut_('lock:adm:' + id, { until: now + CFG.ADMIN_LOCK_SEC * 1000 }, CFG.ADMIN_LOCK_SEC);
      cacheDel_('fail:adm:' + id);
      logBestEffort_('anonymous (' + id + ')', 'login_locked', '', 'after ' + CFG.ADMIN_FAIL_MAX + ' failures');
      fail_('LOCKED', 'Too many failed attempts. This Admin ID is locked for ' + (CFG.ADMIN_LOCK_SEC / 60) + ' minutes.');
    }
    cachePut_('fail:adm:' + id, rec, CFG.ADMIN_LOCK_SEC);
    logBestEffort_('anonymous (' + id + ')', 'login_failed', '', '');
    fail_('AUTH_FAILED', 'Invalid Admin ID or password.');
  }
  cacheDel_('fail:adm:' + id);
  var role = String(admin.Role).toLowerCase() === 'owner' ? 'owner' : 'viewer';
  var name = cleanText_(admin.Name) || id;
  var token = randomHex_(64);
  cachePut_('sess:' + token, { adminId: id, exp: now + CFG.SESSION_TTL_SEC * 1000 }, CFG.SESSION_TTL_SEC);
  logBestEffort_(name + ' (' + id + ')', 'login', '', 'role=' + role);
  return { success: true, token: token, name: name, adminId: id, role: role, expiresInSeconds: CFG.SESSION_TTL_SEC };
}

// The account is re-read on every request, so Active=FALSE or a role change takes effect on the next click.
function authenticate_(token) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) fail_('AUTH_REQUIRED', 'Please sign in.');
  var s = cacheGet_('sess:' + token);
  if (!s || s.exp <= nowMs_()) fail_('AUTH_REQUIRED', 'Your session has expired. Please sign in again.');
  var a = getAdminRow_(s.adminId);
  if (!a || !isTrue_(a.Active)) { cacheDel_('sess:' + token); fail_('AUTH_REQUIRED', 'Your session is no longer valid. Please sign in again.'); }
  var role = String(a.Role).toLowerCase() === 'owner' ? 'owner' : 'viewer';
  return { adminId: s.adminId, name: cleanText_(a.Name) || s.adminId, role: role, token: token };
}

function actAdminLogout_(body) {
  var token = body.token;
  if (typeof token === 'string' && /^[a-f0-9]{64}$/.test(token)) {
    var s = cacheGet_('sess:' + token);
    cacheDel_('sess:' + token);
    if (s) logBestEffort_(s.adminId, 'logout', '', '');
  }
  return { success: true };
}

/* =============================================================================
 * 10. ADMIN: LOGGING
 * ========================================================================== */

function logRow_(actor, action, teamId, detail) {
  return { Timestamp: isoIST_(nowMs_()), Actor: String(actor), Action: action, TeamID: teamId || '', Detail: cleanText_(String(detail || '')).slice(0, 300) };
}
// Changes: the log line is part of the transaction (an unlogged change is rolled back).
function logTx_(admin, action, teamId, detail) {
  appendRowsTx_(sheet_(SHEETS.LOG), H.LOG, [logRow_(actorOf_(admin), action, teamId, detail)]);
}
// Views, logins, exports: never block the action if the log cannot be written.
function logBestEffort_(actor, action, teamId, detail) {
  try {
    withLock_(function () { appendRows_(sheet_(SHEETS.LOG), H.LOG, [logRow_(actor, action, teamId, detail)]); });
  } catch (e) { Logger.log('log failed: ' + (e && e.message ? e.message : e)); }
}

/* =============================================================================
 * 11. ADMIN: DATA VIEW AND STATS
 * ========================================================================== */

function memberView_(r) {
  return {
    role: r.Role, fullName: r.FullName, email: r.Email, phone: r.Phone, dob: r.DOB, ageOnEvent: Number(r.AgeOnEvent),
    college: r.College, course: r.Course, courseOther: r.CourseOther, branch: r.Branch, year: r.Year, profileLink: r.ProfileLink
  };
}
function teamView_(t, ms) {
  return {
    teamId: t.TeamID, timestamp: t.Timestamp, teamName: t.TeamName,
    college: { name: t.College, address: t.Address, city: t.City, state: t.State, pin: t.PIN },
    howHeard: t.HowHeard, status: t.Status, checkedIn: isTrue_(t.CheckedIn), checkedInAt: t.CheckedInAt,
    emailStatus: t.EmailStatus, emailTries: Number(t.EmailTries) || 0, emailSentAt: t.EmailSentAt, updatedAt: t.UpdatedAt,
    members: ms.map(memberView_)
  };
}

function loadTeamView_(teamId) {
  var teams = loadTeams_(), members = loadMembers_();
  for (var i = 0; i < teams.length; i++) if (teams[i].TeamID === teamId) return teamView_(teams[i], activeMembersOf_(members, teamId));
  return null;
}

function actAdminGetData_(body, ctx) {
  var teams = loadTeams_(), members = loadMembers_();
  var byTeam = Object.create(null);
  members.forEach(function (m) { if (isTrue_(m.Active)) (byTeam[m.TeamID] = byTeam[m.TeamID] || []).push(m); });
  var views = teams.map(function (t) { return teamView_(t, activeMembersOf_(byTeam[t.TeamID] || [], t.TeamID)); });
  logBestEffort_(actorOf_(ctx.admin), 'view', '', 'teams=' + views.length);
  return { success: true, serverTime: isoIST_(nowMs_()), teams: views, stats: computeStats_(views) };
}

function countMap_(map) {
  return Object.keys(map).map(function (k) { return { name: k, count: map[k] }; })
    .sort(function (a, b) { return b.count - a.count || (a.name < b.name ? -1 : 1); });
}

function computeStats_(views) {
  var live = views.filter(function (t) { return t.status === 'confirmed'; });
  var s = {};
  var participants = 0;
  live.forEach(function (t) { participants += t.members.length; });
  s.registered = { teams: live.length, participants: participants, cancelledTeams: views.length - live.length };

  var perDay = Object.create(null);
  live.forEach(function (t) { var d = String(t.timestamp).slice(0, 10); perDay[d] = (perDay[d] || 0) + 1; });
  s.perDay = Object.keys(perDay).sort().map(function (d) { return { date: d, count: perDay[d] }; });

  s.ageBuckets = AGE_BUCKETS.map(function (b) { return { label: b[2], count: 0 }; });
  var courseCount = Object.create(null), yearCount = Object.create(null), branchCount = Object.create(null), collegeCount = Object.create(null);
  var collegeName = Object.create(null);
  live.forEach(function (t) {
    t.members.forEach(function (m) {
      for (var i = 0; i < AGE_BUCKETS.length; i++) if (m.ageOnEvent >= AGE_BUCKETS[i][0] && m.ageOnEvent <= AGE_BUCKETS[i][1]) { s.ageBuckets[i].count++; break; }
      courseCount[m.course] = (courseCount[m.course] || 0) + 1;
      var yk = m.course + '|' + m.year;
      yearCount[yk] = (yearCount[yk] || 0) + 1;
      if (m.branch) branchCount[m.branch] = (branchCount[m.branch] || 0) + 1;
      var ck = nameKey_(m.college);
      if (!(ck in collegeName)) collegeName[ck] = m.college;
      collegeCount[ck] = (collegeCount[ck] || 0) + 1;
    });
  });
  s.courses = COURSES.filter(function (c) { return courseCount[c.name]; }).map(function (c) {
    return {
      course: c.name, count: courseCount[c.name],
      years: c.years.filter(function (y) { return yearCount[c.name + '|' + y]; }).map(function (y) { return { year: y, count: yearCount[c.name + '|' + y] }; })
    };
  });
  s.branches = BRANCHES.filter(function (b) { return branchCount[b]; }).map(function (b) { return { name: b, count: branchCount[b] }; });

  var stateCount = Object.create(null), heard = Object.create(null);
  var checked = 0, mail = { pending: 0, sent: 0, failed: 0 };
  live.forEach(function (t) {
    stateCount[t.college.state] = (stateCount[t.college.state] || 0) + 1;
    heard[t.howHeard] = (heard[t.howHeard] || 0) + 1;
    if (t.checkedIn) checked++;
    if (mail[t.emailStatus] !== undefined) mail[t.emailStatus]++;
  });
  s.states = countMap_(stateCount);
  s.topColleges = Object.keys(collegeCount).map(function (k) { return { name: collegeName[k], count: collegeCount[k] }; })
    .sort(function (a, b) { return b.count - a.count || (a.name < b.name ? -1 : 1); }).slice(0, 15);
  s.howHeard = countMap_(heard);
  s.checkIn = { checkedIn: checked, registered: live.length };
  s.emailQueue = mail;
  return s;
}

/* =============================================================================
 * 12. ADMIN: WRITE ACTIONS
 * ========================================================================== */

function adminWrite_(fn) { return withLock_(function () { return withTx_(fn); }); }

function findTeam_(teams, teamId) {
  for (var i = 0; i < teams.length; i++) if (teams[i].TeamID === teamId) return teams[i];
  return null;
}
function needTeamId_(body) {
  var id = normTeamId_(body.teamId);
  if (!id) fail_('BAD_REQUEST', 'A valid Team ID is required.');
  return id;
}
function needEmailKey_(raw, label) {
  if (typeof raw !== 'string') fail_('BAD_REQUEST', label + ' must be text.');
  var em = cleanText_(raw).toLowerCase();
  if (!validEmail_(em)) fail_('BAD_REQUEST', label + ' is not a valid email address.');
  return emailKey_(em);
}
function touchTeam_(team, patch) {
  var p = { UpdatedAt: isoIST_(nowMs_()) };
  Object.keys(patch || {}).forEach(function (k) { p[k] = patch[k]; });
  updateRowTx_(sheet_(SHEETS.TEAMS), H.TEAMS, team._row, p);
}
function findActiveMemberByKey_(members, teamId, key) {
  for (var i = 0; i < members.length; i++) {
    var m = members[i];
    if (m.TeamID === teamId && isTrue_(m.Active) && m.EmailKey === key) return m;
  }
  return null;
}

function actAdminCancel_(body, ctx) {
  var teamId = needTeamId_(body);
  var note = '';
  if (body.note !== undefined && body.note !== null) {
    if (typeof body.note !== 'string') fail_('BAD_REQUEST', 'note must be text.');
    note = cleanText_(body.note);
    if (len_(note) > 200) fail_('BAD_REQUEST', 'The note can be at most 200 characters.');
  }
  return adminWrite_(function () {
    var team = findTeam_(loadTeams_(), teamId);
    if (!team) fail_('NOT_FOUND', 'Team not found.');
    if (team.Status !== 'confirmed') fail_('BAD_STATE', 'This team is already cancelled.');
    touchTeam_(team, { Status: 'cancelled' });
    logTx_(ctx.admin, 'cancel', teamId, note);
    return { success: true, team: loadTeamView_(teamId) };
  });
}

function actAdminCheckin_(body, ctx) {
  var teamId = needTeamId_(body);
  if (typeof body.checkedIn !== 'boolean') fail_('BAD_REQUEST', 'checkedIn must be true or false.');
  var flag = body.checkedIn;
  return adminWrite_(function () {
    var team = findTeam_(loadTeams_(), teamId);
    if (!team) fail_('NOT_FOUND', 'Team not found.');
    if (team.Status !== 'confirmed') fail_('BAD_STATE', 'A cancelled team cannot be checked in.');
    touchTeam_(team, { CheckedIn: flag ? 'TRUE' : 'FALSE', CheckedInAt: flag ? isoIST_(nowMs_()) : '' });
    logTx_(ctx.admin, flag ? 'checkin' : 'checkin_undo', teamId, '');
    return { success: true, team: loadTeamView_(teamId) };
  });
}

function actAdminRetryEmail_(body, ctx) {
  var teamId = needTeamId_(body);
  return adminWrite_(function () {
    var team = findTeam_(loadTeams_(), teamId);
    if (!team) fail_('NOT_FOUND', 'Team not found.');
    if (team.EmailStatus !== 'failed') fail_('BAD_STATE', 'Only a failed email can be retried.');
    touchTeam_(team, { EmailStatus: 'pending', EmailTries: '0' });
    logTx_(ctx.admin, 'retry_email', teamId, '');
    return { success: true, team: loadTeamView_(teamId) };
  });
}

function actAdminChangeCaptain_(body, ctx) {
  var teamId = needTeamId_(body);
  var key = needEmailKey_(body.email, 'email');
  return adminWrite_(function () {
    var team = findTeam_(loadTeams_(), teamId);
    if (!team) fail_('NOT_FOUND', 'Team not found.');
    if (team.Status !== 'confirmed') fail_('BAD_STATE', 'This team is cancelled.');
    var members = loadMembers_();
    var target = findActiveMemberByKey_(members, teamId, key);
    if (!target) fail_('NOT_FOUND', 'No member of this team has that email.');
    if (target.Role === 'captain') fail_('BAD_STATE', 'That member is already the captain.');
    var current = null;
    activeMembersOf_(members, teamId).forEach(function (m) { if (m.Role === 'captain') current = m; });
    var sh = sheet_(SHEETS.MEMBERS);
    if (current) updateRowTx_(sh, H.MEMBERS, current._row, { Role: 'member' });
    updateRowTx_(sh, H.MEMBERS, target._row, { Role: 'captain' });
    touchTeam_(team, {});
    logTx_(ctx.admin, 'change_captain', teamId, 'new captain: ' + target.FullName);
    return { success: true, team: loadTeamView_(teamId) };
  });
}

function actAdminSwap_(body, ctx) {
  var teamId = needTeamId_(body);
  var oldKey = needEmailKey_(body.oldEmail, 'oldEmail');
  if (!isPlain_(body.newMember)) fail_('BAD_REQUEST', 'newMember is required.');
  var unknown = [];
  rejectUnknown_(body.newMember, MEMBER_FIELDS, 'newMember', unknown);
  if (unknown.length) fail_('BAD_REQUEST', 'The request contains unexpected fields.', unknown);
  return adminWrite_(function () {
    var teams = loadTeams_(), members = loadMembers_();
    var team = findTeam_(teams, teamId);
    if (!team) fail_('NOT_FOUND', 'Team not found.');
    if (team.Status !== 'confirmed') fail_('BAD_STATE', 'This team is cancelled.');
    var old = findActiveMemberByKey_(members, teamId, oldKey);
    if (!old) fail_('NOT_FOUND', 'No member of this team has that email.');
    if (old.Role === 'captain') fail_('BAD_STATE', 'The captain cannot be swapped. Make another member the captain first, then swap this member.');
    var errors = [];
    var nm = validateMember_(body.newMember, 'newMember', 1, errors);
    if (!errors.length) {
      var idx = activeIndex_(teams, members, old._row);
      if (idx.byEmail[nm.emailKey]) addErr_(errors, 'newMember.email', 'This email is already registered in a team.', 'DUPLICATE_PERSON');
      if (idx.byPhone[nm.phoneKey]) addErr_(errors, 'newMember.phone', 'This phone number is already registered in a team.', 'DUPLICATE_PERSON');
    }
    if (errors.length) throwErrors_(errors);
    var sh = sheet_(SHEETS.MEMBERS);
    updateRowTx_(sh, H.MEMBERS, old._row, { Active: 'FALSE' });
    appendRowsTx_(sh, H.MEMBERS, [memberRowFromData_(teamId, 'member', nm)]);
    touchTeam_(team, {});
    logTx_(ctx.admin, 'swap_member', teamId, 'replaced ' + old.FullName + ' with ' + nm.fullName);
    return { success: true, team: loadTeamView_(teamId) };
  });
}

function actAdminEditMember_(body, ctx) {
  var teamId = needTeamId_(body);
  var key = needEmailKey_(body.email, 'email');
  if (!isPlain_(body.fields) || Object.keys(body.fields).length === 0) fail_('BAD_REQUEST', 'fields must be an object with at least one field.');
  var unknown = [];
  rejectUnknown_(body.fields, MEMBER_FIELDS, 'fields', unknown);
  if (unknown.length) fail_('BAD_REQUEST', 'The request contains unexpected fields.', unknown);
  var fields = body.fields;
  return adminWrite_(function () {
    var teams = loadTeams_(), members = loadMembers_();
    var team = findTeam_(teams, teamId);
    if (!team) fail_('NOT_FOUND', 'Team not found.');
    if (team.Status !== 'confirmed') fail_('BAD_STATE', 'This team is cancelled.');
    var target = findActiveMemberByKey_(members, teamId, key);
    if (!target) fail_('NOT_FOUND', 'No member of this team has that email.');
    var merged = {
      fullName: target.FullName, email: target.Email, phone: target.Phone, dob: target.DOB, college: target.College,
      course: target.Course, courseOther: target.CourseOther, branch: target.Branch, year: target.Year, profileLink: target.ProfileLink
    };
    Object.keys(fields).forEach(function (k) { merged[k] = fields[k]; });
    if (hasOwn_(fields, 'course') && typeof fields.course === 'string') {
      var nd = COURSE_BY_NAME[cleanText_(fields.course)];
      if (nd && !nd.needsBranch && !hasOwn_(fields, 'branch')) merged.branch = '';
      if (nd && !nd.needsOther && !hasOwn_(fields, 'courseOther')) merged.courseOther = '';
    }
    var errors = [];
    var nm = validateMember_(merged, 'fields', target.Role === 'captain' ? 0 : 1, errors);
    if (!errors.length) {
      var idx = activeIndex_(teams, members, target._row);
      if (idx.byEmail[nm.emailKey]) addErr_(errors, 'fields.email', 'This email is already registered in a team.', 'DUPLICATE_PERSON');
      if (idx.byPhone[nm.phoneKey]) addErr_(errors, 'fields.phone', 'This phone number is already registered in a team.', 'DUPLICATE_PERSON');
    }
    if (errors.length) throwErrors_(errors);
    updateRowTx_(sheet_(SHEETS.MEMBERS), H.MEMBERS, target._row, {
      FullName: nm.fullName, Email: nm.email, EmailKey: nm.emailKey, Phone: nm.phone, PhoneKey: nm.phoneKey, DOB: nm.dob,
      AgeOnEvent: String(nm.age), College: nm.college, Course: nm.course, CourseOther: nm.courseOther, Branch: nm.branch,
      Year: nm.year, ProfileLink: nm.profileLink
    });
    touchTeam_(team, {});
    logTx_(ctx.admin, 'edit_member', teamId, 'fields: ' + Object.keys(fields).join(', '));
    return { success: true, team: loadTeamView_(teamId) };
  });
}

function actAdminLogExport_(body, ctx) {
  if (typeof body.kind !== 'string' || EXPORT_KINDS.indexOf(body.kind) < 0) fail_('BAD_REQUEST', 'kind must be one of: ' + EXPORT_KINDS.join(', ') + '.');
  var count = body.count;
  if (typeof count !== 'number' || !isFinite(count) || Math.floor(count) !== count || count < 0 || count > 100000) fail_('BAD_REQUEST', 'count must be a whole number.');
  withLock_(function () { withTx_(function () { logTx_(ctx.admin, 'export', '', 'kind=' + body.kind + ', count=' + count); }); });
  return { success: true, logged: true };
}

/* =============================================================================
 * 13. EMAIL QUEUE (time-driven trigger, every 10 minutes)
 * ========================================================================== */

function buildConfirmationEmail_(team, ms) {
  var cap = ms[0];
  var lines = [];
  lines.push('Hi ' + cap.FullName + ',', '');
  lines.push('Your team "' + team.TeamName + '" is registered for ' + CFG.EVENT_NAME + '.', '');
  lines.push('Team ID: ' + team.TeamID, '');
  lines.push('Members:');
  ms.forEach(function (m, i) { lines.push((i + 1) + '. ' + m.FullName + (m.Role === 'captain' ? ' (captain)' : '')); });
  lines.push('', 'When and where');
  lines.push(CFG.EVENT_DATES + ', Delhi. The exact venue is shared with registered teams by the organizers.', '');
  lines.push('Please note');
  lines.push('- There is no accommodation, no food and no merch.');
  lines.push('- Every member must be between ' + CFG.MIN_AGE + ' and ' + CFG.MAX_AGE + ' years old and carry a valid photo ID (school or college ID).', '');
  lines.push('Next steps');
  var link = prop_('GROUP_LINK');
  if (link) lines.push('- Join the WhatsApp group for updates: ' + link);
  lines.push('- Forward this email to your teammates.');
  lines.push('- You can check your registration any time on the Check my registration page of the ' + CFG.EVENT_NAME + ' website, using your Team ID and this email address.', '');
  lines.push('Questions? Reply to this email.', '');
  lines.push('The ' + CFG.EVENT_NAME + ' team');
  return {
    subject: CFG.EVENT_NAME + ': your team is registered (' + team.TeamID + ')',
    body: lines.join('\n')
  };
}

function processEmailQueue() {
  beginExecution_();
  if (prop_('EMAIL_ENABLED', 'FALSE').toUpperCase() !== 'TRUE') return;
  var started = nowMs_();
  try {
    withLock_(function () {
      var tsheet = sheet_(SHEETS.TEAMS);
      var teams = loadTeams_(), members = loadMembers_();
      var quota = MailApp.getRemainingDailyQuota();
      var sent = 0;
      for (var i = 0; i < teams.length; i++) {
        var t = teams[i];
        if (t.Status !== 'confirmed' || t.EmailStatus !== 'pending') continue;
        if (quota <= 0 || sent >= CFG.EMAIL_BATCH || nowMs_() - started > 240000) break;
        var ms = activeMembersOf_(members, t.TeamID);
        var nowIso = isoIST_(nowMs_());
        try {
          if (!ms.length || ms[0].Role !== 'captain' || !ms[0].Email) throw new Error('No captain email on file');
          var mail = buildConfirmationEmail_(t, ms);
          MailApp.sendEmail({ to: ms[0].Email, subject: mail.subject, body: mail.body, name: prop_('SENDER_NAME', 'masoulen') });
          quota--; sent++;
          updateRowTx_(tsheet, H.TEAMS, t._row, { EmailStatus: 'sent', EmailSentAt: nowIso, UpdatedAt: nowIso }, true);
        } catch (err) {
          var tries = (Number(t.EmailTries) || 0) + 1;
          Logger.log('email failed for ' + t.TeamID + ': ' + (err && err.message ? err.message : err));
          updateRowTx_(tsheet, H.TEAMS, t._row, { EmailTries: String(tries), EmailStatus: tries >= CFG.EMAIL_MAX_TRIES ? 'failed' : 'pending', UpdatedAt: nowIso }, true);
        }
      }
    });
  } catch (e) {
    Logger.log('processEmailQueue skipped: ' + (e && e.message ? e.message : e));
  }
}

/* =============================================================================
 * 14. SETUP, MAINTENANCE AND EDITOR-ONLY HELPERS (none of these are reachable from the web)
 * ========================================================================== */

function ensureSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  var w = headers.length;
  var first = sh.getRange(1, 1, 1, w).getValues()[0].map(function (v) { return String(v); });
  var empty = first.every(function (v) { return v === ''; });
  if (empty) sh.getRange(1, 1, 1, w).setValues([headers]);
  else if (first.join('|') !== headers.join('|')) {
    throw new Error('Sheet "' + name + '" has unexpected headers. Expected: ' + headers.join(', ') + '. setup() will not overwrite it.');
  }
  sh.getRange(1, 1, 1, w).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.getRange(2, 1, Math.max(sh.getMaxRows() - 1, 1), w).setNumberFormat('@');
  return sh;
}

function installTriggers_() {
  var mine = ['processEmailQueue', 'dailyBackup'];
  ScriptApp.getProjectTriggers().forEach(function (t) { if (mine.indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('processEmailQueue').timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger('dailyBackup').timeBased().everyDays(1).atHour(3).create();
}

function setup() {
  beginExecution_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open this script from the main spreadsheet (Extensions > Apps Script) and run setup() again.');
  var adminId = prop_('ADMIN_SHEET_ID');
  if (!adminId) throw new Error('Add the Script Property ADMIN_SHEET_ID first (the separate owner-only spreadsheet), then run setup() again.');
  if (adminId === ss.getId()) throw new Error('ADMIN_SHEET_ID must be a different spreadsheet from the main one.');
  setProp_('MAIN_SHEET_ID', ss.getId());
  SS_ = ss;
  if (!prop_('EMAIL_ENABLED')) setProp_('EMAIL_ENABLED', 'FALSE');
  if (!prop_('SENDER_NAME')) setProp_('SENDER_NAME', CFG.EVENT_NAME);
  if (!prop_('REG_CLOSE_AT')) setProp_('REG_CLOSE_AT', CFG.DEFAULT_REG_CLOSE_AT);
  if (!hasOwn_(props_(), 'TEAM_COUNTER')) setProp_('TEAM_COUNTER', '0');
  if (!hasOwn_(props_(), 'CACHE_EPOCH')) setProp_('CACHE_EPOCH', '0');

  ensureSheet_(ss, SHEETS.TEAMS, H.TEAMS);
  ensureSheet_(ss, SHEETS.MEMBERS, H.MEMBERS);
  ensureSheet_(ss, SHEETS.LOG, H.LOG);
  ensureSheet_(SpreadsheetApp.openById(adminId), SHEETS.ADMINS, H.ADMINS);
  installTriggers_();

  Logger.log('setup() done. Tabs, triggers (email queue every 10 min, daily backup) and counters are in place.');
  if (!prop_('GROUP_LINK')) Logger.log('WARNING: GROUP_LINK is not set. Confirmation screens and emails will have no WhatsApp link.');
  Logger.log('Next: run createAdmin(), then Deploy > New deployment > Web app (Execute as: Me, Access: Anyone).');
}

function healthCheck() {
  beginExecution_();
  var ok = true;
  function line(label, good, extra) { if (!good) ok = false; Logger.log((good ? 'OK    ' : 'FAIL  ') + label + (extra ? ' - ' + extra : '')); }
  line('MAIN_SHEET_ID set', !!prop_('MAIN_SHEET_ID'));
  line('ADMIN_SHEET_ID set', !!prop_('ADMIN_SHEET_ID'));
  line('GROUP_LINK set', !!prop_('GROUP_LINK'));
  line('Registration deadline', true, isoIST_(regCloseMs_()) + (isOpenNow_() ? ' (open)' : ' (CLOSED)'));
  line('EMAIL_ENABLED', true, prop_('EMAIL_ENABLED', 'FALSE'));
  line('LAUNCHED', true, prop_('LAUNCHED', 'not set'));
  try {
    Object.keys(SHEETS).forEach(function (k) {
      if (k === 'ADMINS') return;
      var sh = mainSs_().getSheetByName(SHEETS[k]);
      line('Sheet ' + SHEETS[k], !!sh, sh ? (Math.max(sh.getLastRow() - 1, 0) + ' data rows') : 'missing, run setup()');
    });
    var adm = adminSs_().getSheetByName(SHEETS.ADMINS);
    line('Sheet Admins (owner-only file)', !!adm, adm ? (Math.max(adm.getLastRow() - 1, 0) + ' admins') : 'missing, run setup()');
  } catch (e) { line('Spreadsheet access', false, String(e)); }
  var handlers = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  line('Trigger processEmailQueue', handlers.indexOf('processEmailQueue') >= 0);
  line('Trigger dailyBackup', handlers.indexOf('dailyBackup') >= 0);
  Logger.log(ok ? 'ALL GOOD' : 'SOMETHING NEEDS ATTENTION (see FAIL lines above)');
}

function validAdminId_(id) { return /^[a-z0-9._-]{2,32}$/.test(id); }

function createAdmin() {
  beginExecution_();
  var ADMIN_ID = 'owner';        // <-- EDIT: 2 to 32 characters: a-z 0-9 . _ -
  var ADMIN_NAME = 'Organizer';  // <-- EDIT: shown in Admin_Log
  var ROLE = 'owner';            // <-- 'owner' (can change things) or 'viewer' (read-only)
  var id = String(ADMIN_ID).toLowerCase();
  if (!validAdminId_(id)) throw new Error('ADMIN_ID must be 2 to 32 characters of a-z 0-9 . _ -');
  if (ROLE !== 'owner' && ROLE !== 'viewer') throw new Error("ROLE must be 'owner' or 'viewer'");
  withLock_(function () {
    if (getAdminRow_(id)) throw new Error('Admin "' + id + '" already exists. Use resetAdminPassword() instead.');
    var pw = randomPassword_(), salt = randomHex_(32);
    var sh = adminSs_().getSheetByName(SHEETS.ADMINS);
    appendRows_(sh, H.ADMINS, [{ AdminID: id, Name: cleanText_(ADMIN_NAME), Salt: salt, PasswordHash: hashPassword_(salt, pw), Role: ROLE, Active: 'TRUE' }]);
    Logger.log('Admin created. ID: ' + id + '  Role: ' + ROLE);
    Logger.log('PASSWORD (shown only once, save it in a password manager): ' + pw);
  });
}

function resetAdminPassword() {
  beginExecution_();
  var ADMIN_ID = 'owner';        // <-- EDIT
  var id = String(ADMIN_ID).toLowerCase();
  withLock_(function () {
    var a = getAdminRow_(id);
    if (!a) throw new Error('Admin "' + id + '" does not exist.');
    var pw = randomPassword_(), salt = randomHex_(32);
    var sh = adminSs_().getSheetByName(SHEETS.ADMINS);
    updateRowTx_(sh, H.ADMINS, a._row, { Salt: salt, PasswordHash: hashPassword_(salt, pw) }, true);
    cacheDel_('fail:adm:' + id); cacheDel_('lock:adm:' + id);
    Logger.log('New password for ' + id + ' (shown only once): ' + pw);
  });
}

function unlockAdmin() {
  beginExecution_();
  var ADMIN_ID = 'owner';        // <-- EDIT
  var id = String(ADMIN_ID).toLowerCase();
  cacheDel_('fail:adm:' + id);
  cacheDel_('lock:adm:' + id);
  Logger.log('Admin "' + id + '" unlocked.');
}

function backupFolder_() {
  var id = prop_('BACKUP_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* recreate below */ } }
  var f = DriveApp.createFolder('masoulen-backups');
  setProp_('BACKUP_FOLDER_ID', f.getId());
  return f;
}

function dailyBackup() {
  beginExecution_();
  var folder = backupFolder_();
  var stamp = isoIST_(nowMs_()).slice(0, 16).replace(/[:T]/g, '-');
  DriveApp.getFileById(mainSs_().getId()).makeCopy('masoulen-backup-' + stamp, folder);
  var files = folder.getFiles(), list = [];
  while (files.hasNext()) { var f = files.next(); if (f.getName().indexOf('masoulen-backup-') === 0) list.push(f); }
  list.sort(function (a, b) { return b.getDateCreated().getTime() - a.getDateCreated().getTime(); });
  for (var i = CFG.BACKUPS_KEEP; i < list.length; i++) list[i].setTrashed(true);
}

// Pre-launch wipe. Not an API action. Refuses to run once LAUNCHED = TRUE.
function resetAllData() {
  beginExecution_();
  if (prop_('LAUNCHED').toUpperCase() === 'TRUE') throw new Error('Refusing to wipe: Script Property LAUNCHED is TRUE.');
  var who = '';
  try { who = Session.getActiveUser().getEmail(); } catch (e) { who = '(unknown)'; }
  withLock_(function () {
    [[SHEETS.TEAMS, H.TEAMS], [SHEETS.MEMBERS, H.MEMBERS], [SHEETS.LOG, H.LOG]].forEach(function (p) {
      var sh = sheet_(p[0]);
      var rows = sh.getMaxRows() - 1;
      if (rows > 0) sh.getRange(2, 1, rows, p[1].length).clearContent();
    });
    setProp_('TEAM_COUNTER', '0');
    setProp_('CACHE_EPOCH', String((Number(prop_('CACHE_EPOCH', '0')) || 0) + 1));
  });
  Logger.log('resetAllData() ran by ' + who + ' at ' + isoIST_(nowMs_()) + ': Teams, Members and Admin_Log cleared, Team ID counter reset, caches invalidated.');
}