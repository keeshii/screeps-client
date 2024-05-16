import GameObject from './gameObject';
import {S} from '../const';
import {actionLine} from '../actions';

export default class Link extends GameObject {
  constructor(obj) {
    super(obj);
    this.g = new PIXI.Graphics();
  }

  update(dobj, room) {
    let obj = super.update(dobj, room);

    let g = this.g;


    if (obj.actionLog) {
      for (let k in obj.actionLog) {
        let a = obj.actionLog[k];
        if (!a) continue;

        switch (k) {
          case 'transferEnergy':
            actionLine(room, k, {x: obj.x, y: obj.y}, a);
            break;

          default:
            console.log("link actionLog", k, a, this);
        }
      }
    }

    const m = S(5);
    const v = S(7);
    const h = S(5);

    function diamond(fill, c) {
      g.beginFill(fill);
      g.moveTo(m, m - v*c);
      g.lineTo(m + h*c, m);
      g.lineTo(m, m + v*c);
      g.lineTo(m - h*c, m);
      g.closePath();
      g.endFill();
    }


    g.clear();

    g.lineStyle(1, 0xffcccc, 1);
    diamond(0x000000, 1);

    g.lineStyle(0, 0x000000, 0);
    diamond(0x555555, 0.7);

    let energy = obj.store ? obj.store['energy'] : obj.energy;
    let energyCapacity = obj.store ? obj.storeCapacityResource['energy'] : obj.energyCapacity;
    diamond(0xffee66, 0.7 * energy / energyCapacity);
    
  }
}
