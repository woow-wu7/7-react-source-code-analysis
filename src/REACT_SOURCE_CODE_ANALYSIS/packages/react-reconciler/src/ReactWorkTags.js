/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// WorkTag
// 用于表示React元素的类型
export type WorkTag =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24;

// nodeType
// React元素的类型，类似于原生的 Node.nodeType
// 原生中的 nodeType 返回一个整数值，表示节点类型
// 不同节点的 nodeType ( 属性值 ) 和 ( 对应常量 ) 如下
// - document: 9 ====================> 文档节点
// - element: 1 =====================> 元素节点
// - attr: 2 ========================> 属性节点
// - text: 3 ========================> 文本节点
// - DocumentFragment: 11 ===========> 文档片段节点
// - DocumentType: 10 ===============> 文档类型节点
// - Comment： 8 =====================> 注释节点
export const FunctionComponent = 0; // 函数组件0
export const ClassComponent = 1;
export const IndeterminateComponent = 2; // Before we know whether it is function or class
export const HostRoot = 3; // Root of a host tree. Could be nested inside another node.
export const HostPortal = 4; // A subtree. Could be an entry point to a different renderer.
export const HostComponent = 5;
export const HostText = 6;
export const Fragment = 7;
export const Mode = 8;
export const ContextConsumer = 9; // consumer
export const ContextProvider = 10; // provider
export const ForwardRef = 11;
export const Profiler = 12;
export const SuspenseComponent = 13;
export const MemoComponent = 14;
export const SimpleMemoComponent = 15;
export const LazyComponent = 16;
export const IncompleteClassComponent = 17;
export const DehydratedFragment = 18;
export const SuspenseListComponent = 19;
export const ScopeComponent = 21;
export const OffscreenComponent = 22;
export const LegacyHiddenComponent = 23;
export const CacheComponent = 24;
