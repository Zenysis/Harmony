// @flow
import Promise from 'bluebird';
import invariant from 'invariant';

import Queue from 'lib/Queue';

type PromiseThunk = () => Promise<*>;

/**
 * A PromiseQueue is useful for when you have a large number of promises to
 * start but not all should be run concurrently.
 */
export default class PromiseQueue {
  _inProgress: number = 0;
  +_maxConcurrent: number;
  +_queue: Queue<PromiseThunk> = new Queue();

  constructor(maxConcurrent: number = 1) {
    this._maxConcurrent = maxConcurrent;
  }

  /**
   * Add the wrapped promise to the queue. If there are enough free slots, run
   * the promise immediately. Otherwise, add it to a queue to have it run when
   * space is available.
   */
  add(promiseThunk: PromiseThunk): Promise<*> {
    return new Promise((resolve, reject) => {
      const runner: PromiseThunk = () => this._run(
        promiseThunk,
        resolve,
        reject,
      );

      if (this._inProgress > this._maxConcurrent) {
        this._queue.enqueue(runner);
      } else {
        runner();
      }
    });
  }

  /**
   * Run the promise returned by the promiseThunk. After the promise
   * completes, check if we should start the next promise in the queue.
   *
   * @return Promise<void>: The newly started promise.
   */
  _run(promiseThunk: PromiseThunk, resolve: *, reject: *): Promise<*> {
    this._inProgress++;
    return promiseThunk()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this._inProgress--;
        // If we have an open slot available, and the queue is nonempty, pull
        // off the next queued promise and run it.
        if (this._inProgress <= this._maxConcurrent && !this._queue.empty()) {
          const nextPromise = this._queue.dequeue();
          invariant(
            nextPromise !== undefined,
            'Queue should never be nonempty and return undefined.',
          );
          // Run, but do not return, the next promise. Intentionally not
          // returning the promise since we are inside a `finally` block of an
          // unrelated promise (and we don't want to block that promise's
          // completion).
          nextPromise();
        }
      });
  }
}
