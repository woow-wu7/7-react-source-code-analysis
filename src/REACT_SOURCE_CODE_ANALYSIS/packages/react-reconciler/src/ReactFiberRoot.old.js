/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FiberRoot, SuspenseHydrationCallbacks} from './ReactInternalTypes';
import type {RootTag} from './ReactRootTags';

import {noTimeout, supportsHydration} from './ReactFiberHostConfig';
import {createHostRootFiber} from './ReactFiber.old';
import {
  NoLane,
  NoLanes,
  NoTimestamp,
  TotalLanes,
  createLaneMap,
} from './ReactFiberLane.old';
import {
  enableSuspenseCallback,
  enableCache,
  enableProfilerCommitHooks,
  enableProfilerTimer,
  enableUpdaterTracking,
} from 'shared/ReactFeatureFlags';
import {initializeUpdateQueue} from './ReactUpdateQueue.old';
import {LegacyRoot, ConcurrentRoot} from './ReactRootTags';


// ----------------------------------------------------------------------------------------------------------- FiberRootNode
// []FiberRootNode
// 1
// init mount
// const root: FiberRoot = (new FiberRootNode(containerInfo, tag, hydrate): any);
function FiberRootNode(containerInfo, tag, hydrate) {

  this.tag = tag;
  // tag
  // - tag表示fiberRoot对象节点的类型，fiberRoot的tag只可能是 RootTag = 0｜1

  this.containerInfo = containerInfo;
  // containerInfo
  // - containerInfo 就是reactDOM.render(element, container) 中的 container 容器，一般是 document.getElementById('root')

  this.pendingChildren = null;

  this.current = null;
  // current
  // - fiberRoot.current = rootFiber

  this.pingCache = null;
  this.finishedWork = null;
  this.timeoutHandle = noTimeout;

  this.context = null;
  this.pendingContext = null;
  // context 和 pendingContext
  // - 在 updateContainer() 方法中会判断 fiberRoot的context是否存在
  // - 存在： container.context = context = {}
  // - 不存在：container.pendingContext = context = {}

  this.hydrate = hydrate;
  this.callbackNode = null;
  this.callbackPriority = NoLane;
  this.eventTimes = createLaneMap(NoLanes);
  this.expirationTimes = createLaneMap(NoTimestamp);

  this.pendingLanes = NoLanes;
  this.suspendedLanes = NoLanes;
  this.pingedLanes = NoLanes;
  this.expiredLanes = NoLanes;
  this.mutableReadLanes = NoLanes;
  this.finishedLanes = NoLanes;

  this.entangledLanes = NoLanes;
  this.entanglements = createLaneMap(NoLanes);

  if (enableCache) {
    this.pooledCache = null;
    this.pooledCacheLanes = NoLanes;
  }

  if (supportsHydration) {
    this.mutableSourceEagerHydrationData = null;
  }

  if (enableSuspenseCallback) {
    this.hydrationCallbacks = null;
  }

  if (enableProfilerTimer && enableProfilerCommitHooks) {
    this.effectDuration = 0;
    this.passiveEffectDuration = 0;
  }

  if (enableUpdaterTracking) {
    this.memoizedUpdaters = new Set();
    const pendingUpdatersLaneMap = (this.pendingUpdatersLaneMap = []);
    for (let i = 0; i < TotalLanes; i++) {
      pendingUpdatersLaneMap.push(new Set());
    }
  }

  if (__DEV__) {
    switch (tag) {
      case ConcurrentRoot:
        this._debugRootType = 'createRoot()';
        break;
      case LegacyRoot:
        this._debugRootType = 'createLegacyRoot()';
        break;
    }
  }
}

// ----------------------------------------------------------------------------------------------------------- createFiberRoot
// createFiberRoot
// 1
// init mount
// return createFiberRoot( containerInfo, tag, hydrate, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, );
export function createFiberRoot(
  containerInfo: any,
  tag: RootTag, // type RootTag = 0 | 1; // 0
  hydrate: boolean,
  hydrationCallbacks: null | SuspenseHydrationCallbacks,
  isStrictMode: boolean,
  concurrentUpdatesByDefaultOverride: null | boolean,
): FiberRoot {
  const root: FiberRoot = (new FiberRootNode(containerInfo, tag, hydrate): any); // ============ fiberRoot

  if (enableSuspenseCallback) {
    // enableSuspenseCallback
    // export const enableSuspenseCallback = false;
    // enableSuspenseCallback 是一个常量 false
    root.hydrationCallbacks = hydrationCallbacks; // 初始化时 hydrationCallbacks = null
  }

  // Cyclic construction. This cheats the type system right now because
  // stateNode is any.
  // 循环结构。这会立即欺骗类型系统，因为stateNode是any。
  const uninitializedFiber = createHostRootFiber( // ============================================ rootFiber
    tag, // 0
    isStrictMode, // false
    concurrentUpdatesByDefaultOverride, // false
  );
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;
  // fiberRoot 和 rootFiber 之间的相互引用
  // 1. rootFiber.stateNode = fiberRoot
  // 2. fiberRoot.current = rootFiber

  if (enableCache) {  // export const enableCache = __EXPERIMENTAL__;
    const initialCache = new Map();
    root.pooledCache = initialCache;
    const initialState = {
      element: null,
      cache: initialCache,
    };
    uninitializedFiber.memoizedState = initialState; // memoizedState 的赋值
  } else {
    const initialState = {
      element: null,
    };
    uninitializedFiber.memoizedState = initialState;
  }

  initializeUpdateQueue(uninitializedFiber); // 添加 rootFiber.updateQueue 属性

  return root;
}
