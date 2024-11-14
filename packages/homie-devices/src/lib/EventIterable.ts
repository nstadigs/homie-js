// Originally from: https://jsr.io/@mindfulminun/pear/1.5.1/core/async.ts

export class EventIterable<T> implements AsyncIterable<T> {
  private done: boolean;
  private events: T[];
  private resolve: () => void;
  private promise!: Promise<void>;

  constructor() {
    this.done = false;
    this.events = [];
    this.resolve = () => {};
    this.defer();
  }

  private defer() {
    this.promise = new Promise((r) => (this.resolve = r));
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<Awaited<T>, void, undefined> {
    while (!this.done) {
      await this.promise;
      yield* this.events;
      this.events = [];
    }
  }

  emit(event: T) {
    this.events.push(event);
    this.resolve();
    this.defer();
  }

  end() {
    this.done = true;
    this.resolve();
  }
}
