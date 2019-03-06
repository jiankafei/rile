export default {
  axial: 'V', // 轴向
  size: '100%', // 轴向尺寸
  damping: .5, // 阻尼
  pulldownBounce: true, // 下拉是否回弹
  pullupBounce: true, // 上拉是否回弹
  pulldown: {
    pullText: '下拉刷新',
    triggerText: '释放更新',
    loadingText: '加载中...',
    doneText: '加载完成',
    failText: '加载失败',
    loadedStayTime: 400,
    stayDistance: 50,
    triggerDistance: 70
  },
  pullup: {
    pullText: '上拉加载',
    triggerText: '释放更新',
    loadingText: '加载中...',
    doneText: '加载完成',
    failText: '加载失败',
    loadedStayTime: 400,
    stayDistance: 50,
    triggerDistance: 70,
  },
  infinate: {
    loadingText: '加载中...',
    reachBottomDistance: 100,
  },
  // return a promise instance
  fetch: {
    pulldown: () => Promise.resolve(),
    pullup: () => Promise.resolve(),
    infinate: () => Promise.resolve(),
  },
};