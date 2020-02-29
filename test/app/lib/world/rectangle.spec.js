/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('Rectangle', function() {
  const Rectangle = require('lib/world/rectangle');
  const Vector = require('lib/world/vector');
  const Ellipse = require('lib/world/ellipse');

  it('contains its own center', function() {
    const rect = new Rectangle(0, 0, 10, 10);
    return expect(rect.containsPoint(new Vector(0, 0))).toBe(true);
  });

  it('contains a point when rotated', function() {
    const rect = new Rectangle(0, -20, 40, 40, (3 * Math.PI) / 4);
    const p = new Vector(0, 2);
    return expect(rect.containsPoint(p, true)).toBe(true);
  });

  it('correctly calculates distance to a faraway point', function() {
    const rect = new Rectangle(100, 50, 20, 40);
    const p = new Vector(200, 300);
    let d = 10 * Math.sqrt(610);
    expect(rect.distanceToPoint(p)).toBeCloseTo(d);
    rect.rotation = Math.PI / 2;
    d = 80 * Math.sqrt(10);
    return expect(rect.distanceToPoint(p)).toBeCloseTo(d);
  });

  it('does not modify itself or target Vector when calculating distance', function() {
    const rect = new Rectangle(-100, -200, 1, 100);
    const rect2 = rect.copy();
    const p = new Vector(-100.25, -101);
    const p2 = p.copy();
    rect.distanceToPoint(p);
    expect(p.x).toEqual(p2.x);
    expect(p.y).toEqual(p2.y);
    expect(rect.x).toEqual(rect2.x);
    expect(rect.y).toEqual(rect2.y);
    expect(rect.width).toEqual(rect2.width);
    expect(rect.height).toEqual(rect2.height);
    return expect(rect.rotation).toEqual(rect2.rotation);
  });

  it('correctly calculates distance to contained point', function() {
    const rect = new Rectangle(-100, -200, 1, 100);
    const rect2 = rect.copy();
    const p = new Vector(-100.25, -160);
    const p2 = p.copy();
    expect(rect.distanceToPoint(p)).toBe(0);
    rect.rotation = 0.00000001 * Math.PI;
    return expect(rect.distanceToPoint(p)).toBe(0);
  });

  it('correctly calculates distance to other rectangles', function() {
    expect(new Rectangle(0, 0, 4, 4, Math.PI / 4).distanceToRectangle(new Rectangle(4, -4, 2, 2, 0))).toBeCloseTo(2.2426);
    expect(new Rectangle(0, 0, 3, 3, 0).distanceToRectangle(new Rectangle(0, 0, 2, 2, 0))).toBe(0);
    expect(new Rectangle(0, 0, 3, 3, 0).distanceToRectangle(new Rectangle(0, 0, 2.5, 2.5, Math.PI / 4))).toBe(0);
    expect(new Rectangle(0, 0, 4, 4, 0).distanceToRectangle(new Rectangle(4, 2, 2, 2, 0))).toBe(1);
    return expect(new Rectangle(0, 0, 4, 4, 0).distanceToRectangle(new Rectangle(4, 2, 2, 2, Math.PI / 4))).toBeCloseTo(2 - Math.SQRT2);
  });

  it('has predictable vertices', function() {
    const rect = new Rectangle(50, 50, 100, 100);
    const v = rect.vertices();
    expect(v[0].x).toEqual(0);
    expect(v[0].y).toEqual(0);
    expect(v[1].x).toEqual(0);
    expect(v[1].y).toEqual(100);
    expect(v[2].x).toEqual(100);
    expect(v[2].y).toEqual(100);
    expect(v[3].x).toEqual(100);
    return expect(v[3].y).toEqual(0);
  });

  it('has predictable vertices when rotated', function() {
    const rect = new Rectangle(50, 50, 100, 100, Math.PI / 4);
    const v = rect.vertices();
    const d = (Math.sqrt(2 * 100 * 100) - 100) / 2;
    expect(v[0].x).toBeCloseTo(-d);
    expect(v[0].y).toBeCloseTo(50);
    expect(v[1].x).toBeCloseTo(50);
    expect(v[1].y).toBeCloseTo(100 + d);
    expect(v[2].x).toBeCloseTo(100 + d);
    expect(v[2].y).toBeCloseTo(50);
    expect(v[3].x).toBeCloseTo(50);
    return expect(v[3].y).toBeCloseTo(-d);
  });

  it('is its own AABB when not rotated', function() {
    const rect = new Rectangle(10, 20, 30, 40);
    const aabb = rect.axisAlignedBoundingBox();
    return ['x', 'y', 'width', 'height'].map((prop) =>
      expect(rect[prop]).toBe(aabb[prop]));
});

  it('is its own AABB when rotated 180', function() {
    const rect = new Rectangle(10, 20, 30, 40, Math.PI);
    const aabb = rect.axisAlignedBoundingBox();
    return ['x', 'y', 'width', 'height'].map((prop) =>
      expect(rect[prop]).toBe(aabb[prop]));
});

  it('calculates rectangle intersections properly', function() {
    const rect = new Rectangle(1, 1, 2, 2, 0);
    expect(rect.intersectsShape(new Rectangle(3, 1, 2, 2, 0))).toBe(true);
    expect(rect.intersectsShape(new Rectangle(3, 3, 2, 2, 0))).toBe(true);
    expect(rect.intersectsShape(new Rectangle(1, 1, 2, 2, 0))).toBe(true);
    expect(rect.intersectsShape(new Rectangle(1, 1, Math.SQRT1_2, Math.SQRT1_2, Math.PI / 4))).toBe(true);
    expect(rect.intersectsShape(new Rectangle(4, 1, 2, 2, 0))).toBe(false);
    expect(rect.intersectsShape(new Rectangle(3, 4, 2, 2, 0))).toBe(false);
    expect(rect.intersectsShape(new Rectangle(1, 4, 2 * Math.SQRT1_2, 2 * Math.SQRT1_2, Math.PI / 4))).toBe(false);
    expect(rect.intersectsShape(new Rectangle(3, 1, 2, 2, Math.PI / 4))).toBe(true);
    return expect(rect.intersectsShape(new Rectangle(1, 2, 2 * Math.SQRT2, 2 * Math.SQRT2, Math.PI / 4))).toBe(true);
  });

  return it('calculates ellipse intersections properly', function() {
    const rect = new Rectangle(1, 1, 2, 2, 0);
    expect(rect.intersectsShape(new Ellipse(1, 1, Math.SQRT1_2, Math.SQRT1_2, Math.PI / 4))).toBe(true);
    expect(rect.intersectsShape(new Ellipse(4, 1, 2, 2, 0))).toBe(false);
    expect(rect.intersectsShape(new Ellipse(3, 4, 2, 2, 0))).toBe(false);
    return expect(rect.intersectsShape(new Ellipse(1, 4, 2 * Math.SQRT1_2, 2 * Math.SQRT1_2, Math.PI / 4))).toBe(false);
  });
});
