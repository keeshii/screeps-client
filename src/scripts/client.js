// import 'pixi.js/dist/pixi'; // TODO: Get imports working better with Rollup...

import {Room} from './room';
import {tween} from './tween';

console.log("PIXI: ", PIXI);

var type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}

PIXI.utils.sayHello(type);

/*
  Vue likes to observe anything that get stored in its instances,
  transitively all the way down. This has a bad effect on PIXI's 
  rendering speed, so we use Symbols to store the data instead,
  which Vue doesn't observe.
*/
export const ROOM = Symbol('ROOM');
export const RENDERER = Symbol('RENDERER');
export const STAGE = Symbol('STAGE');

export class ScreepsClient {
  constructor(screeps) {
    this.screeps = screeps;
    let renderer = this[RENDERER] = PIXI.autoDetectRenderer(256, 256, {antialias: true});

    // renderer.view.style.position = "absolute";
    renderer.view.style.display = "block";
    renderer.autoResize = true;

    this.render = true;

    // document.body.appendChild(renderer.view);

    this[STAGE] = new PIXI.Container();

    this.onMessage = this.onMessage.bind(this);
    this.onRoomUpdate = this.onRoomUpdate.bind(this);

    this.protocol = 0;

    this.money = null;
    this.cpuMemory = {cpu: 0, memory: 0};

    this.roomName = "";
    this.shards = null;
    this.rooms = null;

  }

  connect() {

    // screeps.on("console", line => console.log("console", line));
    // screeps.on("memory", line => console.log("memory", line));
    // screeps.on("code", line => console.log("code", line));
    // screeps.on("room", roomMsg => {
    //   console.log("room", roomMsg);
    //   room.updateRoom(roomMsg[1]);
    // });
    this.screeps.on("message", this.onMessage);


    return this.startScreepsConn();
  }

  disconnect() {
    this.screeps.removeListener("message", this.onMessage);
    this.run = false;
  }



  async startScreepsConn() {
    let screeps = this.screeps; 

    // await screeps.connect();
    this.me = await screeps.me();
    console.log('me', this.me);
    await screeps.socket();
  }

  async finishConnecting() {
    let screeps = this.screeps; 
    let me = this.me;

    screeps.subscribe('server-message', this.onServerMessage.bind(this));
    screeps.subscribe(`user:${me._id}/money`, this.onMoney.bind(this));
    screeps.subscribe(`user:${me._id}/cpu`, this.onCPU.bind(this));
    screeps.subscribe(`user:${me._id}/newMessage`, this.onNewMessage.bind(this));
    screeps.subscribe(`user:${me._id}/memory`, this.onMemory.bind(this));
    screeps.subscribe(`user:${me._id}/console`, this.onConsole.bind(this));
    screeps.subscribe(`user:${me._id}/set-active-branch`, this.onActiveBranch.bind(this));
    screeps.subscribe(`user:${me._id}/code`, this.onCode.bind(this));

    let apirooms = await screeps.rooms();
    console.log(apirooms);
    let {shards, rooms} = apirooms;

    if (!rooms)
      rooms = [];

    for (let shard in shards) {
      for (let room of shards[shard]) {
        rooms.push(shard + '/' + room);
      }
    }

    this.shards = shards;
    console.log('SHARDS', shards);
    this.rooms = rooms;
    console.log('ROOMS', rooms);

    if (this.roomName !== "")
      this.setRoom(this.roomName);

    requestAnimationFrame(ts => { this.gameLoop(ts); });
  }

  setRoom(roomName) {
    console.log('client setRoom', roomName);
    this.roomName = roomName;
    if (this[ROOM]){
      this.screeps.unsubscribe(`room:${this[ROOM].name}`, this.onRoomUpdate);
      this[STAGE].removeChild(this[ROOM].g);
      this[ROOM] = undefined;
    }

    if (roomName !== "") {
      // this.screeps.unsubscribe(`room:${roomName}`, this.onRoomUpdate);
      this.screeps.subscribe(`room:${roomName}`, this.onRoomUpdate);
      this[ROOM] = new Room(this.screeps, roomName);
      this[STAGE].addChild(this[ROOM].g);
    }
  }


  onMessage(msg) {
    if (typeof msg === "string"){
      if (msg.match(/^auth/)) {
        console.log("AUTH", msg);
        this.finishConnecting();
      } else if (msg.match(/^protocol/)) {
        console.log('PROTOCOL', msg.slice(9));
        this.protocol = +msg.slice(9);
      } else {
        console.log("message", JSON.stringify(msg));
      }
    } else {
      console.log("MESSAGE NOT STRING!", msg)
    }
  }


    onServerMessage(path, val) {

    }
    onMoney(path, val) {
      this.money = val;
    }
    onCPU(path, val) {
      this.cpuMemory = val;
    }
    onNewMessage(path, val) {
      console.log('newMessage', val);
    }
    onMemory(path, val) {
      console.log('memory', val);
    }
    onConsole(path, val) {

    }
    onActiveBranch(path, val) {
      console.log('activeBranch', val);
    }
    onCode(path, val) {
      console.log('code', val);
    }

    onRoomUpdate(path, val) {
      // console.log('ROOM', path, val);
      this[ROOM].updateRoom(val);
    }


  // let lastTimestamp;
  gameLoop(timestamp) {
    // console.log('render', timestamp);
    if (this.render) requestAnimationFrame(ts => this.gameLoop(ts));

    lastTimestamp = timestamp;

    // if (Math.random() < 0.01)
    //   console.log('timestamp', timestamp - performance.now());

    if (this[ROOM]) this[ROOM].preRender(timestamp);

    tween.update(timestamp);

    this[RENDERER].render(this[STAGE]);
  }
  // requestAnimationFrame(ts => { lastTimestamp = ts; gameLoop(ts); });

  resize(...args) {
    // console.log('client.resize', args);
    return this[RENDERER].resize(...args);
  }

  get view() {
    return this[RENDERER].view;
  }
}

export let lastTimestamp = 0;
