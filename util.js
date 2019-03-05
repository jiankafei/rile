// 创建元素
const createElement = (tagName, attributes = Object.create(null), textContent) => {
  const el = document.createElement(tagName);
  for (const [name, value] of Object.entries(attributes)) {
    el.setAttribute(name, value);
  }
  if (textContent) el.textContent = textContent;
  return el;
};
// css 数值单位计算
const calc = (a, sign, b) => {
  const reg = /^calc/;
  a = `${a}`.replace(reg, '');
  b = `${b}`.replace(reg, '');
  return `calc(${a} ${sign} ${b})`;
};
// touch 事件对象处理
const dealTouch = (start, current, actualAxial = 'V') => {
  const deltaX = current.clientX - start.clientX;
  const deltaY = current.clientY - start.clientY;
  const deltaT = current.timeStamp - start.timeStamp;
  const deltaA = actualAxial === 'V' ? deltaY : deltaX;

  let direction;
  let axial;
  let delta;
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // 左右滑动
    direction = deltaX > 0 ? 'right' : 'left';
    axial = 'H';
    delta = deltaX;
  } else {
    // 上下滑动
    direction = deltaY > 0 ? 'bottom' : 'top';
    axial = 'V';
    delta = deltaY;
  }
  return {
    deltaX, // X轴增量
    deltaY, // Y轴增量
    deltaT, // 滑动时间
    deltaA, // 根据实际轴向确定的轴增量
    delta, // 轴增量
    direction, // 滑动方向 [left, right, top, bottom]
    axial, // 轴向 [V, H]
    speed: Math.abs(delta / deltaT), // 轴增速，像素/每毫秒
  };
};
// 节流
const throttle = (() => {
  let ticking = false;
  return fn => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn();
      });
    }
  };
})();

export {
  createElement,
  calc,
  dealTouch,
  throttle,
};