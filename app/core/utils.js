/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let compare, injectCSS, replaceText;
const slugify = (_.str != null ? _.str.slugify : undefined) != null ? (_.str != null ? _.str.slugify : undefined) : (_.string != null ? _.string.slugify : undefined); // TODO: why _.string on client and _.str on server?

const translatejs2cpp = function(jsCode, fullCode) {
  let i;
  let end;
  let end1;
  if (fullCode == null) { fullCode = true; }
  const matchBrackets = function(str, startIndex) {
    let cc = 0;
    for (let i = startIndex, end = str.length-1; i <= end; i++) {
      if (str[i] === '{') { cc += 1; }
      if (str[i] === '}') {
        cc -= 1;
        if (!cc) { return i+2; }
      }
    }
  };
  const splitFunctions = function(str) {
    let startComments;
    let result;
    const creg = new RegExp('\n[ \t]*[^/]');
    let codeIndex = creg.exec(str);
    if (str && (str[0] !== '/')) {
      startComments = '';
    } else if (codeIndex) {
      codeIndex = codeIndex.index + 1;
      startComments = str.slice(0, codeIndex);
      str = str.slice(codeIndex);
    } else {
      return [str, ''];
    }

    const indices = [];
    const reg = new RegExp('\nfunction ', 'gi');
    if (str.startsWith("function ")) { indices.push(0); }
    while (result = reg.exec(str)) {
      indices.push(result.index+1);
    }
    const split = [];
    let end = 0;
    if (indices.length) { split.push({s: 0, e: indices[0]}); }
    for (let i of Array.from(indices)) {
      end = matchBrackets(str, i);
      split.push({s: i, e: end});
    }
    split.push({s: end, e: str.length});
    const header = startComments ? [startComments] : [];
    return header.concat(split.map(s => str.slice(s.s, s.e)));
  };

  const jsCodes = splitFunctions(jsCode);
  const len = jsCodes.length;
  let lines = jsCodes[len-1].split('\n');
  if (fullCode) {
    jsCodes[len-1] = `\
void main() {
${(lines.map(line => '    ' + line)).join('\n')}
}\
`;
  } else {
    jsCodes[len-1] = (lines.map(line => ' ' + line)).join('\n');
  }
  for (i = 0, end = len-1; i <= end; i++) {
    if (/^ ?function/.test(jsCodes[i])) {
      const variables = jsCodes[i].match(/function.*\((.*)\)/)[1];
      let v = '';
      if (variables) { v = variables.split(', ').map(e => 'auto ' + e).join(', '); }
      jsCodes[i] = jsCodes[i].replace(/function(.*)\((.*)\)/, 'auto$1(' + v + ')');
    }
    jsCodes[i] = jsCodes[i].replace(new RegExp('var x', 'g'), 'float x');
    jsCodes[i] = jsCodes[i].replace(new RegExp('var y', 'g'), 'float y');
    jsCodes[i] = jsCodes[i].replace(new RegExp(' === ', 'g'), ' == ');
    jsCodes[i] = jsCodes[i].replace(new RegExp(' !== ', 'g'), ' != ');
    jsCodes[i] = jsCodes[i].replace(new RegExp(' and ', 'g'), ' && ');
    jsCodes[i] = jsCodes[i].replace(new RegExp(' or ', 'g'), ' || ');
    jsCodes[i] = jsCodes[i].replace(new RegExp('not ', 'g'), '!');
    jsCodes[i] = jsCodes[i].replace(new RegExp(' var ', 'g'), ' auto ');
  }
  if (!fullCode) {
    lines = jsCodes[len-1].split('\n');
    jsCodes[len-1] = (lines.map(line => line.slice(1))).join('\n');
  }

  const cppCodes = jsCodes.join('').split('\n');
  for (i = 1, end1 = cppCodes.length-1; i <= end1; i++) {
    if (cppCodes[i].match(/^\s*else/) && cppCodes[i-1].match("//")) {
      const tmp = cppCodes[i];
      cppCodes[i] = cppCodes[i-1];
      cppCodes[i-1] = tmp;
    }
  }
  return cppCodes.join('\n');
};

var clone = function(obj) {
  if ((obj === null) || (typeof (obj) !== 'object')) { return obj; }
  const temp = obj.constructor();
  for (let key in obj) {
    temp[key] = clone(obj[key]);
  }
  return temp;
};

const combineAncestralObject = function(obj, propertyName) {
  const combined = {};
  while (obj != null ? obj[propertyName] : undefined) {
    for (let key in obj[propertyName]) {
      const value = obj[propertyName][key];
      if (combined[key]) { continue; }
      combined[key] = value;
    }
    if (obj.__proto__) {
      obj = obj.__proto__;
    } else {
      // IE has no __proto__. TODO: does this even work? At most it doesn't crash.
      obj = Object.getPrototypeOf(obj);
    }
  }
  return combined;
};

const countries = [
  {country: 'united-states', countryCode: 'US', ageOfConsent: 13, addressesIncludeAdministrativeRegion:true},
  {country: 'china', countryCode: 'CN', addressesIncludeAdministrativeRegion:true},
  {country: 'brazil', countryCode: 'BR'},

  // Loosely ordered by decreasing traffic as measured 2016-09-01 - 2016-11-07
  // TODO: switch to alphabetical ordering
  {country: 'united-kingdom', countryCode: 'GB', inEU: true, ageOfConsent: 13},
  {country: 'russia', countryCode: 'RU'},
  {country: 'australia', countryCode: 'AU', addressesIncludeAdministrativeRegion:true},
  {country: 'canada', countryCode: 'CA', addressesIncludeAdministrativeRegion:true},
  {country: 'france', countryCode: 'FR', inEU: true, ageOfConsent: 15},
  {country: 'taiwan', countryCode: 'TW'},
  {country: 'ukraine', countryCode: 'UA'},
  {country: 'poland', countryCode: 'PL', inEU: true, ageOfConsent: 13},
  {country: 'spain', countryCode: 'ES', inEU: true, ageOfConsent: 13},
  {country: 'germany', countryCode: 'DE', inEU: true, ageOfConsent: 16},
  {country: 'netherlands', countryCode: 'NL', inEU: true, ageOfConsent: 16},
  {country: 'hungary', countryCode: 'HU', inEU: true, ageOfConsent: 16},
  {country: 'japan', countryCode: 'JP'},
  {country: 'turkey', countryCode: 'TR'},
  {country: 'south-africa', countryCode: 'ZA'},
  {country: 'indonesia', countryCode: 'ID'},
  {country: 'new-zealand', countryCode: 'NZ'},
  {country: 'finland', countryCode: 'FI', inEU: true, ageOfConsent: 13},
  {country: 'south-korea', countryCode: 'KR'},
  {country: 'mexico', countryCode: 'MX', addressesIncludeAdministrativeRegion:true},
  {country: 'vietnam', countryCode: 'VN'},
  {country: 'singapore', countryCode: 'SG'},
  {country: 'colombia', countryCode: 'CO'},
  {country: 'india', countryCode: 'IN', addressesIncludeAdministrativeRegion:true},
  {country: 'thailand', countryCode: 'TH'},
  {country: 'belgium', countryCode: 'BE', inEU: true, ageOfConsent: 13},
  {country: 'sweden', countryCode: 'SE', inEU: true, ageOfConsent: 13},
  {country: 'denmark', countryCode: 'DK', inEU: true, ageOfConsent: 13},
  {country: 'czech-republic', countryCode: 'CZ', inEU: true, ageOfConsent: 15},
  {country: 'hong-kong', countryCode: 'HK'},
  {country: 'italy', countryCode: 'IT', inEU: true, ageOfConsent: 16, addressesIncludeAdministrativeRegion:true},
  {country: 'romania', countryCode: 'RO', inEU: true, ageOfConsent: 16},
  {country: 'belarus', countryCode: 'BY'},
  {country: 'norway', countryCode: 'NO', inEU: true, ageOfConsent: 13},  // GDPR applies to EFTA
  {country: 'philippines', countryCode: 'PH'},
  {country: 'lithuania', countryCode: 'LT', inEU: true, ageOfConsent: 16},
  {country: 'argentina', countryCode: 'AR'},
  {country: 'malaysia', countryCode: 'MY', addressesIncludeAdministrativeRegion:true},
  {country: 'pakistan', countryCode: 'PK'},
  {country: 'serbia', countryCode: 'RS'},
  {country: 'greece', countryCode: 'GR', inEU: true, ageOfConsent: 15},
  {country: 'israel', countryCode: 'IL', inEU: true},
  {country: 'portugal', countryCode: 'PT', inEU: true, ageOfConsent: 13},
  {country: 'slovakia', countryCode: 'SK', inEU: true, ageOfConsent: 16},
  {country: 'ireland', countryCode: 'IE', inEU: true, ageOfConsent: 16},
  {country: 'switzerland', countryCode: 'CH', inEU: true, ageOfConsent: 16},  // GDPR applies to EFTA
  {country: 'peru', countryCode: 'PE'},
  {country: 'bulgaria', countryCode: 'BG', inEU: true, ageOfConsent: 14},
  {country: 'venezuela', countryCode: 'VE'},
  {country: 'austria', countryCode: 'AT', inEU: true, ageOfConsent: 14},
  {country: 'croatia', countryCode: 'HR', inEU: true, ageOfConsent: 16},
  {country: 'saudia-arabia', countryCode: 'SA'},
  {country: 'chile', countryCode: 'CL'},
  {country: 'united-arab-emirates', countryCode: 'AE'},
  {country: 'kazakhstan', countryCode: 'KZ'},
  {country: 'estonia', countryCode: 'EE', inEU: true, ageOfConsent: 13},
  {country: 'iran', countryCode: 'IR'},
  {country: 'egypt', countryCode: 'EG'},
  {country: 'ecuador', countryCode: 'EC'},
  {country: 'slovenia', countryCode: 'SI', inEU: true, ageOfConsent: 15},
  {country: 'macedonia', countryCode: 'MK'},
  {country: 'cyprus', countryCode: 'CY', inEU: true, ageOfConsent: 14},
  {country: 'latvia', countryCode: 'LV', inEU: true, ageOfConsent: 13},
  {country: 'luxembourg', countryCode: 'LU', inEU: true, ageOfConsent: 16},
  {country: 'malta', countryCode: 'MT', inEU: true, ageOfConsent: 16},
  {country: 'lichtenstein', countryCode: 'LI', inEU: true},  // GDPR applies to EFTA
  {country: 'iceland', countryCode: 'IS', inEU: true}  // GDPR applies to EFTA
];

const inEU = country => !!__guard__(_.find(countries, c => c.country === slugify(country)), x => x.inEU);

const addressesIncludeAdministrativeRegion = country => !!__guard__(_.find(countries, c => c.country === slugify(country)), x => x.addressesIncludeAdministrativeRegion);

const ageOfConsent = function(countryName, defaultIfUnknown) {
  if (defaultIfUnknown == null) { defaultIfUnknown = 0; }
  if (!countryName) { return defaultIfUnknown; }
  const country = _.find(countries, c => c.country === slugify(countryName));
  if (!country) { return defaultIfUnknown; }
  if (country.ageOfConsent) { return country.ageOfConsent; }
  if (country.inEU) { return 16; }
  return defaultIfUnknown;
};

const courseIDs = {
  INTRODUCTION_TO_COMPUTER_SCIENCE: '560f1a9f22961295f9427742',
  GAME_DEVELOPMENT_1: '5789587aad86a6efb573701e',
  WEB_DEVELOPMENT_1: '5789587aad86a6efb573701f',
  COMPUTER_SCIENCE_2: '5632661322961295f9428638',
  GAME_DEVELOPMENT_2: '57b621e7ad86a6efb5737e64',
  WEB_DEVELOPMENT_2: '5789587aad86a6efb5737020',
  COMPUTER_SCIENCE_3: '56462f935afde0c6fd30fc8c',
  GAME_DEVELOPMENT_3: '5a0df02b8f2391437740f74f',
  COMPUTER_SCIENCE_4: '56462f935afde0c6fd30fc8d',
  COMPUTER_SCIENCE_5: '569ed916efa72b0ced971447',
  COMPUTER_SCIENCE_6: '5817d673e85d1220db624ca4'
};

// TODO add when final courses content created for ozaria
const ozariaCourseIDs = [];

const orderedCourseIDs = [
  courseIDs.INTRODUCTION_TO_COMPUTER_SCIENCE,
  courseIDs.GAME_DEVELOPMENT_1,
  courseIDs.WEB_DEVELOPMENT_1,
  courseIDs.COMPUTER_SCIENCE_2,
  courseIDs.GAME_DEVELOPMENT_2,
  courseIDs.WEB_DEVELOPMENT_2,
  courseIDs.COMPUTER_SCIENCE_3,
  courseIDs.GAME_DEVELOPMENT_3,
  courseIDs.COMPUTER_SCIENCE_4,
  courseIDs.COMPUTER_SCIENCE_5,
  courseIDs.COMPUTER_SCIENCE_6
];

const courseAcronyms = {};
courseAcronyms[courseIDs.INTRODUCTION_TO_COMPUTER_SCIENCE] = 'CS1';
courseAcronyms[courseIDs.GAME_DEVELOPMENT_1] = 'GD1';
courseAcronyms[courseIDs.WEB_DEVELOPMENT_1] = 'WD1';
courseAcronyms[courseIDs.COMPUTER_SCIENCE_2] = 'CS2';
courseAcronyms[courseIDs.GAME_DEVELOPMENT_2] = 'GD2';
courseAcronyms[courseIDs.WEB_DEVELOPMENT_2] = 'WD2';
courseAcronyms[courseIDs.COMPUTER_SCIENCE_3] = 'CS3';
courseAcronyms[courseIDs.GAME_DEVELOPMENT_3] = 'GD3';
courseAcronyms[courseIDs.COMPUTER_SCIENCE_4] = 'CS4';
courseAcronyms[courseIDs.COMPUTER_SCIENCE_5] = 'CS5';
courseAcronyms[courseIDs.COMPUTER_SCIENCE_6] = 'CS6';

const petThangIDs = [
  '578d320d15e2501f00a585bd', // Wolf Pup
  '5744e3683af6bf590cd27371', // Cougar
  '5786a472a6c64135009238d3', // Raven
  '577d5d4dab818b210046b3bf', // Pugicorn
  '58c74b7c3d4a3d2900d43b7e', // Brown Rat
  '58c7614a62cc3a1f00442240', // Yetibab
  '58a262520b43652f00dad75e', // Phoenix
  '57869cf7bd31c14400834028', // Frog
  '578691f9bd31c1440083251d', // Polar Bear Cub
  '58a2712b0b43652f00dae5a4', // Blue Fox
  '58c737140ca7852e005deb8a', // Mimic
  '57586f0a22179b2800efda37' // Baby Griffin
];

const premiumContent = {
  premiumHeroesCount: '12',
  totalHeroesCount: '16',
  premiumLevelsCount: '330',
  freeLevelsCount: '100'
};

const normalizeFunc = function(func_thing, object) {
  // func could be a string to a function in this class
  // or a function in its own right
  if (object == null) { object = {}; }
  if (_.isString(func_thing)) {
    const func = object[func_thing];
    if (!func) {
      console.error(`Could not find method ${func_thing} in object`, object);
      return () => null; // always return a func, or Mediator will go boom
    }
    func_thing = func;
  }
  return func_thing;
};

const objectIdToDate = objectID => new Date(parseInt(objectID.toString().slice(0,8), 16)*1000);

const hexToHSL = hex => rgbToHsl(hexToR(hex), hexToG(hex), hexToB(hex));

var hexToR = h => parseInt((cutHex(h)).substring(0, 2), 16);
var hexToG = h => parseInt((cutHex(h)).substring(2, 4), 16);
var hexToB = h => parseInt((cutHex(h)).substring(4, 6), 16);
var cutHex = function(h) { if (h.charAt(0) === '#') { return h.substring(1, 7); } else { return h; } };

const hslToHex = hsl => '#' + (Array.from(hslToRgb(...Array.from(hsl || []))).map((n) => toHex(n))).join('');

var toHex = function(n) {
  let h = Math.floor(n).toString(16);
  if (h.length === 1) { h = '0'+h; }
  return h;
};

const pathToUrl = function(path) {
  const base = location.protocol + '//' + location.hostname + (location.port && (":" + location.port));
  return base + path;
};

const extractPlayerCodeTag = function(code) {
  const unwrappedDefaultCode = __guard__(code.match(/<playercode>\n([\s\S]*)\n *<\/playercode>/), x => x[1]);
  if (unwrappedDefaultCode) {
    return stripIndentation(unwrappedDefaultCode);
  } else {
    return undefined;
  }
};

var stripIndentation = function(code) {
  let line;
  const codeLines = code.split('\n');
  const indentation = _.min(_.filter(codeLines.map(line => __guard__(__guard__(line.match(/^\s*/), x1 => x1[0]), x => x.length))));
  const strippedCode = ((() => {
    const result = [];
    for (line of Array.from(codeLines)) {       result.push(line.substr(indentation));
    }
    return result;
  })()).join('\n');
  return strippedCode;
};

// @param {Object} say - the object containing an i18n property.
// @param {string} target - the attribute that you want to access.
// @returns {string} translated string if possible
// Example usage:
//   `courseName = utils.i18n(course.attributes, 'name')`
const i18n = function(say, target, language, fallback) {
  let generalName;
  if (language == null) { language = me.get('preferredLanguage', true); }
  if (fallback == null) { fallback = 'en'; }
  let generalResult = null;
  let fallBackResult = null;
  let fallForwardResult = null;  // If a general language isn't available, the first specific one will do.
  let fallSidewaysResult = null;  // If a specific language isn't available, its sibling specific language will do.
  const matches = (/\w+/gi).exec(language);
  if (matches) { generalName = matches[0]; }

  for (let localeName in say.i18n) {
    var result;
    const locale = say.i18n[localeName];
    if (localeName === '-') { continue; }
    if (target in locale) {
      result = locale[target];
    } else { continue; }
    if (localeName === language) { return result; }
    if (localeName === generalName) { generalResult = result; }
    if (localeName === fallback) { fallBackResult = result; }
    if ((localeName.indexOf(language) === 0) && (fallForwardResult == null)) { fallForwardResult = result; }
    if ((localeName.indexOf(generalName) === 0) && (fallSidewaysResult == null)) { fallSidewaysResult = result; }
  }

  if (generalResult != null) { return generalResult; }
  if (fallForwardResult != null) { return fallForwardResult; }
  if (fallSidewaysResult != null) { return fallSidewaysResult; }
  if (fallBackResult != null) { return fallBackResult; }
  if (target in say) { return say[target]; }
  return null;
};

const getByPath = function(target, path) {
  if (!target) { throw new Error('Expected an object to match a query against, instead got null'); }
  const pieces = path.split('.');
  let obj = target;
  for (let piece of Array.from(pieces)) {
    if (!(piece in obj)) { return undefined; }
    obj = obj[piece];
  }
  return obj;
};

const isID = id => _.isString(id) && (id.length === 24) && (__guard__(id.match(/[a-f0-9]/gi), x => x.length) === 24);

const isIE = () => __guard__(typeof $ !== 'undefined' && $ !== null ? $.browser : undefined, x => x.msie) != null ? __guard__(typeof $ !== 'undefined' && $ !== null ? $.browser : undefined, x => x.msie) : false;

const isRegionalSubscription = name => /_basic_subscription/.test(name);

const isSmokeTestEmail = email => /@example.com/.test(email) || /smoketest/.test(email);

const round = _.curry((digits, n) => n = +n.toFixed(digits));

const positify = func => params => (function(x) { if (x > 0) { return func(params)(x); } else { return 0; } });

// f(x) = ax + b
const createLinearFunc = params => x => ((params.a || 1) * x) + (params.b || 0);

// f(x) = ax² + bx + c
const createQuadraticFunc = params => x => ((params.a || 1) * x * x) + ((params.b || 1) * x) + (params.c || 0);

// f(x) = a log(b (x + c)) + d
const createLogFunc = params => (function(x) { if (x > 0) { return ((params.a || 1) * Math.log((params.b || 1) * (x + (params.c || 0)))) + (params.d || 0); } else { return 0; } });

// f(x) = ax^b + c
const createPowFunc = params => x => ((params.a || 1) * Math.pow(x, params.b || 1)) + (params.c || 0);

const functionCreators = {
  linear: positify(createLinearFunc),
  quadratic: positify(createQuadraticFunc),
  logarithmic: positify(createLogFunc),
  pow: positify(createPowFunc)
};

// Call done with true to satisfy the 'until' goal and stop repeating func
const keepDoingUntil = function(func, wait, totalWait) {
  let done;
  if (wait == null) { wait = 100; }
  if (totalWait == null) { totalWait = 5000; }
  let waitSoFar = 0;
  return (done = function(success) {
    if (((waitSoFar += wait) <= totalWait) && !success) {
      return _.delay((() => func(done)), wait);
    }
  })(false);
};

const grayscale = function(imageData) {
  const d = imageData.data;
  for (let i = 0, end = d.length; i <= end; i += 4) {
    const r = d[i];
    const g = d[i+1];
    const b = d[i+2];
    const v = (0.2126*r) + (0.7152*g) + (0.0722*b);
    d[i] = (d[i+1] = (d[i+2] = v));
  }
  return imageData;
};

// Deep compares l with r, with the exception that undefined values are considered equal to missing values
// Very practical for comparing Mongoose documents where undefined is not allowed, instead fields get deleted
const kindaEqual = (compare = function(l, r) {
  if (_.isObject(l) && _.isObject(r)) {
    for (let key of Array.from(_.union(Object.keys(l), Object.keys(r)))) {
      if (!compare(l[key], r[key])) { return false; }
    }
    return true;
  } else if (l === r) {
    return true;
  } else {
    return false;
  }
});

// Return UTC string "YYYYMMDD" for today + offset
const getUTCDay = function(offset) {
  if (offset == null) { offset = 0; }
  const day = new Date();
  day.setDate(day.getUTCDate() + offset);
  const partYear = day.getUTCFullYear();
  let partMonth = (day.getUTCMonth() + 1);
  if (partMonth < 10) { partMonth = "0" + partMonth; }
  let partDay = day.getUTCDate();
  if (partDay < 10) { partDay = "0" + partDay; }
  return `${partYear}${partMonth}${partDay}`;
};

// Fast, basic way to replace text in an element when you don't need much.
// http://stackoverflow.com/a/4962398/540620
if (typeof document !== 'undefined' && document !== null ? document.createElement : undefined) {
  const dummy = document.createElement('div');
  dummy.innerHTML = 'text';
  const TEXT = dummy.textContent === 'text' ? 'textContent' : 'innerText';
  replaceText = function(elems, text) {
    for (let elem of Array.from(elems)) { elem[TEXT] = text; }
    return null;
  };
}

// Add a stylesheet rule
// http://stackoverflow.com/questions/524696/how-to-create-a-style-tag-with-javascript/26230472#26230472
// Don't use wantonly, or we'll have to implement a simple mechanism for clearing out old rules.
if (typeof document !== 'undefined' && document !== null ? document.createElement : undefined) {
  injectCSS = (function(doc) {
    // wrapper for all injected styles and temp el to create them
    const wrap = doc.createElement("div");
    const temp = doc.createElement("div");
    // rules like "a {color: red}" etc.
    return function(cssRules) {
      // append wrapper to the body on the first call
      if (!wrap.id) {
        wrap.id = "injected-css";
        wrap.style.display = "none";
        doc.body.appendChild(wrap);
      }
      // <br> for IE: http://goo.gl/vLY4x7
      temp.innerHTML = "<br><style>" + cssRules + "</style>";
      wrap.appendChild(temp.children[1]);
    };
  })(document);
}

// So that we can stub out userAgent in tests
const userAgent = () => window.navigator.userAgent;

const getDocumentSearchString = () => // moved to a separate function so it can be mocked for testing
document.location.search;

const getQueryVariables = function() {
  const query = module.exports.getDocumentSearchString().substring(1); // use module.exports so spy is used in testing
  const pairs = (Array.from(query.split('&')).map((pair) => pair.split('=')));
  const variables = {};
  for (let [key, value] of Array.from(pairs)) {
    var left;
    variables[key] = (left = {'true': true, 'false': false}[value]) != null ? left : decodeURIComponent(value);
  }
  return variables;
};

const getQueryVariable = function(param, defaultValue) {
  const variables = getQueryVariables();
  return variables[param] != null ? variables[param] : defaultValue;
};

const getSponsoredSubsAmount = function(price, subCount, personalSub) {
  // 1 100%
  // 2-11 80%
  // 12+ 60%
  // TODO: make this less confusing
  if (price == null) { price = 999; }
  if (subCount == null) { subCount = 0; }
  if (personalSub == null) { personalSub = false; }
  if (!(subCount > 0)) { return 0; }
  const offset = personalSub ? 1 : 0;
  if (subCount <= (1 - offset)) {
    return price;
  } else if (subCount <= (11 - offset)) {
    return Math.round(((1 - offset) * price) + (((subCount - 1) + offset) * price * 0.8));
  } else {
    return Math.round(((1 - offset) * price) + (10 * price * 0.8) + (((subCount - 11) + offset) * price * 0.6));
  }
};

const getCourseBundlePrice = function(coursePrices, seats) {
  let pricePerSeat;
  if (seats == null) { seats = 20; }
  const totalPricePerSeat = coursePrices.reduce(((a, b) => a + b), 0);
  if (coursePrices.length > 2) {
    pricePerSeat = Math.round(totalPricePerSeat / 2.0);
  } else {
    pricePerSeat = parseInt(totalPricePerSeat);
  }
  return seats * pricePerSeat;
};

const getCoursePraise = function() {
  const praise = [
    {
      quote:  "The kids love it.",
      source: "Leo Joseph Tran, Athlos Leadership Academy"
    },
    {
      quote: "My students have been using the site for a couple of weeks and they love it.",
      source: "Scott Hatfield, Computer Applications Teacher, School Technology Coordinator, Eastside Middle School"
    },
    {
      quote: "Thanks for the captivating site. My eighth graders love it.",
      source: "Janet Cook, Ansbach Middle/High School"
    },
    {
      quote: "My students have started working on CodeCombat and love it! I love that they are learning coding and problem solving skills without them even knowing it!!",
      source: "Kristin Huff, Special Education Teacher, Webb City School District"
    },
    {
      quote: "I recently introduced Code Combat to a few of my fifth graders and they are loving it!",
      source: "Shauna Hamman, Fifth Grade Teacher, Four Peaks Elementary School"
    },
    {
      quote: "Overall I think it's a fantastic service. Variables, arrays, loops, all covered in very fun and imaginative ways. Every kid who has tried it is a fan.",
      source: "Aibinder Andrew, Technology Teacher"
    },
    {
      quote: "I love what you have created. The kids are so engaged.",
      source: "Desmond Smith, 4KS Academy"
    },
    {
      quote: "My students love the website and I hope on having content structured around it in the near future.",
      source: "Michael Leonard, Science Teacher, Clearwater Central Catholic High School"
    }
  ];
  return praise[_.random(0, praise.length - 1)];
};

const getPrepaidCodeAmount = function(price, users, months) {
  if (price == null) { price = 0; }
  if (users == null) { users = 0; }
  if (months == null) { months = 0; }
  if (!(users > 0) || !(months > 0)) { return 0; }
  const total = price * users * months;
  return total;
};

const formatDollarValue = dollars => '$' + (parseFloat(dollars).toFixed(2));

const startsWithVowel = s => Array.from('aeiouAEIOU').includes(s[0]);

const filterMarkdownCodeLanguages = function(text, language) {
  if (!text) { return ''; }
  const currentLanguage = language || __guard__(me.get('aceConfig'), x => x.language) || 'python';
  const excludedLanguages = _.without(['javascript', 'python', 'coffeescript', 'lua', 'java', 'cpp', 'html'], currentLanguage === 'cpp' ? 'javascript' : currentLanguage);
  // Exclude language-specific code blocks like ```python (... code ...)``
  // ` for each non-target language.
  const codeBlockExclusionRegex = new RegExp(`\`\`\`(${excludedLanguages.join('|')})\n[^\`]+\`\`\`\n?`, 'gm');
  // Exclude language-specific images like ![python - image description](image url) for each non-target language.
  const imageExclusionRegex = new RegExp(`!\\[(${excludedLanguages.join('|')}) - .+?\\]\\(.+?\\)\n?`, 'gm');
  text = text.replace(codeBlockExclusionRegex, '').replace(imageExclusionRegex, '');

  const commonLanguageReplacements = {
    python: [
      ['true', 'True'], ['false', 'False'], ['null', 'None'],
      ['object', 'dictionary'], ['Object', 'Dictionary'],
      ['array', 'list'], ['Array', 'List'],
    ],
    lua: [
      ['null', 'nil'],
      ['object', 'table'], ['Object', 'Table'],
      ['array', 'table'], ['Array', 'Table'],
    ]
  };
  for (let [from, to] of Array.from(commonLanguageReplacements[currentLanguage] != null ? commonLanguageReplacements[currentLanguage] : [])) {
    // Convert JS-specific keywords and types to Python ones, if in simple `code` tags.
    // This won't cover it when it's not in an inline code tag by itself or when it's not in English.
    text = text.replace(new RegExp(`\`${from}\``, 'g'), `\`${to}\``);
    // Now change "An `dictionary`" to "A `dictionary`", etc.
    if (startsWithVowel(from) && !startsWithVowel(to)) {
      text = text.replace(new RegExp(`( a|A)n( \`${to}\`)`, 'g'), "$1$2");
    }
    if (!startsWithVowel(from) && startsWithVowel(to)) {
      text = text.replace(new RegExp(`( a|A)( \`${to}\`)`, 'g'), "$1n$2");
    }
  }
  if (currentLanguage === 'cpp') {
    const jsRegex = new RegExp("```javascript\n([^`]+)```", 'gm');
    text = text.replace(jsRegex, (a, l) => {
      return `\`\`\`cpp
  ${this.translatejs2cpp(a.slice(13, +(a.length-4) + 1 || undefined), false)}
\`\`\``;
    });
  }

  return text;
};

const capitalLanguages = {
  'javascript': 'JavaScript',
  'coffeescript': 'CoffeeScript',
  'python': 'Python',
  'java': 'Java',
  'cpp': 'C++',
  'lua': 'Lua',
  'html': 'HTML'
};

const createLevelNumberMap = function(levels) {
  const levelNumberMap = {};
  let practiceLevelTotalCount = 0;
  let practiceLevelCurrentCount = 0;
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    let levelNumber = (i - practiceLevelTotalCount) + 1;
    if (level.practice) {
      levelNumber = (i - practiceLevelTotalCount) + String.fromCharCode('a'.charCodeAt(0) + practiceLevelCurrentCount);
      practiceLevelTotalCount++;
      practiceLevelCurrentCount++;
    } else if (level.assessment) {
      practiceLevelTotalCount++;
      practiceLevelCurrentCount++;
      levelNumber = level.assessment === 'cumulative' ? $.t('play_level.combo_challenge') : $.t('play_level.concept_challenge');
    } else {
      practiceLevelCurrentCount = 0;
    }
    levelNumberMap[level.key] = levelNumber;
  }
  return levelNumberMap;
};

const findNextLevel = function(levels, currentIndex, needsPractice) {
  // Find next available incomplete level, depending on whether practice is needed
  // levels = [{practice: true/false, complete: true/false, assessment: true/false}]
  // Skip over assessment levels
  let index = currentIndex;
  index++;
  if (needsPractice) {
    if (levels[currentIndex].practice || ((index < levels.length) && levels[index].practice)) {
      // Needs practice, current level is practice or next is practice; return the next incomplete practice-or-normal level
      // May leave earlier practice levels incomplete and reach end of course
      while ((index < levels.length) && (levels[index].complete || levels[index].assessment)) { index++; }
    } else {
      // Needs practice, current level is required, next level is required or assessment; return the first incomplete level of previous practice chain
      index--;
      while ((index >= 0) && !levels[index].practice) { index--; }
      if (index >= 0) {
        while ((index >= 0) && levels[index].practice) { index--; }
        if (index >= 0) {
          index++;
          while ((index < levels.length) && levels[index].practice && levels[index].complete) { index++; }
          if (levels[index].practice && !levels[index].complete) {
            return index;
          }
        }
      }
      // Last set of practice levels is complete; return the next incomplete normal level instead.
      index = currentIndex + 1;
      while ((index < levels.length) && (levels[index].complete || levels[index].assessment)) { index++; }
    }
  } else {
    // No practice needed; return the next required incomplete level
    while ((index < levels.length) && (levels[index].practice || levels[index].complete || levels[index].assessment)) { index++; }
  }
  return index;
};

const findNextAssessmentForLevel = function(levels, currentIndex, needsPractice) {
  // Find assessment level immediately after current level (and its practice levels)
  // Only return assessment if it's the next level
  // Skip over practice levels unless practice neeeded
  // levels = [{practice: true/false, complete: true/false, assessment: true/false}]
  // eg: l*,p,p,a*,a',l,...
  // given index l*, return index a*
  // given index a*, return index a'
  let index = currentIndex;
  index++;
  while (index < levels.length) {
    if (levels[index].practice) {
      if (needsPractice && !levels[index].complete) { return -1; }
      index++; // It's a practice level but do not need practice, keep looking
    } else if (levels[index].assessment) {
      if (levels[index].complete) { return -1; }
      return index;
    } else if (levels[index].complete) { // It's completed, keep looking
      index++;
    } else { // we got to a normal level; we didn't find an assessment for the given level.
      return -1;
    }
  }
  return -1; // we got to the end of the list and found nothing
};

const needsPractice = function(playtime, threshold) {
  if (playtime == null) { playtime = 0; }
  if (threshold == null) { threshold = 5; }
  return (playtime / 60) > threshold;
};

const sortCourses = courses => _.sortBy(courses, function(course) {
  // ._id can be from classroom.courses, otherwise it's probably .id
  let index = orderedCourseIDs.indexOf(course.id != null ? course.id : course._id);
  if (index === -1) { index = 9001; }
  return index;
});

const sortCoursesByAcronyms = function(courses) {
  const orderedCourseAcronyms = _.sortBy(courseAcronyms);
  return _.sortBy(courses, function(course) {
    // ._id can be from classroom.courses, otherwise it's probably .id
    let index = orderedCourseAcronyms.indexOf(courseAcronyms[course.id != null ? course.id : course._id]);
    if (index === -1) { index = 9001; }
    return index;
  });
};

const usStateCodes =
  // https://github.com/mdzhang/us-state-codes
  // generated by js2coffee 2.2.0
  (function() {
    const stateNamesByCode = {
      'AL': 'Alabama',
      'AK': 'Alaska',
      'AZ': 'Arizona',
      'AR': 'Arkansas',
      'CA': 'California',
      'CO': 'Colorado',
      'CT': 'Connecticut',
      'DE': 'Delaware',
      'DC': 'District of Columbia',
      'FL': 'Florida',
      'GA': 'Georgia',
      'HI': 'Hawaii',
      'ID': 'Idaho',
      'IL': 'Illinois',
      'IN': 'Indiana',
      'IA': 'Iowa',
      'KS': 'Kansas',
      'KY': 'Kentucky',
      'LA': 'Louisiana',
      'ME': 'Maine',
      'MD': 'Maryland',
      'MA': 'Massachusetts',
      'MI': 'Michigan',
      'MN': 'Minnesota',
      'MS': 'Mississippi',
      'MO': 'Missouri',
      'MT': 'Montana',
      'NE': 'Nebraska',
      'NV': 'Nevada',
      'NH': 'New Hampshire',
      'NJ': 'New Jersey',
      'NM': 'New Mexico',
      'NY': 'New York',
      'NC': 'North Carolina',
      'ND': 'North Dakota',
      'OH': 'Ohio',
      'OK': 'Oklahoma',
      'OR': 'Oregon',
      'PA': 'Pennsylvania',
      'RI': 'Rhode Island',
      'SC': 'South Carolina',
      'SD': 'South Dakota',
      'TN': 'Tennessee',
      'TX': 'Texas',
      'UT': 'Utah',
      'VT': 'Vermont',
      'VA': 'Virginia',
      'WA': 'Washington',
      'WV': 'West Virginia',
      'WI': 'Wisconsin',
      'WY': 'Wyoming'
    };
    const stateCodesByName = _.invert(stateNamesByCode);
    // normalizes case and removes invalid characters
    // returns null if can't find sanitized code in the state map

    const sanitizeStateCode = function(code) {
      code = _.isString(code) ? code.trim().toUpperCase().replace(/[^A-Z]/g, '') : null;
      if (stateNamesByCode[code]) { return code; } else { return null; }
    };

    // returns a valid state name else null

    const getStateNameByStateCode = code => stateNamesByCode[sanitizeStateCode(code)] || null;

    // normalizes case and removes invalid characters
    // returns null if can't find sanitized name in the state map

    const sanitizeStateName = function(name) {
      if (!_.isString(name)) {
        return null;
      }
      // bad whitespace remains bad whitespace e.g. "O  hi o" is not valid
      name = name.trim().toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ');
      let tokens = name.split(/\s+/);
      tokens = _.map(tokens, token => token.charAt(0).toUpperCase() + token.slice(1));
      // account for District of Columbia
      if (tokens.length > 2) {
        tokens[1] = tokens[1].toLowerCase();
      }
      name = tokens.join(' ');
      if (stateCodesByName[name]) { return name; } else { return null; }
    };

    // returns a valid state code else null

    const getStateCodeByStateName = name => stateCodesByName[sanitizeStateName(name)] || null;

    return {
      sanitizeStateCode,
      getStateNameByStateCode,
      sanitizeStateName,
      getStateCodeByStateName
    };
  })();

const emailRegex = /[A-z0-9._%+-]+@[A-z0-9.-]+\.[A-z]{2,63}/;
const isValidEmail = email => emailRegex.test(email != null ? email.trim().toLowerCase() : undefined);

const formatStudentLicenseStatusDate = function(status, date) {
    const string = (() => { switch (status) {
      case 'not-enrolled': return $.i18n.t('teacher.status_not_enrolled');
      case 'enrolled': if (date) { return $.i18n.t('teacher.status_enrolled'); } else { return '-'; }
      case 'expired': return $.i18n.t('teacher.status_expired');
    } })();
    return string.replace('{{date}}', date || 'Never');
  };

const getApiClientIdFromEmail = function(email) {
  if (/@codeninjas.com$/i.test(email)) { // hard coded for code ninjas since a lot of their users do not have clientCreator set
    const clientID = '57fff652b0783842003fed00';
    return clientID;
  }
};

// hard-coded 3 CS1 levels with concept video details
// TODO: move them to database if more such levels
const videoLevels = {
  // gems in the deep
  "54173c90844506ae0195a0b4": {
    i18name: 'basic_syntax',
    url: "https://player.vimeo.com/video/310626758",
    cn_url: "https://assets.koudashijie.com/videos/%E5%AF%BC%E8%AF%BE01-%E5%9F%BA%E6%9C%AC%E8%AF%AD%E6%B3%95-Codecombat%20Instruction%20for%20Teachers.mp4",
    title: "Basic Syntax",
    original: "54173c90844506ae0195a0b4",
    thumbnail_locked: "/images/level/videos/basic_syntax_locked.png",
    thumbnail_unlocked: "/images/level/videos/basic_syntax_unlocked.png"
  },
  // fire dancing
  "55ca293b9bc1892c835b0136": {
    i18name: 'while_loops',
    url: "https://player.vimeo.com/video/310626741",
    cn_url: "https://assets.koudashijie.com/videos/%E5%AF%BC%E8%AF%BE03-CodeCombat%E6%95%99%E5%AD%A6%E5%AF%BC%E8%AF%BE-CS1-%E5%BE%AA%E7%8E%AFlogo.mp4",
    title: "While Loops",
    original: "55ca293b9bc1892c835b0136",
    thumbnail_locked: "/images/level/videos/while_loops_locked.png",
    thumbnail_unlocked: "/images/level/videos/while_loops_unlocked.png"
  },
  // known enemy
  "5452adea57e83800009730ee": {
    i18name: 'variables',
    url: "https://player.vimeo.com/video/310626807",
    cn_url: "https://assets.koudashijie.com/videos/%E5%AF%BC%E8%AF%BE02-%E5%8F%98%E9%87%8F-CodeCombat-CS1-%E5%8F%98%E9%87%8Flogo.mp4",
    title: "Variables",
    original: "5452adea57e83800009730ee",
    thumbnail_locked: "/images/level/videos/variables_locked.png",
    thumbnail_unlocked: "/images/level/videos/variables_unlocked.png"
  }
};

module.exports = {
  ageOfConsent,
  capitalLanguages,
  clone,
  combineAncestralObject,
  countries,
  courseAcronyms,
  courseIDs,
  createLevelNumberMap,
  extractPlayerCodeTag,
  filterMarkdownCodeLanguages,
  findNextLevel,
  findNextAssessmentForLevel,
  formatDollarValue,
  formatStudentLicenseStatusDate,
  functionCreators,
  getApiClientIdFromEmail,
  getByPath,
  getCourseBundlePrice,
  getCoursePraise,
  getDocumentSearchString,
  getPrepaidCodeAmount,
  getQueryVariable,
  getQueryVariables,
  getSponsoredSubsAmount,
  getUTCDay,
  grayscale,
  hexToHSL,
  hslToHex,
  i18n,
  injectCSS,
  inEU,
  isID,
  isIE,
  isRegionalSubscription,
  isSmokeTestEmail,
  keepDoingUntil,
  kindaEqual,
  needsPractice,
  normalizeFunc,
  objectIdToDate,
  orderedCourseIDs,
  pathToUrl,
  replaceText,
  round,
  sortCourses,
  sortCoursesByAcronyms,
  stripIndentation,
  usStateCodes,
  userAgent,
  petThangIDs,
  premiumContent,
  isValidEmail,
  videoLevels,
  ozariaCourseIDs,
  addressesIncludeAdministrativeRegion,
  translatejs2cpp
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}