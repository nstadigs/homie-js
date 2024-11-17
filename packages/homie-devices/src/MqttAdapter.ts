export type OnMessageCallback = (topic: string, payload: string) => void;

export type MqttAdapter = {
  connect(url: string): Promise<void>;
  disconnect(url: string): Promise<void>;
  subscribe(topic: string): Promise<void>;
  unsubscribe(topic: string): Promise<void>;
  publish(
    topic: string,
    payload: string,
    qos: 0 | 1 | 2,
    retained: boolean
  ): Promise<void>;
  onMessage(callback: OnMessageCallback): VoidFunction;

  // For last will messages
  onBeforeDisconnect(callback: () => void): void;
};
