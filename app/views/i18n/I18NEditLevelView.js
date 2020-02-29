/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let I18NEditLevelView;
const I18NEditModelView = require('./I18NEditModelView');
const Level = require('models/Level');
const LevelComponent = require('models/LevelComponent');

module.exports = (I18NEditLevelView = (function() {
  I18NEditLevelView = class I18NEditLevelView extends I18NEditModelView {
    static initClass() {
      this.prototype.id = 'i18n-edit-level-view';
      this.prototype.modelClass = Level;
    }

    buildTranslationList() {
      let component, componentIndex, context, hint, i18n, index, key, left, left1, left2, left3, left4, left5, name, path, thang, thangIndex, value;
      const lang = this.selectedLanguage;

      // name, description
      if (i18n = this.model.get('i18n')) {
        let description, loadingTip, studentPlayInstructions;
        if (name = this.model.get('name')) {
          this.wrapRow('Level name', ['name'], name, i18n[lang] != null ? i18n[lang].name : undefined, []);
        }
        if (description = this.model.get('description')) {
          this.wrapRow('Level description', ['description'], description, i18n[lang] != null ? i18n[lang].description : undefined, []);
        }
        if (loadingTip = this.model.get('loadingTip')) {
          this.wrapRow('Loading tip', ['loadingTip'], loadingTip, i18n[lang] != null ? i18n[lang].loadingTip : undefined, []);
        }
        if (studentPlayInstructions = this.model.get('studentPlayInstructions')) {
          this.wrapRow('Student Play Instructions', ['studentPlayInstructions'], studentPlayInstructions, i18n[lang] != null ? i18n[lang].studentPlayInstructions : undefined, []);
        }
      }

      // goals
      const iterable = (left = this.model.get('goals')) != null ? left : [];
      for (index = 0; index < iterable.length; index++) {
        const goal = iterable[index];
        if (i18n = goal.i18n) {
          this.wrapRow('Goal name', ['name'], goal.name, i18n[lang] != null ? i18n[lang].name : undefined, ['goals', index]);
        }
      }

      // documentation
      const iterable1 = (left1 = __guard__(this.model.get('documentation'), x => x.specificArticles)) != null ? left1 : [];
      for (index = 0; index < iterable1.length; index++) {
        const doc = iterable1[index];
        if (i18n = doc.i18n) {
          this.wrapRow('Guide article name', ['name'], doc.name, i18n[lang] != null ? i18n[lang].name : undefined, ['documentation', 'specificArticles', index]);
          this.wrapRow(`'${doc.name}' body`, ['body'], doc.body, i18n[lang] != null ? i18n[lang].body : undefined, ['documentation', 'specificArticles', index], 'markdown');
        }
      }

      // hints
      const iterable2 = (left2 = __guard__(this.model.get('documentation'), x1 => x1.hints)) != null ? left2 : [];
      for (index = 0; index < iterable2.length; index++) {
        hint = iterable2[index];
        if (i18n = hint.i18n) {
          name = `Hint ${index+1}`;
          this.wrapRow(`'${name}' body`, ['body'], hint.body, i18n[lang] != null ? i18n[lang].body : undefined, ['documentation', 'hints', index], 'markdown');
        }
      }
      const iterable3 = (left3 = __guard__(this.model.get('documentation'), x2 => x2.hintsB)) != null ? left3 : [];
      for (index = 0; index < iterable3.length; index++) {
        hint = iterable3[index];
        if (i18n = hint.i18n) {
          name = `Hint ${index+1}`;
          this.wrapRow(`'${name}' body`, ['body'], hint.body, i18n[lang] != null ? i18n[lang].body : undefined, ['documentation', 'hints', index], 'markdown');
        }
      }

      // sprite dialogues
      const iterable4 = (left4 = this.model.get('scripts')) != null ? left4 : [];
      for (let scriptIndex = 0; scriptIndex < iterable4.length; scriptIndex++) {
        const script = iterable4[scriptIndex];
        const iterable5 = script.noteChain != null ? script.noteChain : [];
        for (let noteGroupIndex = 0; noteGroupIndex < iterable5.length; noteGroupIndex++) {
          const noteGroup = iterable5[noteGroupIndex];
          if (!noteGroup) { continue; }
          const iterable6 = noteGroup.sprites != null ? noteGroup.sprites : [];
          for (let spriteCommandIndex = 0; spriteCommandIndex < iterable6.length; spriteCommandIndex++) {
            const spriteCommand = iterable6[spriteCommandIndex];
            const pathPrefix = ['scripts', scriptIndex, 'noteChain', noteGroupIndex, 'sprites', spriteCommandIndex, 'say'];

            if (i18n = spriteCommand.say != null ? spriteCommand.say.i18n : undefined) {
              if (spriteCommand.say.text) {
                this.wrapRow('Sprite text', ['text'], spriteCommand.say.text, i18n[lang] != null ? i18n[lang].text : undefined, pathPrefix, 'markdown');
              }
              if (spriteCommand.say.blurb) {
                this.wrapRow('Sprite blurb', ['blurb'], spriteCommand.say.blurb, i18n[lang] != null ? i18n[lang].blurb : undefined, pathPrefix);
              }
            }

            const iterable7 = (spriteCommand.say != null ? spriteCommand.say.responses : undefined) != null ? (spriteCommand.say != null ? spriteCommand.say.responses : undefined) : [];
            for (let responseIndex = 0; responseIndex < iterable7.length; responseIndex++) {
              const response = iterable7[responseIndex];
              if (i18n = response.i18n) {
                this.wrapRow('Response button', ['text'], response.text, i18n[lang] != null ? i18n[lang].text : undefined, pathPrefix.concat(['responses', responseIndex]));
              }
            }
          }
        }
      }

      // victory modal
      if (i18n = __guard__(this.model.get('victory'), x3 => x3.i18n)) {
        this.wrapRow('Victory text', ['body'], this.model.get('victory').body, i18n[lang] != null ? i18n[lang].body : undefined, ['victory'], 'markdown');
      }

      // code comments
      const iterable8 = (left5 = this.model.get('thangs')) != null ? left5 : [];
      for (thangIndex = 0; thangIndex < iterable8.length; thangIndex++) {
        thang = iterable8[thangIndex];
        const iterable9 = thang.components != null ? thang.components : [];
        for (componentIndex = 0; componentIndex < iterable9.length; componentIndex++) {
          component = iterable9[componentIndex];
          if (component.original !== LevelComponent.ProgrammableID) { continue; }
          const object = (component.config != null ? component.config.programmableMethods : undefined) != null ? (component.config != null ? component.config.programmableMethods : undefined) : {};
          for (let methodName in object) {
            const method = object[methodName];
            if ((i18n = method.i18n) && (context = method.context)) {
              for (key in context) {
                value = context[key];
                path = ['thangs', thangIndex, 'components', componentIndex, 'config', 'programmableMethods', methodName];
                this.wrapRow('Code comment', ['context', key], value, __guard__(i18n[lang] != null ? i18n[lang].context : undefined, x4 => x4[key]), path);
              }
            }
          }
        }
      }

      // code comments
      return (() => {
        let left6;
        const result = [];
        const iterable10 = (left6 = this.model.get('thangs')) != null ? left6 : [];
        for (thangIndex = 0; thangIndex < iterable10.length; thangIndex++) {
          thang = iterable10[thangIndex];
          result.push((() => {
            const result1 = [];
            const iterable11 = thang.components != null ? thang.components : [];
            for (componentIndex = 0; componentIndex < iterable11.length; componentIndex++) {
              component = iterable11[componentIndex];
              if (component.original !== LevelComponent.RefereeID) { continue; }
              if ((i18n = component.config != null ? component.config.i18n : undefined) && (context = component.config.context)) {
                result1.push((() => {
                  const result2 = [];
                  for (key in context) {
                    value = context[key];
                    path = ['thangs', thangIndex, 'components', componentIndex, 'config'];
                    result2.push(this.wrapRow('Referee context string', ['context', key], value, __guard__(i18n[lang] != null ? i18n[lang].context : undefined, x5 => x5[key]), path));
                  }
                  return result2;
                })());
              } else {
                result1.push(undefined);
              }
            }
            return result1;
          })());
        }
        return result;
      })();
    }
  };
  I18NEditLevelView.initClass();
  return I18NEditLevelView;
})());

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}