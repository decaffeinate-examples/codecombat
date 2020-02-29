/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let childKey;
const fs = require('fs');
const path = require('path');
const en = require('../app/locale/en').translation;

const localeCodes = {
  parent: 'nl',
  childA: 'nl-NL',
  childB: 'nl-BE'
};

const localeSources = {};
for (let kind in localeCodes) {
  var encoding;
  const code = localeCodes[kind];
  localeSources[kind] = fs.readFileSync(path.join(__dirname, `../app/locale/${code}.coffee`), (encoding='utf8')).split('\n');
}

for (let index = 0; index < localeSources.parent.length; index++) {
  const parentLine = localeSources.parent[index];
  for (childKey of ['childA', 'childB', 'childC']) {
    var childLine;
    if (!(childLine = localeSources[childKey] != null ? localeSources[childKey][index] : undefined)) { continue; }
    if ((childLine === parentLine) && (childLine !== '')) {
      childLine = '#' + parentLine;
      localeSources[childKey][index] = childLine;
    }
  }
}

for (childKey of ['childA', 'childB', 'childC']) {
  var childCode;
  if (!(childCode = localeCodes[childKey])) { continue; }
  const childLines = localeSources[childKey];
  const newContents = childLines.join('\n');
  fs.writeFileSync(`app/locale/${childCode}.coffee`, newContents);
}
