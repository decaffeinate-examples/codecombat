/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const locale = require('../../../app/locale/locale');
const english = require('../../../app/locale/en');

const _ = require('lodash');
const langs = Object.keys(locale).concat('rot13').map(langKey => require(`../../../app/locale/${langKey}`));

describe('esper error messages', () => langs.forEach(language => {
  return describe(`when language is ${language.englishDescription}`, function() {
    const esper = language.translation.esper || {};
    const englishEsper = english.translation.esper;

    return Object.keys(language.translation.esper || {}).forEach(key => describe(`when key is ${key}`, function() {
      it('should have numbered placeholders $1 through $N', function() {
        const placeholders = (esper[key].match(/\$\d/g) || []).sort();
        const expectedPlaceholders = (Array.from(placeholders).map((val, index) => `$${index+1}`));
        if (!_.isEqual(placeholders, expectedPlaceholders)) {
          return fail(`\
Some placeholders were skipped: ${placeholders}
Translated string: ${esper[key]}\
`
          );
        }
      });

      return it('should have the same placeholders in each entry as in English', function() {
        if (!englishEsper[key]) {
          return fail(`Expected English to have a corresponding key for ${key}`);
        }
        const englishPlaceholders = (englishEsper[key].match(/\$\d/g) || []).sort();
        const placeholders = (esper[key].match(/\$\d/g) || []).sort();
        if (!_.isEqual(placeholders, englishPlaceholders)) {
          return fail(`\
Expected translated placeholders: [${placeholders}] (${esper[key]})
To match English placeholders: [${englishPlaceholders}] (${englishEsper[key]})\
`
          );
        }
      });
    }));
  });
}));

describe('Check keys', () => langs.forEach(language => {
  return describe(`when language is ${language.englishDescription}`, function() {
    const en = english.translation;
    return Object.keys(language.translation || {}).forEach(key => Object.keys(language.translation[key] || {}).forEach(keyChild => it('should have the same keys in each entry as in English', function() {
      if (en[key][keyChild] === undefined) {
        return fail(`\
Expected english to have translation '${key}.${keyChild}'
This can occur when:
* Parent key for '${keyChild}' is accidentally commented.
* English translation for '${key}.${keyChild}' has been deleted.\
`
        );
      }
    })));
  });
}));
