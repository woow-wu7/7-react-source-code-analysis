/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import is from "./objectIs";
import hasOwnProperty from "./hasOwnProperty";

/**
 * Performs equality by iterating through keys on an object and returning false
 * when any key has values which are not strictly equal between the arguments.
 * Returns true when the values of all keys are strictly equal.
 */
// ----------------------------------------------------------------------------------------------------------- shallowEqual
//  PureComponent3 - shallowEqual 浅比较相等
function shallowEqual(objA: mixed, objB: mixed): boolean {
  // function is(x: any, y: any) {
  //   return (
  //     (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y) // eslint-disable-line no-self-compare
  //   );
  //   全等判断
  // }

  if (is(objA, objB)) {
    return true;
    // A和B是同一个对象，即这两个变量在栈内存的指针指向同一个堆地址中的数据，即同一个对象的引用，即 ===
  }

  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false;
    // 不是对象或数组，返回false
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
    // 属性的个数要一样，不一样返回false
  }

  // Test for A's keys different from B.
  for (let i = 0; i < keysA.length; i++) {
    if (
      !hasOwnProperty.call(objB, keysA[i]) ||
      !is(objA[keysA[i]], objB[keysA[i]])
    ) {
      return false;
      // 对象属性对应的值不想等，返回false
    }
  }

  return true;
  // 其实就是浅比较
}

export default shallowEqual;
