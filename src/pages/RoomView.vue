<template>

  <div id="room-view" :class="'tab-' + tabName">
    <nav class="navbar navbar-expand-md navbar-dark bg-secondary">
      <ul class="navbar-nav">
        <li class="nav-item" :class="{active: tabName === 'room'}">
          <a href="#" class="nav-link" @click="setTab('room')">
            Room
          </a>
        </li>
        <li class="nav-item" :class="{active: tabName === 'code'}">
          <a href="#" class="nav-link" @click="setTab('code')">
            Code
          </a>
        </li>
        <li class="nav-item" :class="{active: tabName === 'console'}">
          <a href="#" class="nav-link" @click="setTab('console')">
            Console
          </a>
        </li>
      </ul>

      <div tab-room>
        <form class="form-inline">

          <select :value="roomName" @input="navigateToRoom($event.target.value)"
            class="form-control custom-select custom-select-sm mr-2"
            v-show="rooms.length">
            <option v-for="roomName in rooms" :key="roomName" :value="roomName">
              {{ roomName }}
            </option>
          </select>

          <input id="room" :value="roomName" @change="navigateToRoom($event.target.value)"
            class="form-control form-control-sm mr-2" />

          <router-link :to="{name:'map', query: {room: roomName}}"
            class="btn btn-sm btn-primary">map</router-link>

        </form>
      </div>

      <div class="cpu-stats" tab-console>
        <span class="badge badge-warning">Credits: {{money}}</span>
        <span class="badge badge-primary">CPU: {{cpu}}</span>
        <span class="badge badge-success">Memory: {{memory}}</span>
      </div>

    </nav>

    <div class="room-preview" tab-room>
      <div class="room-list">
        <room-map v-for="roomName in rooms" :key="roomName" :room-name="roomName" :api="api" @click="navigateToRoom(roomName)"></room-map>
      </div>
      <div class="game-container">
        <game :client="client"></game>
      </div>
    </div>

    <code-pane :api="api" ref="codePane" tab-code></code-pane>

    <console :api="api" tab-console></console>

  </div>

</template>

<script>

import SplitPane from '../components/SplitPane.vue';
import SplitPaneVertical from '../components/SplitPaneVertical.vue';
import Game from '../components/Game.vue';
import Console from '../components/Console.vue';
import RoomMap from '../components/RoomMap.vue';
import CodePane from '../components/CodePane.vue';
import eventBus from '../global-events';

export default {
  props: ['roomName'],
  data() {
    return {
      tabName: 'room'
    };
  },

  created() {
    this.setClientRoom();
  },

  watch: {
    'client': function(client) {
      console.log('watch client');
      this.setClientRoom();
    },

    'roomName': function(roomName) {
      console.log('watch roomName');
      this.setClientRoom();
    }
  },

  computed: {
    api() {
      if (eventBus.api && eventBus.api.socketAuth)
        return eventBus.api;
    },
    client() {
      if (eventBus.client && eventBus.client.me)
        return eventBus.client;
    },

    money() {
      return this.client && this.client.money || 0;
    },
    cpu() {
      return this.client && this.client.cpuMemory? this.client.cpuMemory.cpu : 0;
    },
    memory() {
      return this.client && this.client.cpuMemory? this.client.cpuMemory.memory : 0;
    },
    // roomName() {
    //   if (this.)
    //   return this.client && this.client.roomName || "";
    // },
    shards() {
      return this.client && this.client.shards || {};
    },

    rooms() {
      return this.client && this.client.rooms || [];
    }
  },

  methods: {
    navigateToRoom(roomName) {
      this.$router.replace({name: 'room', params: {roomName}});
    },

    setClientRoom() {
      if (this.client) {
        if (this.roomName === "" && this.client.rooms) {
          this.navigateToRoom(this.client.rooms[0]);
        }
        this.client.setRoom(this.roomName);
      }
    },

    onResize() {
      eventBus.$emit('resize');
    },

    setTab(tabName) {

      // We have to manually refresh the code area after tab switch
      if (tabName === 'code') {
        setTimeout(() => this.$refs.codePane.$refs.editor.refresh());
      }

      this.tabName = tabName;
    }
  },

  components: { 
    Game,
    Console,
    SplitPane,
    SplitPaneVertical,
    RoomMap,
    CodePane,
  },
}
</script>

<style>

  #room-view {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  #room-view .navbar {
    justify-content: space-between;
  }

  #room-view .navbar .form-inline {
    flex-flow: row;
  }

  #room-view .navbar .form-inline input {
    max-width: 80px;
  }

  .cpu-stats {
    display: flex;
  }

  .cpu-stats > span {
    margin: 0 .25em;
  }

  .room-preview {
    flex: 1 1;
    flex-direction: column;
  }

  .room-preview .room-list {
    align-items: center;
    background: #2b2b2b;
    display: flex;
    min-height: 180px;
    flex: 0 0 auto;
    flex-direction: row;
    overflow-x: auto;
  }

  .room-preview .room-list .roomMap2 {
    flex: 0 0 auto;
    margin: 0 15px
  }

  .room-preview .game-container {
    background: #444;
    display: flex;
    flex: 1 1;
  }

  [tab-room],
  [tab-code],
  [tab-console] {
    display: none;
  }

  .tab-room [tab-room],
  .tab-code [tab-code],
  .tab-console [tab-console] {
    display: flex;
  }

</style>
