/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Dispatcher as DispatcherType} from 'react-reconciler/src/ReactInternalTypes';

import type {
  MutableSource,
  MutableSourceGetSnapshotFn,
  MutableSourceSubscribeFn,
  ReactContext,
} from 'shared/ReactTypes';
import type PartialRenderer from './ReactPartialRenderer';

import {validateContextBounds} from './ReactPartialRendererContext';

import invariant from 'shared/invariant';
import {enableCache} from 'shared/ReactFeatureFlags';
import is from 'shared/objectIs';

type BasicStateAction<S> = (S => S) | S;
type Dispatch<A> = A => void;

type Update<A> = {|
  action: A,
  next: Update<A> | null,
|};

type UpdateQueue<A> = {|
  last: Update<A> | null,
  dispatch: any,
|};

type Hook = {|
  memoizedState: any,
  queue: UpdateQueue<any> | null,
  next: Hook | null,
|};

type OpaqueIDType = string;

let currentlyRenderingComponent: Object | null = null;
let firstWorkInProgressHook: Hook | null = null;
let workInProgressHook: Hook | null = null;
// Whether the work-in-progress hook is a re-rendered hook
let isReRender: boolean = false;
// Whether an update was scheduled during the currently executing render pass.
let didScheduleRenderPhaseUpdate: boolean = false;
// Lazily created map of render-phase updates
let renderPhaseUpdates: Map<UpdateQueue<any>, Update<any>> | null = null;
// Counter to prevent infinite loops.
let numberOfReRenders: number = 0;
const RE_RENDER_LIMIT = 25;

let isInHookUserCodeInDev = false;

// In DEV, this is the name of the currently executing primitive hook
let currentHookNameInDev: ?string;


// ----------------------------------------------------------------------------------------- resolveCurrentlyRenderingComponent
// resolveCurrentlyRenderingComponent
function resolveCurrentlyRenderingComponent(): Object {
  invariant(
    currentlyRenderingComponent !== null,
    'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
      ' one of the following reasons:\n' +
      '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
      '2. You might be breaking the Rules of Hooks\n' +
      '3. You might have more than one copy of React in the same app\n' +
      'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.',
  );
  if (__DEV__) {
    if (isInHookUserCodeInDev) {
      console.error(
        'Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. ' +
          'You can only call Hooks at the top level of your React function. ' +
          'For more information, see ' +
          'https://reactjs.org/link/rules-of-hooks',
      );
    }
  }
  return currentlyRenderingComponent;
}

function areHookInputsEqual(
  nextDeps: Array<mixed>,
  prevDeps: Array<mixed> | null,
) {
  if (prevDeps === null) {
    if (__DEV__) {
      console.error(
        '%s received a final argument during this render, but not during ' +
          'the previous render. Even though the final argument is optional, ' +
          'its type cannot change between renders.',
        currentHookNameInDev,
      );
    }
    return false;
  }

  if (__DEV__) {
    // Don't bother comparing lengths in prod because these arrays should be
    // passed inline.
    if (nextDeps.length !== prevDeps.length) {
      console.error(
        'The final argument passed to %s changed size between renders. The ' +
          'order and size of this array must remain constant.\n\n' +
          'Previous: %s\n' +
          'Incoming: %s',
        currentHookNameInDev,
        `[${nextDeps.join(', ')}]`,
        `[${prevDeps.join(', ')}]`,
      );
    }
  }
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}

function createHook(): Hook {
  if (numberOfReRenders > 0) {
    invariant(false, 'Rendered more hooks than during the previous render');
  }
  return {
    memoizedState: null,
    queue: null,
    next: null,
  };
}


// ----------------------------------------------------------------------------------------- createWorkInProgressHook
// createWorkInProgressHook
function createWorkInProgressHook(): Hook {
  if (workInProgressHook === null) { // currentTree 和 workInProgressTree
    // This is the first hook in the list
    if (firstWorkInProgressHook === null) {
      isReRender = false;
      firstWorkInProgressHook = workInProgressHook = createHook();
    } else {
      // There's already a work-in-progress. Reuse it.
      isReRender = true;
      workInProgressHook = firstWorkInProgressHook;
    }
  } else {
    if (workInProgressHook.next === null) {
      isReRender = false;
      // Append to the end of the list
      workInProgressHook = workInProgressHook.next = createHook();
    } else {
      // There's already a work-in-progress. Reuse it.
      isReRender = true;
      workInProgressHook = workInProgressHook.next;
    }
  }
  return workInProgressHook;
}

export function prepareToUseHooks(componentIdentity: Object): void {
  currentlyRenderingComponent = componentIdentity;
  if (__DEV__) {
    isInHookUserCodeInDev = false;
  }

  // The following should have already been reset
  // didScheduleRenderPhaseUpdate = false;
  // firstWorkInProgressHook = null;
  // numberOfReRenders = 0;
  // renderPhaseUpdates = null;
  // workInProgressHook = null;
}

export function finishHooks(
  Component: any,
  props: any,
  children: any,
  refOrContext: any,
): any {
  // This must be called after every function component to prevent hooks from
  // being used in classes.

  while (didScheduleRenderPhaseUpdate) {
    // Updates were scheduled during the render phase. They are stored in
    // the `renderPhaseUpdates` map. Call the component again, reusing the
    // work-in-progress hooks and applying the additional updates on top. Keep
    // restarting until no more updates are scheduled.
    didScheduleRenderPhaseUpdate = false;
    numberOfReRenders += 1;

    // Start over from the beginning of the list
    workInProgressHook = null;

    children = Component(props, refOrContext);
  }
  resetHooksState();
  return children;
}

// Reset the internal hooks state if an error occurs while rendering a component
export function resetHooksState(): void {
  if (__DEV__) {
    isInHookUserCodeInDev = false;
  }

  currentlyRenderingComponent = null;
  didScheduleRenderPhaseUpdate = false;
  firstWorkInProgressHook = null;
  numberOfReRenders = 0;
  renderPhaseUpdates = null;
  workInProgressHook = null;
}

function getCacheForType<T>(resourceType: () => T): T {
  invariant(false, 'Not implemented.');
}

function readContext<T>(context: ReactContext<T>): T {
  const threadID = currentPartialRenderer.threadID;
  validateContextBounds(context, threadID);
  if (__DEV__) {
    if (isInHookUserCodeInDev) {
      console.error(
        'Context can only be read while React is rendering. ' +
          'In classes, you can read it in the render method or getDerivedStateFromProps. ' +
          'In function components, you can read it directly in the function body, but not ' +
          'inside Hooks like useReducer() or useMemo().',
      );
    }
  }
  return context[threadID];
}

function useContext<T>(context: ReactContext<T>): T {
  if (__DEV__) {
    currentHookNameInDev = 'useContext';
  }
  resolveCurrentlyRenderingComponent();
  const threadID = currentPartialRenderer.threadID;
  validateContextBounds(context, threadID);
  return context[threadID];
}

// ----------------------------------------------------------------------------------------- basicStateReducer
// basicStateReducer
function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  // $FlowFixMe: Flow doesn't like mixed types
  return typeof action === 'function' ? action(state) : action;
}


// ----------------------------------------------------------------------------------------- useState
// useState
// 1
// type BasicStateAction<S> = (S => S) | S;
// - action：是一个函数，该函数返回值和参数类型一致，或者一个值
// 2
// type Dispatch<A> = A => void;
// - dispatch：是一个函数，这个函数有一个参数，没有返回值，( A是一个函数或者值： (S => S) | S )
// 3
// 返回值：useState的返回值是 => useReducer(basicStateReducer, initialState)
export function useState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  if (__DEV__) {
    currentHookNameInDev = 'useState'; // hooks在dev环境中的名字
  }
  return useReducer(
    basicStateReducer,
    // basicStateReducer
    // 第一个参数 basicStateReducer函数
    // 参数：state，action
    // 返回值：
    //    - 如果action是函数，调用action(state)并返回
    //    - 如果action不是函数，直接返回action

    (initialState: any),
    // initialState
    // 第二个参数 initialState，初始化state

    // init
    // 第三个参数 init
    // 惰性初始化
    // - useReducer has a special case to support lazy useState initializers
    // - 概念：useReducer 可以 ( 惰性的创建初始state )，即 ( 第三个参数 ) init函数，这样 ( 初始state ) 将被设置为 init(initialArg)
    // - 好处：1.这样就可以将计算state的逻辑提取到reducer的外部 2.也为将来重置state的action做处理提供了便利
  );
}


// ----------------------------------------------------------------------------------------- useReducer
// useReducer
export function useReducer<S, I, A>(
  reducer: (S, A) => S, // useState调用时传入useReducer的第一个参数是basicStateReducer函数
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  if (__DEV__) {
    if (reducer !== basicStateReducer) {
      currentHookNameInDev = 'useReducer';
    }
  }
  currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
  workInProgressHook = createWorkInProgressHook();
  if (isReRender) {
    // This is a re-render. Apply the new render phase updates to the previous
    // current hook.
    const queue: UpdateQueue<A> = (workInProgressHook.queue: any);
    const dispatch: Dispatch<A> = (queue.dispatch: any);
    if (renderPhaseUpdates !== null) {
      // Render phase updates are stored in a map of queue -> linked list
      const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);
      if (firstRenderPhaseUpdate !== undefined) {
        renderPhaseUpdates.delete(queue);
        let newState = workInProgressHook.memoizedState;
        let update = firstRenderPhaseUpdate;
        do {
          // Process this render phase update. We don't have to check the
          // priority because it will always be the same as the current
          // render's.
          const action = update.action;
          if (__DEV__) {
            isInHookUserCodeInDev = true;
          }
          newState = reducer(newState, action);
          if (__DEV__) {
            isInHookUserCodeInDev = false;
          }
          update = update.next;
        } while (update !== null);

        workInProgressHook.memoizedState = newState;

        return [newState, dispatch];
      }
    }
    return [workInProgressHook.memoizedState, dispatch];
  } else {
    if (__DEV__) {
      isInHookUserCodeInDev = true;
    }
    let initialState;
    if (reducer === basicStateReducer) {
      // Special case for `useState`.
      initialState =
        typeof initialArg === 'function'
          ? ((initialArg: any): () => S)()
          : ((initialArg: any): S);
    } else {
      initialState =
        init !== undefined ? init(initialArg) : ((initialArg: any): S);
    }
    if (__DEV__) {
      isInHookUserCodeInDev = false;
    }
    workInProgressHook.memoizedState = initialState;
    const queue: UpdateQueue<A> = (workInProgressHook.queue = {
      last: null,
      dispatch: null,
    });
    const dispatch: Dispatch<A> = (queue.dispatch = (dispatchAction.bind(
      null,
      currentlyRenderingComponent,
      queue,
    ): any));
    return [workInProgressHook.memoizedState, dispatch];
  }
}

function useMemo<T>(nextCreate: () => T, deps: Array<mixed> | void | null): T {
  currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
  workInProgressHook = createWorkInProgressHook();

  const nextDeps = deps === undefined ? null : deps;

  if (workInProgressHook !== null) {
    const prevState = workInProgressHook.memoizedState;
    if (prevState !== null) {
      if (nextDeps !== null) {
        const prevDeps = prevState[1];
        if (areHookInputsEqual(nextDeps, prevDeps)) {
          return prevState[0];
        }
      }
    }
  }

  if (__DEV__) {
    isInHookUserCodeInDev = true;
  }
  const nextValue = nextCreate();
  if (__DEV__) {
    isInHookUserCodeInDev = false;
  }
  workInProgressHook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

function useRef<T>(initialValue: T): {|current: T|} {
  currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
  workInProgressHook = createWorkInProgressHook();
  const previousRef = workInProgressHook.memoizedState;
  if (previousRef === null) {
    const ref = {current: initialValue};
    if (__DEV__) {
      Object.seal(ref);
    }
    workInProgressHook.memoizedState = ref;
    return ref;
  } else {
    return previousRef;
  }
}

export function useLayoutEffect(
  create: () => (() => void) | void,
  inputs: Array<mixed> | void | null,
) {
  if (__DEV__) {
    currentHookNameInDev = 'useLayoutEffect';
    console.error(
      'useLayoutEffect does nothing on the server, because its effect cannot ' +
        "be encoded into the server renderer's output format. This will lead " +
        'to a mismatch between the initial, non-hydrated UI and the intended ' +
        'UI. To avoid this, useLayoutEffect should only be used in ' +
        'components that render exclusively on the client. ' +
        'See https://reactjs.org/link/uselayouteffect-ssr for common fixes.',
    );
  }
}

function dispatchAction<A>(
  componentIdentity: Object,
  queue: UpdateQueue<A>,
  action: A,
) {
  invariant(
    numberOfReRenders < RE_RENDER_LIMIT,
    'Too many re-renders. React limits the number of renders to prevent ' +
      'an infinite loop.',
  );

  if (componentIdentity === currentlyRenderingComponent) {
    // This is a render phase update. Stash it in a lazily-created map of
    // queue -> linked list of updates. After this render pass, we'll restart
    // and apply the stashed updates on top of the work-in-progress hook.
    didScheduleRenderPhaseUpdate = true;
    const update: Update<A> = {
      action,
      next: null,
    };
    if (renderPhaseUpdates === null) {
      renderPhaseUpdates = new Map();
    }
    const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);
    if (firstRenderPhaseUpdate === undefined) {
      renderPhaseUpdates.set(queue, update);
    } else {
      // Append the update to the end of the list.
      let lastRenderPhaseUpdate = firstRenderPhaseUpdate;
      while (lastRenderPhaseUpdate.next !== null) {
        lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
      }
      lastRenderPhaseUpdate.next = update;
    }
  } else {
    // This means an update has happened after the function component has
    // returned. On the server this is a no-op. In React Fiber, the update
    // would be scheduled for a future render.
  }
}

export function useCallback<T>(
  callback: T,
  deps: Array<mixed> | void | null,
): T {
  return useMemo(() => callback, deps);
}

// TODO Decide on how to implement this hook for server rendering.
// If a mutation occurs during render, consider triggering a Suspense boundary
// and falling back to client rendering.
function useMutableSource<Source, Snapshot>(
  source: MutableSource<Source>,
  getSnapshot: MutableSourceGetSnapshotFn<Source, Snapshot>,
  subscribe: MutableSourceSubscribeFn<Source, Snapshot>,
): Snapshot {
  resolveCurrentlyRenderingComponent();
  return getSnapshot(source._source);
}

function useDeferredValue<T>(value: T): T {
  resolveCurrentlyRenderingComponent();
  return value;
}

function useTransition(): [boolean, (callback: () => void) => void] {
  resolveCurrentlyRenderingComponent();
  const startTransition = callback => {
    callback();
  };
  return [false, startTransition];
}

function useOpaqueIdentifier(): OpaqueIDType {
  return (
    (currentPartialRenderer.identifierPrefix || '') +
    'R:' +
    (currentPartialRenderer.uniqueID++).toString(36)
  );
}

function useCacheRefresh(): <T>(?() => T, ?T) => void {
  invariant(false, 'Not implemented.');
}

function noop(): void {}

export let currentPartialRenderer: PartialRenderer = (null: any);
export function setCurrentPartialRenderer(renderer: PartialRenderer) {
  currentPartialRenderer = renderer;
}

export const Dispatcher: DispatcherType = {
  readContext,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
  // useImperativeHandle is not run in the server environment
  useImperativeHandle: noop,
  // Effects are not run in the server environment.
  useEffect: noop,
  // Debugging effect
  useDebugValue: noop,
  useDeferredValue,
  useTransition,
  useOpaqueIdentifier,
  // Subscriptions are not setup in a server environment.
  useMutableSource,
};

if (enableCache) {
  Dispatcher.getCacheForType = getCacheForType;
  Dispatcher.useCacheRefresh = useCacheRefresh;
}
