/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "shared/invariant";

import ReactNoopUpdateQueue from "./ReactNoopUpdateQueue";

const emptyObject = {};
if (__DEV__) {
  Object.freeze(emptyObject);
}

/**
 * Base class helpers for the updating state of a component.
 */
// ----------------------------------------------------------------------------------------------------------- Component
// Component
// - 使用：一般都是 Class A extends Component {}
function Component(props, context, updater) {
  this.props = props;
  this.context = context;

  // If a component has string refs, we will assign a different object later.
  // 先赋值空对象
  this.refs = emptyObject;

  // We initialize the default updater but the real one gets injected by the renderer.
  // 初始化updater
  this.updater = updater || ReactNoopUpdateQueue;
  // ReactNoopUpdateQueue
  // - 是一个对象，具有这些属性 {isMounted, enqueueForceUpdate, enqueueReplaceState, enqueueSetState }
}

Component.prototype.isReactComponent = {}; // 用来区分组件的类型
// 1
// isReactComponent
// 问题：如果区分 classComponent 和 functionComponent
// 答案：在 Component.prototype.isReactComponent 上挂载 isReactComponent 来区分

/**
 * Sets a subset of the state. Always use this to mutate
 * state. You should treat `this.state` as immutable.
 *
 * There is no guarantee that `this.state` will be immediately updated, so
 * accessing `this.state` after calling this method may return the old value.
 *
 * There is no guarantee that calls to `setState` will run synchronously,
 * as they may eventually be batched together.  You can provide an optional
 * callback that will be executed when the call to setState is actually
 * completed.
 *
 * When a function is provided to setState, it will be called at some point in
 * the future (not synchronously). It will be called with the up to date
 * component arguments (state, props, context). These values can be different
 * from this.* because your function may be called after receiveProps but before
 * shouldComponentUpdate, and this new state, props, and context will not yet be
 * assigned to this.
 *
 * @param {object|function} partialState Next partial state or function to
 *        produce next partial state to be merged with current state.
 * @param {?function} callback Called after state is updated.
 * @final
 * @protected
 */
// ----------------------------------------------------------------------------------------------------------- setState
Component.prototype.setState = function (partialState, callback) {
  // setState

  // 参数
  // 1. partialState
  //    - 可以是一个 ( 对象 ) 或者 ( 函数 )
  //    - object ====>  Next partial state 下一个state
  //    - function ==> function to produce next partial state to be merged with current state 该函数用来生成 Next partial state
  // 2. callback
  //    - Called after state is updated 是state更新后调用的回调函数，可以获取更新过后的state

  invariant(
    typeof partialState === "object" ||
      typeof partialState === "function" ||
      partialState == null,
    "setState(...): takes an object of state variables to update or a " +
      "function which returns an object of state variables."
  );
  // invariant 是一个警告log直接忽略掉即可，不影响主逻辑

  this.updater.enqueueSetState(this, partialState, callback, "setState"); // reconciler
  // this.updater = updater || ReactNoopUpdateQueue;
  // ReactNoopUpdateQueue 在 /react-source-code-analysis/packages/react/src/ReactNoopUpdateQueue.js 中
  /*
      enqueueSetState: function(
        publicInstance,
        partialState,
        callback,
        callerName,
      ) {
        warnNoop(publicInstance, 'setState');
      }
*/
  /*
    function warnNoop(publicInstance, callerName) { // publicInstance=this，callerName='setState'
      if (__DEV__) {
        const constructor = publicInstance.constructor;
        const componentName =
          (constructor && (constructor.displayName || constructor.name)) ||
          'ReactClass';
        const warningKey = `${componentName}.${callerName}`;
        if (didWarnStateUpdateForUnmountedComponent[warningKey]) {
          return;
        }
        console.error(
          "Can't call %s on a component that is not yet mounted. " +
            'This is a no-op, but it might indicate a bug in your application. ' +
            'Instead, assign to `this.state` directly or define a `state = {};` ' +
            'class property with the desired state in the %s component.',
          callerName,
          componentName,
        );
        didWarnStateUpdateForUnmountedComponent[warningKey] = true;
      }
    }
*/
};

/**
 * Forces an update. This should only be invoked when it is known with
 * certainty that we are **not** in a DOM transaction.
 *
 * You may want to call this when you know that some deeper aspect of the
 * component's state has changed but `setState` was not called.
 *
 * This will not invoke `shouldComponentUpdate`, but it will invoke
 * `componentWillUpdate` and `componentDidUpdate`.
 *
 * @param {?function} callback Called after update is complete.
 * @final
 * @protected
 */
Component.prototype.forceUpdate = function (callback) {
  this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
};

/**
 * Deprecated APIs. These APIs used to exist on classic React classes but since
 * we would like to deprecate them, we're not going to move them over to this
 * modern base class. Instead, we define a getter that warns if it's accessed.
 */
if (__DEV__) {
  const deprecatedAPIs = {
    isMounted: [
      "isMounted",
      "Instead, make sure to clean up subscriptions and pending requests in " +
        "componentWillUnmount to prevent memory leaks.",
    ],
    replaceState: [
      "replaceState",
      "Refactor your code to use setState instead (see " +
        "https://github.com/facebook/react/issues/3236).",
    ],
  };
  const defineDeprecationWarning = function (methodName, info) {
    Object.defineProperty(Component.prototype, methodName, {
      get: function () {
        console.warn(
          "%s(...) is deprecated in plain JavaScript React classes. %s",
          info[0],
          info[1]
        );
        return undefined;
      },
    });
  };
  for (const fnName in deprecatedAPIs) {
    if (deprecatedAPIs.hasOwnProperty(fnName)) {
      defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
    }
  }
}

// 寄生原型链继承
function ComponentDummy() {}
ComponentDummy.prototype = Component.prototype;

// ----------------------------------------------------------------------------------------------------------- PureComponent
// PureComponent1
/**
 * Convenience component with default shallow equality check for sCU.
 */
// PureComponent 和 React.memo 之间的区别
// 1. PureComponent
// - PureComponent会检查 props 和 state 对前后的值做浅比较(===)，如果 ( 相等返回false，不重新渲染 ) ( 不相等返回true，重新渲染 )
// 2. React.memo
// - React.memo只会检查props，并且对前后值做一层浅比较( === )，( 相等返回true，不重新渲染 ) ( 相等返回false，重新渲染 )
// - React.memo(functionComponent, areEqual) 可以通过第二个参数自行比较
function PureComponent(props, context, updater) {
  this.props = props;
  this.context = context;

  // If a component has string refs, we will assign a different object later.
  this.refs = emptyObject; // 赋值空对象

  this.updater = updater || ReactNoopUpdateQueue;
  // ReactNoopUpdateQueue
  // - 是一个对象，具有这些属性 {isMounted, enqueueForceUpdate, enqueueReplaceState, enqueueSetState }
}

const pureComponentPrototype = (PureComponent.prototype = new ComponentDummy());
// 1
// new ComponentDummy()
// function ComponentDummy() {}
// ComponentDummy.prototype = Component.prototype;
// 寄生原型链继承，这样 ( pureComponent实例 ) 的 ( 原型对象上 ) 是没有任何属性的，但是原型对象的原型链上的属性仍然可以继承

// 2
// Component.prototype
// - 具有以下属性
// - isReactComponent
// - setState
// - forceUpdate

pureComponentPrototype.constructor = PureComponent;
// 2
// 修改prototype对象时，一定要修改prototype.constructor，防止引用出错
// 如果不修改，prototype.constructor将指向 ComponentDummy

// Avoid an extra prototype jump for these methods.
// 合并属性 到 pureComponentPrototype
Object.assign(pureComponentPrototype, Component.prototype);
// Object.assign()
// Object.assign(target, source1, source2)
// - 作用: 将 ( source源对象 ) 中的所有 ( 可枚举属性 ) 复制到 ( target目标对象 )
// - 参数:
//    - 如果只有一个参数，就回直接返回参数对象
//    - 如果该参数不是对象，则会先转成对象，然后返回
// - 注意:
//    - 是浅拷贝
//    - 同名属性的替换 - 如果具有同名属性，将被后面的source对象覆盖
//    - 数组的处理 - 会把数组视为对象 Object.assign([1, 2, 3], [4, 5]) // [4, 5, 3]

pureComponentPrototype.isPureReactComponent = true;
// 3
// isPureReactComponent
// isPureReactComponent 用来判断是不是纯组件 PureComponent

export { Component, PureComponent };
