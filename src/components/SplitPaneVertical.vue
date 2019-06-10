<template>
  <div class="split-panev"
    @mousemove="dragMove" @mouseup="dragEnd" @mouseleave="dragEnd"
    @touchmove="dragMove" @touchend="dragEnd"
    :class="{ 'is-dragging': dragging }">
    <div class="split-panev-item" :style="{ height: splitLeft }">
      <slot name="left"></slot>
    </div>
    <div class="split-panev-gutter"
      @mousedown="dragStart"
      @touchstart="dragStart"
      :style="{ height: gutter + 'px' }"></div>
    <div class="split-panev-item" :style="{ height: splitRight }">
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
      var pageY = e.touches ? e.touches[0].pageY : e.pageY;
      e.preventDefault();
      this.dragging = true
      this.startY = pageY
      this.startSplit = this.split
    },
    dragMove (e) {
      var pageY = e.touches ? e.touches[0].pageY : e.pageY;
      if (this.dragging) {
        e.preventDefault();
        const dx = pageY - this.startY
        const totalHeight = this.$el.offsetHeight
        let split = this.startSplit + (dx / totalHeight * 100)
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
.split-panev {
  width: 100%;
  height: 100%;
  position: relative;
  /*display: flex;*/
  /*align-items: stretch;*/
}
.split-panev-item,
.split-panev-gutter {
  width: 100%;
  overflow: hidden;
}
.split-panev-item {
  /*flex: 1;*/
}
.split-panev-gutter {
  /*flex: 0 0 5px;*/
  background: #eee;
  cursor: ns-resize;
}
.split-panev.is-dragging {
  cursor: ns-resize;
}
</style>