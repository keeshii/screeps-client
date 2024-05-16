import GameObject from './gameObject';
import {S, TWEEN_DURATION} from '../const';
import {tween, tweenRotation, interp} from '../tween';
import {actionLine} from '../actions';

export default class Tower extends GameObject {
	constructor(obj) {
		super(obj);
		this.g = new PIXI.Container();
		this.graphics = new PIXI.Graphics();
		this.g.addChild(this.graphics);

		this.graphics.position.set(S(5), S(5));
		this.graphics.pivot.set(S(5), S(5));

		this.freeze = 0;
	}

	update(dobj, room) {
		let obj = super.update(dobj, room);

		let g = this.graphics;

		if (obj.actionLog) {
			for (let k in obj.actionLog) {
				let a = obj.actionLog[k];
				if (!a) continue;

				tweenRotation(TWEEN_DURATION/2, g, obj, obj.actionLog[k], Math.PI * 0.5);
				this.freeze = 2;

				switch (k) {
					case 'repair':
					case 'build':
						actionLine(room, k, {x: obj.x, y: obj.y}, a);
						break;
					case 'heal':
						actionLine(room, k, {x: obj.x, y: obj.y}, a, 0x00FF00);
						break;
					case 'attack':
						actionLine(room, k, {x: obj.x, y: obj.y}, a, 0x0000FF);
						break;

					default:
						console.log("tower actionLog", k, a, this);
				}
			}
		}



		const m = S(5); // middle
		const r = S(7); // radius

		g.clear();
		g.lineStyle(2, 0xffffff, 1);
		g.beginFill(0x000000);
		g.drawCircle(m, m, r);
		g.endFill();

		const rr = S(1); // round radius
		const h = S(7); // body height
		const w = S(5); // body width
		const y = S(2); // body y offset

		g.lineStyle(0, 0x000000, 1);
		g.beginFill(0x888888);
		g.drawRoundedRect(m-w, y, 2*w, h, rr);
		g.endFill();

		g.lineStyle(0, 0, 0);
		g.beginFill(0xffff00);

                let energy = obj.store ? obj.store['energy'] : obj.energy;
                let energyCapacity = obj.store ? obj.storeCapacityResource['energy'] : obj.energyCapacity;
		let height = (h-2) * energy / energyCapacity;
		g.drawRoundedRect(m-w+0.5, y + h - height-1, 2*w-1, height, rr);
		g.endFill();


		const tw = S(2.5); // turret width
		const th = S(7); // turret height

		g.lineStyle(1, 0x000000, 1);
		g.beginFill(0x888888);
		g.drawRoundedRect(m-tw, y-th, 2*tw, th, rr);
		g.endFill();
	}




	preRender(ts) {
		super.preRender(ts);

		if (this.freeze > 0)
			this.freeze -= 0.01;
		else
			this.graphics.rotation += 0.008;
	}
}
