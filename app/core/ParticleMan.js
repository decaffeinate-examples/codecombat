/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ParticleMan;
const CocoClass = require('core/CocoClass');
const utils = require('core/utils');
const THREE = require('three');
window.SPE = require('exports-loader?SPE!imports-loader?THREE=three!vendor/scripts/ShaderParticles');

module.exports = (ParticleMan = (ParticleMan = class ParticleMan extends CocoClass {

  constructor() {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.render = this.render.bind(this);
    if (!(typeof Modernizr !== 'undefined' && Modernizr !== null ? Modernizr.webgl : undefined)) { return this.unsupported = true; } // TODO: Fix with Webpack
    try {
      this.renderer = new THREE.WebGLRenderer({alpha: true});
    } catch (err) {
      return this.unsupported = true;
    }
    $(this.renderer.domElement).addClass('particle-man');
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.particleGroups = [];
  }

  destroy() {
    this.detach();
    this.disposeObject3D(this.scene);
    for (let child of Array.from(__guard__(this.scene != null ? this.scene.children : undefined, x => x.slice()) || [])) {
      this.scene.remove(child);
    }
    return super.destroy();
  }

  disposeObject3D(obj) {
    if (!obj) { return; }
    for (let child of Array.from(obj.children)) { this.disposeObject3D(child); }
    if (obj.geometry != null) {
      obj.geometry.dispose();
    }
    obj.geometry = undefined;
    if (obj.material) {
      let material;
      for (material of Array.from(obj.material.materials != null ? obj.material.materials : [])) { material.dispose(); }
      obj.material.dispose();
      obj.material = undefined;
    }
    if (obj.texture) {
      obj.texture.dispose();
      return obj.texture = undefined;
    }
  }

  attach($el) {
    let camera;
    this.$el = $el;
    if (this.unsupported) { return; }
    const width = this.$el.innerWidth();
    const height = this.$el.innerHeight();
    this.aspectRatio = width / height;
    this.renderer.setSize(width, height);
    this.$el.append(this.renderer.domElement);
    this.camera = (camera = new THREE.OrthographicCamera(
      100 * -0.5,                 // Left
      100 * 0.5,                  // Right
      100 * 0.5 * this.aspectRatio,   // Top
      100 * -0.5 * this.aspectRatio,  // Bottom
      0,                          // Near frustrum distance
      1000                        // Far frustrum distance
    ));
    this.camera.position.set(0, 0, 100);
    this.camera.up = new THREE.Vector3(0, 1, 0);  // http://stackoverflow.com/questions/14271672/moving-the-camera-lookat-and-rotations-in-three-js
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    if (!this.started) {
      this.started = true;
      return this.render();
    }
  }

  detach() {
    if (this.unsupported) { return; }
    this.renderer.domElement.remove();
    return this.started = false;
  }

  render() {
    if (this.unsupported) { return; }
    if (this.destroyed) { return; }
    if (!this.started) { return; }
    this.renderer.render(this.scene, this.camera);
    const dt = this.clock.getDelta();
    for (let group of Array.from(this.particleGroups)) {
      group.tick(dt);
    }
    return requestAnimationFrame(this.render);
  }
    //@countFPS()

  countFPS() {
    if (this.framesRendered == null) { this.framesRendered = 0; }
    ++this.framesRendered;
    if (this.lastFPS == null) { this.lastFPS = new Date(); }
    const now = new Date();
    if ((now - this.lastFPS) > 1000) {
      console.log(this.framesRendered, 'fps with', this.particleGroups.length, 'particle groups.');
      this.framesRendered = 0;
      return this.lastFPS = now;
    }
  }

  addEmitter(x, y, kind) {
    if (kind == null) { kind = "level-dungeon-premium"; }
    if (this.unsupported) { return; }
    const options = $.extend(true, {}, particleKinds[kind]);
    if (!options.group) { return console.error("Couldn't find particle configuration for", kind); }
    options.group.texture = THREE.ImageUtils.loadTexture(`/images/common/particles/${options.group.texture}.png`);
    const scale = 100;
    const aspectRatio = this.$el;
    const group = new SPE.Group(options.group);
    group.mesh.position.x = scale * (-0.5 + x);
    group.mesh.position.y = scale * (-0.5 + y) * this.aspectRatio;
    const emitter = new SPE.Emitter(options.emitter);
    group.addEmitter(emitter);
    this.particleGroups.push(group);
    this.scene.add(group.mesh);
    return group;
  }

  removeEmitter(group) {
    if (this.unsupported) { return; }
    this.scene.remove(group.mesh);
    return this.particleGroups = _.without(this.particleGroups, group);
  }

  removeEmitters() {
    if (this.unsupported) { return; }
    return Array.from(this.particleGroups.slice()).map((group) => this.removeEmitter(group));
  }
}));

  //addTestCube: ->
    //geometry = new THREE.BoxGeometry 5, 5, 5
    //material = new THREE.MeshLambertMaterial color: 0xFF0000
    //mesh = new THREE.Mesh geometry, material
    //@scene.add mesh
    //light = new THREE.PointLight 0xFFFF00
    //light.position.set 10, 0, 20
    //@scene.add light


const hsl = (hue, saturation, lightness) => new THREE.Color(utils.hslToHex([hue, saturation, lightness]));
const vec = (x, y, z) => new THREE.Vector3(x, y, z);

const defaults = {
  group: {
    texture: 'star',
    maxAge: 1.9,
    radius: 0.75,
    hasPerspective: 1,
    colorize: 1,
    transparent: 1,
    alphaTest: 0.5,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending
  },
  emitter: {
    type: "disk",
    particleCount: 100,
    radius: 1,
    position: vec(0, 0, 0),
    positionSpread: vec(1, 0, 1),
    acceleration: vec(0, 2, 0),
    accelerationSpread: vec(0, 0, 0),
    velocity: vec(0, 4, 0),
    velocitySpread: vec(2, 2, 2),
    sizeStart: 6,
    sizeStartSpread: 1,
    sizeMiddle: 4,
    sizeMiddleSpread: 1,
    sizeEnd: 2,
    sizeEndSpread: 1,
    angleStart: 0,
    angleStartSpread: 0,
    angleMiddle: 0,
    angleMiddleSpread: 0,
    angleEnd: 0,
    angleEndSpread: 0,
    angleAlignVelocity: false,
    colorStart: hsl(0.55, 0.75, 0.75),
    colorStartSpread: vec(0.3, 0.3, 0.3),
    colorMiddle: hsl(0.55, 0.6, 0.5),
    colorMiddleSpread: vec(0.2, 0.2, 0.2),
    colorEnd: hsl(0.55, 0.5, 0.25),
    colorEndSpread: vec(0.1, 0.1, 0.1),
    opacityStart: 1,
    opacityStartSpread: 0,
    opacityMiddle: 0.75,
    opacityMiddleSpread: 0,
    opacityEnd: 0.25,
    opacityEndSpread: 0,
    duration: null,
    alive: 1,
    isStatic: 0
  }
};

const ext = (d, options) => $.extend(true, {}, d, options != null ? options : {});

var particleKinds = {
  'level-dungeon-premium': ext(defaults),
  'level-forest-premium': ext(defaults, {
    emitter: {
      colorStart: hsl(0.56, 0.97, 0.5),
      colorMiddle: hsl(0.56, 0.57, 0.5),
      colorEnd: hsl(0.56, 0.17, 0.5)
    }
  }
  ),
  'level-desert-premium': ext(defaults, {
    emitter: {
      colorStart: hsl(0.56, 0.97, 0.5),
      colorMiddle: hsl(0.56, 0.57, 0.5),
      colorEnd: hsl(0.56, 0.17, 0.5)
    }
  }
  ),
  'level-mountain-premium': ext(defaults, {
    emitter: {
      colorStart: hsl(0.56, 0.97, 0.5),
      colorMiddle: hsl(0.56, 0.57, 0.5),
      colorEnd: hsl(0.56, 0.17, 0.5)
    }
  }
  ),
  'level-glacier-premium': ext(defaults, {
    emitter: {
      colorStart: hsl(0.56, 0.97, 0.5),
      colorMiddle: hsl(0.56, 0.57, 0.5),
      colorEnd: hsl(0.56, 0.17, 0.5)
    }
  }
  ),
  'level-volcano-premium': ext(defaults, {
    emitter: {
      colorStart: hsl(0.56, 0.97, 0.5),
      colorMiddle: hsl(0.56, 0.57, 0.5),
      colorEnd: hsl(0.56, 0.17, 0.5)
    }
  }
  )
};

particleKinds['level-dungeon-premium-hero'] = ext(particleKinds['level-dungeon-premium'], {
  emitter: {
    particleCount: 200,
    radius: 1.5,
    acceleration: vec(0, 4, 0),
    opacityStart: 0.25,
    opacityMiddle: 0.5,
    opacityEnd: 0.75
  }
}
);

particleKinds['level-dungeon-gate'] = ext(particleKinds['level-dungeon-premium'], {
  emitter: {
    particleCount: 2000,
    acceleration: vec(0, 8, 0),
    colorStart: hsl(0.5, 0.75, 0.9),
    colorMiddle: hsl(0.5, 0.75, 0.7),
    colorEnd: hsl(0.5, 0.75, 0.3),
    colorStartSpread: vec(1, 1, 1),
    colorMiddleSpread: vec(1.5, 1.5, 1.5),
    colorEndSpread: vec(2.5, 2.5, 2.5)
  }
}
);

particleKinds['level-dungeon-hero-ladder'] = (particleKinds['level-dungeon-course-ladder'] = ext(particleKinds['level-dungeon-premium'], {
  emitter: {
    particleCount: 200,
    acceleration: vec(0, 3, 0),
    colorStart: hsl(0, 0.75, 0.7),
    colorMiddle: hsl(0, 0.75, 0.5),
    colorEnd: hsl(0, 0.75, 0.3)
  }
}
));

particleKinds['level-dungeon-replayable'] = (particleKinds['level-dungeon-replayable-premium'] = ext(particleKinds['level-dungeon-hero-ladder'], {
  emitter: {
    colorStart: hsl(0.17, 0.75, 0.7),
    colorMiddle: hsl(0.17, 0.75, 0.5),
    colorEnd: hsl(0.17, 0.75, 0.3)
  }
}
));

particleKinds['level-dungeon-game-dev'] = (particleKinds['level-dungeon-game-dev-premium'] = ext(particleKinds['level-dungeon-hero-ladder'], {
  emitter: {
    colorStart: hsl(0.7, 0.75, 0.7),
    colorMiddle: hsl(0.7, 0.75, 0.5),
    colorEnd: hsl(0.7, 0.75, 0.3)
  }
}
));

particleKinds['level-dungeon-web-dev'] = (particleKinds['level-dungeon-web-dev-premium'] = ext(particleKinds['level-dungeon-hero-ladder'], {
  emitter: {
    colorStart: hsl(0.7, 0.25, 0.7),
    colorMiddle: hsl(0.7, 0.25, 0.5),
    colorEnd: hsl(0.7, 0.25, 0.3)
  }
}
));

particleKinds['level-dungeon-premium-item'] = ext(particleKinds['level-dungeon-gate'], {
  emitter: {
    particleCount: 2000,
    radius: 2.5,
    acceleration: vec(0, 8, 1),
    opacityStart: 0,
    opacityMiddle: 0.5,
    opacityEnd: 0.75,
    colorStart: hsl(0.5, 0.75, 0.9),
    colorMiddle: hsl(0.5, 0.75, 0.7),
    colorEnd: hsl(0.5, 0.75, 0.3),
    colorStartSpread: vec(1, 1, 1),
    colorMiddleSpread: vec(1.5, 1.5, 1.5),
    colorEndSpread: vec(2.5, 2.5, 2.5)
  }
}
);

particleKinds['level-forest-premium-hero'] = ext(particleKinds['level-forest-premium'], {
  emitter: {
    particleCount: 200,
    radius: 1.5,
    acceleration: vec(0, 4, 0),
    opacityStart: 0.25,
    opacityMiddle: 0.5,
    opacityEnd: 0.75
  }
}
);

particleKinds['level-forest-gate'] = ext(particleKinds['level-forest-premium'], {
  emitter: {
    particleCount: 120,
    velocity: vec(0, 8, 0),
    colorStart: hsl(0.56, 0.97, 0.3),
    colorMiddle: hsl(0.56, 0.57, 0.3),
    colorEnd: hsl(0.56, 0.17, 0.3),
    colorStartSpread: vec(1, 1, 1),
    colorMiddleSpread: vec(1.5, 1.5, 1.5),
    colorEndSpread: vec(2.5, 2.5, 2.5)
  }
}
);

particleKinds['level-forest-hero-ladder'] = (particleKinds['level-forest-course-ladder'] = ext(particleKinds['level-forest-premium'], {
  emitter: {
    particleCount: 90,
    velocity: vec(0, 4, 0),
    colorStart: hsl(0, 0.95, 0.3),
    colorMiddle: hsl(0, 1, 0.5),
    colorEnd: hsl(0, 0.75, 0.1)
  }
}
));

particleKinds['level-forest-replayable'] = (particleKinds['level-forest-replayable-premium'] = ext(particleKinds['level-forest-hero-ladder'], {
  emitter: {
    colorStart: hsl(0.17, 0.75, 0.7),
    colorMiddle: hsl(0.17, 0.75, 0.5),
    colorEnd: hsl(0.17, 0.75, 0.3)
  }
}
));

particleKinds['level-forest-game-dev'] = (particleKinds['level-forest-game-dev-premium'] = ext(particleKinds['level-forest-hero-ladder'], {
  emitter: {
    colorStart: hsl(0.7, 0.75, 0.7),
    colorMiddle: hsl(0.7, 0.75, 0.5),
    colorEnd: hsl(0.7, 0.75, 0.3)
  }
}
));

particleKinds['level-forest-web-dev'] = (particleKinds['level-forest-web-dev-premium'] = ext(particleKinds['level-forest-hero-ladder'], {
  emitter: {
    colorStart: hsl(0.7, 0.25, 0.7),
    colorMiddle: hsl(0.7, 0.25, 0.5),
    colorEnd: hsl(0.7, 0.25, 0.3)
  }
}
));

particleKinds['level-forest-premium-item'] = ext(particleKinds['level-forest-gate'], {
  emitter: {
    particleCount: 2000,
    radius: 2.5,
    acceleration: vec(0, 8, 1),
    opacityStart: 0,
    opacityMiddle: 0.5,
    opacityEnd: 0.75,
    colorStart: hsl(0.5, 0.75, 0.9),
    colorMiddle: hsl(0.5, 0.75, 0.7),
    colorEnd: hsl(0.5, 0.75, 0.3),
    colorStartSpread: vec(1, 1, 1),
    colorMiddleSpread: vec(1.5, 1.5, 1.5),
    colorEndSpread: vec(2.5, 2.5, 2.5)
  }
}
);

particleKinds['level-desert-premium-hero'] = ext(particleKinds['level-desert-premium'], {
  emitter: {
    particleCount: 200,
    radius: 1.5,
    acceleration: vec(0, 4, 0),
    opacityStart: 0.25,
    opacityMiddle: 0.5,
    opacityEnd: 0.75
  }
}
);

particleKinds['level-desert-gate'] = ext(particleKinds['level-desert-premium'], {
  emitter: {
    particleCount: 120,
    velocity: vec(0, 8, 0),
    colorStart: hsl(0.56, 0.97, 0.3),
    colorMiddle: hsl(0.56, 0.57, 0.3),
    colorEnd: hsl(0.56, 0.17, 0.3),
    colorStartSpread: vec(1, 1, 1),
    colorMiddleSpread: vec(1.5, 1.5, 1.5),
    colorEndSpread: vec(2.5, 2.5, 2.5)
  }
}
);

particleKinds['level-desert-hero-ladder'] = (particleKinds['level-desert-course-ladder'] = ext(particleKinds['level-desert-premium'], {
  emitter: {
    particleCount: 90,
    velocity: vec(0, 4, 0),
    colorStart: hsl(0, 0.95, 0.3),
    colorMiddle: hsl(0, 1, 0.5),
    colorEnd: hsl(0, 0.75, 0.1)
  }
}
));

particleKinds['level-desert-replayable'] = (particleKinds['level-desert-replayable-premium'] = ext(particleKinds['level-desert-hero-ladder'], {
  emitter: {
    colorStart: hsl(0.17, 0.75, 0.7),
    colorMiddle: hsl(0.17, 0.75, 0.5),
    colorEnd: hsl(0.17, 0.75, 0.3)
  }
}
));

particleKinds['level-desert-game-dev'] = (particleKinds['level-desert-game-dev-premium'] = ext(particleKinds['level-desert-hero-ladder'], {
  emitter: {
    colorStart: hsl(0.7, 0.75, 0.7),
    colorMiddle: hsl(0.7, 0.75, 0.5),
    colorEnd: hsl(0.7, 0.75, 0.3)
  }
}
));

particleKinds['level-desert-web-dev'] = (particleKinds['level-desert-web-dev-premium'] = ext(particleKinds['level-desert-hero-ladder'], {
  emitter: {
    colorStart: hsl(0.7, 0.25, 0.7),
    colorMiddle: hsl(0.7, 0.25, 0.5),
    colorEnd: hsl(0.7, 0.25, 0.3)
  }
}
));

particleKinds['level-mountain-premium-hero'] = ext(particleKinds['level-mountain-premium'], {
  emitter: {
    particleCount: 200,
    radius: 1.5,
    acceleration: vec(0, 4, 0),
    opacityStart: 0.25,
    opacityMiddle: 0.5,
    opacityEnd: 0.75
  }
}
);

particleKinds['level-mountain-gate'] = ext(particleKinds['level-mountain-premium'], {
  emitter: {
    particleCount: 120,
    velocity: vec(0, 8, 0),
    colorStart: hsl(0.56, 0.97, 0.3),
    colorMiddle: hsl(0.56, 0.57, 0.3),
    colorEnd: hsl(0.56, 0.17, 0.3),
    colorStartSpread: vec(1, 1, 1),
    colorMiddleSpread: vec(1.5, 1.5, 1.5),
    colorEndSpread: vec(2.5, 2.5, 2.5)
  }
}
);

particleKinds['level-mountain-hero-ladder'] = (particleKinds['level-mountain-course-ladder'] = ext(particleKinds['level-mountain-premium'], {
  emitter: {
    particleCount: 90,
    velocity: vec(0, 4, 0),
    colorStart: hsl(0, 0.95, 0.3),
    colorMiddle: hsl(0, 1, 0.5),
    colorEnd: hsl(0, 0.75, 0.1)
  }
}
));

particleKinds['level-mountain-replayable'] = (particleKinds['level-mountain-replayable-premium'] = ext(particleKinds['level-mountain-hero-ladder'], {
  emitter: {
    colorStart: hsl(0.17, 0.75, 0.7),
    colorMiddle: hsl(0.17, 0.75, 0.5),
    colorEnd: hsl(0.17, 0.75, 0.3)
  }
}
));

particleKinds['level-mountain-game-dev'] = (particleKinds['level-mountain-game-dev-premium'] = ext(particleKinds['level-mountain-hero-ladder'], {
  emitter: {
    colorStart: hsl(0.7, 0.75, 0.7),
    colorMiddle: hsl(0.7, 0.75, 0.5),
    colorEnd: hsl(0.7, 0.75, 0.3)
  }
}
));

particleKinds['level-mountain-web-dev'] = (particleKinds['level-mountain-web-dev-premium'] = ext(particleKinds['level-mountain-hero-ladder'], {
  emitter: {
    colorStart: hsl(0.7, 0.25, 0.7),
    colorMiddle: hsl(0.7, 0.25, 0.5),
    colorEnd: hsl(0.7, 0.25, 0.3)
  }
}
));

particleKinds['level-glacier-premium-hero'] = ext(particleKinds['level-glacier-premium'], {
  emitter: {
    particleCount: 200,
    radius: 1.5,
    acceleration: vec(0, 4, 0),
    opacityStart: 0.25,
    opacityMiddle: 0.5,
    opacityEnd: 0.75
  }
}
);

particleKinds['level-glacier-gate'] = ext(particleKinds['level-glacier-premium'], {
  emitter: {
    particleCount: 120,
    velocity: vec(0, 8, 0),
    colorStart: hsl(0.56, 0.97, 0.3),
    colorMiddle: hsl(0.56, 0.57, 0.3),
    colorEnd: hsl(0.56, 0.17, 0.3),
    colorStartSpread: vec(1, 1, 1),
    colorMiddleSpread: vec(1.5, 1.5, 1.5),
    colorEndSpread: vec(2.5, 2.5, 2.5)
  }
}
);

particleKinds['level-glacier-hero-ladder'] = (particleKinds['level-glacier-course-ladder'] = ext(particleKinds['level-glacier-premium'], {
  emitter: {
    particleCount: 90,
    velocity: vec(0, 4, 0),
    colorStart: hsl(0, 0.95, 0.3),
    colorMiddle: hsl(0, 1, 0.5),
    colorEnd: hsl(0, 0.75, 0.1)
  }
}
));

particleKinds['level-glacier-replayable'] = (particleKinds['level-glacier-replayable-premium'] = ext(particleKinds['level-glacier-hero-ladder'], {
  emitter: {
    colorStart: hsl(0.17, 0.75, 0.7),
    colorMiddle: hsl(0.17, 0.75, 0.5),
    colorEnd: hsl(0.17, 0.75, 0.3)
  }
}
));

particleKinds['level-glacier-game-dev'] = (particleKinds['level-glacier-game-dev-premium'] = ext(particleKinds['level-glacier-hero-ladder'], {
  emitter: {
    colorStart: hsl(0.7, 0.75, 0.7),
    colorMiddle: hsl(0.7, 0.75, 0.5),
    colorEnd: hsl(0.7, 0.75, 0.3)
  }
}
));

particleKinds['level-glacier-web-dev'] = (particleKinds['level-glacier-web-dev-premium'] = ext(particleKinds['level-glacier-hero-ladder'], {
  emitter: {
    colorStart: hsl(0.7, 0.25, 0.7),
    colorMiddle: hsl(0.7, 0.25, 0.5),
    colorEnd: hsl(0.7, 0.25, 0.3)
  }
}
));

particleKinds['level-volcano-premium-hero'] = ext(particleKinds['level-volcano-premium'], {
  emitter: {
    particleCount: 200,
    radius: 1.5,
    acceleration: vec(0, 4, 0),
    opacityStart: 0.25,
    opacityMiddle: 0.5,
    opacityEnd: 0.75
  }
}
);

particleKinds['level-volcano-gate'] = ext(particleKinds['level-volcano-premium'], {
  emitter: {
    particleCount: 120,
    velocity: vec(0, 8, 0),
    colorStart: hsl(0.56, 0.97, 0.3),
    colorMiddle: hsl(0.56, 0.57, 0.3),
    colorEnd: hsl(0.56, 0.17, 0.3),
    colorStartSpread: vec(1, 1, 1),
    colorMiddleSpread: vec(1.5, 1.5, 1.5),
    colorEndSpread: vec(2.5, 2.5, 2.5)
  }
}
);

particleKinds['level-volcano-hero-ladder'] = ext(particleKinds['level-volcano-premium'], {
  emitter: {
    particleCount: 90,
    velocity: vec(0, 4, 0),
    colorStart: hsl(0, 0.95, 0.3),
    colorMiddle: hsl(0, 1, 0.5),
    colorEnd: hsl(0, 0.75, 0.1)
  }
}
);

particleKinds['level-volcano-replayable'] = (particleKinds['level-volcano-replayable-premium'] = ext(particleKinds['level-volcano-hero-ladder'], {
  emitter: {
    colorStart: hsl(0.17, 0.75, 0.7),
    colorMiddle: hsl(0.17, 0.75, 0.5),
    colorEnd: hsl(0.17, 0.75, 0.3)
  }
}
));

particleKinds['level-volcano-game-dev'] = (particleKinds['level-volcano-game-dev-premium'] = ext(particleKinds['level-volcano-hero-ladder'], {
  emitter: {
    colorStart: hsl(0.7, 0.75, 0.7),
    colorMiddle: hsl(0.7, 0.75, 0.5),
    colorEnd: hsl(0.7, 0.75, 0.3)
  }
}
));

particleKinds['level-volcano-web-dev'] = (particleKinds['level-volcano-web-dev-premium'] = ext(particleKinds['level-volcano-hero-ladder'], {
  emitter: {
    colorStart: hsl(0.7, 0.25, 0.7),
    colorMiddle: hsl(0.7, 0.25, 0.5),
    colorEnd: hsl(0.7, 0.25, 0.3)
  }
}
));

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}