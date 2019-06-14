<template>

  <div class="game-canvas-container">
    
  </div>

</template>

<script>
import eventBus from '../global-events';

var CANVAS_SIZE = 750,
    CANVAS_MIN_SIZE = 350;

export default {
  props: ['client'],
  data() {
    return {
      resizeRef: undefined
    }
  },

  watch: {
    'client': function(client, oldClient) {
      if (oldClient) {
        this.detatchClient(oldClient);
      }

      if (client){
        this.attachClient(client);
      }
    }
  },

  created() {
    this.resizeRef = () => setTimeout(this.resizeView.bind(this));
    window.addEventListener('resize', this.resizeRef);
  },

  destroyed() {
    window.removeEventListener('resize', this.resizeRef);
  },

  mounted() {
  	if (this.client)
      this.attachView();
    eventBus.$on('resize', this.resizeView);
  },

  updated() {
    if (this.client) {
    	let view = this.client.view;
    	if (view.parentElement !== this.$el) {
    		view.parentElement.removeChild(view);
  	  	this.attachView();
    	}
    }
  },

  beforeDestroy() {
    if (this.client)
      this.detatchClient(this.client);
    eventBus.$off('resize', this.resizeView);
  },

  methods: {
  	attachView() {
	  	this.$el.appendChild(this.client.view);
	  	this.resizeView();
  	},

  	resizeView() {
          if (!this.client) {
            return;
          }
          var width = window.innerWidth,
              height = window.innerHeight - 180 - 56 * 2,
              size = Math.max(CANVAS_MIN_SIZE, Math.min(width, height));

          if (size > this.$el.parentElement.offsetWidth) {
            size = this.$el.parentElement.offsetWidth;
          }

          this.$el.style.width = size + 'px';
          this.$el.style.height = size + 'px';

          this.client.resize(CANVAS_SIZE, CANVAS_SIZE);
  	},

    attachClient(client) {
      client.connect();
      this.attachView();
    },

    detatchClient(client) {
      let view = client.view;
      if (view.parentElement)
        view.parentElement.removeChild(view);
      // client.destroy();
      client.disconnect();
    }
  }
}
</script>

<style>
  .game-canvas-container {
    background: #444;
    margin: 0 auto;
    padding: 20px;
    width: 100%;
  }

  .game-canvas-container canvas {
    height: 100% !important;
    width: 100% !important;
  }
</style>
