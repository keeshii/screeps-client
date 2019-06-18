import GameObject from './gameObject';
import {S} from '../const';
import {clampXYf, neighbors, renderSquare} from '../terrain';

export default class ConstructionSite extends GameObject {
  constructor(obj) {
    super(obj);

    this.g = new PIXI.Graphics();
    this.alphaDiff = 0.005;
  }

  update(dobj, room) {
    let obj = super.update(dobj, room);

    let g = this.g;

    g.clear();
    g.lineStyle(2, 0x708f73);
    g.drawCircle(S(5), S(5), S(3));

    g.lineStyle(0, 0, 0);
    if (obj.progress > 0) {
      g.beginFill(0x708f73);
      g.moveTo(S(5), S(5));
      g.lineTo(S(8), S(5));
      let end = 2 * Math.PI * obj.progress / obj.progressTotal;
      g.arc(S(5), S(5), S(3), 0, end);
      g.lineTo(S(5), S(5));
      g.endFill();
    }
  }

  preRender(ts) {
    // blinking, slowly
    let alpha = this.g.alpha;
    alpha += this.alphaDiff;
    if (alpha > 1 || alpha < 0.5) {
      alpha = alpha > 1 ? 1 : alpha;
      alpha = alpha < 0.5 ? 0.5 : alpha;
      this.alphaDiff = -this.alphaDiff;
    }
    this.g.alpha = alpha;
  }
}
