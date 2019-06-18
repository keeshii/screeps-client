<template>

  <div id="app">

    <nav class="navbar navbar-expand-md navbar-dark bg-dark justify-content-center">
      <ul class="navbar-nav">
        <li class="nav-item">
          <router-link :to="{name: 'login'}" class="nav-link" active-class="active">
            login
          </router-link>
        </li>
        <li class="nav-item">
          <router-link :to="{name: 'register'}" class="nav-link" active-class="active">
            register
          </router-link>
        </li>
        <li class="nav-item">
          <router-link :to="{name: 'room', params: {roomName: ' '}}" class="nav-link" active-class="active">
            room
          </router-link>
        </li>
        <li class="nav-item">
          <router-link :to="{name: 'map'}" class="nav-link" active-class="active">
            map
          </router-link>
        </li>
        <li class="nav-item">
          <router-link :to="{name: 'profile'}" class="nav-link" active-class="active">
            profile
          </router-link>
        </li>
      </ul>
    </nav>

    <router-view></router-view>
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

  components: {
  },
}
</script>

<style>
  html, body {
    height: 100%;
  }

  #app {
    display: flex;
    height: 100%;
    flex-direction: column;
  }

  #app > .navbar {
    z-index: 1;
  }

  .navbar-expand-md {
    flex: 0 0 auto;
  }

  .navbar-expand-md .navbar-nav .nav-link {
    padding-right: .5rem;
    padding-left: .5rem;
  }

  .navbar-expand-md .navbar-nav {
    flex-direction: row;
  }
</style>
