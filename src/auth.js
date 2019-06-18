
import Vue from 'vue';
import eventBus from './global-events';
import { ScreepsAPI } from './scripts/screepsAPI';
import {ScreepsClient} from './scripts/client';

const DEFAULT_HOST = 'screeps.com';
const DEFAULT_PORT = 443;
const DEFAULT_SECURE = true;

let auth = new Vue({
  data() {
    return {
      host: '',
      port: '',
      secure: '',
      username: '',
      email: '',
      password: '',
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
          username: saved.username,
          email: saved.email,
          password: saved.password,
        };
      } else {
        return {
          host: DEFAULT_HOST,
          secure: DEFAULT_SECURE,
          port: DEFAULT_PORT
        };
      }
    },
    load() {
      const saved = this.getSaved();
      this.host = saved.host;
      this.port = saved.port;
      this.secure = saved.secure;
      this.username = saved.username;
      this.email = saved.email;
      this.password = saved.password;
    },
    save() {
      window.localStorage.setItem("saved-credentials", JSON.stringify({
        host: this.host,
        port: this.port,
        secure: this.secure,
        username: this.username,
        email: this.email,
        password: this.password,
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

      let api = new ScreepsAPI({
        host: this.host,
        port: this.port,
        secure: this.secure,
      });
      api.token = token;
      let client = new ScreepsClient(api);
      client.connect().then(() => {
        eventBus.api = api;
        eventBus.client = client;
      }).catch(() => {
        console.log('error auth connect');
      });
    },
    connect() {
      if (!this.username || !this.password) {
        if (Vue.router.currentRoute.name !== 'login')
          Vue.router.replace({name: 'login', query: {backto: Vue.router.currentRoute.path}});
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
        email: this.username,
        password: this.password,
      });
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

      if (data.username)
        this.username = data.username;
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