// import WebSocket from 'ws';
import { EventEmitter } from 'events';
import axios from 'axios/dist/axios';
import pako from 'pako';
import { Buffer } from 'buffer';

export class ScreepsAPI extends EventEmitter {
  set email(v) {
    this.opts.email = v;
  }

  set password(v) {
    this.opts.password = v;
  }

  constructor (opts) {
    super();
    opts = opts || {};
    this.opts = opts;
    if (opts.host && opts.port && opts.secure !== undefined)
      this.prefix = (opts.secure? 'https' : 'http') + '://' + opts.host + ":" + opts.port
    else
      this.prefix = opts.ptr ? 'https://screeps.com/ptr' : 'https://screeps.com'

    this.token = opts.token || '';
    this.email = opts.email || '';
    this.password = opts.password || '';
    this.user = null;
    this.ws = null;
    this.connected = false;
    this.socketAuth = false;
    this.shard = '';
  }

  async rawreq(method, path, body) {
    return await axios({
      url: this.prefix + path,
      json: true,
      method,
      headers: {
        'X-Token': this.token || undefined,
        'X-Username': this.token || undefined
      },
      data: method == 'POST' ? body : undefined || undefined,
      params: method == 'GET' ? body : undefined || undefined
    });
  }

  async req(method, path, body) {
    if (!this.token && !this.email) {
      throw new Error('No authentication credentials provided');
    }

    try {
      let res = await this.rawreq(method, path, body);

      if (res.status == 200) {
        if (res.headers['x-token'])
          this.token = res.headers['x-token']
      }

      return res;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        throw new Error('Unauthorized: Invalid credentials');
      }
      throw error;
    }
  }

  async basicAuthReq(method, path, body) {
    // Username/password auth for private servers
    if (!this.email || !this.password) {
      throw new Error('Email and password required for basic authentication');
    }

    try {
      let res = await axios({
        url: this.prefix + path,
        json: true,
        method,
        auth: {
          username: this.email,
          password: this.password
        },
        data: method == 'POST' ? body : undefined || undefined,
        params: method == 'GET' ? body : undefined || undefined
      });

      if (res.status == 200) {
        if (res.headers['x-token'])
          this.token = res.headers['x-token']
      }

      return res;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        throw new Error('Unauthorized: Invalid email or password');
      }
      throw error;
    }
  }

  connect() {
    console.log('connect')
    if (!this.token && !this.email) {
      return Promise.reject(new Error('No credentials provided'));
    }
    return this.me().then(() => true);
  }
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
      this.socketAuth = false;
    }
  }
  auth(email, password) {
    this.email = email;
    this.password = password;
    return this.signin();
  }
  authToken(token) {
    this.token = token;
    return this.me();
  }
  async register(username, email, password, serverPassword) {
    let res = await this.rawreq('POST', '/api/register/submit', {username, email, password, serverPassword});
    return res.data;
  }



  async signin() {
    // Sign in with username/password to get token (for private servers)
    if (!this.email || !this.password) {
      throw new Error('Email and password required');
    }
    let res = await this.basicAuthReq('POST', '/api/auth/signin', {
      email: this.email,
      password: this.password
    });
    if (res.data.token) {
      this.token = res.data.token;
    }
    this.user = res.data;
    return res.data;
  }

  async me() {
    if (!this.token && !this.email) {
      throw new Error('No credentials provided');
    }
    // Try token auth first, fall back to basic auth for private servers
    let res;
    if (this.token) {
      res = await this.req('GET', '/api/auth/me', null);
    } else {
      res = await this.basicAuthReq('GET', '/api/auth/me', null);
    }
    this.user = res.data;
    return res.data;
  }

  async console(expression, shard = '') {
    shard = shard || this.shard;
    let res = await this.req('POST', '/api/user/console', {expression, shard});
    return res.data;
  }

  async socket () {
    if (this.ws) return Promise.resolve();
    if (!this.token) await this.getToken();
    if (!this.user) await this.me();
    let wsprefix = this.prefix.replace(/^http/, 'ws')
    let ws = new WebSocket(`${wsprefix}/socket/websocket`);
    // console.log('ws', ws);
    this.ws = ws;
    ws.onmessage = event => {
      // console.log("wsmessage", event);
      let msg = event.data;
      if (msg.slice(0, 3) == 'gz:'){
        // console.log("inflate: ", inflate(msg));
        // console.log("gz: ", gz(msg));
        
        msg = gz(msg)
      }

      if (msg[0] == '[') {
        msg = JSON.parse(msg);
      }

      if (typeof msg !== 'string') {
        let subs = this.subscriptions[msg[0]];
        if (!subs) {
          console.log("unsolicited message", msg);
          this.wssend(`unsubscribe ${msg[0]}`);
          return;
        }
        for (let i = 0; i < subs.length; i++) {
          subs[i](msg[0], msg[1], msg);
        }

      } else {
        if (msg.match(/^auth ok/)) {
          this.socketAuth = true;
        }
        this.emit('message', msg);
      }

      // if (msg[0].match(/console/))
      //   this.emit('console', msg)
      // else if (msg[0].match(/memory/))
      //   this.emit('memory', msg)
      // else if (msg[0].match(/code/))
      //   this.emit('code', msg)
      // else if (msg[0].match(/room/))
      //   this.emit('room', msg)
      // else

    };
    return await new Promise((resolve, reject) => {
      ws.onopen = () => {
        this.wssend('gzip on');
        this.wssend(`auth ${this.token}`);
        this.connected = true;
        resolve();
      };
    })
  }

  subscriptions = {};
  subscribe(path, cb) {
    if (!cb) throw "Bad subscribe! " + path;
    // if (path.match(/^room/)) console.log('SUB', path);
    // if (!path.match(/^([a-z]+):(.+?)$/))
    //   path = `user:${this.user._id}${path}`
    if (!this.subscriptions[path]) {
      this.wssend(`subscribe ${path}`);
      this.subscriptions[path] = [];
    }
    this.subscriptions[path].push(cb);
  }

  unsubscribe(path, cb) {
    // if (path.match(/^room/)) console.log('UNSUB', path);
    // if (!path.match(/^([a-z]+):(.+?)$/))
    //   path = `user:${this.user._id}${path}`
    let subs = this.subscriptions[path];
    if (!subs) return;
    this.subscriptions[path] = subs.filter((c) => c !== cb);
    if (this.subscriptions[path].length === 0){
      this.wssend(`unsubscribe ${path}`);
      this.subscriptions[path] = undefined;
    }
  }

  wssend(...data) {
    // console.log('ws', ...data)
    if (!this.ws) {
      console.log("cannot send", data);
      return;
    }
    this.ws.send([...data])
  }

  get memory () {
    return {
      get: (path, def, shard = '') => {
        shard = shard || this.shard;
        return this.req('GET', `/api/user/memory`, {path: path || '', shard})
          .then(data => {
            if (data.body.error) throw data.body.error
            let ret = data.body.data || def
            if (typeof ret == 'string' && ret.slice(0, 3) == 'gz:') ret = gz(ret)
            return ret
          })
      },
      set: (path, value, shard = '') => {
        shard = shard || this.shard;
        return this.req('POST', `/api/user/memory`, {path, value, shard})
          .then(data => {
            if (data.body.error) throw data.body.error
            return data.body.data
          })
      }
    }
  }

  get market () {
    return {
      index: (shard = '') => {
        shard = shard || this.shard;
        return this.req('GET', `/api/game/market/index`, {shard})
          .then(data => {
            if (data.body.error) throw data.body.error
            let ret = data.body.list
            if (typeof ret == 'string' && ret.slice(0, 3) == 'gz:') ret = gz(ret)
            return ret
          })
      },
      orders: (resourceType, shard = '') => {
        shard = shard || this.shard;
        return this.req('GET', '/api/game/market/orders', {resourceType, shard})
          .then(data => {
            if (data.body.error) throw data.body.error
            let ret = data.body.list
            if (typeof ret == 'string' && ret.slice(0, 3) == 'gz:') ret = gz(ret)
            return ret
          })
      },
      stats: (resourceType, shard = '') => {
        shard = shard || this.shard;
        return this.req('GET', '/api/game/market/stats', {resourceType, shard})
          .then(data => {
            if (data.body.error) throw data.body.error
            let ret = data.body.stats
            if (typeof ret == 'string' && ret.slice(0, 3) == 'gz:') ret = gz(ret)
            return ret
          })
      }
    }
  }

  /**
   *  {ok: 1, time: 17652988}
   */
  async time(shard = '') {
    shard = shard || this.shard;
    let res = await this.req('GET', '/api/game/time', {shard});
    return res.data;
  }

  /**
   * {"ok":1,"status":"normal"}
   */
  async worldStatus() {
    let res = await this.req('GET', '/api/user/world-status');
    return res.data;
  }

  /**
   * {"ok":1,"count":0}
   */
  async unreadCount() {
    let res = await this.req('GET', '/api/user/messages/unread-count');
    return res.data;
  }

  /**
   * {"ok":1,"room":{"_id":"E82N7","status":"normal","novice":1488620978881}}
   */
  async roomStatus(room, shard = '') {
    shard = shard || this.shard;
    let res = await this.req('GET', '/api/game/room-status', {room, shard});
    return res.data;
  }

  /**
   * {"ok":1,"terrain":[{"_id":"5873be0611e3e4361b4da2c7","room":"E82N7","terrain":<2500 of 0, 1 or 2 as a string>,"type":"terrain"}]}
   */
  roomTerrainCache = {};
  async roomTerrain(room, encoded, shard = '') {
    shard = shard || this.shard;
    let cached;
    if (cached = this.roomTerrainCache[room + !!encoded])
      return cached;
    let res = await this.req('GET', '/api/game/room-terrain', {room, encoded: encoded? 1 : 0, shard});
    this.roomTerrainCache[room + !!encoded] = res.data;
    return res.data;
  }

  async branches() {
    let res = await this.req('GET', '/api/user/branches');
    return res.data;
  }

  async setActiveBranch(branch, activeName) {
    let res = await this.req('POST', '/api/user/set-active-branch', {branch, activeName});
    return res.data;
  }

  async cloneBranch(branch, newName, defaultModules) {
    let res = await this.req('POST', '/api/user/clone-branch', {branch, newName, defaultModules});
    return res.data;
  }

  async deleteBranch(branch) {
    let res = await this.req('POST', '/api/user/delete-branch', {branch});
    return res.data;
  }

  /**
   * branch can be "$activeWorld" to get the active branch
   * {"ok":1,"branch":"ts-default","modules":{"main":<string of code>}}
   */
  async code(branch) {
    let res = await this.req('GET', '/api/user/code', {branch});
    return res.data;
  }

  async setCode(branch, modules, _hash) {
    if (!_hash)
      _hash = Date.now();
    let res = await this.req('POST', '/api/user/code', {branch, modules, _hash});
    return res.data;
  }

  /**
   * {"ok":1,"rooms":[]}
   */
  async respawnProhibitedRooms() {
    let res = await this.req('GET', '/api/user/respawn-prohibited-rooms');
    return res.data;
  }

  /**
   * {"ok":1,"rooms":[]}
   */
  async respawn() {
    let res = await this.req('POST', '/api/user/respawn');
    return res.data;
  }


  /**
   * OLD: {"ok":1,"rooms":["E83N7"]}
   * NEW: {"ok":1,"shards":{"shard0":[],"shard1":["E2S29"]}}
   */
  async rooms(id) {
    if (id === undefined) id = this.user._id;
    let res = await this.req('GET', '/api/user/rooms', {id});
    let ret = res.data;
    // if (ret.rooms)
    //   ret.shards = {shard0: ret.rooms};
    return ret;
  }

  /**
   * {"ok":1,"stats":{"creepsLost":25,"creepsProduced":20199,"energyHarvested":2756044,"energyControl":1180464,"energyCreeps":1305150,"energyConstruction":251876}}
   */
  async stats(id, interval) {
    if (id === undefined) id = this.user._id;
    let res = await this.req('GET', '/api/user/stats', {id, interval});
    return res.data;
  }

  /**
   * {"ok":1,"user":{"_id":"...","username":"ricochet1k","badge":{"type":19,"color1":"#000000","color2":"#3a0080","color3":"#05004d","param":0,"flip":false},"steam":{"id":"..."},"gcl":9001809}}
   */
  async userFind(username) {
    let res = await this.req('GET', '/api/user/find', {username});
    return res.data;
  }

  /**
   * {"ok":1,"list":[{"_id":"5863de22ec0e632daa8550e6","season":"2016-12","user":"585c1fadbadd410834155410","score":146093,"rank":2278},{"_id":"586846a0ec0e632daa907c34","season":"2017-01","user":"585c1fadbadd410834155410","score":4798156,"rank":797},{"_id":"589125349c76d517f2424b27","season":"2017-02","user":"585c1fadbadd410834155410","score":3927406,"rank":745}]}
   */
  async leaderboardFind(username, mode) {
    let res = await this.req('GET', '/api/leaderboard/find', {username, mode});
    return res.data;
  }

  async placeSpawn(name, room, x, y, shard = '') {
    shard = shard || this.shard;
    let res = await this.req('POST', '/api/game/place-spawn', {name, room, x, y, shard});
    return res.data;
  }
}

function gz (data) {
  let buf = new Buffer(data.slice(3), 'base64')
  // let ret = zlib.gunzipSync(buf).toString();
  let ret = pako.ungzip(buf, {to: "string"});
  // console.log("gz:", data);
  // console.log("ungz:", ret);
  try {
    return JSON.parse(ret);
  } catch (e) {
    console.error(e);
    return null;
  }
}

function inflate (data) {
  let buf = new Buffer(data.slice(3), 'base64')
  // let ret = zlib.inflateSync(buf).toString();
  let ret = pako.deflate(buf, {to: "string"});
  // console.log("inflate:", data);
  // console.log("uninflate:", ret);
  try {
    return JSON.parse(ret);
  } catch (e) {
    console.error(e);
    return null;
  }
}

function noop () {}
