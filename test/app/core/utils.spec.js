/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('Utility library', function() {
  const utils = require('../../../app/core/utils');

  describe('translatejs2cpp(jsCode, fullCode)', function() {
    describe('do not add void main if fullCode set false', function() {
      it('if there is no patten need translate', () => expect(utils.translatejs2cpp('hero.moveRight()', false)).toBe('hero.moveRight()'));
      it('if there is var x or var y', () => expect(utils.translatejs2cpp('var x = 2;\nvar y = 3', false)).toBe('float x = 2;\nfloat y = 3'));
      it('if there is ===/!==/and/or/not', () => expect(utils.translatejs2cpp('a === 2 and b !== 1 or (not c)', false)).toBe('a == 2 && b != 1 || (!c)'));
      it('if there is other var', () => expect(utils.translatejs2cpp('var enemy = hero...', false)).toBe('auto enemy = hero...'));
      it('if there is a function definition', () => expect(utils.translatejs2cpp('function a() {}\n', false)).toBe('auto a() {}\n'));
      return it('if ther is a comment in if..else..', () => expect(utils.translatejs2cpp('if(a){\n}\n//test\nelse{\n}', false)).toBe('if(a){\n}\nelse{\n//test\n}'));
    });

    describe('add void main if fullCode set true', function() {
      it('if there is no patten need translate', () => expect(utils.translatejs2cpp('hero.moveRight();')).toBe('void main() {\n    hero.moveRight();\n}'));
      it('if there is var x or var y', () => expect(utils.translatejs2cpp('var x = 2;\nvar y = 3;')).toBe('void main() {\n    float x = 2;\n    float y = 3;\n}'));
      it('if there is ===/!==/and/or/not', () => expect(utils.translatejs2cpp('a === 2 and b !== 1 or (not c)')).toBe('void main() {\n    a == 2 && b != 1 || (!c)\n}'));
      it('if there is other var', () => expect(utils.translatejs2cpp('var enemy = hero...')).toBe('void main() {\n    auto enemy = hero...\n}'));
      it('if there is a function definition', () => expect(utils.translatejs2cpp('function a() {}\n')).toBe('auto a() {}\nvoid main() {\n    \n}'));
      it('if there is a function definition with parameter', () => expect(utils.translatejs2cpp('function a(b) {}\n')).toBe('auto a(auto b) {}\nvoid main() {\n    \n}'));
      return it('if there is a function definition with parameters', () => expect(utils.translatejs2cpp('function a(b, c) {}\na();')).toBe('auto a(auto b, auto c) {}\nvoid main() {\n    a();\n}'));
    });

    return describe('if there are start comments', function() {
      it('if there is no code', () => expect(utils.translatejs2cpp('//abc\n//def\n')).toBe('//abc\n//def\nvoid main() {\n    \n}'));
      it('if there is code without function definition', () => expect(utils.translatejs2cpp('//abc\nhero.moveRight()')).toBe('//abc\nvoid main() {\n    hero.moveRight()\n}'));
      return it('if there is code with function definition', () => expect(utils.translatejs2cpp('//abc\nfunction a(b, c) {}\nhero.moveRight()')).toBe('//abc\nauto a(auto b, auto c) {}\nvoid main() {\n    hero.moveRight()\n}'));
    });
  });

  describe('getQueryVariable(param, defaultValue)', function() {
    beforeEach(() => spyOn(utils, 'getDocumentSearchString').and.returnValue(
      '?key=value&bool1=false&bool2=true&email=test%40email.com'
    ));

    it('returns the query parameter', () => expect(utils.getQueryVariable('key')).toBe('value'));

    it('returns Boolean types if the value is "true" or "false"', function() {
      expect(utils.getQueryVariable('bool1')).toBe(false);
      return expect(utils.getQueryVariable('bool2')).toBe(true);
    });

    it('decodes encoded strings', () => expect(utils.getQueryVariable('email')).toBe('test@email.com'));

    return it('returns the given default value if the key is not present', function() {
      expect(utils.getQueryVariable('key', 'other-value')).toBe('value');
      return expect(utils.getQueryVariable('NaN', 'other-value')).toBe('other-value');
    });
  });

  describe('i18n', function() {
    beforeEach(function() {
      return this.fixture1 = {
        'text': 'G\'day, Wizard! Come to practice? Well, let\'s get started...',
        'blurb': 'G\'day',
        'i18n': {
          'es-419': {
            'text': '¡Buenas, Hechicero! ¿Vienes a practicar? Bueno, empecemos...'
          },
          'es-ES': {
            'text': '¡Buenas Mago! ¿Vienes a practicar? Bien, empecemos...'
          },
          'es': {
            'text': '¡Buenas Mago! ¿Vienes a practicar? Muy bien, empecemos...'
          },
          'fr': {
            'text': 'S\'lut, Magicien! Venu pratiquer? Ok, bien débutons...'
          },
          'pt-BR': {
            'text': 'Bom dia, feiticeiro! Veio praticar? Então vamos começar...'
          },
          'en': {
            'text': 'Ohai Magician!'
          },
          'de': {
            'text': '\'N Tach auch, Zauberer! Kommst Du zum Üben? Dann lass uns anfangen...'
          },
          'sv': {
            'text': 'Godagens, trollkarl! Kommit för att öva? Nå, låt oss börja...'
          }
        }
      };
    });

    it('i18n should find a valid target string', function() {
      expect(utils.i18n(this.fixture1, 'text', 'sv')).toEqual(this.fixture1.i18n['sv'].text);
      return expect(utils.i18n(this.fixture1, 'text', 'es-ES')).toEqual(this.fixture1.i18n['es-ES'].text);
    });

    it('i18n picks the correct fallback for a specific language', function() {
      return expect(utils.i18n(this.fixture1, 'text', 'fr-be')).toEqual(this.fixture1.i18n['fr'].text);
    });

    it('i18n picks the correct fallback', function() {
      expect(utils.i18n(this.fixture1, 'text', 'nl')).toEqual(this.fixture1.i18n['en'].text);
      return expect(utils.i18n(this.fixture1, 'text', 'nl', 'de')).toEqual(this.fixture1.i18n['de'].text);
    });

    it('i18n falls back to the default text, even for other targets (like blurb)', function() {
      delete this.fixture1.i18n['en'];
      expect(utils.i18n(this.fixture1, 'text', 'en')).toEqual(this.fixture1.text);
      expect(utils.i18n(this.fixture1, 'blurb', 'en')).toEqual(this.fixture1.blurb);
      delete this.fixture1.blurb;
      return expect(utils.i18n(this.fixture1, 'blurb', 'en')).toEqual(null);
    });

    return it('i18n can fall forward if a general language is not found', function() {
      return expect(utils.i18n(this.fixture1, 'text', 'pt')).toEqual(this.fixture1.i18n['pt-BR'].text);
    });
  });

  describe('inEU', function() {
    it('EU countries return true', function() {
      const euCountries = ['Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'United Kingdom'];
      try {
        return euCountries.forEach(c => expect(utils.inEU(c)).toEqual(true));
      } catch (err) {
        // NOTE: without try/catch, exceptions do not yield failed tests.
        // E.g. utils.inEU used to call Array.find which isn't supported in IE11, try/catch required to register test fail
        return expect(err).not.toBeDefined();
      }
    });
    return it('non-EU countries return false', function() {
      const nonEuCountries = ['united-states', 'peru', 'vietnam'];
      try {
        return nonEuCountries.forEach(c => expect(utils.inEU(c)).toEqual(false));
      } catch (err) {
        return expect(err).not.toBeDefined();
      }
    });
  });

  describe('ageOfConsent', function() {
    it('US is 13', () => expect(utils.ageOfConsent('united-states')).toEqual(13));
    it('Latvia is 13', () => expect(utils.ageOfConsent('latvia')).toEqual(13));
    it('Austria is 14', () => expect(utils.ageOfConsent('austria')).toEqual(14));
    it('Greece is 15', () => expect(utils.ageOfConsent('greece')).toEqual(15));
    it('Slovakia is 16', () => expect(utils.ageOfConsent('slovakia')).toEqual(16));
    it('default for EU countries 16', () => expect(utils.ageOfConsent('israel')).toEqual(16));
    it('default for other countries is 0', () => expect(utils.ageOfConsent('hong-kong')).toEqual(0));
    it('default for unknown countries is 0', () => expect(utils.ageOfConsent('codecombat')).toEqual(0));
    it('default for undefined countries is 0', () => expect(utils.ageOfConsent(undefined)).toEqual(0));
    return it('defaultIfUnknown works', () => expect(utils.ageOfConsent(undefined, 13)).toEqual(13));
  });

  describe('createLevelNumberMap', function() {
    // r=required p=practice
    it('returns correct map for r', function() {
      const levels = [
        {key: 1, practice: false}
      ];
      const levelNumberMap = utils.createLevelNumberMap(levels);
      return expect(((() => {
        const result = [];
        for (let key in levelNumberMap) {
          const val = levelNumberMap[key];
          result.push(val.toString());
        }
        return result;
      })())).toEqual(['1']);
    });
    it('returns correct map for r r', function() {
      const levels = [
        {key: 1, practice: false},
        {key: 2, practice: false}
      ];
      const levelNumberMap = utils.createLevelNumberMap(levels);
      return expect(((() => {
        const result = [];
        for (let key in levelNumberMap) {
          const val = levelNumberMap[key];
          result.push(val.toString());
        }
        return result;
      })())).toEqual(['1', '2']);
    });
    it('returns correct map for p', function() {
      const levels = [
        {key: 1, practice: true}
      ];
      const levelNumberMap = utils.createLevelNumberMap(levels);
      return expect(((() => {
        const result = [];
        for (let key in levelNumberMap) {
          const val = levelNumberMap[key];
          result.push(val.toString());
        }
        return result;
      })())).toEqual(['0a']);
    });
    it('returns correct map for r p r', function() {
      const levels = [
        {key: 1, practice: false},
        {key: 2, practice: true},
        {key: 3, practice: false}
      ];
      const levelNumberMap = utils.createLevelNumberMap(levels);
      return expect(((() => {
        const result = [];
        for (let key in levelNumberMap) {
          const val = levelNumberMap[key];
          result.push(val.toString());
        }
        return result;
      })())).toEqual(['1', '1a', '2']);
    });
    it('returns correct map for r p p p', function() {
      const levels = [
        {key: 1, practice: false},
        {key: 2, practice: true},
        {key: 3, practice: true},
        {key: 4, practice: true}
      ];
      const levelNumberMap = utils.createLevelNumberMap(levels);
      return expect(((() => {
        const result = [];
        for (let key in levelNumberMap) {
          const val = levelNumberMap[key];
          result.push(val.toString());
        }
        return result;
      })())).toEqual(['1', '1a', '1b', '1c']);
    });
    return it('returns correct map for r p p p r p p r r p r', function() {
      const levels = [
        {key: 1, practice: false},
        {key: 2, practice: true},
        {key: 3, practice: true},
        {key: 4, practice: true},
        {key: 5, practice: false},
        {key: 6, practice: true},
        {key: 7, practice: true},
        {key: 8, practice: false},
        {key: 9, practice: false},
        {key: 10, practice: true},
        {key: 11, practice: false}
      ];
      const levelNumberMap = utils.createLevelNumberMap(levels);
      return expect(((() => {
        const result = [];
        for (let key in levelNumberMap) {
          const val = levelNumberMap[key];
          result.push(val.toString());
        }
        return result;
      })())).toEqual(['1', '1a', '1b', '1c', '2', '2a', '2b', '3', '4', '4a', '5']);
    });
  });

  return describe('findNextLevel and findNextAssessmentForLevel', function() {
    // r=required p=practice c=complete *=current a=assessment
    // utils.findNextLevel returns next level 0-based index
    // utils.findNextAssessmentForLevel returns next level 0-based index

    // Find next available incomplete level, depending on whether practice is needed
    // Find assessment level immediately after current level (and its practice levels)
    // Only return assessment if it's the next level
    // Skip over practice levels unless practice neeeded
    // levels = [{practice: true/false, complete: true/false, assessment: true/false}]

    describe('when no practice needed', function() {
      const needsPractice = false;
      it('returns correct next levels when rc* p', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: true, complete: false}
        ];
        expect(utils.findNextLevel(levels, 0, needsPractice)).toEqual(2);
        return expect(utils.findNextAssessmentForLevel(levels, 0, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when pc* p r', function() {
        const levels = [
          {practice: true, complete: true},
          {practice: true, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 0, needsPractice)).toEqual(2);
        return expect(utils.findNextAssessmentForLevel(levels, 0, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when pc* p p', function() {
        const levels = [
          {practice: true, complete: true},
          {practice: true, complete: false},
          {practice: true, complete: false}
        ];
        expect(utils.findNextLevel(levels, 0, needsPractice)).toEqual(3);
        return expect(utils.findNextAssessmentForLevel(levels, 0, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc* p rc', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: true, complete: false},
          {practice: false, complete: true}
        ];
        expect(utils.findNextLevel(levels, 0, needsPractice)).toEqual(3);
        return expect(utils.findNextAssessmentForLevel(levels, 0, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc rc rc* a r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: false, complete: false, assessment: true},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 2, needsPractice)).toEqual(4);
        return expect(utils.findNextAssessmentForLevel(levels, 2, needsPractice)).toEqual(3);
      });
      it('returns correct next levels when rc* r p p p a r p p p a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 0, needsPractice)).toEqual(1);
        return expect(utils.findNextAssessmentForLevel(levels, 0, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc rc* p p p a r p p p a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 1, needsPractice)).toEqual(6);
        return expect(utils.findNextAssessmentForLevel(levels, 1, needsPractice)).toEqual(5);
      });
      it('returns correct next levels when rc rc pc* p p a r p p p a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 2, needsPractice)).toEqual(6);
        return expect(utils.findNextAssessmentForLevel(levels, 2, needsPractice)).toEqual(5);
      });
      it('returns correct next levels when rc rc pc pc pc* a r p p p a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 4, needsPractice)).toEqual(6);
        return expect(utils.findNextAssessmentForLevel(levels, 4, needsPractice)).toEqual(5);
      });
      it('returns correct next levels when rc rc pc pc pc ac* r p p p a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {assessment: true, complete: true},
          {practice: false, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 5, needsPractice)).toEqual(6);
        return expect(utils.findNextAssessmentForLevel(levels, 5, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc rc pc pc pc ac rc* p p p a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {assessment: true, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 6, needsPractice)).toEqual(11);
        return expect(utils.findNextAssessmentForLevel(levels, 6, needsPractice)).toEqual(10);
      });
      it('returns correct next levels when rc rc* p p p a rc p p p a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: true},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 2, needsPractice)).toEqual(11);
        return expect(utils.findNextAssessmentForLevel(levels, 2, needsPractice)).toEqual(5);
      });
      it('returns correct next levels when rc rc pc pc pc* a rc p p p a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {assessment: true, complete: false},
          {practice: false, complete: true},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 4, needsPractice)).toEqual(11);
        return expect(utils.findNextAssessmentForLevel(levels, 4, needsPractice)).toEqual(5);
      });
      it('returns correct next levels when rc rc* p p p ac rc p p p a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 2, needsPractice)).toEqual(11);
        return expect(utils.findNextAssessmentForLevel(levels, 2, needsPractice)).toEqual(-1);
      });
      return it('returns correct next levels when rc rc pc pc pc* a rc p p p a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {assessment: true, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 4, needsPractice)).toEqual(11);
        return expect(utils.findNextAssessmentForLevel(levels, 4, needsPractice)).toEqual(-1);
      });
    });

    return describe('when needs practice', function() {
      const needsPractice = true;
      it('returns correct next levels when rc* p', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: true, complete: false}
        ];
        expect(utils.findNextLevel(levels, 0, needsPractice)).toEqual(1);
        return expect(utils.findNextAssessmentForLevel(levels, 0, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc* rc', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true}
        ];
        expect(utils.findNextLevel(levels, 0, needsPractice)).toEqual(2);
        return expect(utils.findNextAssessmentForLevel(levels, 0, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc p rc*', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: true, complete: false},
          {practice: false, complete: true}
        ];
        expect(utils.findNextLevel(levels, 2, needsPractice)).toEqual(1);
        return expect(utils.findNextAssessmentForLevel(levels, 2, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc pc p rc*', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: false},
          {practice: false, complete: true}
        ];
        expect(utils.findNextLevel(levels, 3, needsPractice)).toEqual(2);
        return expect(utils.findNextAssessmentForLevel(levels, 3, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc rc rc* a r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: false, complete: false, assessment: true},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 2, needsPractice)).toEqual(4);
        return expect(utils.findNextAssessmentForLevel(levels, 2, needsPractice)).toEqual(3);
      });
      it('returns correct next levels when rc pc p rc* p', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: false},
          {practice: false, complete: true},
          {practice: true, complete: false}
        ];
        expect(utils.findNextLevel(levels, 3, needsPractice)).toEqual(4);
        return expect(utils.findNextAssessmentForLevel(levels, 3, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc pc p rc* pc', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: false},
          {practice: false, complete: true},
          {practice: true, complete: true}
        ];
        expect(utils.findNextLevel(levels, 3, needsPractice)).toEqual(5);
        return expect(utils.findNextAssessmentForLevel(levels, 3, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc pc p rc* pc p', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: false},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: false}
        ];
        expect(utils.findNextLevel(levels, 3, needsPractice)).toEqual(5);
        return expect(utils.findNextAssessmentForLevel(levels, 3, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc pc p rc* pc r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: false},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 3, needsPractice)).toEqual(5);
        return expect(utils.findNextAssessmentForLevel(levels, 3)).toEqual(-1);
      });
      it('returns correct next levels when rc pc p rc* pc p r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: false},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 3, needsPractice)).toEqual(5);
        return expect(utils.findNextAssessmentForLevel(levels, 3)).toEqual(-1);
      });
      it('returns correct next levels when rc pc pc rc* r p', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {practice: false, complete: true},
          {practice: false, complete: false},
          {practice: true, complete: false}
        ];
        expect(utils.findNextLevel(levels, 3, needsPractice)).toEqual(4);
        return expect(utils.findNextAssessmentForLevel(levels, 3, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc* pc rc', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: false, complete: true}
        ];
        expect(utils.findNextLevel(levels, 0, needsPractice)).toEqual(3);
        return expect(utils.findNextAssessmentForLevel(levels, 0, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc pc p rc* r p', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: false},
          {practice: false, complete: true},
          {practice: false, complete: false},
          {practice: true, complete: false}
        ];
        expect(utils.findNextLevel(levels, 3, needsPractice)).toEqual(2);
        return expect(utils.findNextAssessmentForLevel(levels, 3, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc pc p a rc* r p', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: false},
          {practice: false, complete: false, assessment: true},
          {practice: false, complete: true},
          {practice: false, complete: false},
          {practice: true, complete: false}
        ];
        expect(utils.findNextLevel(levels, 4, needsPractice)).toEqual(2);
        return expect(utils.findNextAssessmentForLevel(levels, 4, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc pc p a rc* pc p r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 4, needsPractice)).toEqual(6);
        return expect(utils.findNextAssessmentForLevel(levels, 4, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc rc* p p p a r p p p a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 1, needsPractice)).toEqual(2);
        return expect(utils.findNextAssessmentForLevel(levels, 1, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc rc pc* p p a r p p p a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 2, needsPractice)).toEqual(3);
        return expect(utils.findNextAssessmentForLevel(levels, 2, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc rc pc pc pc* a r p p p a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 4, needsPractice)).toEqual(6);
        return expect(utils.findNextAssessmentForLevel(levels, 4, needsPractice)).toEqual(5);
      });
      it('returns correct next levels when rc rc pc pc pc ac* r p p p a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {assessment: true, complete: true},
          {practice: false, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 5, needsPractice)).toEqual(6);
        return expect(utils.findNextAssessmentForLevel(levels, 5, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc rc pc pc pc ac rc* p p p a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {assessment: true, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 6, needsPractice)).toEqual(7);
        return expect(utils.findNextAssessmentForLevel(levels, 6, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc rc pc pc pc* ac rc p p p a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {assessment: true, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 4, needsPractice)).toEqual(7);
        return expect(utils.findNextAssessmentForLevel(levels, 4, needsPractice)).toEqual(-1);
      });
      it('returns correct next levels when rc rc pc pc pc* a rc p p p a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {assessment: true, complete: false},
          {practice: false, complete: true},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 4, needsPractice)).toEqual(7);
        return expect(utils.findNextAssessmentForLevel(levels, 4, needsPractice)).toEqual(5);
      });
      it('returns correct next levels when rc rc pc pc pc* ac rc pc pc pc a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {assessment: true, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 4, needsPractice)).toEqual(11);
        return expect(utils.findNextAssessmentForLevel(levels, 4, needsPractice)).toEqual(-1);
      });
      return it('returns correct next levels when rc rc pc pc pc ac* r p p p a r r', function() {
        const levels = [
          {practice: false, complete: true},
          {practice: false, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {practice: true, complete: true},
          {assessment: true, complete: true},
          {practice: false, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {practice: true, complete: false},
          {assessment: true, complete: false},
          {practice: false, complete: false},
          {practice: false, complete: false}
        ];
        expect(utils.findNextLevel(levels, 5, needsPractice)).toEqual(6);
        return expect(utils.findNextAssessmentForLevel(levels, 5, needsPractice)).toEqual(-1);
      });
    });
  });
});
