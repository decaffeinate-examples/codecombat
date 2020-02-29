/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// TODO: this thing needs a bit of thinking/testing for grid square alignments, exclusive vs. inclusive mins/maxes, etc.

let Grid;
module.exports = (Grid = class Grid {
  constructor(thangs, width, height, padding, left, bottom, rogue) {
    this.width = width;
    this.height = height;
    if (padding == null) { padding = 0; }
    this.padding = padding;
    if (left == null) { left = 0; }
    this.left = left;
    if (bottom == null) { bottom = 0; }
    this.bottom = bottom;
    if (rogue == null) { rogue = false; }
    this.rogue = rogue;
    this.width = Math.ceil(this.width);
    this.height = Math.ceil(this.height);
    this.left = Math.floor(this.left);
    this.bottom = Math.floor(this.bottom);
    this.update(thangs);
  }

  update(thangs) {
    let x, y;
    let asc, end;
    let t;
    this.grid = [];
    for (y = 0, end = this.height, asc = 0 <= end; asc ? y <= end : y >= end; asc ? y++ : y--) {
      var asc1, end1;
      this.grid.push([]);
      for (x = 0, end1 = this.width, asc1 = 0 <= end1; asc1 ? x <= end1 : x >= end1; asc1 ? x++ : x--) {
        this.grid[y].push([]);
      }
    }
    if (this.rogue) {
      thangs = ((() => {
        const result = [];
        for (t of Array.from(thangs)) {           if (t.collides || ((t.spriteName === 'Gem') && !t.dead)) {
            result.push(t);
          }
        }
        return result;
      })());
    } else {
      thangs = ((() => {
        const result1 = [];
        for (t of Array.from(thangs)) {           if (t.collides) {
            result1.push(t);
          }
        }
        return result1;
      })());
    }
    return (() => {
      const result2 = [];
      for (var thang of Array.from(thangs)) {
        const rect = thang.rectangle();
        var [minX, maxX, minY, maxY] = Array.from([9001, -9001, 9001, -9001]);
        for (let v of Array.from(rect.vertices())) {
          minX = Math.min(minX, v.x - this.padding);
          minY = Math.min(minY, v.y - this.padding);
          maxX = Math.max(maxX, v.x + this.padding);
          maxY = Math.max(maxY, v.y + this.padding);
        }
        result2.push((() => {
          const result3 = [];
          for (y of Array.from(this.columns(minY, maxY))) {
            result3.push((() => {
              const result4 = [];
              for (x of Array.from(this.rows(minX, maxX))) {
                result4.push(this.grid[y][x].push(thang));
              }
              return result4;
            })());
          }
          return result3;
        })());
      }
      return result2;
    })();
  }

  contents(gx, gy, width, height) {
    if (width == null) { width = 1; }
    if (height == null) { height = 1; }
    const thangs = [];
    for (let y of Array.from(this.columns(gy - (height / 2), gy + (height / 2)))) {
      for (let x of Array.from(this.rows(gx - (width / 2), gx + (width / 2)))) {
        for (let thang of Array.from(this.grid[y][x])) {
          if (thang.collides && !(Array.from(thangs).includes(thang)) && (thang.id !== 'Add Thang Phantom')) { thangs.push(thang); }
        }
      }
    }
    return thangs;
  }

  clampColumn(y) {
    y = Math.max(0, Math.floor(y) - this.bottom);
    return Math.min(this.grid.length, Math.ceil(y) - this.bottom);
  }

  clampRow(x) {
    x = Math.max(0, Math.floor(x) - this.left);
    return Math.min((this.grid[0] != null ? this.grid[0].length : undefined) || 0, Math.ceil(x) - this.left);
  }

  columns(minY, maxY) {
    return __range__(this.clampColumn(minY), this.clampColumn(maxY), false);
  }

  rows(minX, maxX) {
    return __range__(this.clampRow(minX), this.clampRow(maxX), false);
  }

  toString(rogue) {
    if (rogue == null) { rogue = false; }
    const upsideDown = _.clone(this.grid);
    upsideDown.reverse();
    return (Array.from(upsideDown).map((row) => (Array.from(row).map((thangs) => this.charForThangs(thangs, rogue))).join(' '))).join("\n");
  }

  charForThangs(thangs, rogue) {
    if (!rogue) { return thangs.length || ' '; }
    if (!thangs.length) { return '.'; }
    if (_.find(thangs, t => /Hero Placeholder/.test(t.id))) { return '@'; }
    if (_.find(thangs, {spriteName: 'Spike Walls'})) { return '>'; }
    if (_.find(thangs, {spriteName: 'Fence Wall'})) { return 'F'; }
    if (_.find(thangs, {spriteName: 'Fire Trap'})) { return 'T'; }
    if (_.find(thangs, {spriteName: 'Dungeon Wall'})) { return ' '; }
    if (_.find(thangs, {spriteName: 'Gem'})) { return 'G'; }
    if (_.find(thangs, {spriteName: 'Treasure Chest'})) { return 'C'; }
    if (_.find(thangs, {spriteName: 'Spear'})) { return '*'; }
    if (_.find(thangs, {type: 'munchkin'})) { return 'o'; }
    if (_.find(thangs, t => t.team === 'ogres')) { return 'O'; }
    if (_.find(thangs, t => t.team === 'humans')) { return 'H'; }
    if (_.find(thangs, t => t.team === 'neutral')) { return 'N'; }
    return '?';
  }
});

function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}