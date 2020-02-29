/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Vector = require('./vector');
const LineSegment = require('./line_segment');

class Rectangle {
  static initClass() {
    this.className = 'Rectangle';
    // Class methods for nondestructively operating - TODO: add rotate
    for (let name of ['add', 'subtract', 'multiply', 'divide']) {
      ((name => Rectangle[name] = (a, b) => a.copy()[name](b)))(name);
    }
  
    this.prototype.isRectangle = true;
    this.prototype.apiProperties = ['x', 'y', 'width', 'height', 'rotation', 'getPos', 'vertices', 'touchesRect', 'touchesPoint', 'distanceToPoint', 'distanceSquaredToPoint', 'distanceToRectangle', 'distanceSquaredToRectangle', 'distanceToEllipse', 'distanceSquaredToEllipse', 'distanceToShape', 'distanceSquaredToShape', 'containsPoint', 'copy', 'intersectsLineSegment', 'intersectsEllipse', 'intersectsRectangle', 'intersectsShape'];
  }

  constructor(x, y, width, height, rotation) {
    if (x == null) { x = 0; }
    this.x = x;
    if (y == null) { y = 0; }
    this.y = y;
    if (width == null) { width = 0; }
    this.width = width;
    if (height == null) { height = 0; }
    this.height = height;
    if (rotation == null) { rotation = 0; }
    this.rotation = rotation;
  }

  copy() {
    return new Rectangle(this.x, this.y, this.width, this.height, this.rotation);
  }

  getPos() {
    return new Vector(this.x, this.y);
  }

  vertices() {
    // Counter-clockwise, starting from bottom left (when unrotated)
    const [w2, h2, cos, sin] = Array.from([this.width / 2, this.height / 2, Math.cos(this.rotation), Math.sin(-this.rotation)]);
    return [
      new Vector(this.x - ((w2 * cos) - (h2 * sin)), this.y - ((w2 * sin) + (h2 * cos))),
      new Vector(this.x - ((w2 * cos) + (h2 * sin)), this.y - ((w2 * sin) - (h2 * cos))),
      new Vector(this.x + ((w2 * cos) - (h2 * sin)), this.y + ((w2 * sin) + (h2 * cos))),
      new Vector(this.x + ((w2 * cos) + (h2 * sin)), this.y + ((w2 * sin) - (h2 * cos)))
    ];
  }

  lineSegments() {
    const vertices = this.vertices();
    const lineSegment0 = new LineSegment(vertices[0], vertices[1]);
    const lineSegment1 = new LineSegment(vertices[1], vertices[2]);
    const lineSegment2 = new LineSegment(vertices[2], vertices[3]);
    const lineSegment3 = new LineSegment(vertices[3], vertices[0]);
    return [lineSegment0, lineSegment1, lineSegment2, lineSegment3];
  }

  touchesRect(other) {
    // Whether this rect shares part of any edge with other rect, for non-rotated, non-overlapping rectangles.
    // I think it says kitty-corner rects touch, but I don't think I want that.
    // Float instability might get me, too.
    const [bl1, tl1, tr1, br1] = Array.from(this.vertices());
    const [bl2, tl2, tr2, br2] = Array.from(other.vertices());
    if ((tl1.x > tr2.x) || (tl2.x > tr1.x)) { return false; }
    if ((bl1.y > tl2.y) || (bl2.y > tl1.y)) { return false; }
    if ((tl1.x === tr2.x) || (tl2.x === tr1.x)) { return true; }
    if ((tl1.y === bl2.y) || (tl2.y === bl1.y)) { return true; }
    return false;
  }

  touchesPoint(p) {
    // Whether this rect has point p exactly on one of its edges, assuming no rotation.
    const [bl, tl, tr, br] = Array.from(this.vertices());
    if (!(p.y >= bl.y) || !(p.y <= tl.y)) { return false; }
    if (!(p.x >= bl.x) || !(p.x <= br.x)) { return false; }
    if ((p.x === bl.x) || (p.x === br.x)) { return true; }
    if ((p.y === bl.y) || (p.y === tl.y)) { return true; }
    return false;
  }

  axisAlignedBoundingBox(rounded) {
    if (rounded == null) { rounded = true; }
    const box = this.copy();
    if (!this.rotation) { return box; }
    box.rotation = 0;
    let [left, top] = Array.from([9001, 9001]);
    for (let vertex of Array.from(this.vertices())) {
      [left, top] = Array.from([Math.min(left, vertex.x), Math.min(top, vertex.y)]);
    }
    if (rounded) {
      [left, top] = Array.from([Math.round(left), Math.round(top)]);
    }
    [box.width, box.height] = Array.from([2 * (this.x - left), 2 * (this.y - top)]);
    return box;
  }

  distanceToPoint(p) {
    // Get p in rect's coordinate space, then operate in one quadrant.
    p = Vector.subtract(p, this.getPos()).rotate(-this.rotation);
    const dx = Math.max(Math.abs(p.x) - (this.width / 2), 0);
    const dy = Math.max(Math.abs(p.y) - (this.height / 2), 0);
    return Math.sqrt((dx * dx) + (dy * dy));
  }

  distanceSquaredToPoint(p) {
    // Doesn't handle rotation; just supposed to be faster than distanceToPoint.
    p = Vector.subtract(p, this.getPos());
    const dx = Math.max(Math.abs(p.x) - (this.width / 2), 0);
    const dy = Math.max(Math.abs(p.y) - (this.height / 2), 0);
    return (dx * dx) + (dy * dy);
  }

  distanceToRectangle(other) {
    return Math.sqrt(this.distanceSquaredToRectangle(other));
  }

  distanceSquaredToRectangle(other) {
    if (this.intersectsRectangle(other)) { return 0; }
    const [firstVertices, secondVertices] = Array.from([this.vertices(), other.vertices()]);
    const [firstEdges, secondEdges] = Array.from([this.lineSegments(), other.lineSegments()]);
    let ans = Infinity;
    for (let i = 0; i < 4; i++) {
      var j;
      var asc, end;
      var asc1, end1;
      for (j = 0, end = firstEdges.length, asc = 0 <= end; asc ? j < end : j > end; asc ? j++ : j--) {
        ans = Math.min(ans, firstEdges[j].distanceSquaredToPoint(secondVertices[i]));
      }
      for (j = 0, end1 = secondEdges.length, asc1 = 0 <= end1; asc1 ? j < end1 : j > end1; asc1 ? j++ : j--) {
        ans = Math.min(ans, secondEdges[j].distanceSquaredToPoint(firstVertices[i]));
      }
    }
    return ans;
  }

  distanceToEllipse(ellipse) {
    return Math.sqrt(this.distanceSquaredToEllipse(ellipse));
  }

  distanceSquaredToEllipse(ellipse) {
    return this.distanceSquaredToRectangle(ellipse.rectangle());  // TODO: actually implement rectangle-ellipse distance
  }

  distanceToShape(shape) {
    return Math.sqrt(this.distanceSquaredToShape(shape));
  }

  distanceSquaredToShape(shape) {
    if (shape.isEllipse) { return this.distanceSquaredToEllipse(shape); } else { return this.distanceSquaredToRectangle(shape); }
  }

  containsPoint(p, withRotation) {
    if (withRotation == null) { withRotation = true; }
    if (withRotation && this.rotation) {
      return !this.distanceToPoint(p);
    } else {
      return (this.x - (this.width / 2) < p.x && p.x < this.x + (this.width / 2)) && (this.y - (this.height / 2) < p.y && p.y < this.y + (this.height / 2));
    }
  }

  intersectsLineSegment(p1, p2) {
    let [px1, py1, px2, py2] = Array.from([p1.x, p1.y, p2.x, p2.y]);
    const m1 = (py1 - py2) / (px1 - px2);
    const b1 = py1 - (m1 * px1);
    const vertices = this.vertices();
    const lineSegments = [[vertices[0], vertices[1]], [vertices[1], vertices[2]], [vertices[2], vertices[3]], [vertices[3], vertices[0]]];
    for (let lineSegment of Array.from(lineSegments)) {
      [px1, py1, px2, py2] = Array.from([p1.x, p1.y, p2.x, p2.y]);
      const m2 = (py1 - py2) / (px1 - px2);
      const b2 = py1 - (m * px1);
      if (m1 !== m2) {
        var m = m1 - m2;
        const b = b2 - b1;
        const x = b / m;
        const [littleX, bigX] = Array.from(px1 < px2 ? [px1, px2] : [px2, px1]);
        if ((x >= littleX) && (x <= bigX)) {
          const y = (m1 * x) + b1;
          const [littleY, bigY] = Array.from(py1 < py2 ? [py1, py2] : [py2, py1]);
          if ((littleY <= solution) && (bigY >= solution)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  intersectsRectangle(rectangle) {
    if (this.containsPoint(rectangle.getPos())) { return true; }
    for (let thisLineSegment of Array.from(this.lineSegments())) {
      for (let thatLineSegment of Array.from(rectangle.lineSegments())) {
        if (thisLineSegment.intersectsLineSegment(thatLineSegment)) {
          return true;
        }
      }
    }
    return false;
  }

  intersectsEllipse(ellipse) {
    if (this.containsPoint(ellipse.getPos())) { return true; }
    for (let lineSegment of Array.from(this.lineSegments())) { if (ellipse.intersectsLineSegment(lineSegment.a, lineSegment.b)) { return true; } }
    return false;
  }

  intersectsShape(shape) {
    if (shape.isEllipse) { return this.intersectsEllipse(shape); } else { return this.intersectsRectangle(shape); }
  }

  subtract(point) {
    this.x -= point.x;
    this.y -= point.y;
    this.pos.subtract(point);
    return this;
  }

  add(point) {
    this.x += point.x;
    this.y += point.y;
    this.pos.add(point);
    return this;
  }

  divide(n) {
    [this.width, this.height] = Array.from([this.width / n, this.height / n]);
    return this;
  }

  multiply(n) {
    [this.width, this.height] = Array.from([this.width * n, this.height * n]);
    return this;
  }

  isEmpty() {
    return (this.width === 0) && (this.height === 0);
  }

  invalid() {
    return (this.x === Infinity) || isNaN(this.x) || (this.y === Infinity) || isNaN(this.y) || (this.width === Infinity) || isNaN(this.width) || (this.height === Infinity) || isNaN(this.height) || (this.rotation === Infinity) || isNaN(this.rotation);
  }

  toString() {
    return `{x: ${this.x.toFixed(0)}, y: ${this.y.toFixed(0)}, w: ${this.width.toFixed(0)}, h: ${this.height.toFixed(0)}, rot: ${this.rotation.toFixed(3)}}`;
  }

  serialize() {
    return {CN: this.constructor.className, x: this.x, y: this.y, w: this.width, h: this.height, r: this.rotation};
  }

  static deserialize(o, world, classMap) {
    return new Rectangle(o.x, o.y, o.w, o.h, o.r);
  }

  serializeForAether() { return this.serialize(); }
  static deserializeFromAether(o) { return this.deserialize(o); }
}
Rectangle.initClass();

module.exports = Rectangle;
