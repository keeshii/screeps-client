<template>
  <div>
    <div class="mapview" ref="mapview" v-if="renderMap"
      @mousedown.capture="mouseDown($event)" @mousemove.capture="mouseMove($event)" @mouseup.capture="mouseUp($event)"
      @touchstart.capture="mouseDown($event)" @touchmove.capture="mouseMove($event)" @touchend.capture="mouseUp($event)"
      @click.capture="click($event)" >

      <div class="mapview-inner" :style="{left: xpan + 'px', top: ypan + 'px', width: (hsquares * squareSize)+'px', height: (vsquares * squareSize)+'px'}">
        <div class="y" v-for="y in vsquares" :key="y + yoffsetreal" :style="{width: hsquares*squareSize+'px', height: squareSize+'px'}">
          <div class="x" v-for="x in hsquares" :key="x + xoffsetreal" style="display: inline-block;" :style="{width: squareSize+'px', height: squareSize+'px'}">
            <room-map :style="{width: squareSize + 'px', height: squareSize + 'px'}" :room-name="roomName(x + xoffsetreal, y + yoffsetreal)" :api="api" @click="navigateToRoom(roomName(x + xoffsetreal, y + yoffsetreal))"></room-map>
          </div>
        </div>
      </div>
    </div>

    <div class="mapview-shard navbar navbar-expand-md navbar-dark bg-dark" v-if="shards">
      <form class="form-inline">
        <select class="form-control form-control-sm" v-model="shardName">
          <option v-for="name in shards" :value="name">{{name}}</option>
        </select>
      </form>
    </div>
  </div>
</template>


<script>

import Game from '../components/Game.vue';
import RoomMap from '../components/RoomMap.vue';
import eventBus from '../global-events';

const DEFAULT_ROOM = 'W5N5';

function fromRoomName(roomName) {
  let pattern = /^((\w+)\/)?([WE])([0-9]+)([NS])([0-9]+)$/;
  let match = null;

  if (roomName) {
    match = roomName.match(pattern);
  }
  if (match === null && eventBus.client && eventBus.client.roomName) {
    match = eventBus.client.roomName.match(pattern);
  }
  if (match === null) {
    match = DEFAULT_ROOM.match(pattern);
  }
  let [name,,shard,h,wx,v,wy] = match;
  if(h == 'W') wx = ~wx;
  if(v == 'N') wy = ~wy;
  return [shard, wx - 1, wy - 1]
}

function toRoomName([shard, x, y]) {
  var result = "";
  if (shard)
    result += shard + '/';
  result += (x < 0 ? "W" + ~x : "E" + x);
  result += (y < 0 ? "N" + ~y : "S" + y);
  return result;
}


export default {
  name: 'map-view',
  props: ['shard'],

  data() {
    let xoffset, yoffset;

    let [shard, wx, wy] = fromRoomName(this.$route.query.room);
    xoffset = wx;
    yoffset = wy;

    return {
      shardName: '',
      resizeRef: undefined,
      renderMap: true,
      squareSize: 150,
      totalMovement: 0,
      pan: {x: 0, y: 0},
      touchStart: {x: 0, y:0},
      offsetWidth: 0,
      offsetHeight: 0,
      xoffset,
      yoffset,
    }
  },

  created() {
    this.resizeRef = () => setTimeout(this.resizeView.bind(this));
    window.addEventListener('resize', this.resizeRef);
    this.setShard();
  },

  destroyed() {
    window.removeEventListener('resize', this.resizeRef);
  },

  mounted() {
    this.resizeView();
    let hq = this.hsquares, vq = this.vsquares;

    if (hq % 2 === 0) {
      hq++;
      this.xoffset--;
    }

    if (vq % 2 === 0) {
      vq++;
      this.yoffset--;
    }

    this.pan.x = Math.round(((hq * this.squareSize) - this.offsetWidth) / 2) - this.squareSize;
    this.pan.y = Math.round(((vq * this.squareSize) - this.offsetHeight) / 2) - this.squareSize;
  },

  computed: {
    api() {
      return eventBus.api;
    },
    client() {
      return eventBus.client;
    },

    xoffsetreal() {
      return this.xoffset - Math.ceil(this.offsetWidth / this.squareSize / 2)
    },
    yoffsetreal() {
      return this.yoffset - Math.ceil(this.offsetHeight / this.squareSize / 2)
    },

    hsquares() {
      //console.log('hsquares', this.offsetWidth, this.offsetWidth / this.squareSize);
      return Math.ceil(this.offsetWidth / this.squareSize) + 2;
    },
    vsquares() {
      return Math.ceil(this.offsetHeight / this.squareSize) + 2;
    },

    xpan() {
      return -this.pan.x - this.squareSize;
    },

    ypan() {
      return -this.pan.y - this.squareSize;
    },

    shards() {
      return eventBus.client && eventBus.client.shards;
    },
  },

  watch: {
    'shardName': function(name) {
      this.setShard(name);
    }
  },

  methods: {
    roomName(x, y) {
      return toRoomName([this.shard, x, y])
    },

    navigateToRoom(roomName) {
      this.$router.push({name: 'room', params: {roomName}});
    },

    mouseDown(e) {
      this.totalMovement = 0;
      if (e.touches) {
        this.touchStart.x = e.touches[0].clientX;
        this.touchStart.y = e.touches[0].clientY;
      } else {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    mouseMove(e) {
      if (!e.buttons && !e.touches) return;

      var movementX = e.movementX;
      var movementY = e.movementY;

      if (e.touches) {
        movementX = event.touches[0].clientX - this.touchStart.x;
        movementY = event.touches[0].clientY - this.touchStart.y;
        this.touchStart.x = event.touches[0].clientX;
        this.touchStart.y = event.touches[0].clientY;
      }

      //console.log('mouseMove', e);
      this.totalMovement += Math.abs(movementX) + Math.abs(movementY);
      this.pan.x -= movementX;
      while (this.pan.x < 0) {
        this.pan.x += this.squareSize;
        this.xoffset -= 1;
      }
      while (this.pan.x > this.squareSize) {
        this.pan.x -= this.squareSize;
        this.xoffset += 1;
      }
      this.pan.y -= movementY;
      while (this.pan.y < 0) {
        this.pan.y += this.squareSize;
        this.yoffset -= 1;
      }
      while (this.pan.y > this.squareSize) {
        this.pan.y -= this.squareSize;
        this.yoffset += 1;
      }
    },

    mouseUp(e) {
      if (this.totalMovement > 5) {
        e.preventDefault();
        e.stopPropagation();
      }
      // console.log('mouseUp', this.totalMovement, e);
      //this.totalMovement = 0;
    },

    click(e) {
      // console.log('click', this.totalMovement, e);
      if (this.totalMovement > 5) {
        e.preventDefault();
        e.stopPropagation();
      }
    },

    resizeView() {
      this.offsetWidth = this.$refs.mapview.offsetWidth;
      this.offsetHeight = this.$refs.mapview.offsetHeight;
    },

    refreshMap() {
      this.renderMap = false;
      this.$nextTick().then(() => {
        this.renderMap = true;
      });
    },

    setShard(shard) {
      if (!shard && eventBus.api && eventBus.api.shard) {
        this.shardName = eventBus.api.shard;
      }

      if (shard && eventBus.api) {
        eventBus.api.shard = shard;
        this.shardName = shard;
        this.refreshMap();
      }
    }
  },

  components: {
    RoomMap,
  }

}
</script>


<style>

.mapview {
  bottom: 0;
  cursor: pointer;
  left: 0;
  overflow: hidden;
  position: fixed;
  right: 0;
  top: 0;
}

.mapview-inner {
  position: absolute;
}

.mapview-shard {
  bottom: 0;
  left: 0;
  position: fixed;
  right: 0;
}

.mapview-shard select {
  min-width: 150px;
}

</style>


