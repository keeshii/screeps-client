import GameObject from './gameObject';
import {S} from '../const';
import {arc} from '../utils/arc';


const {sin, cos, PI, sqrt} = Math;

export default class Lab extends GameObject {
	constructor(obj) {
		super(obj);

		this.g = new PIXI.Graphics();
	}

	update(dobj, room) {
		let obj = super.update(dobj, room);

		let g = this.g;

		let m = S(5); // middle
		let r = S(6); // radius
		let i = S(1.1); // inset

		// let wh = S(3); // rectangle half-width
		let h = S(1.7); // rectangle height
                let ry = -S(0.5); // overlap the rectangle

		let droopAngle = PI/4; // angle to drop below the center line
		let wh = r*sin(droopAngle); // rectangle half-width
		let y = m + r*cos(droopAngle); // rectangle top


		// outline and black background
		g.clear();
		g.lineStyle(1.5, 0xdd0000, 1);
		g.beginFill(0x000000);
		arc(g, m, m, r, PI-droopAngle, droopAngle);
		// g.drawRect(m-wh, y, wh*2, h);
		g.lineTo(m+wh, y+h+ry);
		g.lineTo(m-wh, y+h+ry);
		g.lineTo(m-wh, y);
		g.closePath();
		g.endFill();

		let iy = m + (r-i)*cos(droopAngle);

		// gray inset
		g.lineStyle(0, 0, 0);
		g.beginFill(0x666666);
		arc(g, m, m, r-i, PI-droopAngle, droopAngle);
		// g.closePath();
		g.endFill();

		// mineral fill
		let fillRadius = (r-i) * 0.4//sqrt(obj.mineralAmount / obj.mineralCapacity);
		let fillDroopY = fillRadius * cos(droopAngle);
		g.lineStyle(0, 0, 0);
		g.beginFill(0xffffff);
		arc(g, m, iy - fillDroopY, fillRadius, PI-droopAngle, droopAngle);
		g.endFill();

		// energy fill
                let energy = obj.store ? obj.store['energy'] : obj.energy;
                let energyCapacity = obj.store ? obj.storeCapacityResource['energy'] : obj.energyCapacity;
		let e = energy / energyCapacity;
		let mehw = wh - 3; // max energy half-width
		let ehw = mehw * e; // energy half-width
		g.lineStyle(0, 0, 0);
		g.beginFill(0xffff00);
		g.drawRect(m-ehw, y+ry+2, ehw*2, h-5);
		g.endFill();
	}
}
