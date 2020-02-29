/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Language = require('./languages');
const concepts = require('./concepts');

// schema helper methods

const me = module.exports;

const combine = function(base, ext) {
  if (ext == null) { return base; }
  return _.extend(base, ext);
};

const urlPattern = '^(ht|f)tp(s?)\:\/\/[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*(:(0-9)*)*(\/?)([a-zA-Z0-9\-\.\?\,\'\/\\\+&%\$#_=]*)?$';
const pathPattern = '^\/([a-zA-Z0-9\-\.\?\,\'\/\\\+&%\$#_=]*)?$';

// Common schema properties
me.object = (ext, props) => combine({type: 'object', additionalProperties: false, properties: props || {}}, ext);
me.array = (ext, items) => combine({type: 'array', items: items || {}}, ext);
me.shortString = ext => combine({type: 'string', maxLength: 100}, ext);
me.pct = ext => combine({type: 'number', maximum: 1.0, minimum: 0.0}, ext);
me.passwordString = {type: 'string', maxLength: 256, minLength: 2, title: 'Password'};

// Dates should usually be strings, ObjectIds should be strings: https://github.com/codecombat/codecombat/issues/1384
me.date = ext => combine({type: ['object', 'string'], format: 'date-time'}, ext);  // old
me.stringDate = ext => combine({type: ['string'], format: 'date-time'}, ext);  // new
me.objectId = ext => combine({type: ['object', 'string']}, ext);  // old
me.stringID = ext => combine({type: 'string', minLength: 24, maxLength: 24}, ext);  // use for anything new

me.url = ext => combine({type: 'string', format: 'url', pattern: urlPattern}, ext);
me.path = ext => combine({type: 'string', pattern: pathPattern}, ext);
me.int = ext => combine({type: 'integer'}, ext);
me.float = ext => combine({type: 'number'}, ext);

const PointSchema = me.object({title: 'Point', description: 'An {x, y} coordinate point.', format: 'point2d', required: ['x', 'y']}, {
  x: {title: 'x', description: 'The x coordinate.', type: 'number', 'default': 15},
  y: {title: 'y', description: 'The y coordinate.', type: 'number', 'default': 20}
});

me.point2d = ext => combine(_.cloneDeep(PointSchema), ext);

const SoundSchema = me.object({format: 'sound'}, {
  mp3: {type: 'string', format: 'sound-file'},
  ogg: {type: 'string', format: 'sound-file'}
});

me.sound = function(props) {
  const obj = _.cloneDeep(SoundSchema);
  for (let prop in props) { obj.properties[prop] = props[prop]; }
  return obj;
};

const ColorConfigSchema = me.object({format: 'color-sound'}, {
  hue: {format: 'range', type: 'number', minimum: 0, maximum: 1},
  saturation: {format: 'range', type: 'number', minimum: 0, maximum: 1},
  lightness: {format: 'range', type: 'number', minimum: 0, maximum: 1}
});

me.colorConfig = function(props) {
  const obj = _.cloneDeep(ColorConfigSchema);
  for (let prop in props) { obj.properties[prop] = props[prop]; }
  return obj;
};

// BASICS

const basicProps = linkFragment => ({
  _id: me.objectId({links: [{rel: 'self', href: `/db/${linkFragment}/{($)}`}], format: 'hidden'}),
  __v: {title: 'Mongoose Version', format: 'hidden'}
});

me.extendBasicProperties = function(schema, linkFragment) {
  if (schema.properties == null) { schema.properties = {}; }
  return _.extend(schema.properties, basicProps(linkFragment));
};

// PATCHABLE

const patchableProps = () => ({
  patches: me.array({title:'Patches'}, {
    _id: me.objectId({links: [{rel: 'db', href: '/db/patch/{($)}'}], title: 'Patch ID', description: 'A reference to the patch.'}),
    status: {enum: ['pending', 'accepted', 'rejected', 'cancelled']}
  }),

  allowPatches: {type: 'boolean'},

  watchers: me.array({title: 'Watchers'},
    me.objectId({links: [{rel: 'extra', href: '/db/user/{($)}'}]}))
});

me.extendPatchableProperties = function(schema) {
  if (schema.properties == null) { schema.properties = {}; }
  return _.extend(schema.properties, patchableProps());
};

// NAMED

const namedProps = () => ({
  name: me.shortString({title: 'Name'}),
  slug: me.shortString({title: 'Slug', format: 'hidden'})
});

me.extendNamedProperties = function(schema) {
  if (schema.properties == null) { schema.properties = {}; }
  return _.extend(schema.properties, namedProps());
};

// VERSIONED

const versionedProps = linkFragment => ({
  version: {
    'default': {minor: 0, major: 0, isLatestMajor: true, isLatestMinor: true},
    format: 'version',
    title: 'Version',
    type: 'object',
    readOnly: true,
    additionalProperties: false,
    properties: {
      major: {type: 'number', minimum: 0},
      minor: {type: 'number', minimum: 0},
      isLatestMajor: {type: 'boolean'},
      isLatestMinor: {type: 'boolean'}
    }
  },

  // TODO: figure out useful 'rel' values here
  original: me.objectId({links: [{rel: 'extra', href: `/db/${linkFragment}/{($)}`}], format: 'hidden'}),

  parent: me.objectId({links: [{rel: 'extra', href: `/db/${linkFragment}/{($)}`}], format: 'hidden'}),
  creator: me.objectId({links: [{rel: 'extra', href: '/db/user/{($)}'}], format: 'hidden'}),
  created: me.date({title: 'Created', readOnly: true}),
  commitMessage: {type: 'string', maxLength: 500, title: 'Commit Message', readOnly: true}
});

me.extendVersionedProperties = function(schema, linkFragment) {
  if (schema.properties == null) { schema.properties = {}; }
  return _.extend(schema.properties, versionedProps(linkFragment));
};

// SEARCHABLE

const searchableProps = () => ({
  index: {format: 'hidden'}
});

me.extendSearchableProperties = function(schema) {
  if (schema.properties == null) { schema.properties = {}; }
  return _.extend(schema.properties, searchableProps());
};

const algoliaSearchableProps = () => ({
  _algoliaObjectID: { type: 'string' }
});

me.extendAlgoliaProperties = function(schema) {
  if (schema.properties == null) { schema.properties = {}; }
  return _.extend(schema.properties, algoliaSearchableProps());
};

// PERMISSIONED

const permissionsProps = () => ({
  permissions: {
    type: 'array',
    items: {
      type: 'object',
      additionalProperties: false,
      properties: {
        target: {},
        access: {type: 'string', 'enum': ['read', 'write', 'owner']}
      }
    },
    format: 'hidden'
  }
});

me.extendPermissionsProperties = function(schema) {
  if (schema.properties == null) { schema.properties = {}; }
  return _.extend(schema.properties, permissionsProps());
};

// TRANSLATABLE

me.generateLanguageCodeArrayRegex = () => '^(' + Language.languageCodes.join('|') + ')$';

me.getLanguageCodeArray = () => Language.languageCodes;

me.getLanguagesObject = () => Language;

me.extendTranslationCoverageProperties = function(schema) {
  if (schema.properties == null) { schema.properties = {}; }
  return schema.properties.i18nCoverage = { title: 'i18n Coverage', type: 'array', items: { type: 'string' }};
};

// OTHER

me.classNamePattern = '^[A-Z][A-Za-z0-9]*$';  // starts with capital letter; just letters and numbers
me.identifierPattern = '^[a-z][A-Za-z0-9]*$';  // starts with lowercase letter; just letters and numbers
me.constantPattern = '^[A-Z0-9_]+$';  // just uppercase letters, underscores, and numbers
me.identifierOrConstantPattern = '^([a-z][A-Za-z0-9]*|[A-Z0-9_]+)$';

me.FunctionArgumentSchema = me.object({
  title: 'Function Argument',
  description: 'Documentation entry for a function argument.',
  'default': {
    name: 'target',
    type: 'object',
    optional: false,
    example: 'this.getNearestEnemy()',
    description: 'The target of this function.'
  },
  required: ['name', 'type', 'example', 'description']
}, {
  name: {type: 'string', pattern: me.identifierPattern, title: 'Name', description: 'Name of the function argument.'},
  i18n: { type: 'object', format: 'i18n', props: ['description'], description: 'Help translate this argument'},
  // not actual JS types, just whatever they describe...
  type: me.shortString({title: 'Type', description: 'Intended type of the argument.'}),
  optional: {title: 'Optional', description: 'Whether an argument may be omitted when calling the function', type: 'boolean'},
  example: {
    oneOf: [
      {
        type: 'object',
        title: 'Language Examples',
        description: 'Examples by code language.',
        additionalProperties: me.shortString({description: 'Example value for the argument.'}),
        format: 'code-languages-object',
        default: {javascript: '', python: ''}
      },
      me.shortString({title: 'Example', description: 'Example value for the argument.'})
    ]
  },
  description: {
    oneOf: [
      {
        type: 'object',
        title: 'Language Descriptions',
        description: 'Example argument descriptions by code language.',
        additionalProperties: {type: 'string', description: 'Description of the argument.', maxLength: 1000},
        format: 'code-languages-object',
        default: {javascript: '', python: ''}
      },
      {title: 'Description', type: 'string', description: 'Description of the argument.', maxLength: 1000}
    ]
  },
  'default': {
    title: 'Default',
    description: 'Default value of the argument. (Your code should set this.)',
    'default': null
  }
}
);

me.codeSnippet = me.object({description: 'A language-specific code snippet'}, {
  code: {type: 'string', format: 'code', title: 'Snippet', default: '', description: 'Code snippet. Use ${1:defaultValue} syntax to add flexible arguments'},
  tab: {type: 'string', title: 'Tab Trigger', description: 'Tab completion text. Will be expanded to the snippet if typed and hit tab.'}
});

me.activity = me.object({description: 'Stats on an activity'}, {
  first: me.date(),
  last: me.date(),
  count: {type: 'integer', minimum: 0}
});

me.terrainString = me.shortString({enum: ['Grass', 'Dungeon', 'Indoor', 'Desert', 'Mountain', 'Glacier', 'Volcano'], title: 'Terrain', description: 'Which terrain type this is.'});

me.HeroConfigSchema = me.object({description: 'Which hero the player is using, equipped with what inventory.'}, {
  inventory: {
    type: 'object',
    description: 'The inventory of the hero: slots to item ThangTypes.',
    additionalProperties: me.objectId({description: 'An item ThangType.'})
  },
  thangType: me.objectId({links: [{rel: 'db', href: '/db/thang.type/{($)}/version'}], title: 'Thang Type', description: 'The ThangType of the hero.', format: 'thang-type'})
}
);

me.RewardSchema = function(descriptionFragment) {
  if (descriptionFragment == null) { descriptionFragment = 'earned by achievements'; }
  return {
    type: 'object',
    additionalProperties: false,
    description: `Rewards ${descriptionFragment}.`,
    properties: {
      heroes: me.array({uniqueItems: true, description: `Heroes ${descriptionFragment}.`},
        me.stringID({links: [{rel: 'db', href: '/db/thang.type/{($)}/version'}], title: 'Hero ThangType', description: 'A reference to the earned hero ThangType.', format: 'thang-type'})),
      items: me.array({uniqueItems: true, description: `Items ${descriptionFragment}.`},
        me.stringID({links: [{rel: 'db', href: '/db/thang.type/{($)}/version'}], title: 'Item ThangType', description: 'A reference to the earned item ThangType.', format: 'thang-type'})),
      levels: me.array({uniqueItems: true, description: `Levels ${descriptionFragment}.`},
        me.stringID({links: [{rel: 'db', href: '/db/level/{($)}/version'}], title: 'Level', description: 'A reference to the earned Level.', format: 'latest-version-original-reference'})),
      gems: me.float({description: `Gems ${descriptionFragment}.`})
    }
  };
};

me.task = me.object({title: 'Task', description: 'A task to be completed', format: 'task', default: {name: 'TODO', complete: false}}, {
  name: {title: 'Name', description: 'What must be done?', type: 'string'},
  complete: {title: 'Complete', description: 'Whether this task is done.', type: 'boolean', format: 'checkbox'}
});

me.concept = {type: 'string', enum: (Array.from(concepts).map((concept) => concept.concept)), format: 'concept'};

me.scoreType = me.shortString({title: 'Score Type', 'enum': ['time', 'damage-taken', 'damage-dealt', 'gold-collected', 'difficulty', 'code-length', 'survival-time', 'defeated']});  // TODO: total gear value.
