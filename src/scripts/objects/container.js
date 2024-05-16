import GameObject from './gameObject';
import {S} from '../const';

export default class Container extends GameObject {
	constructor(obj) {
		super(obj);

		this.g = new PIXI.Graphics();
	}

	update(dobj, room) {
		let obj = super.update(dobj, room);

		let g = this.g;

		let m = S(5);
		let w = S(2.4);
		let h = S(6);
		let hy = (S(10)-h)/2;

		g.lineStyle(1, 0x000000, 1);
		g.beginFill(0x666666);
		g.drawRect(m-w, hy, 2*w, h);
		g.endFill();

		g.lineStyle(0, 0, 0);
		g.beginFill(0xffff00);

                let energy = obj.store ? obj.store['energy'] : obj.energy;
                let energyCapacity = obj.storeCapacity ? obj.storeCapacity : obj.energyCapacity;
		let height = (h-2) * energy / energyCapacity;
		g.drawRect(m-w+0.5, h+hy - height-1, 2*w-1, height);
		g.endFill();
	}
}
