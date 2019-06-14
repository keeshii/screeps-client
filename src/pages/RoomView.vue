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
        <button class="btn btn-sm btn-dark mr-2" @click="showPlaceSpawnModal()">Place spawn</button>

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
        <room-map v-for="roomName in rooms"
          :key="roomName" :room-name="roomName" :api="api"
          @click="navigateToRoom(roomName)">
        </room-map>
      </div>
      <div class="game-container">
        <game :client="client" v-if="tabName === 'room'"></game>
      </div>
    </div>

    <code-pane :api="api" ref="codePane" tab-code></code-pane>

    <console :api="api" tab-console></console>

    <!-- Modal -->
    <div class="modal show" tabindex="-1" v-if="isPlaceSpawnVisible">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Place spawn</h5>
            <button type="button" class="close" @click="isPlaceSpawnVisible = false">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <form>
              <div class="form-group row">
                <label class="col-sm-2 col-form-label">Room</label>
                <div class="col-sm-10">
                  <input type="text" class="form-control" v-model="placeSpawnRoom" placeholder="Room">
                </div>
              </div>
              <div class="form-group row">
                <label class="col-sm-2 col-form-label">Position</label>
                <div class="col-sm-5">
                  <input type="number" min="1" max="50" class="form-control" v-model="placeSpawnX" placeholder="X">
                </div>
                <div class="col-sm-5">
                  <input type="number" min="1" max="50" class="form-control" v-model="placeSpawnY" placeholder="Y">
                </div>
              </div>
            </form>
            <div class="invalid-feedback" v-if="placeSpawnError">{{placeSpawnError}}</div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="isPlaceSpawnVisible = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="respawn()">Respawn</button>
            <button type="button" class="btn btn-primary" @click="placeSpawn()">Place spawn</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop show" v-if="isPlaceSpawnVisible"></div>

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
      tabName: 'room',
      isPlaceSpawnVisible: false,
      placeSpawnError: '',
      placeSpawnRoom: '',
      placeSpawnX: 25,
      placeSpawnY: 25
    };
  },

  created() {
    this.setClientRoom();
  },

  watch: {
    'client': function(client) {
      this.setClientRoom();
    },

    'roomName': function(roomName) {
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
      if (this.roomName === '-') {
        this.roomName = '';
      }

      if (this.client) {
        if (this.roomName === '' && this.client.roomName !== '') {
          this.navigateToRoom(this.client.roomName);
        } else if (this.roomName === '' && this.client.rooms) {
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
    },

    showPlaceSpawnModal() {
      this.isPlaceSpawnVisible = true;
      this.placeSpawnRoom = this.roomName;
      this.placeSpawnError = '';
    },

    async placeSpawn() {
      if (!eventBus.api) {
        return;
      }
      this.placeSpawnError = '';
      var spawnName = 'Spawn1';
      var response;
      try {
        response = await eventBus.api.placeSpawn(spawnName, this.placeSpawnRoom, this.placeSpawnX, this.placeSpawnY);
        if (response.error) {
          throw new Error(response.error);
        }
        this.isPlaceSpawnVisible = false;
        return;
      } catch (error) {
        this.placeSpawnError = error.message;
      }
    },

    async respawn() {
      if (!eventBus.api) {
        return;
      }
      this.placeSpawnError = '';
      var response;
      try {
        response = await eventBus.api.respawn();
        if (response.error) {
          throw new Error(response.error);
        }
        this.isPlaceSpawnVisible = false;
        return;
      } catch (error) {
        this.placeSpawnError = error.message;
      }
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

  #room-view .navbar .form-inline button {
    white-space: nowrap;
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
    display: block;
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

  .modal {
    display: none;
  }

  .invalid-feedback,
  .modal.show {
    display: block;
  }

</style>
