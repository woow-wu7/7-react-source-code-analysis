/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Dispatcher} from 'react-reconciler/src/ReactInternalTypes';
import type {
  MutableSource,
  MutableSourceGetSnapshotFn,
  MutableSourceSubscribeFn,
  ReactContext,
} from 'shared/ReactTypes';
import type {OpaqueIDType} from 'react-reconciler/src/ReactFiberHostConfig';

import ReactCurrentDispatcher from './ReactCurrentDispatcher';

type BasicStateAction<S> = (S => S) | S;
type Dispatch<A> = A => void;

function resolveDispatcher() {
  const dispatcher = ReactCurrentDispatcher.current;
  // ReactCurrentDispatcher

  // const ReactCurrentDispatcher = {
  //   current: (null: null | Dispatcher),
  // };

  // export type Dispatcher = {|
  //   getCacheForType?: <T>(resourceType: () => T) => T,
  //   readContext<T>(context: ReactContext<T>): T,
  //   useState<S>(initialState: (() => S) | S): [S, Dispatch<BasicStateAction<S>>],
  //   useReducer<S, I, A>(
  //     reducer: (S, A) => S,
  //     initialArg: I,
  //     init?: (I) => S,
  //   ): [S, Dispatch<A>],
  //   useContext<T>(context: ReactContext<T>): T,
  //   useRef<T>(initialValue: T): {|current: T|},
  //   useEffect(
  //     create: () => (() => void) | void,
  //     deps: Array<mixed> | void | null,
  //   ): void,
  //   useLayoutEffect(
  //     create: () => (() => void) | void,
  //     deps: Array<mixed> | void | null,
  //   ): void,
  //   useCallback<T>(callback: T, deps: Array<mixed> | void | null): T,
  //   useMemo<T>(nextCreate: () => T, deps: Array<mixed> | void | null): T,
  //   useImperativeHandle<T>(
  //     ref: {|current: T | null|} | ((inst: T | null) => mixed) | null | void,
  //     create: () => T,
  //     deps: Array<mixed> | void | null,
  //   ): void,
  //   useDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void,
  //   useDeferredValue<T>(value: T): T,
  //   useTransition(): [boolean, (() => void) => void],
  //   useMutableSource<Source, Snapshot>(
  //     source: MutableSource<Source>,
  //     getSnapshot: MutableSourceGetSnapshotFn<Source, Snapshot>,
  //     subscribe: MutableSourceSubscribeFn<Source, Snapshot>,
  //   ): Snapshot,
  //   useOpaqueIdentifier(): any,
  //   useCacheRefresh?: () => <T>(?() => T, ?T) => void,

  //   unstable_isNewReconciler?: boolean,
  // |};



  if (__DEV__) {
    if (dispatcher === null) { // dev环境 并且 dispatcher是null
      console.error(
        'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
          ' one of the following reasons:\n' +
          '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
          '2. You might be breaking the Rules of Hooks\n' +
          '3. You might have more than one copy of React in the same app\n' +
          'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.',
      );
    }
  }
  // Will result in a null access error if accessed outside render phase. We
  // intentionally don't throw our own error because this is in a hot path.
  // Also helps ensure this is inlined.
  return ((dispatcher: any): Dispatcher);
}

export function getCacheForType<T>(resourceType: () => T): T {
  const dispatcher = resolveDispatcher();
  // $FlowFixMe This is unstable, thus optional
  return dispatcher.getCacheForType(resourceType);
}

export function useContext<T>(Context: ReactContext<T>): T {
  const dispatcher = resolveDispatcher();
  if (__DEV__) {
    // TODO: add a more generic warning for invalid values.
    if ((Context: any)._context !== undefined) {
      const realContext = (Context: any)._context;
      // Don't deduplicate because this legitimately causes bugs
      // and nobody should be using this in existing code.
      if (realContext.Consumer === Context) {
        console.error(
          'Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be ' +
            'removed in a future major release. Did you mean to call useContext(Context) instead?',
        );
      } else if (realContext.Provider === Context) {
        console.error(
          'Calling useContext(Context.Provider) is not supported. ' +
            'Did you mean to call useContext(Context) instead?',
        );
      }
    }
  }
  return dispatcher.useContext(Context);
}

// ---------------------------------------- useState
export function useState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}

export function useReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  const dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialArg, init);
}

export function useRef<T>(initialValue: T): {|current: T|} {
  const dispatcher = resolveDispatcher();
  return dispatcher.useRef(initialValue);
}

export function useEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, deps);
}

export function useLayoutEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  const dispatcher = resolveDispatcher();
  return dispatcher.useLayoutEffect(create, deps);
}

export function useCallback<T>(
  callback: T,
  deps: Array<mixed> | void | null,
): T {
  const dispatcher = resolveDispatcher();
  return dispatcher.useCallback(callback, deps);
}

export function useMemo<T>(
  create: () => T,
  deps: Array<mixed> | void | null,
): T {
  const dispatcher = resolveDispatcher();
  return dispatcher.useMemo(create, deps);
}

export function useImperativeHandle<T>(
  ref: {|current: T | null|} | ((inst: T | null) => mixed) | null | void,
  create: () => T,
  deps: Array<mixed> | void | null,
): void {
  const dispatcher = resolveDispatcher();
  return dispatcher.useImperativeHandle(ref, create, deps);
}

export function useDebugValue<T>(
  value: T,
  formatterFn: ?(value: T) => mixed,
): void {
  if (__DEV__) {
    const dispatcher = resolveDispatcher();
    return dispatcher.useDebugValue(value, formatterFn);
  }
}

export const emptyObject = {};

export function useTransition(): [boolean, (() => void) => void] {
  const dispatcher = resolveDispatcher();
  return dispatcher.useTransition();
}

export function useDeferredValue<T>(value: T): T {
  const dispatcher = resolveDispatcher();
  return dispatcher.useDeferredValue(value);
}

export function useOpaqueIdentifier(): OpaqueIDType | void {
  const dispatcher = resolveDispatcher();
  return dispatcher.useOpaqueIdentifier();
}

export function useMutableSource<Source, Snapshot>(
  source: MutableSource<Source>,
  getSnapshot: MutableSourceGetSnapshotFn<Source, Snapshot>,
  subscribe: MutableSourceSubscribeFn<Source, Snapshot>,
): Snapshot {
  const dispatcher = resolveDispatcher();
  return dispatcher.useMutableSource(source, getSnapshot, subscribe);
}

export function useCacheRefresh(): <T>(?() => T, ?T) => void {
  const dispatcher = resolveDispatcher();
  // $FlowFixMe This is unstable, thus optional
  return dispatcher.useCacheRefresh();
}
