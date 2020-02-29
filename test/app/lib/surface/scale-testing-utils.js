/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const createjs = require('lib/createjs-parts');

module.exports.hitTest = function(stage, bounds) {
  let hits;
  let tests = (hits = 0);
  for (let x of Array.from(_.range(bounds.x, bounds.x + bounds.width, 5))) {
    for (let y of Array.from(_.range(bounds.y, bounds.y + bounds.height, 5))) {
      tests += 1;
      const objects = stage.getObjectsUnderPoint(x, y);
      const hasSprite = _.any(objects, o => o instanceof createjs.Sprite);
      const hasShape = _.any(objects, o => o instanceof createjs.Shape);
      if ((hasSprite && hasShape) || !(hasSprite || hasShape)) { hits += 1; }
      const g = new createjs.Graphics();
      if (hasSprite && hasShape) {
        g.beginFill(createjs.Graphics.getRGB(64,64,255,0.7));
      } else if (!(hasSprite || hasShape)) {
        g.beginFill(createjs.Graphics.getRGB(64,64,64,0.7));
      } else {
        g.beginFill(createjs.Graphics.getRGB(255,64,64,0.7));
      }
      g.drawCircle(0, 0, 2);
      const s = new createjs.Shape(g);
      s.x = x;
      s.y = y;
      stage.addChild(s);
    }
  }
  return hits/tests;
};

