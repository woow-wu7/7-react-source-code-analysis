/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Container} from './ReactDOMHostConfig';
import type {FiberRoot} from 'react-reconciler/src/ReactInternalTypes';
import type {ReactNodeList} from 'shared/ReactTypes';

import {
  getInstanceFromNode,
  isContainerMarkedAsRoot,
  markContainerAsRoot,
  unmarkContainerAsRoot,
} from './ReactDOMComponentTree';
import {listenToAllSupportedEvents} from '../events/DOMPluginEventSystem';
import {isValidContainerLegacy} from './ReactDOMRoot';
import {
  DOCUMENT_NODE,
  ELEMENT_NODE,
  COMMENT_NODE,
} from '../shared/HTMLNodeType';

import {
  createContainer,
  findHostInstanceWithNoPortals,
  updateContainer,
  flushSyncWithoutWarningIfAlreadyRendering,
  getPublicRootInstance,
  findHostInstance,
  findHostInstanceWithWarning,
} from 'react-reconciler/src/ReactFiberReconciler';
import {LegacyRoot} from 'react-reconciler/src/ReactRootTags';
import getComponentNameFromType from 'shared/getComponentNameFromType';
import invariant from 'shared/invariant';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import {has as hasInstance} from 'shared/ReactInstanceMap';

const ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;

let topLevelUpdateWarnings;

if (__DEV__) {
  topLevelUpdateWarnings = (container: Container) => {
    if (container._reactRootContainer && container.nodeType !== COMMENT_NODE) {
      const hostInstance = findHostInstanceWithNoPortals(
        container._reactRootContainer.current,
      );
      if (hostInstance) {
        if (hostInstance.parentNode !== container) {
          console.error(
            'render(...): It looks like the React-rendered content of this ' +
              'container was removed without using React. This is not ' +
              'supported and will cause errors. Instead, call ' +
              'ReactDOM.unmountComponentAtNode to empty a container.',
          );
        }
      }
    }

    const isRootRenderedBySomeReact = !!container._reactRootContainer;
    const rootEl = getReactRootElementInContainer(container);
    const hasNonRootReactChild = !!(rootEl && getInstanceFromNode(rootEl));

    if (hasNonRootReactChild && !isRootRenderedBySomeReact) {
      console.error(
        'render(...): Replacing React-rendered children with a new root ' +
          'component. If you intended to update the children of this node, ' +
          'you should instead have the existing children update their state ' +
          'and render the new components instead of calling ReactDOM.render.',
      );
    }

    if (
      container.nodeType === ELEMENT_NODE &&
      ((container: any): Element).tagName &&
      ((container: any): Element).tagName.toUpperCase() === 'BODY'
    ) {
      console.error(
        'render(): Rendering components directly into document.body is ' +
          'discouraged, since its children are often manipulated by third-party ' +
          'scripts and browser extensions. This may lead to subtle ' +
          'reconciliation issues. Try rendering into a container element created ' +
          'for your app.',
      );
    }
  };
}

function getReactRootElementInContainer(container: any) {
  if (!container) {
    return null;
  }

  if (container.nodeType === DOCUMENT_NODE) {
    return container.documentElement;
  } else {
    return container.firstChild;
  }
}

// ----------------------------------------------------------------------------------------------------------- legacyCreateRootFromDOMContainer
// legacyCreateRootFromDOMContainer
function legacyCreateRootFromDOMContainer(
  container: Container,
  forceHydrate: boolean,
): FiberRoot {
  // First clear any existing content. 首先清除所有存在的content
  if (!forceHydrate) { // 非服务端渲染
    let rootSibling;
    while ((rootSibling = container.lastChild)) {
      container.removeChild(rootSibling);
      // 清空 container 的所有子节点
      // - 这样做说明了不要在容器中写入任何子节点，1.这样会被清空 2.可能会涉及到repaint/reflow
    }
  }

  // 干掉container所有子元素后，再通过 createContainer 创建 container
  const root = createContainer(
    container,
    LegacyRoot, // export const LegacyRoot = 0;
    forceHydrate, // false
    null, // hydrationCallbacks
    false, // isStrictMode
    false, // concurrentUpdatesByDefaultOverride,
  );
  markContainerAsRoot(root.current, container);

  const rootContainerElement =
    container.nodeType === COMMENT_NODE ? container.parentNode : container;
  listenToAllSupportedEvents(rootContainerElement);

  return root;
}

function warnOnInvalidCallback(callback: mixed, callerName: string): void {
  if (__DEV__) {
    if (callback !== null && typeof callback !== 'function') {
      console.error(
        '%s(...): Expected the last optional `callback` argument to be a ' +
          'function. Instead received: %s.',
        callerName,
        callback,
      );
    }
  }
}

// ----------------------------------------------------------------------------------------------------------- legacyRenderSubtreeIntoContainer
// legacyRenderSubtreeIntoContainer
// 1
// 初次渲染 init mount
// - 1. 初次渲染 - 是没有 (老的虚拟DOM节点的 )
// - 2. 即初次渲染生成一个插入一个，但如果是更新阶段则要考虑很多情况了，比如移动，更新，插件等等
// 2
// 如何判断是不是初次渲染？
// - 因为初次渲染是没有老的虚拟DOM节点的，所以可以通过 ( root ) 来判断，即 ( let root = container._reactRootContainer )
// 2
// 初始化调用ReactDOM.render() 时的 ( 参数 ) 如下
// - legacyRenderSubtreeIntoContainer( null, element, container, false, callback, );
function legacyRenderSubtreeIntoContainer(
  parentComponent: ?React$Component<any, any>, // init => null
  children: ReactNodeList, // render 第一个参数 element
  container: Container, // render 第二个参数 container
  forceHydrate: boolean, // 服务器端渲染标识，初始化是false, init => false
  callback: ?Function, // 初次渲染或者更新后需要执行的回调，可选，基本不会使用
) {
  if (__DEV__) {
    topLevelUpdateWarnings(container);
    warnOnInvalidCallback(callback === undefined ? null : callback, 'render');
  }

  let root = container._reactRootContainer;
  // root
  // 1. 声明 root
  // 2. 在container上生声明了_reactRootContainer属性
  // 3. init时，_reactRootContainer属性不存在，则 root = undefined
  // 4. container
  //    - 1
  //    - container是调用 reactDOM.render()时传入的第二个参数，即jsx挂载的容器，是真实的DOM
  //    - 下面生成fiberRoot的时候，  root = container._reactRootContainer = legacyCreateRootFromDOMContainer()，
  //    - 即在容器上挂载了 fiberRoot
  //    - 2
  //    - react的项目中，可以通过 document.querySelector('#root')._reactRootContainer 来读取 _reactRootContainer
  //    - 可以看到：( fiberRoot的构造函 ) 数是 ( FiberRootNode(containerInfo, tag, hydrate) )
  // 5. 先总结一下
  //    - root 就是 fiberRoot，因为后面会赋值给 fiberRoot 变量
  //    - fiberRoot 同样挂在了 container DOM节点上
  //    - fiberRoot对象 就是整个fiber树的 根节点 ( 其实每个DOM节点一定对应着一个fiber对象，所以DOM树和fiber数一一对应 )

  let fiberRoot: FiberRoot; // 缓存 old virtual DOM，用于对比
  // fiberRoot
  // 1. 注意区分 fiberRoot 和 rootFiber
  //    - fiberRoot 只有一个
  //    - rootFiber 可以有多个，就是一个普通的fiber节点
  // 2. 两者的关系
  //    - rootFiber.stateNode = fiberRoot
  //    - fiberRoot.current = rootFiber
  //    - 两者循环引用

  if (!root) {
    // Initial mount
    // ------------------------------------------------------------ 初始化mount阶段，即初次渲染，root不存在
    // 初次渲染 root 是不存在的，所以要创建生成一个root

    // 1
    // container
    // container._reactRootContainer.
    // container._reactRootContainer._internalRoot 指向的就是 fiberRoot
    // 2
    // fiberRoot === fiberRootNode对象
    // 3
    // 再次复习 fiberRoot 和 rootFiber
    // - fiberRoot
    //   - fiberRoot 关联的是真实的DOM容器节点
    // - rootFiber
    //   - 是虚拟DOM的根节点
    // - fiberRoot.current === rootFiber
    // - rootFiber.stateNode === fiberRoot
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
      container,
      forceHydrate, // init => false
    );
    fiberRoot = root; // 缓存 old virtual DOM，用于对比
    if (typeof callback === 'function') { // 一般都不会指定callback，即一般不会进入if
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }
    // Initial mount should not be batched.
    // 初次渲染是非批量更新，可以保证 ( 更新效率与用户体验 )
    // 比如初次渲染希望更快的速速让用户看到 ui
    flushSyncWithoutWarningIfAlreadyRendering(() => {
      updateContainer(children, fiberRoot, parentComponent, callback);
    });
    // flushSyncWithoutWarningIfAlreadyRendering
    // - 函数签名：flushSyncWithoutWarningIfAlreadyRendering(fn) => fn()

  } else {
    // ------------------------------------------------------------ 更新阶段
    fiberRoot = root;
    if (typeof callback === 'function') {
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }
    // Update
    // 批量更新 batched update
    updateContainer(children, fiberRoot, parentComponent, callback);
  }
  return getPublicRootInstance(fiberRoot);
}

export function findDOMNode(
  componentOrElement: Element | ?React$Component<any, any>,
): null | Element | Text {
  if (__DEV__) {
    const owner = (ReactCurrentOwner.current: any);
    if (owner !== null && owner.stateNode !== null) {
      const warnedAboutRefsInRender = owner.stateNode._warnedAboutRefsInRender;
      if (!warnedAboutRefsInRender) {
        console.error(
          '%s is accessing findDOMNode inside its render(). ' +
            'render() should be a pure function of props and state. It should ' +
            'never access something that requires stale data from the previous ' +
            'render, such as refs. Move this logic to componentDidMount and ' +
            'componentDidUpdate instead.',
          getComponentNameFromType(owner.type) || 'A component',
        );
      }
      owner.stateNode._warnedAboutRefsInRender = true;
    }
  }
  if (componentOrElement == null) {
    return null;
  }
  if ((componentOrElement: any).nodeType === ELEMENT_NODE) {
    return (componentOrElement: any);
  }
  if (__DEV__) {
    return findHostInstanceWithWarning(componentOrElement, 'findDOMNode');
  }
  return findHostInstance(componentOrElement);
}

export function hydrate(
  element: React$Node,
  container: Container,
  callback: ?Function,
) {
  if (__DEV__) {
    console.error(
      'ReactDOM.hydrate is no longer supported in React 18. Use hydrateRoot ' +
        'instead. Until you switch to the new API, your app will behave as ' +
        "if it's running React 17. Learn " +
        'more: https://reactjs.org/link/switch-to-createroot',
    );
  }

  invariant(
    isValidContainerLegacy(container),
    'Target container is not a DOM element.',
  );
  if (__DEV__) {
    const isModernRoot =
      isContainerMarkedAsRoot(container) &&
      container._reactRootContainer === undefined;
    if (isModernRoot) {
      console.error(
        'You are calling ReactDOM.hydrate() on a container that was previously ' +
          'passed to ReactDOM.createRoot(). This is not supported. ' +
          'Did you mean to call hydrateRoot(container, element)?',
      );
    }
  }
  // TODO: throw or warn if we couldn't hydrate?
  return legacyRenderSubtreeIntoContainer(
    null,
    element,
    container,
    true,
    callback,
  );
}

// ----------------------------------------------------------------------------------------------------------- ReactDOM.render
// render
// 1
// ReactDOM.render(element, container[, callback])
// - 1. 作用：
//    - 1. 初始渲染：在提供的 container 里面渲染一个React元素，并返回对该组件的引用，( 或者针对无状态组件返回null )
//    - 2. 更新：-- 如果React元素之前已经在 container 里渲染过，这将会对其执行 ( 更新操作 )，并仅仅会在必要时改变DOM以映射最新的React元素
// - 2. 参数
//    - element
//    - container
//    - callback: 可选，在 ( 渲染或更新 ) 完成后，执行的回调函数
// - 3. 返回值
//    - legacyRenderSubtreeIntoContainer
//    - legacyRenderSubtreeIntoContainer( null, element, container, false, callback ) 调用的返回值就是render()函数的返回值
export function render(
  element: React$Element<any>,
  container: Container,
  callback: ?Function,
) {
  if (__DEV__) {
    console.error(
      'ReactDOM.render is no longer supported in React 18. Use createRoot ' +
        'instead. Until you switch to the new API, your app will behave as ' +
        "if it's running React 17. Learn " +
        'more: https://reactjs.org/link/switch-to-createroot',
    );
    // createRoot
    // - React 18中不再支持ReactDOM.render，请使用 createRoot() 代替
  }

  invariant(
    isValidContainerLegacy(container), // 合法的节点
    'Target container is not a DOM element.',
  );
  // export default function invariant(condition, format, a, b, c, d, e, f) {
  //   throw new Error(
  //     'Internal React error: invariant() is meant to be replaced at compile ' +
  //       'time. There is no runtime version.',
  //   );
  // }

  if (__DEV__) {
    const isModernRoot =
      isContainerMarkedAsRoot(container) &&
      container._reactRootContainer === undefined;
    // 1
    // isContainerMarkedAsRoot
    // export function isContainerMarkedAsRoot(node: Container): boolean {
    //   return !!node[internalContainerInstanceKey];
    // }
    // 2
    // internalContainerInstanceKey
    // const internalContainerInstanceKey = '__reactContainer$' + randomKey;
    // 3
    // randomKey
    // const randomKey = Math.random()
    // .toString(36)
    // .slice(2);


    if (isModernRoot) {
      console.error(
        'You are calling ReactDOM.render() on a container that was previously ' +
          'passed to ReactDOM.createRoot(). This is not supported. ' +
          'Did you mean to call root.render(element)?',
          // 您正在对以前传递给 ReactDOM.createRoot() 的容器使用 ReactDOM.render()，不支持这样做，你是想调用root.render(element)？
      );
    }
  }

  // legacyRenderSubtreeIntoContainer()
  // render() 函数最终返回值 legacyRenderSubtreeIntoContainer()
  // legacy : 遗产  +  render: 渲染  +  subtree: 子树  +  into: 到 +  container: 容器
  return legacyRenderSubtreeIntoContainer(
    null, // parentComponent 父组件
    element, // children
    container, // container
    false, // forceHydrate 服务端渲染的标志
    callback, // callback
  );
}

export function unstable_renderSubtreeIntoContainer(
  parentComponent: React$Component<any, any>,
  element: React$Element<any>,
  containerNode: Container,
  callback: ?Function,
) {
  invariant(
    isValidContainerLegacy(containerNode),
    'Target container is not a DOM element.',
  );
  invariant(
    parentComponent != null && hasInstance(parentComponent),
    'parentComponent must be a valid React Component',
  );
  return legacyRenderSubtreeIntoContainer(
    parentComponent,
    element,
    containerNode,
    false,
    callback,
  );
}

export function unmountComponentAtNode(container: Container) {
  invariant(
    isValidContainerLegacy(container),
    'unmountComponentAtNode(...): Target container is not a DOM element.',
  );

  if (__DEV__) {
    const isModernRoot =
      isContainerMarkedAsRoot(container) &&
      container._reactRootContainer === undefined;
    if (isModernRoot) {
      console.error(
        'You are calling ReactDOM.unmountComponentAtNode() on a container that was previously ' +
          'passed to ReactDOM.createRoot(). This is not supported. Did you mean to call root.unmount()?',
      );
    }
  }

  if (container._reactRootContainer) {
    if (__DEV__) {
      const rootEl = getReactRootElementInContainer(container);
      const renderedByDifferentReact = rootEl && !getInstanceFromNode(rootEl);
      if (renderedByDifferentReact) {
        console.error(
          "unmountComponentAtNode(): The node you're attempting to unmount " +
            'was rendered by another copy of React.',
        );
      }
    }

    // Unmount should not be batched.
    flushSyncWithoutWarningIfAlreadyRendering(() => {
      legacyRenderSubtreeIntoContainer(null, null, container, false, () => {
        // $FlowFixMe This should probably use `delete container._reactRootContainer`
        container._reactRootContainer = null;
        unmarkContainerAsRoot(container);
      });
    });
    // If you call unmountComponentAtNode twice in quick succession, you'll
    // get `true` twice. That's probably fine?
    return true;
  } else {
    if (__DEV__) {
      const rootEl = getReactRootElementInContainer(container);
      const hasNonRootReactChild = !!(rootEl && getInstanceFromNode(rootEl));

      // Check if the container itself is a React root node.
      const isContainerReactRoot =
        container.nodeType === ELEMENT_NODE &&
        isValidContainerLegacy(container.parentNode) &&
        !!container.parentNode._reactRootContainer;

      if (hasNonRootReactChild) {
        console.error(
          "unmountComponentAtNode(): The node you're attempting to unmount " +
            'was rendered by React and is not a top-level container. %s',
          isContainerReactRoot
            ? 'You may have accidentally passed in a React root node instead ' +
                'of its container.'
            : 'Instead, have the parent component update its state and ' +
                'rerender in order to remove this component.',
        );
      }
    }

    return false;
  }
}
