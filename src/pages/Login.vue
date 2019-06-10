<template>
  <div class="container mt-4 mb-4">

  <div class="card">
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
        <div class="form-group">
          <label for="username">username:</label>
          <input id="username" v-model="auth.username" class="form-control" />
        </div>
        <div class="form-group">
          <label for="email">email:</label>
          <input id="email" v-model="auth.email" class="form-control" />
        </div>
        <div class="form-group">
          <label for="password">password:</label>
          <input id="password" v-model="auth.password" type="password" class="form-control" />
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
    }
  },

  mounted() {
    if (this.$route.query.token)
      auth.externalConnect(this.$route.query.token);
    if (this.$route.query.auto && auth.password)
      this.login();

      this.$watch(() => eventBus.api, api => {
        if (!api) return;
        console.log('API changed', api);
        if (this.$route.query.backto){
          this.$router.replace(this.$route.query.backto);
        } else {
          this.$router.replace('/');
        }
      })
  },

  methods: {
  	login() {
      auth.connect();
  	},
    externalauth(which) {
      // let ret = "//" + auth.host + ":" + auth.port + "/" + window.location.path + "#/login";
      window.open("//" + auth.host + ":" + auth.port + "/api/auth/" + which);
      //+ "?return=" + encodeURIComponent(ret)
    }
  }
}
</script>
