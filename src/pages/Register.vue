<template>
  <div class="container mt-4 mb-4">

  <div class="card mb-2">
    <div class="card-body">
      <form @submit.prevent="register()">
        <div class="form-group">
          <label for="host">host:</label>
          <input id="host" v-model="host" class="form-control" />
        </div>
        <div class="form-group">
          <label for="port">port:</label>
          <input id="port" v-model="port" class="form-control" />
        </div>
        <div class="form-group form-check">
          <input id="secure" v-model="secure" type="checkbox" class="form-check-input" />
          <label for="secure" class="form-check-label">Secure</label>
        </div>
        <div class="form-group">
          <label for="username">username:</label>
          <input id="username" v-model="username" class="form-control" />
        </div>
        <div class="form-group">
          <label for="email">email:</label>
          <input id="email" v-model="email" class="form-control" />
        </div>
        <div class="form-group">
          <label for="password">password:</label>
          <input id="password" v-model="password" type="password" class="form-control" />
        </div>
        <div class="form-group">
          <label for="password">server password:</label>
          <input id="password" v-model="serverPassword" type="password" class="form-control" />
        </div>
        <div class="text-right">
          <button @click.prevent="register()" class="btn btn-primary">Register</button>
        </div>
      </form>
    </div>
  </div>

  <p v-if="status" :class="{'text-danger': error}">
    {{status}}
  </p>

  </div>
</template>

<script>

import eventBus from '../global-events';
import { ScreepsAPI } from '../scripts/screepsAPI';

export default {
  data() {
  	return {
          host: window.location.hostname,
          port: window.location.port,
          secure: window.location.protocol === 'https:',
          username: '',
          email: '',
          password: '',
          serverPassword: '',
          status: '',
          error: false
  	}
  },

  methods: {
    async register() {
      if (eventBus.api) eventBus.api.disconnect();
      if (eventBus.client) eventBus.client.disconnect();

      if (!this.username.trim() || !this.password.trim()) {
        this.error = true;
        this.status = 'Invalid form data';
        return;
      }

      this.error = false;
      this.status = 'Sending register request...';

      eventBus.api = new ScreepsAPI({
          host: this.host,
          port: this.port,
          secure: this.secure,

          email: this.email,
          password: this.password,
        });

      eventBus.api.register(this.username, this.email, this.password, this.serverPassword)
        .then(res => {
          if (res.ok) {
            this.error = false;
            this.status = 'OK';

            window.localStorage.setItem("saved-credentials", JSON.stringify({
                    host: this.host,
                    port: this.port,
                    secure: this.secure,

                    email: this.email,
                    password: this.password,
            }));
          } else {
            this.error = true;
            this.status = (res && res.error) || 'Unknown error';
          }
        })
        .catch(error => {
          error = error && error.message ? error.message : error;
          error = error || 'Unknown error';
          this.error = true;
          this.status = error;
        });
    }
  }
}
</script>
