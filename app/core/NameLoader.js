/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CocoClass = require('core/CocoClass');

const namesCache = {};

class NameLoader extends CocoClass {
  constructor(...args) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.loadedNames = this.loadedNames.bind(this);
    super(...args);
  }

  loadNames(ids) {
    const toLoad = _.uniq((Array.from(ids).filter((id) => !namesCache[id])));
    if (!toLoad.length) { return false; }
    const jqxhrOptions = {
      url: '/db/user/x/names',
      type: 'POST',
      data: {ids: toLoad},
      success: this.loadedNames
    };

    return jqxhrOptions;
  }

  loadedNames(newNames) {
    return _.extend(namesCache, newNames);
  }

  getName(id) {
    if ((namesCache[id] != null ? namesCache[id].firstName : undefined) && (namesCache[id] != null ? namesCache[id].lastName : undefined)) {
      return `${(namesCache[id] != null ? namesCache[id].firstName : undefined)} ${(namesCache[id] != null ? namesCache[id].lastName : undefined)}`;
    }
    return (namesCache[id] != null ? namesCache[id].firstName : undefined) || (namesCache[id] != null ? namesCache[id].name : undefined) || id;
  }
}

module.exports = new NameLoader();
