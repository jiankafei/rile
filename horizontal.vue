<template>
<section class="pull" ref="pull">
  <div class="pull-motion" ref="motion">
    <section class="pull-refresh" ref="refresh"></section>
    <section class="pull-scroll" ref="scroll">
      <div v-for="(num, index) of 50" :key="index" class="scroll-item">打分法第三方</div>
    </section>
    <section class="pull-loadmore" ref="loadmore"></section>
    <section class="pull-infinate" ref="infinate"></section>
  </div>
</section>
</template>

<script>
import Pull from './pull2';
import {
  createElement,
} from './util';

document.head.appendChild(createElement('meta', {
  name: 'viewport',
  content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}));

export default {
  created() {},
  mounted() {
    new Pull({
      axial: 'H',
      size: '100vh',
      elements: {
        pullEl: this.$refs.pull,
        motionEl: this.$refs.motion,
        scrollEl: this.$refs.scroll,
        refreshEl: this.$refs.refresh,
        loadmoreEl: this.$refs.loadmore,
        infinateEl: this.$refs.infinate,
      },
      pulldown: {},
      pullup: {},
      infinate: {},
      fetch: {
        pulldown: () => new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve();
          }, 1000);
        }),
        pullup: () => new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve();
          }, 1000);
        }),
        infinate: () => new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve();
          }, 1000);
      }),
      },
    });
  },
};
</script>

<style lang="stylus">
* {
  margin: 0;
  padding: 0;
}
</style>

<style lang="stylus" scoped>
.pull
  height 100px
  .pull-refresh,
  .pull-loadmore
    width 100px
  .pull-scroll
    display flex
  .scroll-item
    flex none;
    width 50px
</style>
