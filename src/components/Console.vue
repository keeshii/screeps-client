<template>

  <div class="console" ref="consoleWrapper" style="height: 100%;">
    <div class="console-lines">
      <div class="console-line" v-for="line in lines" v-html="line"></div>
    </div>
    <nav class="navbar navbar-expand-md navbar-dark bg-dark">
      <div class="input-group">
        <input v-model="command" class="form-control form-control-sm" />
        <div class="input-group-append">
          <button @click.prevent="send()" class="btn btn-sm btn-primary">Send</button>
        </div>
      </div>
    </nav>
  </div>

</template>

<script>
import eventBus from '../global-events';

export default {
  props: ['api'],
  data() {
    return {
      command: '',
      lines: [],
      connected: false,
    }
  },

  watch: {
    'api': function(api, oldApi) {
      this.disconnect(oldApi);
      this.connect(api);
    },
  },

  created() {
    this.connect(this.api);
  },

  mounted() {
  },

  updated() {
  },

  beforeDestroy() {
    this.disconnect(this.api);
  },

  methods: {
    reconnect(api) {

    },
    connect(api) {
      if (api && api.socketAuth && api.subscribe){
        console.log('Console.connect', `user:${api.user._id}/console`, api)
        api.subscribe(`user:${api.user._id}/console`, this.onMessage);
        this.connected = true;
      }
    },

    disconnect(api) {
      this.connected = false;
      if (api && api.unsubscribe)
        api.unsubscribe(`user:${api.user._id}/console`, this.onMessage);
    },

    onMessage(key, msg) {
      const con = this.$refs && this.$refs.consoleWrapper;
      let isAtBottom = false;
      if (con) {
        isAtBottom = con.scrollHeight - con.clientHeight <= con.scrollTop + 1;
      }
      if (msg.messages && msg.messages.log) {
        for (let m of msg.messages.log) {
          this.lines.push('< ' + m);
        }
      } else if (msg.error) {
        this.lines.push('< ' + msg.error);
      } else {
        console.log('wierd console', msg);
      }

      if (isAtBottom)
        this.$nextTick(() => {
          con.scrollTop = con.scrollHeight;
        })
    },

    async send() {
      var cmd = this.command.trim();
      if (cmd === '' || !eventBus.api) {
        return;
      }
      var response = await eventBus.api.console(cmd);
      if (response && response.ok) {
        this.lines.push('> ' + this.command);
        this.command = '';
      }
    }
  }
}
</script>

<style>
.console {
  color: #ccc;
  background: #222;
  flex-direction: column;
  height: 100%;
}

.console-lines {
  flex: 1 1;
  font-size: 12px;
  overflow-y: scroll;
  padding: 4px;
}

.console-line,
.console .form-control {
  font-family: Monaco, Menlo, 'Ubuntu Mono', Consolas, source-code-pro, monospace;
}

.console-line {
  word-wrap: normal;
  margin: 0;
}

</style>
