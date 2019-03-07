import 'intersection-observer';
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
    delete options.elements.refreshEl;
  }
  if (b.pullup) {
    options.pullup = Object.assign(Object.create(null), a.pullup, b.pullup);
    options.pullupBounce = true;
  } else {
    delete options.pullup;
    delete options.elements.loadmoreEl;
  }
  if (b.infinate) {
    options.infinate = Object.assign(Object.create(null), a.infinate, b.infinate);
    options.pullupBounce = false;
  } else {
    delete options.infinate;
    delete options.elements.infinateEl;
  }

  return options;
};

// slide
const slideTo = (el, cssfunc, distance, transition, options) => {
  if (options.distance === distance) return Promise.resolve();
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
  scrollSize,
  clientSize,
}) => (el[scrollProp] + el[clientSize] + 1 >= el[scrollSize]);

// pullStatus 更新
const pulldownStatusUpdate = (distance, options) => {
  const {
    pulldown,
  } = options;
  if (pulldown) {
    if (distance < pulldown.triggerDistance) {
      options.pullStatus = 'less';
    } else if (distance >= pulldown.triggerDistance) {
      options.pullStatus = 'over';
    }
  }
}
const pullupStatusUpdate = (distance, options) => {
  const {
    pullup,
  } = options;
  if (pullup) {
    if (Math.abs(distance) < pullup.triggerDistance) {
      options.pullStatus = 'less';
    } else if (Math.abs(distance) >= pullup.triggerDistance) {
      options.pullStatus = 'over';
    }
  }
}

// back 动作
const actionBack = (options) => {
  options.status = 'back';
  options.backingOfTouchLife = true;
  return slideTo(options.elements.motionEl, options.cssfunc, 0, 200, options)
    .then(() => {
      options.status = 'normal';
      options.pulling = false;
      options.loadLife = false;
      console.log('回归');
      return Promise.resolve();
    });
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
  return fetch[action]()
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
  options.loadLife = true;
  if (options.status === 'normal') {
    options.status = 'stay';
    options.stayingOfTouchLife = true;
  }
  const stayDistance = options[options.action].stayDistance;
  const stayDistanceDealed = options.action === 'pulldown' ? stayDistance : -stayDistance;
  return slideTo(options.elements.motionEl, options.cssfunc, stayDistanceDealed, 200, options)
    .then(() => {
      if (options.status === 'fetch' || options.status === 'back') {
        return Promise.resolve(options);
      } else {
        options.stayingOfTouchLife = false;
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
    infinateEl,
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
  if (infinateEl) {
    infinateEl.style.setProperty(sideProp, '100%', 'important');
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
    clientSize,
    cssfunc,
    infinate,
  } = options;

  const {
    scrollEl,
    motionEl,
    infinateEl,
  } = elements;

  if (infinateEl) {
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        console.log(111);
      }
    }, {
      root: scrollEl,
      rootMargin: `${infinate.reachBottomDistance}px`,
      threshold: 0,
    });
    io.observe(infinateEl);
  }

  const handleMove = ev => {
    if (ev.touches.length > 1) return;
    if (options.stayingOfTouchLife || options.backingOfTouchLife) return;
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
      let distance = options.distance;
      // 限制 distance
      if (options.action === 'pulldown') {
        distance = (originDeltaData.deltaA - originScrollDistance) * damping + prevDistance;
        if (distance < 0) distance = 0;
        pulldownStatusUpdate(distance, options);
      } else if (options.action === 'pullup') {
        distance = (originDeltaData.deltaA + scrollEl[scrollSize] - scrollEl[clientSize] - originScrollDistance) * damping + prevDistance;
        if (distance > 0) distance = 0;
        pullupStatusUpdate(distance, options);
      }
      // 阻止滚动并移动
      ev.preventDefault();
      ev.stopPropagation();
      slideTo(motionEl, cssfunc, distance, null, options);
    }
    // 更新 startData
    startData = moveData;
  };

  const handleEnd = (ev) => {
    document.removeEventListener('touchmove', handleMove, {
      passive: false,
      capture: false,
    });
    document.removeEventListener('touchend', handleEnd, false);
    if (options.stayingOfTouchLife || options.backingOfTouchLife) {
      options.stayingOfTouchLife = options.backingOfTouchLife = false;
      return;
    }
    const touch = ev.changedTouches[0];
    const endData = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      timeStamp: ev.timeStamp,
    };
    const deltaData = dealTouch(originStartData, endData, axial);
    if (!deltaData.delta) return;
    if (options.pullStatus === 'over') {
      return actionStay(options);
    }
    slideTo(motionEl, cssfunc, 0, 200, options)
      .then(() => {
        options.pulling = false;
      });
  };

  const handleStart = ev => {
    if (!options.loadLife) {
      options.stayingOfTouchLife = options.backingOfTouchLife = false;
    }
    prevDistance = options.distance;
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
      pullStatus: 'less',
      status: 'normal',
      action: 'normal',
      pulling: false,
      loadLife: false,
      stayingOfTouchLife: false,
      backingOfTouchLife: false,
    }, options.axial === 'V' ? {
      cssfunc: 'translatey',
      scrollProp: 'scrollTop',
      scrollSize: 'scrollHeight',
      clientSize: 'clientHeight',
      startPullDirection: 'bottom',
      endPullDirection: 'top',
    } : {
      cssfunc: 'translatex',
      scrollProp: 'scrollLeft',
      scrollSize: 'scrollWidth',
      clientSize: 'clientWidth',
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
    options.action = 'pulldown';
    actionStay(options);
  };
  pullup() {
    const options = wm.get(this);
    if (finalEndReached(options.elements.scrollEl, options)) {
      options.action = 'pullup';
      actionStay(options);
    }
  };
}