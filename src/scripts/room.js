
import objectTypes from './objects';
import {SQUARE_SIZE} from './const';
import Grid from './utils/grid';
import {renderTerrain} from './terrain';
import parseColor from './utils/color';

function def(val, defaultVal) {
  if (val === undefined || val === null)
    return defaultVal;
  return val;
}

function V(n) {
  return Vr(n+0.5);
}
function Vr(n) {
  return n * SQUARE_SIZE;
}

const fontRe = /^\s*(?=(?:(?:[-a-z]+\s*){0,2}(italic|oblique))?)(?=(?:(?:[-a-z]+\s*){0,2}(small-caps))?)(?=(?:(?:[-a-z]+\s*){0,2}(bold(?:er)?|lighter|[1-9]00))?)(?:(?:normal|\1|\2|\3)\s*){0,3}((?:xx?-)?(?:small|large)|medium|smaller|larger|[.\d]+(?:\%|in|[cem]m|ex|p[ctx])?)(?:\s*\/\s*(normal|[.\d]+(?:\%|in|[cem]m|ex|p[ctx])))?\s*([-,\"\sa-z]+?)\s*$/i;
function parseFont(font) {
  var parts = fontRe.exec( font );
  if (!parts) {
    console.log("parseFont failed: ", font);
    return {};
  }
  var f = {};
  f.fontStyle   = parts[1] || 'normal';
  f.fontVariant = parts[2] || 'normal';
  f.fontWeight  = parts[3] || 'normal';
  f.fontSize    = parts[4];
  f.lineHeight  = parts[5];
  f.fontFamily  = parts[6];
  return f;
}

const unhandled  = {};

export class Room {
  constructor(screeps, name) {
    this.name = name;

    this.g = new PIXI.Container();
    // stage.addChild(this.g);
    this.g.scale.set(15 / SQUARE_SIZE, 15 / SQUARE_SIZE);

    this.terrainG = new PIXI.Graphics();
    // terrainG.cacheAsBitmap = true; // renders as black?
    this.g.addChild(this.terrainG);

    let layers = [
      'road', 
      'constructedWall',
      'constructionSite',
      'container', 
      'energy', 
      'extension', 
      'mineral', 
      'source', 
      'controller',
      'spawn', 
      'storage', 
      'tower', 
      'lab', 
      'link', 
      'creep', 
      'rampart',
      'unknown'
    ];
    this.layers = {};
    for (let layer of layers) {
      let l = new PIXI.Container();
      // l.scale.set(10 / SQUARE_SIZE, 10 / SQUARE_SIZE);
      this.layers[layer] = {container: l, grid: new Grid(50, 50)};
      this.g.addChild(l);
    }

    this.layers['rampart'].container.alpha = 0.6;
    // this.layers['rampart'].container.cacheAsBitmap = true;

    this.roomVisualC = new PIXI.Container();
    this.g.addChild(this.roomVisualC);

    this.roomObjects = {};

    
    screeps.roomTerrain(name, true).then(t =>{
      console.log("terrain", name, t);
      if (!t) return;
      
      if (t.error) {
        console.log("terrain error", t.error, name);
        return;
      }
      renderTerrain(this.terrainG, t.terrain[0].terrain);
    });
  }

  renderVisuals(roomVisuals) {
    const c = this.roomVisualC;

    if (c.__ob__) console.log("room.roomVisual is observed by Vue! This will affect performance!");

    c.removeChildren();
    let visuals = roomVisuals.split('\n').filter(x=>x);
    // console.log('visuals', visuals.length);
    let g = new PIXI.Graphics();
    c.addChild(g);
    let n = 0;
    for (let vs of visuals) {
      let v = JSON.parse(vs);
      if (!v.s) v.s = {};
      var color, fill, stroke, transparent, alpha;

      if (++n > 100) {
        g = new PIXI.Graphics();
        c.addChild(g);
        n = 0;
      }

      switch (v.t) {
        case 't': // text
          alpha = def(v.s.opacity, 1);
          let textStyle = new PIXI.TextStyle();
          textStyle.fill = parseColor(def(v.s.color, '#ffffff'));
          textStyle.stroke = v.s.stroke? parseColor(v.s.stroke) : undefined;
          textStyle.strokeThickness = v.s.stroke !== undefined? Vr(def(v.s.strokeWidth, 0.15)) : 0;
          textStyle.align = def(v.s.align, 'center');
          let baseline = /*textStyle.textBaseline =*/ v.s.background? 'middle' : 'baseline';
          let font = parseFont(def(v.s.font, '0.7 sans-serif'));
          if (/^[.\d]+$/.exec(font.fontSize)) {
            font.fontSize = SQUARE_SIZE * font.fontSize + "px";
          }
          Object.assign(textStyle, font);
          // console.log('font', textStyle.textBaseline, textStyle);
          // textStyle.font = def(v.s.font, "");

          let background = v.s.background? parseColor(v.s.background) : undefined;


          let text = new PIXI.Text(v.text, textStyle);
          text.position.set(V(v.x), V(v.y));
          text.anchor.set(
            def({left: 0, center: 0.5, right: 1}[textStyle.align], 0), 
            def({baseline: 1, middle: 0.5}[baseline], 0))
          // console.log('anchor', def({left: 0, center: 0.5, right: 1}[textStyle.align], 0), 
          //   def({baseline: 1, middle: 0.5}[baseline], 0), textStyle.align, baseline);

          if (background !== undefined) {
            let padding = def(v.s.backgroundPadding, 0.3);
            let bg = new PIXI.Graphics();
            bg.beginFill(background);
            bg.drawRoundedRect(-padding, -padding, text.width+2*padding, text.height+2*padding, 0.1);
            bg.endFill();

            bg.position.set(
              text.position.x - text.width * text.anchor.x, 
              text.position.y - text.height * text.anchor.y);

            let tc = new PIXI.Container();
            tc.addChild(bg);
            tc.addChild(text);
            tc.alpha = alpha;

            c.addChild(tc);
          } else {
            
            text.alpha = alpha;
            c.addChild(text);
          }
          break;

        case 'l': // line
          // TODO: lineStyle undefined|'dashed'|'dotted'
          color = parseColor(def(v.s.color, '#ffffff'));
          g.lineStyle(Vr(def(v.s.width, 0.1)), color, def(v.s.opacity, 0.5));
          g.moveTo(V(v.x1), V(v.y1));
          g.lineTo(V(v.x2), V(v.y2));
          break;

        case 'r': // rect
          // TODO: lineStyle undefined|'dashed'|'dotted'
          fill = parseColor(def(v.s.fill, '#ffffff'));
          stroke = v.s.stroke && parseColor(v.s.stroke);
          transparent = v.s.fill === 'transparent' || v.s.fill === '';
          alpha = def(v.s.opacity, 0.5);
          if (v.s.stroke)
            g.lineStyle(Vr(def(v.s.strokeWidth, 0.1)), stroke, alpha);
          else 
            g.lineStyle(0, 0, 0);
          if (!transparent)
            g.beginFill(fill, alpha);
          g.drawRect(V(v.x), V(v.y), Vr(v.w), Vr(v.h));
          if (!transparent)
            g.endFill();
          break;

        case 'c': // circle
          // TODO: lineStyle undefined|'dashed'|'dotted'
          fill = parseColor(def(v.s.fill, '#ffffff'));
          stroke = parseColor(def(v.s.stroke, '#ffffff'));
          transparent = v.s.fill === 'transparent' || v.s.fill === '';
          alpha = def(v.s.opacity, 0.5);
          if (v.s.stroke)
            g.lineStyle(Vr(def(v.s.strokeWidth, 0.1)), stroke, alpha);
          else 
            g.lineStyle(0, 0, 0);
          if (!transparent)
            g.beginFill(fill, alpha);
          g.drawCircle(V(v.x), V(v.y), Vr(def(v.s.radius, 0.15)));
          if (!transparent)
            g.endFill();
          break;

        case 'p': // polyline
          // TODO: lineStyle undefined|'dashed'|'dotted'
          color = parseColor(def(v.s.color, '#ffffff'));
          g.lineStyle(Vr(def(v.s.width, 0.1)), color, def(v.s.opacity, 0.5));
          g.moveTo(V(v.points[0][0]), V(v.points[0][1]));
          for (let i = 1; i < v.points.length; i++) {
            let p = v.points[i];
            g.lineTo(V(p[0]), V(p[1]));
          }
          break;

        default:
          if (!unhandled[v.t]) {
            unhandled[v.t] = true;
            console.log("Unhandled visual: ", v);
          }
      }
    }
  }

  updateRoom(room) {
    if (room.visual) {
      this.renderVisuals(room.visual);
    }
    for (let id in room.objects) {
      let obj = room.objects[id];


      let robj = this.roomObjects[id];


      if (obj === null) {
        if (robj)
          robj.g.parent.removeChild(robj.g);
        delete this.roomObjects[id];
        continue;
      }

      let created = false;
      let type = 'unknown';
        
      if (!robj) {
        if (!obj.type) continue; // diff of object we don't have

        if (this.layers[obj.type])
          type = obj.type;
        else {
          console.log('unknown object type: ', obj.type, obj);
          type = obj.type;
          objectTypes[type] = objectTypes['unknown'];
          this.layers[type] = this.layers['unknown'];
        }

        let objType = objectTypes[type];
        // if (!objType) {
        //   console.log("unknown object: ", obj);
        //   continue;
        //   // objType = objectTypes.unknown;
        // }

        robj = new objType(obj);
        this.roomObjects[id] = robj;
        this.layers[type].container.addChild(robj.g);

        created = true;
      }
      else if (robj.obj.type in objectTypes)
        type = robj.obj.type;


      robj.update(obj, this);

      if (created || robj.lastObj.x !== robj.obj.x 
            || robj.lastObj.y !== robj.obj.y) {
        let grid = this.layers[type].grid;
        grid.set(robj.lastObj.x, robj.lastObj.y, undefined);
        grid.set(robj.obj.x, robj.obj.y, robj);
      }
    }
  }

  preRender(timestamp) {

    for (let id in this.roomObjects) {
      let robj = this.roomObjects[id];

      robj.preRender(timestamp, this);
    }

  }
}
