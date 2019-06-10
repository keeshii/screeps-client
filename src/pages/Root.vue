<template>

  <div class="container mt-4 mb-4">

    <div class="alert alert-primary" role="alert">
      Waiting for login...
    </div>

  </div>

</template>

<script>

import eventBus from '../global-events';
import { ScreepsAPI } from '../scripts/screepsAPI';
import {ScreepsClient} from '../scripts/client';

export default {
  data() {
    return {}
  },

  mounted() {
    if (!eventBus.client) {
      this.$router.replace({name: 'login', query: {auto: true}});
      return;
    }

    let unwatch = this.$watch(function() { return eventBus.client && eventBus.client.rooms}, function(rooms) {
      console.log('watch rooms', rooms);
      if (!rooms) return;
      this.loadedRooms();
      unwatch();
    }, {immediate: true});
    console.log('watched');
  },

  computed: {
    
  },

  methods: {
    loadedRooms() {
      let rooms = eventBus.client.rooms;
      if (!rooms) return;
      if (!rooms[0]) {
        this.$router.replace({name: 'map'});
        return;
      }

      let room = rooms[0];

      if (this.$route.path === '/') {
        this.$router.replace({name: 'room', params: {roomName: room}});
      }
    }
  },
  components: {
  },
}
</script>

<style>

</style>
