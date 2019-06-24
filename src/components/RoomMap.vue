<template>
  <div class="roomMap2" @click="$emit('click', $event)" :class="{ 'is-loading': isLoading }">
    <img :src="background" @load="onLoad" />
    <div class="overlay" v-for="k in kinds" :key="k">
      <div class="mapSpot" v-for="(xy, i) in data[k]" :key="i" :style="mapSpotStyle(k, xy)">
      </div>
    </div>
    <div class="roomMapName">{{roomName}}</div>
  </div>
</template>

<script>
const colors = {
  'r': '#555555', // road
  'c': '#0000ff', // controller
  'k': '#aa0000', // keeperLair
  'm': '#8888ff', // mineral
  'p': '#ff00ff', // portal
  'pb': '#88ff88', // powerBank || power
  's': '#ffff00', // source
  'w': '#000000', // wall

  // default - any user-owned structure
  '2': '#ff0000', // invader
  'me': '#00aa00', // All my stuff
  'user': '#990000', // All enemy stuff
};

export default {
  props: ['roomName', 'api'],
  data: function() {
    return {
      data: {},
      isLoading: true
    }
  },
  mounted() {
    // console.log('roomMap mounted', this, this.$props);
    if (this.api && this.api.connected) this.connect(this.api);
  },
  beforeDestroy() {
    if (this.api) this.disconnect(this.api);
  },

  watch: {
    'api': function(api, oldapi) {
      if (oldapi) this.disconnect(oldapi);

      //if (api && api.connected) this.connect(api);
    },
    'connected': function(connected, old) {
      if (this.api && this.api.user)
        this.connect(this.api);
    }
  },

  computed: {
    background() {
      // console.log('background', this, this.api, this.roomName);
      if (!this.api) return "";

      const {host, port, secure} = this.api.opts;
      const roomName = this.api.shard
        ? this.api.shard + '/' + this.roomName
        : this.roomName;

      if (host === "screeps.com") { // official server uses a CDN
        if (roomName.indexOf('/') > -1)
          return `https://d3os7yery2usni.cloudfront.net/map/${roomName}.png`;
        return `https://d3os7yery2usni.cloudfront.net/map3/${roomName}.png`;
      }

      const proto = (secure? 'https' : 'http')
      let bg = `${proto}://${host}:${port}/assets/map/${roomName}.png`;
      // console.log('bg ', bg);
      return bg;
    },
    msg() {
      let shardName = this.roomName;
      if (this.api.shard) {
        shardName = this.api.shard + '/' + this.roomName;
      }
      return "roomMap2:" + shardName;
    },
    kinds() {
      return this.data? Object.keys(this.data) : [];
    },
    connected() {
      return this.api && this.api.connected;
    }
  },

  methods: {
    connect(api) {
      api.subscribe(this.msg, this.onMessage);
    },

    disconnect(api) {
      api.unsubscribe(this.msg, this.onMessage);
    },

    onMessage(path, val) {
      if (path === this.msg) {
        // console.log('roomMap!', Object.keys(msg[1]), JSON.stringify(msg[1]));
        this.data = val;
      }
    },
    color(kind) {
      let c = colors[kind];
      if (!c) {
        if (kind === this.api.user._id)
          c = colors[kind] = colors['me'];
        else
          c = colors[kind] = colors['user'];
        // console.log("Unknown roomMap2 color: ", kind);
      }
      return c;
    },

    mapSpotStyle(kind, spot) {
      // console.log('mapSpotStyle', kind, spot);
      return {top: 3*spot[1]+'px', left: 3*spot[0]+'px', background: this.color(kind)};
    },

    onLoad(e) {
      this.isLoading = false;
    }
  }
}
</script>

<style>
.roomMap2 {
  background: #2b2b2b;
  position: absolute;
  width: 150px;
  height: 150px;
}

.roomMap2.is-loading {
  outline: 1px solid rgba(255,255,255,0.1);
}

.roomMap2.is-loading img,
.roomMap2.is-loading .roomMapName {
   display: none;
}

.roomMapName {
  bottom: 0;
  color: rgba(255, 255, 255, 0.5);
  position: absolute;
  margin: 0;
  padding: 0;
  right: 0;
  font-size: 1em;
  font-family: monospace;
  line-height: 1em;
}

.overlay {
  position: absolute;
  top: 0;
}

.mapSpot {
  position: absolute;
  width: 3px;
  height: 3px;
}

img {
  width: 100%;
  height: 100%;
}
</style>
