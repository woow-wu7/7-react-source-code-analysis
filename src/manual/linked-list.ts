
// js实现单向链表
// 单向链表, 每一个元素都有一个存储元素自身的节点和一个指向下一个元素引用的节点组成
function linkedList() {
  // NodeConstructor
  // 链表节点
  const NodeConstructor = function (el) {
    this.el = el; // 存储的数据
    this.next = null; // 指针
  };
  this.head = null; // 单链表的第一个节点，初始值 null
  this.length = 0; // 单链表的长度，初始值 0


  // 在尾部添加节点
  this.append = (el) => {
    let node = new NodeConstructor(el)
    let current = null
    if (!this.head) { // -------------- 头部节点不存在，生成一个节点
      this.head = node
    } else { // ----------------------- 头部节点存在，找到最后一个节点并将最后一个节点的next指向要插入的node
      current = this.head // 缓存头部节点
      while(current.next) {
        current = current.next
        // 用current不断的指向下一个节点，直到最后一个节点时不满足条件，最后一个节点的 ( next=null )
        // 其实就是找到最后一个节点，然后将next指向node，则是在尾部添加节点
      }
      current.next = node // 将最后一个节点的 next 指向 node，则添加完成
    }
    this.length++ // 添加节点完成后，将长度+1
  };


  // 插入节点
  // 实现插入节点逻辑首先我们要考虑边界条件，如果插入的位置在头部或者比尾部位置还大，我们就没必要从头遍历一遍处理了，这样可以提高性能
  this.insert = (position, el) => {
    const node = new NodeConstructor(el)
    let prevNode = null
    let current = this.head
    let currentIndex = 0;

    if (position >= 0 && position <= this.length) {
      if (position === 0) { // 插入头部
        node.next = current // 插入的元素的 next => head
        this.head = node // 插入后，插入的节点重新成为head
      } else {
        while(currentIndex++ < this.position) {
          prevNode = current // 游标的前一个位置节点
          current = current.next // 不断向后寻找位置
        }
        node.next = current; // 找到了插入的位置，将 将要插入的节点的 node.next => current
        prevNode.next = node; // 找到了插入的位置，将 前一个节点的 next => node
        this.length++ // 插入完长度+1
        return true // 表示插入成功
      }
    }
    else {
      return false
    }
  };

  // 移除指定位置的元素
  this.removeAt = (pos) => {};
  // 移除指定节点
  this.remove = (el) => {};
  // 查询节点所在位置
  this.indexOf = (el) => {};
  // 判断链表是否为空
  this.isEmpty = () => {};
  // 返回链表长度
  this.size = () => {};
  // 将链表转化为数组返回
  this.toArray = () => {};


}
