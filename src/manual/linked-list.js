// js实现 - [单向链表]
// 单向链表, 每一个元素都有一个存储元素自身的节点和一个指向下一个元素引用的节点组成
function LinkedList() {
  // NodeConstructor
  // 链表节点
  const NodeConstructor = function (el) {
    this.el = el; // 存储的数据
    this.next = null; // 指针
  };

  this.head = null; // 单链表的第一个节点，初始值 null，其实head保存的就是整个链表
  this.length = 0; // 单链表的长度，初始值 0


  // 在尾部添加节点
  this.append = (el) => {
    let node = new NodeConstructor(el);
    let current = null; // 指针
    if (!this.head) {
      // -------------- 头部节点不存在，生成一个节点
      this.head = node;
    } else {
      // ----------------------- 头部节点存在，找到最后一个节点并将最后一个节点的next指向要插入的node
      current = this.head; // 缓存头部节点
      while (current.next) {
        current = current.next;
        // 用current不断的指向下一个节点，直到最后一个节点时不满足条件，最后一个节点的 ( lastNode.next = null )
        // 其实就是找到最后一个节点，然后将next指向node，则是在尾部添加节点
      }
      current.next = node; // 将最后一个节点的 next 指向 node，则添加完成，最新添加的node成为单链表的最后一个节点
    }
    this.length++; // 添加节点完成后，将长度+1
  };


  // 插入节点
  // 实现插入节点逻辑首先我们要考虑边界条件，如果插入的位置在头部或者比尾部位置还大，我们就没必要从头遍历一遍处理了，这样可以提高性能
  this.insert = (position, el) => {
    const node = new NodeConstructor(el);
    let prevNode = null;
    let current = this.head;
    let currentIndex = 0;

    if (position >= 0 && position < this.length) {
      if (position === 0) {
        // 插入头部
        node.next = current; // 插入的元素的 next => head
        this.head = node; // 插入后，插入的节点重新成为head
      } else {
        // 这里没有判断是不是最后一个，因为没有最后一个的标志位指针，还是要从头遍历
        while (currentIndex++ < this.position) {
          prevNode = current; // 游标的前一个位置节点
          current = current.next; // 不断向后寻找位置
        }
        node.next = current; // 找到了插入的位置，将 将要插入的节点的 node.next => current
        prevNode.next = node; // 找到了插入的位置，将 前一个节点的 next => node
        this.length++; // 插入完长度+1
        return true; // 表示插入成功
      }
    } else {
      return false;
    }
  };


  // 查询节点所在位置
  // 根据节点的值查询节点位置实现起来比较简单，我们只要从头开始遍历，然后找到对应的值之后记录一下索引即可
  this.indexOf = (el) => {
    let currentIndex = 0;
    let current = this.head;
    while (currentIndex < this.length) {
      if (current.el === el) {
        return currentIndex; // 找到返回节点位置
      }
      current = current.next; // 否则找下一个
      currentIndex++; // index+1
    }
  };


  // 移除指定位置的元素
  // 移除指定位置的节点也需要判断一下边界条件，可插入节点类似，但要注意移除之后一定要将链表长度-1
  this.removeAt = (position) => {
    // position表示位置，是number类型
    // 检测边界条件
    if (position >= 0 && position < this.length) {
      let prevNode = null; // 缓存当前节点，也可以理解为是当前节点的前一个节点
      let current = this.head; // 当前节点
      let currentIndex = 0; // 当前节点位置

      if (position === 0) {
        this.head = current.next; // 如果删除链表的第一个节点，则直接把第二个节点赋值给第第一个节点 ( head = head.next )
      } else {
        // 这里没有直接判断是不是最后一个，因为没有最后一个的标志位指针，还是要从头遍历 ( 即没有做这样的判断 position === length -1 )
        while (currentIndex++ < position) {
          prevNode = current;
          current = current.next; // 不断重头往后遍历，知道找到position所在的节点
        }
        prevNode.next = current.next;
        // 将 ( 要删除的节点的前一个节点的next ) 指向 ( 将要删除的节点的下一个节点 )
        // 这里包含了最后一个节点的删除，当是最后一个节点时，current.next === null，prevNode.next = current.next = null 表达式也是成立的
      }
      this.length--; // 操作完成，长度-1
      return current.el; // 返回删除的节点上的数据el
    } else {
      return null; // 随便返回一个值，表示没做任何操作，因为位置都不在链表上
    }
  };


  // 移除指定节点
  // 移除指定节点实现非常简单，我们只需要利用之前实现好的查找节点先找到节点的位置，然后再用实现过的removeAt即可
  this.remove = (el) => {
    let index = this.indexOf(el);
    this.removeAt(index);
  };


  // 判断链表是否为空
  // 只需要判断 length 是否为0，返回boolean
  this.isEmpty = () => {
    return this.length === 0;
  };


  // 返回链表长度
  this.size = () => {
    return this.length;
  };


  // 将链表转化为数组返回
  this.toArray = () => {
    let current = this.head;
    let resultList = [];
    while (current.next) { // 节点的next存在，就把el添加进数组，直到最后一个节点，最后一个节点的 ( lastNde.next = null )
      resultList.push(current.el);
      current = current.next; // 不断 next
    }
    return resultList;
  };
}


const linkedList = new LinkedList();

// 测试 append
// head(el:100) -> next(el: 200) -> next(null)
linkedList.append(100);
linkedList.append(200);
linkedList.append(300);
linkedList.append(400);
linkedList.append(500);
linkedList.append(600);
linkedList.append(700);

// 测试 indexOf
const index = linkedList.indexOf(300);
console.log(`index`, index);

// 测试 removeAt
linkedList.removeAt(1);

// 测试 remove
linkedList.remove(600);

// 测试 isEmpty
const isEmpty = linkedList.isEmpty()
console.log(`isEmpty`, isEmpty)

// 测试 size
const size = linkedList.size()
console.log(`size`, size)

// 测试 toArray
const arr = linkedList.toArray()
console.log(`arr`, arr)