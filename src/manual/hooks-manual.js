// 手写hooks源码 - useState

// (一)
// useState工作原理
// 1. 产生了更新，更新的内容保存在update对象中，更新会让组件重新render
// 2. 组件render时，useState调用后返回值数组，数组的第0项count为更新后最新的值
// 3. 更新分为两种
//    - mount: 初始化mount阶段时，count是useSate的参数即 initialState
//    - update: 点击事件等触发dispatcher函数，即useState的返回值数组的第二个成员函数，导致count更新为 count => count + 1

// (二)
// hooks中的一些概念
// 1. 链表
//    memorizedState => hooks函数本身会保存在链表结构中，比如 useState
//    queue ==========> 多个useState返回数组中的第二个成员setter函数( 更新执行的函数 )，也会保存在链表中，是一个环状链表，环状链表是特殊的单链表

let workInProgressHook = null; // 当前正在计算的hook，相当于一个指针，时刻修改指向
let isMount = true; // 标志位，boolean，表示是否是 ( mount ) 阶段，对应的有 ( mount update ) 两个阶段

const fiber = {
  // fiber节点
  stateNode: App, // fiber.stateNode指向真实的DOM，即指向fiberRoot
  memorizedState: null, // hooks链表，用来保存function函数组件中的state数据，比如setState返回数组的第一个成员的值
};

function schedule() {
  // 调度
  workInProgressHook = fiber.memorizedState;
  const app = fiber.stateNode(); // 触发组件更新，即执行functionComponent
  isMount = false; // 第一次调度后，不再是mount节点，以后将是render阶段
  return app;
}

const dispatchAction = (queue, action) => {
  const update = {
    action,
    next: null,
  };
  if (queue.pending === null) {
    update.next = update;
  } else {
    update.next = queue.pending.next;
    queue.pending.next = update;
  }
  queue.pending = update;

  schedule(); // dispatch执行后，执行调度函数schedule，更新组件
};

function useState(initialState) {
  let hook;

  if (isMount) {
    // ----------------------------------- mount
    hook = {
      memorizedState: initialState, // 保存初始值
      queue: {
        pending: null,
      },
      next: null,
    };
    if (!fiber.memoizedState) {
      // mount阶段时，即初始化时 fiber.memoizedState = null
      fiber.memoizedState = hook; // 将 fiber.memoizedState 指向最新的 hook
    } else {
      //  fiber.memoizedState存在，说明在mount阶段中有多个hooks
      workInProgressHook.next = hook; // 将上一个hook的next指向当前的hook，即 prevHook.next -> hook
      // 1. mount阶段，第一个hook，第一次未进入时: workInProgressHook = fiber.memorizedState = hook
      // 2. mount阶段，第二个hook，会进入else:  workInProgressHook.next === fiber.memoizedState.next
    }
    workInProgressHook = hook; // 从新将 workInProgressHook 指向最新的 hook
  } else {
    // ----------------------------------------- update
    hook = workInProgressHook;
    workInProgressHook = workInProgressHook.next;
  }

  let baseState = hook.memoizedState;
  if (hook.queue.pending) {
    let firstUpdate = hook.queue.pending.next;

    do {
      const action = firstUpdate.action;
      baseState = action(baseState);
      firstUpdate = firstUpdate.next;
    } while (firstUpdate !== hook.queue.pending)

      hook.queue.pending = null;
  }
  hook.memoizedState = baseState;

  return [baseState, dispatchAction.bind(null, hook.queue)];
}

function App() {
  const [count, setCount] = useState(0);

  console.log(`isMount => `, isMount);
  console.log(`count =>`, count);

  return {
    click: setCount((count) => count + 1),
  };
}

window.app = schedule();
