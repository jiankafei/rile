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

// back 动作
const actionBack = (options) => {
  options.status = 'back';
  options.backStartOfTouchLife = true;
  if (options.distance === 0) return Promise.resolve();
  return slideTo(options.elements.motionEl, options.cssfunc, 0, 200, options)
    .then(() => {
      options.backStartOfTouchLife = false;
      options.status = 'normal';
      options.pulling = false;
      options.fetching = false;
      options.distance = 0;
    })
    .catch(console.warn);
};

// fetch 动作
const actionFetch = (options) => {
  const {
    fetch,
    action,
  } = options;
  const {
    loadedStayTime,
  } = options[action];
  options.status = 'fetch';
  options.fetching = true;
  fetch[action]()
    .then(() => new Promise((resolve) => {
      if (loadedStayTime < 200) {
        resolve();
      } else {
        setTimeout(() => {
          resolve();
        }, loadedStayTime);
      }
    }))
    .then(() => actionBack(options));
}

// stay 动作
const actionStay = (options) => {
  options.stayStartOfTouchLife = true;
  const stayDistance = options[options.action].stayDistance;
  const stayDistanceDealed = options.action === 'pulldown' ? stayDistance : -stayDistance;
  return slideTo(options.elements.motionEl, options.cssfunc, stayDistanceDealed, 200, options)
    .then(() => {
      options.stayStartOfTouchLife = false;
      if (options.fetching) {
        return Promise.resolve(options);
      } else {
        return actionFetch(options);
      }
    });
};

// init
const init = (options) => {
  const {
    size,
    axial,
    elements,
  } = options;

  const {
    pullEl,
    motionEl,
    scrollEl,
    refreshEl,
    loadmoreEl,
  } = elements;

  const negativeSize = calc(size, '*', -1);
  let axialProp;
  let sideProp;
  let startPositionProp;
  let endPositionProp;
  if (axial === 'V') {
    axialProp = 'height';
    sideProp = 'width';
    startPositionProp = 'top';
    endPositionProp = 'bottom';
  } else {
    axialProp = 'width';
    sideProp = 'height';
    startPositionProp = 'left';
    endPositionProp = 'right';
  }

  pullEl.style.setProperty('position', 'relative', 'important');
  pullEl.style.setProperty('overflow', 'hidden', 'important');
  pullEl.style.setProperty(axialProp, size, 'important');
  
  motionEl.style.setProperty('position', 'absolute', 'important');
  motionEl.style.setProperty(sideProp, '100%', 'important');
  motionEl.style.setProperty(startPositionProp, negativeSize, 'important');
  motionEl.style.setProperty(endPositionProp, negativeSize, 'important');

  scrollEl.style.setProperty('position', 'absolute', 'important');
  scrollEl.style.setProperty('overflow', 'auto', 'important');
  scrollEl.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
  scrollEl.style.setProperty(startPositionProp, size, 'important');
  scrollEl.style.setProperty(axialProp, size, 'important');
  scrollEl.style.setProperty(sideProp, '100%', 'important');

  if (refreshEl) {
    const refreshSize = window.getComputedStyle(refreshEl).getPropertyValue(axialProp);
    refreshEl.style.setProperty('position', 'absolute', 'important');
    refreshEl.style.setProperty(sideProp, '100%', 'important');
    refreshEl.style.setProperty(startPositionProp, calc(size, '-', refreshSize), 'important');
  }
  if (loadmoreEl) {
    const loadmoreSize = window.getComputedStyle(loadmoreEl).getPropertyValue(axialProp);
    loadmoreEl.style.setProperty('position', 'absolute', 'important');
    loadmoreEl.style.setProperty(sideProp, '100%', 'important');
    loadmoreEl.style.setProperty(endPositionProp, calc(size, '-', loadmoreSize), 'important');
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
    if (options.backStartOfTouchLife || options.stayStartOfTouchLife) return;
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

  const handleEnd = (ev) => {
    if (options.backStartOfTouchLife || options.stayStartOfTouchLife) return;
    const touch = ev.changedTouches[0];
    const endData = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      timeStamp: ev.timeStamp,
    };
    const deltaData = dealTouch(originStartData, endData, axial);
    if (!deltaData.delta) return;
    document.removeEventListener('touchmove', handleMove, {
      passive: false,
      capture: false,
    });
    document.removeEventListener('touchend', handleEnd, false);
    if (options.status === 'over') {
      return actionStay(options);
    }
    slideTo(motionEl, cssfunc, 0, 200, options)
      .then(() => {
        options.status = 'normal';
        options.pulling = false;
      });
  };

  const handleStart = ev => {
    if (options.backStartOfTouchLife || options.stayStartOfTouchLife) return;
    prevDistance = options.distance;
    options.status = 'normal';
    options.stayStartOfTouchLife = false;
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
      stayStartOfTouchLife: false,
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