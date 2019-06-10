<template>
  <div class="split-pane"
    @mousemove="dragMove" @mouseup="dragEnd" @mouseleave="dragEnd"
    @touchmove="dragMove" @touchend="dragEnd"
    :class="{ 'is-dragging': dragging }">
    <div class="split-pane-item" :style="{ width: splitLeft }">
      <slot name="left"></slot>
    </div>
    <div class="split-pane-gutter"
      @mousedown="dragStart"
      @touchstart="dragStart"
      :style="{ width: gutter + 'px' }"></div>
    <div class="split-pane-item" :style="{ width: splitRight }">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script>
// Stolen from https://github.com/dangvanthanh/vue-split-pane/


export default {
  data () {
    return {
      gutter: 5,
      split: 50,
      dragging: false
    }
  },
  computed: {
    splitLeft: function () {
      return `calc(${this.split}% - ${this.gutter}px)`
    },
    splitRight: function () {
      return `calc(${100 - this.split}% - ${this.gutter}px)`
    }
  },
  methods: {
    dragStart (e) {
      var pageX = e.touches ? e.touches[0].pageX : e.pageX;
      e.preventDefault();
      this.dragging = true;
      this.startX = pageX;
      this.startSplit = this.split;
    },
    dragMove (e) {
      var pageX = e.touches ? e.touches[0].pageX : e.pageX;
      if (this.dragging) {
        e.preventDefault();
        const dx = pageX - this.startX
        const totalWidth = this.$el.offsetWidth
        let split = this.startSplit + (dx / totalWidth * 100)
        this.split = Math.max(10, Math.min(90, split));
        this.$emit('resize');
      }
    },
    dragEnd () {
      this.dragging = false
    }
  }
}
</script>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
}
.split-pane {
  height: 100%;
  /*display: flex;*/
  /*align-items: stretch;*/
}
.split-pane-item,
.split-pane-gutter {
  height: 100%;
  float: left;
  overflow: hidden;
}
.split-pane-item {
  /*flex: 1;*/
}
.split-pane-gutter {
  /*flex: 0 0 5px;*/
  background: #eee;
  cursor: ew-resize;
}
.is-dragging {
  cursor: ew-resize;
}
</style>