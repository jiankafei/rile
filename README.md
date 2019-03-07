# Pull

  1. 下拉刷新，上拉加载，无限加载
  2. 支持横轴纵轴
  3. 规避垂直轴滑动
  4. 支持主动上拉下拉

## 表现

  pulldown
      less > 0
      over > stay
              > pulldown > stay
                            > stay > prevent
                            > back > prevent
              > pullup > less
                            > back > prevent

## options

  ```js
  options = {
    total, // 列表总数，infinate时为必填，loadmore时为非必填
    height: '100vh', // 高度，所有有效的css值，默认 100vh
    axial: 'V', // 轴向[V, H] 默认 V
    damping: .5, // 阻尼值 [0 - 1] 越小阻塞越大，默认 .5
    elements, // 需要传递的元素
    refresh, // 刷新选项，有该选项则表示支持，需要使用默认配置，则直接赋值为 truthy 值
    loadmore, // 加载更多选项，有该选项则表示支持，需要使用默认配置，则直接赋值为 truthy 值
    infinate, // 无限加载选项，有该选项则表示支持，需要使用默认配置，则直接赋值为 truthy 值
  };
  ```

## elements

  ```js
  options = {
    pullEl,
    motionEl,
    scrollEl,
    refreshEl,
    loadmoreEl,
    infinateEl,
  }
  ```

## refresh

  ```js
  options = {
    pullText: '下拉刷新',
    triggerText: '释放更新',
    loadingText: '加载中...',
    doneText: '加载完成',
    failText: '加载失败',
    loadedStayTime: 400,
    stayDistance: 50,
    triggerDistance: 70
  };
  ```

## loadmore

  ```js
  options = {
    pullText: '上拉加载',
    triggerText: '释放更新',
    loadingText: '加载中...',
    doneText: '加载完成',
    failText: '加载失败',
    loadedStayTime: 400,
    stayDistance: 50,
    triggerDistance: 70,
  };
  ```

## infinate

  ```js
  options = {
    loadingText: '加载中...',
    triggerDistance: 100,
  }
  ```

## Event

  refreshStateChange
  loadmoreStateChange
  refreshStart
  refreshEnd
  loadmoreStart
  loadmoreEnd
  infinateStart
  infinateEnd