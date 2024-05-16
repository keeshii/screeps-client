import GameObject from './gameObject';
import {S} from '../const';

export default class Storage extends GameObject {
	constructor(obj) {
		super(obj);

		this.g = new PIXI.Graphics();
	}

	update(dobj, room) {
		let obj = super.update(dobj, room);

		let g = this.g;

		let m = S(5);
		let w = S(5);
		let h = S(12);
		let hy = (S(10)-h)/2;

		let ox = S(6);
		let oy = S(7);

		g.lineStyle(2, 0x666666, 1);
		g.beginFill(0x000000);
		g.moveTo(m-ox, m-oy);
		g.arcTo(m, m-(oy + S(2)), m+ox, m-oy, S(19));
		g.lineTo(m+ox, m-oy);
		g.arcTo(m+(ox+S(2)), m, m+ox, m+oy, S(25));
		g.lineTo(m+ox, m+oy);
		g.arcTo(m, m+(oy + S(2)), m-ox, m+oy, S(19));
		g.lineTo(m-ox, m+oy);
		g.arcTo(m-(ox+S(2)), m, m-ox, m-oy, S(25));
		g.endFill();

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
