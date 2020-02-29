/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let LevelCollection;
const CocoCollection = require('collections/CocoCollection');
const Level = require('models/Level');
const utils = require('core/utils');

module.exports = (LevelCollection = (function() {
  LevelCollection = class LevelCollection extends CocoCollection {
    static initClass() {
      this.prototype.url = '/db/level';
      this.prototype.model = Level;
    }

    fetchForClassroom(classroomID, options) {
      if (options == null) { options = {}; }
      options.url = `/db/classroom/${classroomID}/levels`;
      return this.fetch(options);
    }

    fetchForClassroomAndCourse(classroomID, courseID, options) {
      if (options == null) { options = {}; }
      options.url = `/db/classroom/${classroomID}/courses/${courseID}/levels`;
      return this.fetch(options);
    }

    fetchForCampaign(campaignSlug, options) {
      if (options == null) { options = {}; }
      options.url = `/db/campaign/${campaignSlug}/levels`;
      return this.fetch(options);
    }

    getSolutionsMap(languages) {
      return this.models.reduce((map, level) => {
        const targetLangs = level.get('primerLanguage') ? [level.get('primerLanguage')] : languages;
        const solutions = level.getSolutions().filter(s => Array.from(targetLangs).includes(s.language) || (Array.from(targetLangs).includes('cpp') && (s.language === 'javascript')));
        if (Array.from(targetLangs).includes('cpp')) {
          if (solutions != null) {
            solutions.forEach(s => {
            if (s.language !== 'javascript') { return; }
            s.language = 'cpp';
            return s.source = utils.translatejs2cpp(s.source);
          });
          }
        }
        if (Array.from(targetLangs).includes('html')) {
          if (solutions != null) {
            solutions.forEach(s => {
            if (s.language !== 'html') { return; }
            const strippedSource = utils.extractPlayerCodeTag(s.source || '');
            if (strippedSource) { return s.source = strippedSource; }
          });
          }
        }
        map[level.get('original')] = solutions != null ? solutions.map(s => ({source: this.fingerprint(s.source, s.language), description: s.description, capstoneStage: s.capstoneStage})) : undefined;
        return map;
      }
      , {});
    }

    fingerprint(code, language) {
      // Add a zero-width-space at the end of every comment line
      switch (language) {
        case ['javascript', 'java', 'cpp']: return code.replace(/^(\/\/.*)/gm, "$1​");
        case 'lua': return code.replace(/^(--.*)/gm, "$1​");
        case 'html': return code.replace(/^(<!--.*)-->/gm, "$1​-->");
        default: return code.replace(/^(#.*)/gm, "$1​");
      }
    }
  };
  LevelCollection.initClass();
  return LevelCollection;
})());
