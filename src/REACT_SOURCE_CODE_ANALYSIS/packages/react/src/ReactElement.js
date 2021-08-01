/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import getComponentNameFromType from 'shared/getComponentNameFromType';
import invariant from 'shared/invariant';
import {REACT_ELEMENT_TYPE} from 'shared/ReactSymbols';
import hasOwnProperty from 'shared/hasOwnProperty';

import ReactCurrentOwner from './ReactCurrentOwner';


// RESERVED_PROPS
// - RESERVED_PROPS 是保留属性
// - 包括 key ref __self __source
const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
};

let specialPropKeyWarningShown,
  specialPropRefWarningShown,
  didWarnAboutStringRefs;

if (__DEV__) {
  didWarnAboutStringRefs = {};
}

function hasValidRef(config) {
  if (__DEV__) {
    if (hasOwnProperty.call(config, 'ref')) {
      const getter = Object.getOwnPropertyDescriptor(config, 'ref').get;
      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }
  return config.ref !== undefined;
}

function hasValidKey(config) {
  if (__DEV__) {
    if (hasOwnProperty.call(config, 'key')) {
      const getter = Object.getOwnPropertyDescriptor(config, 'key').get;
      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }
  return config.key !== undefined;
}

function defineKeyPropWarningGetter(props, displayName) {
  const warnAboutAccessingKey = function() {
    if (__DEV__) {
      if (!specialPropKeyWarningShown) {
        specialPropKeyWarningShown = true;
        console.error(
          '%s: `key` is not a prop. Trying to access it will result ' +
            'in `undefined` being returned. If you need to access the same ' +
            'value within the child component, you should pass it as a different ' +
            'prop. (https://reactjs.org/link/special-props)',
          displayName,
        );
      }
    }
  };
  warnAboutAccessingKey.isReactWarning = true;
  Object.defineProperty(props, 'key', {
    get: warnAboutAccessingKey,
    configurable: true,
  });
}

function defineRefPropWarningGetter(props, displayName) {
  const warnAboutAccessingRef = function() {
    if (__DEV__) {
      if (!specialPropRefWarningShown) {
        specialPropRefWarningShown = true;
        console.error(
          '%s: `ref` is not a prop. Trying to access it will result ' +
            'in `undefined` being returned. If you need to access the same ' +
            'value within the child component, you should pass it as a different ' +
            'prop. (https://reactjs.org/link/special-props)',
          displayName,
        );
      }
    }
  };
  warnAboutAccessingRef.isReactWarning = true;
  Object.defineProperty(props, 'ref', {
    get: warnAboutAccessingRef,
    configurable: true,
  });
}

function warnIfStringRefCannotBeAutoConverted(config) {
  if (__DEV__) {
    if (
      typeof config.ref === 'string' &&
      ReactCurrentOwner.current &&
      config.__self &&
      ReactCurrentOwner.current.stateNode !== config.__self
    ) {
      const componentName = getComponentNameFromType(
        ReactCurrentOwner.current.type,
      );

      if (!didWarnAboutStringRefs[componentName]) {
        console.error(
          'Component "%s" contains the string ref "%s". ' +
            'Support for string refs will be removed in a future major release. ' +
            'This case cannot be automatically converted to an arrow function. ' +
            'We ask you to manually fix this case by using useRef() or createRef() instead. ' +
            'Learn more about using refs safely here: ' +
            'https://reactjs.org/link/strict-mode-string-ref',
          componentName,
          config.ref,
        );
        didWarnAboutStringRefs[componentName] = true;
      }
    }
  }
}

/**
 * Factory method to create a new React element. This no longer adheres to
 * the class pattern, so do not use new to call it. Also, instanceof check
 * will not work. Instead test $$typeof field against Symbol.for('react.element') to check
 * if something is a React Element.
 * 工厂函数创建一个新的React元素，不再依附于class的模式，所以不需要使用new来调用，同样实例检查则不会工作
 * - 如果是react元素请使用 $$typeof
 * - 而不要使用 Symbol.for('react.element')
 *
 * @param {*} type
 * @param {*} props
 * @param {*} key
 * @param {string|object} ref
 * @param {*} owner
 * @param {*} self A *temporary* helper to detect places where `this` is
 * different from the `owner` when React.createElement is called, so that we
 * can warn. We want to get rid of owner and replace string `ref`s with arrow
 * functions, and as long as `this` and owner are the same, there will be no
 * change in behavior.
 * @param {*} source An annotation object (added by a transpiler or otherwise)
 * indicating filename, line number, and/or other information.注释对象
 * @internal
 */
// ----------------------------------------------------------------------------- ReactElement
const ReactElement = function(type, key, ref, self, source, owner, props) {
  const element = {
    // This tag allows us to uniquely identify this as a React Element
    // $$typeof 这个标签允许我们唯一地将其标识为React元素
    $$typeof: REACT_ELEMENT_TYPE, // 表示ReactElement类型
    // const symbolFor = Symbol.for;
    // REACT_ELEMENT_TYPE = symbolFor('react.element');

    // Symbol.for() 和 Symbol() 的区别要注意
    // 1. Symbol.for()
    // - 有时候我们希望使用同一个Symbol值，Symbol.for()可以做到这一点
    // - 参数：一个字符串
    // - 作用：搜索有没有该参数作为名称的Symbol值
    //  - 有：返回这个Symbol值
    //  - 没有：就新建一个以该字符串作为名称的Symbol值，并将其 ( 注册到全局 )
    // 2. Symbol.for() 和 Symbol() 的区别
    //  - 两者都会生成 Symbol 值
    //  - Symbol.for()会登记到全局中供搜索
    //  - Symbol()不会登记到全局供搜索
    //  - 所以：
    //      - Symbol.for("bar") === Symbol.for("bar") -------- true
    //      - Symbol("bar") === Symbol("bar") ---------------- false

    // Built-in properties that belong on the element
    // 元素的内置属性
    type: type, // class或function
    key: key,
    ref: ref, // useRef的ref对象
    props: props,

    // Record the component responsible for creating this element.
    // 记录负责创建此元素的组件
    _owner: owner,
  };

  if (__DEV__) {
    // The validation flag is currently mutative. We put it on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    element._store = {};

    // To make comparing ReactElements easier for testing purposes, we make
    // the validation flag non-enumerable (where possible, which should
    // include every environment we run tests in), so the test framework
    // ignores it.
    Object.defineProperty(element._store, 'validated', {
      configurable: false, // validated 属性的 ( 属性描述符是否可以被修改 )和 ( validated属性是否可删除 )
      enumerable: false, // validated 属性是否可枚举 => for...in 和 Object.keys() 只能遍历可枚举的属性
      writable: true, // validated 属性是否被重写，(true可以被修改) (false不能被修改)
      value: false, // validated 属性的值 => 这里的意思是 element._store.validated = false
    });
    // Object.defineProperty(obj, prop, descriptor)
      // obj：要定义属性的对象
      // prop：属性
      // descriptor：属性描述符号


    // self and source are DEV only properties.
    // self 和 source 两个属性只在dev中存在
    Object.defineProperty(element, '_self', {
      configurable: false,
      enumerable: false,
      writable: false, // 只读
      value: self,
    });
    // Two elements created in two different places should be considered
    // equal for testing purposes and therefore we hide it from enumeration.
    // 应考虑在两个不同地方创建的两个元素，对于测试目的来说是相等的，因此我们从枚举中隐藏它
    Object.defineProperty(element, '_source', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: source,
    });
    if (Object.freeze) { // 冻结 props 和 element对象， element对象在函数前面定义了
      Object.freeze(element.props);
      Object.freeze(element);
    }
  }

  return element;
};

/**
 * https://github.com/reactjs/rfcs/pull/107
 * @param {*} type
 * @param {object} props
 * @param {string} key
 */
export function jsx(type, config, maybeKey) {
  let propName;

  // Reserved names are extracted
  const props = {};

  let key = null;
  let ref = null;

  // Currently, key can be spread in as a prop. This causes a potential
  // issue if key is also explicitly declared (ie. <div {...props} key="Hi" />
  // or <div key="Hi" {...props} /> ). We want to deprecate key spread,
  // but as an intermediary step, we will use jsxDEV for everything except
  // <div {...props} key="Hi" />, because we aren't currently able to tell if
  // key is explicitly declared to be undefined or not.
  if (maybeKey !== undefined) {
    key = '' + maybeKey;
  }

  if (hasValidKey(config)) {
    key = '' + config.key;
  }

  if (hasValidRef(config)) {
    ref = config.ref;
  }

  // Remaining properties are added to a new props object
  for (propName in config) {
    if (
      hasOwnProperty.call(config, propName) &&
      !RESERVED_PROPS.hasOwnProperty(propName)
    ) {
      props[propName] = config[propName];
    }
  }

  // Resolve default props
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  return ReactElement(
    type,
    key,
    ref,
    undefined,
    undefined,
    ReactCurrentOwner.current,
    props,
  );
}

/**
 * https://github.com/reactjs/rfcs/pull/107
 * @param {*} type
 * @param {object} props
 * @param {string} key
 */
export function jsxDEV(type, config, maybeKey, source, self) {
  let propName;

  // Reserved names are extracted
  const props = {};

  let key = null;
  let ref = null;

  // Currently, key can be spread in as a prop. This causes a potential
  // issue if key is also explicitly declared (ie. <div {...props} key="Hi" />
  // or <div key="Hi" {...props} /> ). We want to deprecate key spread,
  // but as an intermediary step, we will use jsxDEV for everything except
  // <div {...props} key="Hi" />, because we aren't currently able to tell if
  // key is explicitly declared to be undefined or not.
  if (maybeKey !== undefined) {
    key = '' + maybeKey;
  }

  if (hasValidKey(config)) {
    key = '' + config.key;
  }

  if (hasValidRef(config)) {
    ref = config.ref;
    warnIfStringRefCannotBeAutoConverted(config);
  }

  // Remaining properties are added to a new props object
  for (propName in config) {
    if (
      hasOwnProperty.call(config, propName) &&
      !RESERVED_PROPS.hasOwnProperty(propName)
    ) {
      props[propName] = config[propName];
    }
  }

  // Resolve default props
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  if (key || ref) {
    const displayName =
      typeof type === 'function'
        ? type.displayName || type.name || 'Unknown'
        : type;
    if (key) {
      defineKeyPropWarningGetter(props, displayName);
    }
    if (ref) {
      defineRefPropWarningGetter(props, displayName);
    }
  }

  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props,
  );
}

/**
 * Create and return a new ReactElement of the given type.
 * See https://reactjs.org/docs/react-api.html#createelement
 */
// ----------------------------------------------------------------------------- createElement
export function createElement(type, config, children) {
  // createElement
  // - 参数
  //  - type：可以是一个 ( 个字符串 ) 或者是一个 ( 组件 )，是组件变量时首字母通常大写
  //    - 字符串类型：原生DOM标签，被称为 ---------------------------------------------- HostComponent
  //    - class类型：继承自Component或者PureComponent的组件，被称为 -------------------- ClassComponent
  //    - function类型：被称为 ------------------------------------------------------ FunctionComponent
  //  - config：配置，比如一个标签的属性集合
  //  - children：子节点，也可以是再次通过 React.createElement() 生成
  let propName;

  // Reserved names are extracted
  // props 用来提取保留属性
  const props = {};

  let key = null;
  let ref = null;
  let self = null;
  let source = null;

  if (config != null) {
    if (hasValidRef(config)) {

      ref = config.ref; // config中存在ref属性，就赋值给 ref 变量

      if (__DEV__) {
        warnIfStringRefCannotBeAutoConverted(config);
      }

      // function hasValidRef(config) {
      //   if (__DEV__) {
      //     if (hasOwnProperty.call(config, 'ref')) {
      //       const getter = Object.getOwnPropertyDescriptor(config, 'ref').get;
      //       if (getter && getter.isReactWarning) {
      //         return false;
      //       }
      //     }
      //   }
      //   return config.ref !== undefined;
      // }
      // 解析：
      // (一) 前值知识：
      // (1) Object.getOwnPropertyDescriptor(obj, props)
      // - 返回指定对象上 ( 一个自有属性 ) 对应的 ( 属性描述符 ) => 自有属性指的是 ( 直接赋值该对象的属性，不需要从原型链上进行查找的属性 )
      // - 参数：(1) obj需要查找的目标对象 (2) 目标对象内属性名称
      // - 返回值：
      //    - 1. 如果指定的属性存在于对象上，则返回其 ( 属性描述符对象 ) property descriptor
      //    - 2. 否则返回 undefined
      // - 例子
      //    - const obj = {name: 'woow_wu7'}; Object.getOwnPropertyDescriptor(obj, 'name')
      //    - 返回：{configurable: true, enumerable: true, value: "woow_wu7", writable: true}
      // (2) hasOwnProperty()
      // - const hasOwnProperty = Object.prototype.hasOwnProperty;
      // (二) if 判断语句表示
      // - 如果：config不是null，并且是DEV环境，并且ref属性是config对象的自身属性，并且属性描述对象中getter存在，并且isReactWarning是true，则返回false
      // - 否则：config.ref !== undefined; 不是undefined返回true
    }
    if (hasValidKey(config)) {

      key = '' + config.key; // config中key存在，转成字符串，赋值给变量 key

      // function hasValidKey(config) {
      //   if (__DEV__) {
      //     if (hasOwnProperty.call(config, 'key')) {
      //       const getter = Object.getOwnPropertyDescriptor(config, 'key').get;
      //       if (getter && getter.isReactWarning) {
      //         return false;
      //       }
      //     }
      //   }
      //   return config.key !== undefined;
      // }
      // 验证config中是否有key属性，有则从新赋值key，并把key转成字符串
    }

    self = config.__self === undefined ? null : config.__self; // 不存在赋值null，存在直接赋值
    source = config.__source === undefined ? null : config.__source; // 同上

    // Remaining properties are added to a new props object
    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
        // const RESERVED_PROPS = {
        //   key: true,
        //   ref: true,
        //   __self: true,
        //   __source: true,
        // };
        // RESERVED => reserved => 保留的
        // Reserved_props
      ) {
        props[propName] = config[propName];
        // 遍历config，如果是自身属性并且不再保留的props的范围内，即赋值给props
        // props是在函数开头，定义的空对象 const props = {};
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object. // 参数中children不止一个，可以缓存到新的数组中去
  const childrenLength = arguments.length - 2; // 因为参数是 type，config，...children，所以要arguments.length - 2
  if (childrenLength === 1) { // 只有一个children，children是函数 createElement(type, config, children) 的第三个参数
    props.children = children; // 则直接赋值给 props.children
  } else if (childrenLength > 1) { // 如果children大于1
    const childArray = Array(childrenLength); // 声明长度为 childrenLength 的空数组
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2]; // 并把所有children参数存入childArray数组
    }
    if (__DEV__) {
      if (Object.freeze) {
        Object.freeze(childArray); // 开发环境冻结对象
      }
    }
    props.children = childArray; // 多个children时，一样赋值给 props.children
  }

  // Resolve default props
  if (type && type.defaultProps) { // type.defaultProps存在
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName]; // defaultProps中的属性在props中的属性不存在，就添加进去
      }
    }
  }
  if (__DEV__) {
    if (key || ref) { // 如果config中key或者ref存在
      const displayName =
        typeof type === 'function' // type是函数组件
          ? type.displayName || type.name || 'Unknown'
          : type; // type不是函数组件，则 displayName = type
      if (key) {
        defineKeyPropWarningGetter(props, displayName); // 可以存在就赋值给props，并且说明警告函数，key不能作为props传入，但是可以使用其他属性作为props值一样即可
        // function defineKeyPropWarningGetter(props, displayName) {
        //   const warnAboutAccessingKey = function() {
        //     if (__DEV__) {
        //       if (!specialPropKeyWarningShown) {
        //         specialPropKeyWarningShown = true;
        //         console.error(
        //           '%s: `key` is not a prop. Trying to access it will result ' +
        //             'in `undefined` being returned. If you need to access the same ' +
        //             'value within the child component, you should pass it as a different ' +
        //             'prop. (https://reactjs.org/link/special-props)',
        //           displayName,
        //         );
        //       }
        //     }
        //   };
        //   warnAboutAccessingKey.isReactWarning = true;
        //   Object.defineProperty(props, 'key', {
        //     get: warnAboutAccessingKey,
        //     configurable: true,
        //   });
        // }
      }
      if (ref) {
        defineRefPropWarningGetter(props, displayName); // 同理，ref存在就赋值给props对象，警告函数一样，ref不能作为props，可以使用其他属性作为props值一样即可
      }
    }
  }
  return ReactElement( // 返回 ReactElement() 的函数调用
    type, // createElement的第一个参数
    key, // 保留props
    ref, // 保留props
    self, // null || config.__self
    source, // nul l|| config.__source
    ReactCurrentOwner.current, // null || Fiber
    props, // props对象
  );
  // const ReactCurrentOwner = {
  //   current: (null: null | Fiber),
  // };
}

/**
 * Return a function that produces ReactElements of a given type.
 * See https://reactjs.org/docs/react-api.html#createfactory
 */
export function createFactory(type) {
  const factory = createElement.bind(null, type);
  // Expose the type on the factory and the prototype so that it can be
  // easily accessed on elements. E.g. `<Foo />.type === Foo`.
  // This should not be named `constructor` since this may not be the function
  // that created the element, and it may not even be a constructor.
  // Legacy hook: remove it
  factory.type = type;
  return factory;
}

export function cloneAndReplaceKey(oldElement, newKey) {
  const newElement = ReactElement(
    oldElement.type,
    newKey,
    oldElement.ref,
    oldElement._self,
    oldElement._source,
    oldElement._owner,
    oldElement.props,
  );

  return newElement;
}

/**
 * Clone and return a new ReactElement using element as the starting point.
 * See https://reactjs.org/docs/react-api.html#cloneelement
 */
export function cloneElement(element, config, children) {
  invariant(
    !(element === null || element === undefined),
    'React.cloneElement(...): The argument must be a React element, but you passed %s.',
    element,
  );

  let propName;

  // Original props are copied
  const props = Object.assign({}, element.props);

  // Reserved names are extracted
  let key = element.key;
  let ref = element.ref;
  // Self is preserved since the owner is preserved.
  const self = element._self;
  // Source is preserved since cloneElement is unlikely to be targeted by a
  // transpiler, and the original source is probably a better indicator of the
  // true owner.
  const source = element._source;

  // Owner will be preserved, unless ref is overridden
  let owner = element._owner;

  if (config != null) {
    if (hasValidRef(config)) {
      // Silently steal the ref from the parent.
      ref = config.ref;
      owner = ReactCurrentOwner.current;
    }
    if (hasValidKey(config)) {
      key = '' + config.key;
    }

    // Remaining properties override existing props
    let defaultProps;
    if (element.type && element.type.defaultProps) {
      defaultProps = element.type.defaultProps;
    }
    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
      ) {
        if (config[propName] === undefined && defaultProps !== undefined) {
          // Resolve default props
          props[propName] = defaultProps[propName];
        } else {
          props[propName] = config[propName];
        }
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  const childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }

  return ReactElement(element.type, key, ref, self, source, owner, props);
}

/**
 * Verifies the object is a ReactElement.
 * See https://reactjs.org/docs/react-api.html#isvalidelement
 * @param {?object} object
 * @return {boolean} True if `object` is a ReactElement.
 * @final
 */
export function isValidElement(object) {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}
