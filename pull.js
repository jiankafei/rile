import styles from './styles';
import {
  calc,
  dealTouch,
  // throttle,
  bottomReached,
} from './util';

import defaultOptions from './options';

const wm = new WeakMap();

const mergeOptions = (a, b) => {
  const options = Object.assign(Object.create(null), a, b);
  options.fetch = Object.assign(Object.create(null), a.fetch, b.fetch);
  if (b.pullup) b.infinate = null;
  if (b.pulldown) {
    options.pulldown = Object.assign(Object.create(null), a.pulldown, b.pulldown);
    options.pulldownBounce = true;
  } else {
    delete options.pulldown;
  }
  if (b.pullup) {
    options.pullup = Object.assign(Object.create(null), a.pullup, b.pullup);
    options.pullupBounce = true;
  } else {
    delete options.pullup;
  }
  if (b.infinate) {
    options.infinate = Object.assign(Object.create(null), a.infinate, b.infinate);
    options.pullupBounce = false;
  } else {
    delete options.infinate;    
  }

  return options;
};

export default class Pull {
  constructor(options) {
    if (!options.elements) return;
    options = mergeOptions(defaultOptions, options);
    wm.set(this, options);
    const {
      height,
      axial,
      damping,
      elements,
      fetch,
    } = options;

    const {
      pullEl,
      motionEl,
      scrollEl,
    } = elements;

    for (const [name, style] of Object.entries(styles)) {
      if (elements[name]) {
        for (const [key, val] of Object.entries(style)) {
          elements[name] && elements[name].style.setProperty(key, val, 'important');
        }
      }
    }

    const negativeHeight = calc(height, '*', -1);
    pullEl.style.setProperty('height', height, 'important');
    motionEl.style.setProperty('top', negativeHeight, 'important');
    motionEl.style.setProperty('bottom', negativeHeight, 'important');
    scrollEl.style.setProperty('top', height, 'important');
    scrollEl.style.setProperty('height', height, 'important');

    const {
      refreshEl,
      loadmoreEl,
    } = elements;
    if (refreshEl) {
      const refreshHeight = window.getComputedStyle(refreshEl).getPropertyValue('height');
      refreshEl.style.setProperty('top', calc(height, '-', refreshHeight), 'important');
    }
    if (loadmoreEl) {
      const loadmoreHeight = window.getComputedStyle(loadmoreEl).getPropertyValue('height');
      loadmoreEl.style.setProperty('bottom', calc(height, '-', loadmoreHeight), 'important');
    }

    // 事件
    let startData = null; // 跟随 touchmove 更迭的事件对象数据
    let originStartData = null; // touchstart 事件对象数据
    let distance = 0; // pull 的距离
    let prevDistance = 0; // 上一个 distance
    let originScrollTop = 0; // 起始滚动高度
    let status = 'normal'; // less, over, fetch, back, normal
    let action = ''; // 当前动作 pulldown, pullup
    let pulling = false; // 是否正在 pull
    let backStartOfTouchLife = false; // 在一个 touch 周期里 back 是否开始
    let fetching = false; // fetch 是否开始

    const {
      pulldown,
      pullup,
      // infinate,
    } = options;
    // 滑动函数
    const slideTo = (el, axial, dis, transition) => {
      return new Promise((resolve) => {
        if (transition) {
          el.addEventListener('transitionend', () => {
            el.style.removeProperty('transition');
            resolve();
          }, {
            once: true,
          });
          el.style.setProperty('transition', `${transition}ms`);
        }
        distance = dis;
        const val = axial === 'H' ? `${dis}px, 0, 0` : `0, ${dis}px, 0`;
        el.style.setProperty('transform', `translate3d(${val})`);
      });
    };
    // 更新 pulldown 的 status
    const pulldownStatusUpdate = () => {
      if (pulldown) {
        if (distance < pulldown.triggerDistance) {
          status = 'less';
        } else if (distance >= pulldown.triggerDistance) {
          status = 'over';
        }
      }
    };
    // 更新 pullup 的 status
    const pullupStatusUpdate = () => {
      if (pullup) {
        if (Math.abs(distance) < pullup.triggerDistance) {
          status = 'less';
        } else if (Math.abs(distance) >= pullup.triggerDistance) {
          status = 'over';
        }
      }
    };
    // 加载函数
    const actionLoading = () => {
      const option = options[action];
      const stayDistance = action === 'pulldown' ? option.stayDistance : -option.stayDistance;
      status = 'fetch';
      fetching = true;
      slideTo(motionEl, axial, stayDistance, 200)
        .then(() => fetch[action]())
        .then(() => new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, option.loadedStayTime);
        }))
        .then(() => {
          status = 'back';
          backStartOfTouchLife = true;
          if (distance === 0) return Promise.resolve();
          return slideTo(motionEl, axial, 0, 200);
        })
        .then(() => {
          status = 'normal';
          pulling = false;
          fetching = false;
          console.log('归位');
        })
        .catch(console.warn);
    };

    const handleMove = ev => {
      if (ev.touches.length > 1) return;
      if (backStartOfTouchLife) return;
      const touch = ev.touches[0];
      const moveData = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        timeStamp: ev.timeStamp,
      };
      const deltaData = dealTouch(startData, moveData, axial); // 用于判断方向
      const originDeltaData = dealTouch(originStartData, moveData, axial); // 用于计算增量距离
      // 设置 action
      if (deltaData.axial === axial && ev.cancelable) {
        if (scrollEl.scrollTop === 0 && deltaData.direction === 'bottom') {
          pulling = true;
          action = 'pulldown';
        } else if (bottomReached(scrollEl) && deltaData.direction === 'top') {
          pulling = true;
          action = 'pullup';
        }
      }
      if (pulling) {
        // 限制 distance
        if (action === 'pulldown') {
          distance = (originDeltaData.deltaA - originScrollTop) * damping + prevDistance;
          if (distance < 0) distance = 0;
          pulldownStatusUpdate();
        } else if (action === 'pullup') {
          distance = (originDeltaData.deltaA + scrollEl.scrollHeight - scrollEl.offsetHeight - originScrollTop) * damping + prevDistance;
          if (distance > 0) distance = 0;
          pullupStatusUpdate();
        }
        // 阻止滚动并移动
        ev.preventDefault();
        ev.stopPropagation();
        slideTo(motionEl, axial, distance);
      }
      // 更新 startData
      startData = moveData;
    };

    const handleEnd = () => {
      document.removeEventListener('touchmove', handleMove, {
        passive: false,
        capture: false,
      });
      document.removeEventListener('touchend', handleEnd, false);
      if (fetching) {
        const option = options[action];
        const stayDistance = action === 'pulldown' ? option.stayDistance : -option.stayDistance;
        return slideTo(motionEl, axial, stayDistance, 200);
      }
      if (distance === 0) return;
      if (status === 'over') {
        return actionLoading();
      }
      slideTo(motionEl, axial, 0, 200)
        .then(() => {
          status = 'normal';
          pulling = false;
        });
    };

    const handleStart = ev => {
      prevDistance = distance;
      status = 'normal';
      backStartOfTouchLife = false;
      motionEl.style.removeProperty('transition');
      const touch = ev.targetTouches[0];
      startData = originStartData = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        timeStamp: ev.timeStamp,
      };
      originScrollTop = scrollEl.scrollTop;
      document.addEventListener('touchmove', handleMove, {
        passive: false,
        capture: false,
      });
      document.addEventListener('touchend', handleEnd, false);
    };
    scrollEl.addEventListener('touchstart', handleStart, false);
  };
  // 主动触发加载效果
  pulldown() {};
  pullup() {};
}