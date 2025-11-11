
import Vue from 'vue';
import eventBus from './global-events';
import { ScreepsAPI } from './scripts/screepsAPI';
import { ScreepsClient } from './scripts/client';

const DEFAULT_HOST = 'screeps.com';
const DEFAULT_PORT = 443;
const DEFAULT_SECURE = true;

let auth = new Vue({
  data() {
    return {
      host: '',
      port: '',
      secure: '',
      token: '',
      email: '',
      password: '',
      authMethod: 'token', // 'token' or 'password'
    }
  },

  created() {
    Vue.nextTick(() => {
      this.load();
      this.connect();
    });
  },

  methods: {
    getSaved() {
      let saved = window.localStorage.getItem('saved-credentials');
      if (saved) {
        saved = JSON.parse(saved);
      }

      if (saved) {
        return {
          host: saved.host,
          port: saved.port,
          secure: saved.secure,
          token: saved.token,
          email: saved.email,
          password: saved.password,
          authMethod: saved.authMethod || 'token',
        };
      } else {
        return {
          host: DEFAULT_HOST,
          secure: DEFAULT_SECURE,
          port: DEFAULT_PORT,
          authMethod: 'token'
        };
      }
    },
    load() {
      const saved = this.getSaved();
      this.host = saved.host;
      this.port = saved.port;
      this.secure = saved.secure;
      this.token = saved.token;
      this.email = saved.email;
      this.password = saved.password;
      this.authMethod = saved.authMethod || 'token';
    },
    save() {
      window.localStorage.setItem("saved-credentials", JSON.stringify({
        host: this.host,
        port: this.port,
        secure: this.secure,
        token: this.token,
        email: this.email,
        password: this.password,
        authMethod: this.authMethod,
      }))
    },
    clearSaved() {
      window.localStorage.removeItem("saved-credentials");
    },
    externalConnect(token) {
      if (eventBus.api)
        eventBus.api.disconnect();
      if (eventBus.client)
        eventBus.client.disconnect();

      this.token = token;
      let api = new ScreepsAPI({
        host: this.host,
        port: this.port,
        secure: this.secure,
      });
      api.token = token;
      let client = new ScreepsClient(api);
      client.connect().then(() => {
        this.save();
        eventBus.api = api;
        eventBus.client = client;
      }).catch(() => {
        console.log('error auth connect');
      });
    },
    connect() {
      if (!this.token && !this.email) {
        if (Vue.router.currentRoute.name !== 'login')
          Vue.router.replace({ name: 'login', query: { backto: Vue.router.currentRoute.path } });
        return;
      }
      if (eventBus.api)
        eventBus.api.disconnect();
      if (eventBus.client)
        eventBus.client.disconnect();

      let api = new ScreepsAPI({
        host: this.host,
        port: this.port,
        secure: this.secure,
        email: this.email,
        password: this.password,
      });
      if (this.token) {
        api.token = this.token;
      }
      let client = new ScreepsClient(api);
      return client.connect().then(() => {
        this.save();
        eventBus.api = api;
        eventBus.client = client;
      });
    },

    receiveMessage(event) {
      console.log('WINDOW MESSAGE', event);
      if (typeof event.data !== 'string')
        return;
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        console.log('weird message', event.data, event);
        return;
      }

      if (data.email)
        this.email = data.email;

      if (data.token)
        this.externalConnect(data.token);
    }
  }
});

export default auth;

window.auth = auth;

window.addEventListener("message", auth.receiveMessage, false);