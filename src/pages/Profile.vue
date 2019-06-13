<template>
  <div class="container mt-4 mb-4">

  <div class="card mb-2">
    <div class="card-body">
      <form v-if="client">
        <div class="form-group row">
          <label class="col-6 col-form-label">username</label>
          <div class="col-6">
            <input type="text" readonly class="form-control-plaintext" :value="username">
          </div>
        </div>
        <div class="form-group row">
          <label class="col-6 col-form-label">email</label>
          <div class="col-6">
            <input type="text" readonly class="form-control-plaintext" :value="email">
          </div>
        </div>
        <div class="form-group row">
          <label class="col-6 col-form-label">GCL</label>
          <div class="col-6">
            <input type="text" readonly class="form-control-plaintext" :value="gcl">
          </div>
        </div>
        <div class="form-group row">
          <label class="col-6 col-form-label">CPU</label>
          <div class="col-6">
            <input type="text" readonly class="form-control-plaintext" :value="cpu">
          </div>
        </div>
        <div class="text-right">
          <button @click.prevent="logout()" class="btn btn-primary">Logout</button>
        </div>
      </form>

      <div v-if="!client">
        Not connected.
      </div>
    </div>
  </div>

  </div>
</template>

<script>

import eventBus from '../global-events';
import auth from '../auth';

export default {
  data() {
    return {
      auth,
    }
  },

  watch: {
    'client': function(client) {
      console.log('watch client');
      this.setClientRoom();
    },
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
    username() {
      if (eventBus.client && eventBus.client.me) {
        return eventBus.client.me.username;
      }
    },
    email() {
      if (eventBus.client && eventBus.client.me) {
        return eventBus.client.me.email;
      }
    },
    cpu() {
      if (eventBus.client && eventBus.client.me) {
        return eventBus.client.me.cpu;
      }
    },
    gcl() {
      if (eventBus.client && eventBus.client.me) {
        return eventBus.client.me.gcl;
      }
    }
  },

  methods: {
    logout() {
      if (eventBus.client) {
        eventBus.client.disconnect();
      }

      if (eventBus.api) {
        eventBus.api.disconnect();
      }

      eventBus.client = null;
      eventBus.api = null;
      auth.clearSaved();
      auth.load();
      this.$router.replace('/login');
    }
  }

}
</script>

<style>

</style>