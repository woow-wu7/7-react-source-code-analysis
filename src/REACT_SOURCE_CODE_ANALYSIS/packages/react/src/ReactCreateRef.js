/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import type {RefObject} from 'shared/ReactTypes';

// ----------------------------------------------------------------------------------------------------------- createRef
// createRef
// an immutable object with a single mutable value
export function createRef(): RefObject {
  const refObject = {
    current: null,
  };
  if (__DEV__) {
    Object.seal(refObject); // current 属性不能添加和删除，只能修改
  }
  return refObject;
}

// 1
// Object.seal(obj)
// - ( 密封 ) 一个对象，( 阻止添加新属性 )，并将所有现有属性标记为 ( 不可配置 - 即属性不可被删除 )，当前属性的值，只要原来是可以写的就 ( 可以改变 )
// - 简单的说就是：( 不能添加/删除新的属性，但是可以修改属性 )
// - 参数: 将要密封的对象
// - 返回值：被密封的对象
/*
  const obj = {name: 'woow_wu7'}
  const obj2 = Object.seal(obj)
  obj1 === obj2 // true
  delete obj.name // false
  delete obj2.name // -------- false，不能删除属性
  obj2.name = 'wu7' // ------- 可以修改已有属性
  obj.age = 20 // ------------ obj和obj2中都不会有age属性，不能添加属性
*/

// 2
// Object.freeze(obj)
// - 不能 ( 添加/删除/修改 ) 属性

// 3
// 使用案例
// class TestCreateRef extends React.Component {
//   inputRef = React.createRef();
//   componentDidMount() {
//     this.inputRef.current.focus();
//   }
//   render() {
//     return <input type="text" ref={this.inputRef} />;
//   }
// }
