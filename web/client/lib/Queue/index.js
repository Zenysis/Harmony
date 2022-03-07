// @flow
/* eslint-disable max-classes-per-file */

/**
 * A node for use in a singly linked list. Stores a value and a pointer to the
 * next node in the list.
 */
class Node<T> {
  +value: T;
  next: Node<T> | void;

  constructor(value: T) {
    this.value = value;
  }
}

/**
 * A data structure for storing and retrieving values in a first-in first-out
 * order.
 */
export default class Queue<T> {
  _head: Node<T> | void;
  _tail: Node<T> | void;
  _size: number = 0;

  /**
   * Insert the specified element into the queue.
   */
  enqueue(value: T): void {
    const node = new Node(value);
    // No elements in list. Set the head to point to this node.
    if (this._tail === undefined) {
      this._head = node;
    } else {
      this._tail.next = node;
    }
    this._tail = node;
    this._size += 1;
  }

  /**
   * Return and remove the head of the queue. If no elements are in the queue,
   * return undefined.
   */
  dequeue(): T | void {
    // No elements in list.
    if (this._head === undefined) {
      return undefined;
    }

    // Only one element in list. Since we are removing it, clear the tail.
    if (this._head === this._tail) {
      this._tail = undefined;
    }

    const output = this._head.value;
    this._head = this._head.next;
    this._size -= 1;
    return output;
  }

  /**
   * Test if the queue is empty.
   */
  empty(): boolean {
    return this._head === undefined;
  }

  /**
   * Return the current size of the queue.
   */
  size(): number {
    return this._size;
  }

  /**
   * Return, but do not remove, the head of the queue.
   */
  peek(): T | void {
    if (this._head === undefined) {
      return undefined;
    }
    return this._head.value;
  }
}
