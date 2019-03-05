import styles from './styles';
import {
  calc,
  dealTouch,
  // throttle,
} from './util';

import defaultOptions from './options';

const wm = new WeakMap();

// 合并 options
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

// slide
const slideTo = (el, cssfunc, distance, transition, options) => {
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
    options.distance = distance;
    el.style.setProperty('transform', `${cssfunc}(${distance}px)`);
  });
}

// 触底
const finalEndReached = (el, {
  scrollProp,
  offsetSize,
  scrollSize,
}) => (el[scrollProp] + el[offsetSize] + 1 >= el[scrollSize]);

// status 更新
const pulldownStatusUpdate = (options) => {
  const {
    pulldown,
    distance,
  } = options;
  if (pulldown) {
    if (distance < pulldown.triggerDistance) {
      options.status = 'less';
    } else if (distance >= pulldown.triggerDistance) {
      options.status = 'over';
    }
  }
}
const pullupStatusUpdate = (options) => {
  const {
    pullup,
    distance,
  } = options;
  if (pullup) {
    if (Math.abs(distance) < pullup.triggerDistance) {
      options.status = 'less';
    } else if (Math.abs(distance) >= pullup.triggerDistance) {
      options.status = 'over';
    }
  }
}

// loading 动作
const actionLoading = (options) => {
  const {
    fetch,
    distance,
    elements,
    action,
    cssfunc,
  } = options;
  const {
    stayDistance,
    loadedStayTime,
  } = options[action];
  const stayDistanceDealed = action === 'pulldown' ? stayDistance : -stayDistance;
  options.status = 'fetch';
  options.fetching = true;
  slideTo(elements.motionEl, cssfunc, stayDistanceDealed, 200, options)
    .then(() => fetch[action]())
    .then(() => new Promise((resolve) => {
      if (loadedStayTime < 200) {
        return resolve();
      }
      setTimeout(() => {
        resolve();
      }, loadedStayTime);
    }))
    .then(() => {
      options.status = 'back';
      options.backStartOfTouchLife = true;
      if (distance === 0) return Promise.resolve();
      return slideTo(elements.motionEl, cssfunc, 0, 200, options);
    })
    .then(() => {
      options.status = 'normal';
      options.pulling = false;
      options.fetching = false;
      console.log('归位');
    })
    .catch(console.warn);
}

// init
const init = (options) => {
  const {
    height,
    elements,
  } = options;

  const {
    pullEl,
    motionEl,
    scrollEl,
    refreshEl,
    loadmoreEl,
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

  if (refreshEl) {
    const refreshHeight = window.getComputedStyle(refreshEl).getPropertyValue('height');
    refreshEl.style.setProperty('top', calc(height, '-', refreshHeight), 'important');
  }
  if (loadmoreEl) {
    const loadmoreHeight = window.getComputedStyle(loadmoreEl).getPropertyValue('height');
    loadmoreEl.style.setProperty('bottom', calc(height, '-', loadmoreHeight), 'important');
  }
}

// bind event
const bindEvent = (options) => {
  let startData = null; // 跟随 touchmove 更迭的事件对象数据
  let originStartData = null; // touchstart 事件对象数据
  let prevDistance = 0; // 上一个 distance
  let originScrollDistance = 0; // 起始滚动高度

  const {
    elements,
    backStartOfTouchLife,
    axial,
    damping,
    scrollProp,
    startPullDirection,
    endPullDirection,
    scrollSize,
    offsetSize,
    cssfunc,
  } = options;

  const {
    scrollEl,
    motionEl,
  } = elements;

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
      if (scrollEl[scrollProp] === 0 && deltaData.direction === startPullDirection) {
        options.pulling = true;
        options.action = 'pulldown';
      } else if (finalEndReached(scrollEl, options) && deltaData.direction === endPullDirection) {
        options.pulling = true;
        options.action = 'pullup';
      }
    }
    if (options.pulling) {
      // 限制 distance
      if (options.action === 'pulldown') {
        options.distance = (originDeltaData.deltaA - originScrollDistance) * damping + prevDistance;
        if (options.distance < 0) options.distance = 0;
        pulldownStatusUpdate(options);
      } else if (options.action === 'pullup') {
        options.distance = (originDeltaData.deltaA + scrollEl[scrollSize] - scrollEl[offsetSize] - originScrollDistance) * damping + prevDistance;
        if (options.distance > 0) options.distance = 0;
        pullupStatusUpdate(options);
      }
      // 阻止滚动并移动
      ev.preventDefault();
      ev.stopPropagation();
      slideTo(motionEl, cssfunc, options.distance, null, options);
    }
    // 更新 startData
    startData = moveData;
  };

  const handleEnd = () => {
    const {
      fetching,
      status,
      action,
    } = options;
    const stayDistance = options[action].stayDistance;
    const stayDistanceDealed = action === 'pulldown' ? stayDistance : -stayDistance;
    document.removeEventListener('touchmove', handleMove, {
      passive: false,
      capture: false,
    });
    document.removeEventListener('touchend', handleEnd, false);
    if (fetching) {
      return slideTo(motionEl, cssfunc, stayDistanceDealed, 200, options);
    }
    if (options.distance === 0) return;
    if (status === 'over') {
      return actionLoading(options);
    }
    slideTo(motionEl, cssfunc, 0, 200, options)
      .then(() => {
        options.status = 'normal';
        options.pulling = false;
      });
  };

  const handleStart = ev => {
    prevDistance = options.distance;
    options.status = 'normal';
    options.backStartOfTouchLife = false;
    motionEl.style.removeProperty('transition');
    const touch = ev.targetTouches[0];
    startData = originStartData = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      timeStamp: ev.timeStamp,
    };
    originScrollDistance = scrollEl[scrollProp];
    document.addEventListener('touchmove', handleMove, {
      passive: false,
      capture: false,
    });
    document.addEventListener('touchend', handleEnd, false);
  };
  scrollEl.addEventListener('touchstart', handleStart, false);
};

export default class Pull {
  constructor(options) {
    if (!options.elements) return;
    options = mergeOptions(defaultOptions, options);
    Object.assign(options, {
      distance: 0,
      status: 'normal',
      action: 'normal',
      pulling: false,
      backStartOfTouchLife: false,
      fetching: false,
    }, options.axial === 'V' ? {
      cssfunc: 'translatey',
      scrollProp: 'scrollTop',
      offsetSize: 'offsetHeight',
      scrollSize: 'scrollHeight',
      startPullDirection: 'bottom',
      endPullDirection: 'top',
    } : {
      cssfunc: 'translatex',
      scrollProp: 'scrollLeft',
      offsetSize: 'offsetWidth',
      scrollSize: 'scrollWidth',
      startPullDirection: 'right',
      endPullDirection: 'left',
    });
    console.log(options);
    wm.set(this, options);
    init(options);
    bindEvent(options);
  };
  // 主动触发加载效果
  pulldown() {
    const options = wm.get(this);
  };
  pullup() {
    const options = wm.get(this);
  };
}