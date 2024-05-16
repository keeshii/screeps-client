import GameObject from './gameObject';
import {S} from '../const';

export default class Extension extends GameObject {
	constructor(obj) {
		super(obj);

		this.g = new PIXI.Graphics();
	}

	update(dobj, room) {
		let obj = super.update(dobj, room);

		let g = this.g;

		g.clear();
		g.lineStyle(1, 0xffffff, 1);
		g.drawCircle(S(5), S(5), S(4));

		g.lineStyle(0, 0, 0);
		g.beginFill(0xffff00);

                let energy = obj.store ? obj.store['energy'] : obj.energy;
                let energyCapacity = obj.store ? obj.storeCapacityResource['energy'] : obj.energyCapacity;
		let e = (S(4) - 2) * Math.sqrt(energy / energyCapacity);
		if (e > 0) e = Math.max(1, e);
		g.drawCircle(S(5), S(5), e);
		g.endFill();
	}
}
