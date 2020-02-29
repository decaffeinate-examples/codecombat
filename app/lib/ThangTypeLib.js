/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const utils = require('core/utils');

const ThangTypeLib = {
  getPortraitURL(thangTypeObj) {
    let iconURL, rasterURL;
    if (application.testing) { return ''; }
    if (iconURL = thangTypeObj.rasterIcon) {
      return `/file/${iconURL}`;
    }
    if (rasterURL = thangTypeObj.raster) {
      return `/file/${rasterURL}`;
    }
    return `/file/db/thang.type/${thangTypeObj.original}/portrait.png`;
  },

  getHeroShortName(thangTypeObj) {
    // New way: moved into ThangType model
    let shortName, translated;
    if (shortName = utils.i18n(thangTypeObj, 'shortName')) {
      return shortName;
    }

    // Old way: hard-coded
    const map = {
      'Assassin': {'en-US': 'Ritic'},
      'Captain': {'en-US': 'Anya', 'zh-HANS': '安雅'},
      'Champion': {'en-US': 'Ida'},
      'Master Wizard': {'en-US': 'Usara'},
      'Duelist': {'en-US': 'Alejandro'},
      'Forest Archer': {'en-US': 'Naria'},
      'Goliath': {'en-US': 'Okar'},
      'Guardian': {'en-US': 'Illia'},
      'Knight': {'en-US': 'Tharin', 'zh-HANS': '坦林'},
      'Librarian': {'en-US': 'Hushbaum'},
      'Necromancer': {'en-US': 'Nalfar'},
      'Ninja': {'en-US': 'Amara'},
      'Pixie': {'en-US': 'Zana'},
      'Potion Master': {'en-US': 'Omarn'},
      'Raider': {'en-US': 'Arryn'},
      'Samurai': {'en-US': 'Hattori'},
      'Ian Elliott': {'en-US': 'Hattori'},
      'Sorcerer': {'en-US': 'Pender'},
      'Trapper': {'en-US': 'Senick'},
      'Code Ninja': {'en-US': 'Code Ninja'}
    };
    const name = map[thangTypeObj.name];
    if (translated = name != null ? name[me.get('preferredLanguage', true)] : undefined) { return translated; }
    return (name != null ? name['en-US'] : undefined);
  },

  getGender(thangTypeObj) {
    // New way: moved into ThangType model
    let gender, left;
    if (gender = thangTypeObj != null ? thangTypeObj.gender : undefined) {
      return gender;
    }

    // Old way: hard-coded
    const slug = (left = (thangTypeObj != null ? thangTypeObj.slug : undefined) != null ? (thangTypeObj != null ? thangTypeObj.slug : undefined) : __guardMethod__(thangTypeObj, 'get', o => o.get('slug'))) != null ? left : '';
    const heroGenders = {
      male: ['knight', 'samurai', 'trapper', 'potion-master', 'goliath', 'assassin', 'necromancer', 'duelist', 'code-ninja'],
      female: ['captain', 'ninja', 'forest-archer', 'librarian', 'sorcerer', 'raider', 'guardian', 'pixie', 'master-wizard', 'champion']
    };
    if (Array.from(heroGenders.female).includes(slug)) { return 'female'; } else { return 'male'; }
  }
};

module.exports = ThangTypeLib;

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}