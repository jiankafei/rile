<template>
<section class="pull" ref="pull">
  <div class="pull-motion" ref="motion">
    <section class="pull-refresh" ref="refresh"></section>
    <section class="pull-scroll" ref="scroll">
      <div v-for="(num, index) of 50" :key="index" class="scroll-item">打分法第三方</div>
      <section class="pull-infinate" ref="infinate"></section>
    </section>
    <section class="pull-loadmore" ref="loadmore"></section>
  </div>
</section>
</template>

<script>
import Pull from './pull';
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
    const pull = new Pull({
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
            resolve('refresh');
          }, 1000);
        }),
        pullup: () => new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve('loadmore');
          }, 1000);
        }),
        infinate: () => new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve('infinate');
          }, 1000);
      }),
      },
    });
    pull.pulldown();
    pull.addEventListener('progress', ev => {
      console.log(ev.detail);
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
  .pull-refresh,
  .pull-loadmore
    height 100px
  .scroll-item
    height 30px
</style>
