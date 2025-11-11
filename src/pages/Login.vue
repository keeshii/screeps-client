<template>
  <div class="container mt-4 mb-4">

  <div class="card mb-2">
    <div class="card-body">
      <form @submit.prevent="login()">
        <div class="form-group">
          <label for="host">host:</label>
          <input id="host" v-model="auth.host" class="form-control" />
        </div>
        <div class="form-group">
          <label for="port">port:</label>
          <input id="port" v-model="auth.port" class="form-control" />
        </div>
        <div class="form-group form-check">
          <input id="secure" v-model="auth.secure" type="checkbox" class="form-check-input" />
          <label for="secure" class="form-check-label">Secure</label>
        </div>

        <!-- Authentication method toggle -->
        <div class="form-group">
          <label>Authentication Method:</label>
          <div class="btn-group btn-group-toggle d-flex" data-toggle="buttons">
            <label class="btn btn-outline-primary" :class="{ active: auth.authMethod === 'token' }">
              <input type="radio" v-model="auth.authMethod" value="token" /> Token
            </label>
            <label class="btn btn-outline-primary" :class="{ active: auth.authMethod === 'password' }">
              <input type="radio" v-model="auth.authMethod" value="password" /> Username/Password
            </label>
          </div>
        </div>

        <!-- Token authentication -->
        <div v-if="auth.authMethod === 'token'">
          <div class="form-group">
            <label for="token">API Token:</label>
            <input id="token" v-model="auth.token" type="password" class="form-control" placeholder="Enter your API token" />
            <small class="form-text text-muted">
              Get your token from <a href="https://screeps.com/a/#!/account/auth-tokens" target="_blank">Account Settings</a> on the Screeps website
            </small>
          </div>
        </div>

        <!-- Username/Password authentication -->
        <div v-else>
          <div class="form-group">
            <label for="email">Email:</label>
            <input id="email" v-model="auth.email" type="email" class="form-control" placeholder="Enter your email" />
          </div>
          <div class="form-group">
            <label for="password">Password:</label>
            <input id="password" v-model="auth.password" type="password" class="form-control" placeholder="Enter your password" />
          </div>
          <small class="form-text text-muted">
            Username/password authentication
          </small>
        </div>

        <div class="text-right">
          <button @click.prevent="login()" class="btn btn-primary">Login</button>
        </div>
      </form>

      <div hidden>
        <div class="steam-auth" @click.prevent="externalauth('steam')"></div>
        <div class="github-auth" @click.prevent="externalauth('github')"></div>
      </div>

    </div>
  </div>

  <p v-if="status" :class="{'text-danger': error}">
    {{status}}
  </p>

  </div>
</template>

<script>

import eventBus from '../global-events';
import auth from '../auth';
import { ScreepsAPI } from '../scripts/screepsAPI';

export default {
  data() {
    return {
      auth,
      status: '',
      error: false
    }
  },

  mounted() {
    if (this.$route.query.token)
      auth.externalConnect(this.$route.query.token);
    if (this.$route.query.auto && auth.token)
      this.login();

      this.$watch(() => eventBus.api, api => {
        if (!api) return;
        console.log('API changed', api);
        if (this.$route.query.backto){
          this.$router.replace(this.$route.query.backto);
        } else {
          this.status = 'Waiting for login...';
        }
      });
  },

  methods: {
    login() {
      this.error = false;
      this.status = 'Waiting for login...';
      var promise = auth.connect();

      if (!promise) {
        this.error = true;
        this.status = 'Invalid form data';
        return;
      }

      promise
        .then(() => {
          this.error = false;
          this.status = 'OK';
          this.auth.email = eventBus.client.me.email;

          let unwatch = this.$watch(function() { return eventBus.client && eventBus.client.rooms}, function(rooms) {
            if (!rooms) return;
            this.loadedRooms(rooms);
            unwatch();
          }, {immediate: true});
        })
        .catch(error => {
          error = error && error.message ? error.message : error;
          error = error || 'Unknown error';
          this.error = true;
          this.status = error;
        });
    },

    loadedRooms(rooms) {
      if (!rooms[0]) {
        this.$router.replace({name: 'map'});
        return;
      }
      let room = rooms[0];
      if (this.$route.path === '/login') {
        this.$router.replace({name: 'room', params: {roomName: room}});
      }
    },

    externalauth(which) {
      // let ret = "//" + auth.host + ":" + auth.port + "/" + window.location.path + "#/login";
      window.open("//" + auth.host + ":" + auth.port + "/api/auth/" + which);
      //+ "?return=" + encodeURIComponent(ret)
    }
  }
}
</script>
