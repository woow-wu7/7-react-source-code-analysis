/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * 1. Use invariant() to assert state which your program assumes to be true.
 * - 使用Invariant（）来断言您的程序假定为true的状态
 * - assumes：假设，设想
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * 3. The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 * - invariant message 将在生产环境中被剔除掉，但是invariant仍然保持，以确保逻辑在生产环境中一致
 */

export default function invariant(condition, format, a, b, c, d, e, f) {
  // 添加此行
  if (condition) return;

  throw new Error(
    "Internal React error: invariant() is meant to be replaced at compile " +
      "time. There is no runtime version."
  );
}
