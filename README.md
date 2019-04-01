# rile

pull to refresh or loadmore and infinat. Coming soon.

  1. 下拉刷新，上拉加载，无限加载
  2. 支持横轴纵轴
  3. 规避垂直轴滑动
  4. 支持主动上拉下拉

## options

```js
const options = {
  total: -1, // 列表总数
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
    doneText: '加载完成',
    failText: '加载失败',
    reachBottomDistance: 100,
  },
  // return a promise instance
  fetch: {
    pulldown: () => Promise.resolve(),
    pullup: () => Promise.resolve(),
    infinate: () => Promise.resolve(),
  },
};
```

## Event

```js
refreshStateChange
loadmoreStateChange
refreshStart
refreshEnd
loadmoreStart
loadmoreEnd
infinateStart
infinateEnd
```