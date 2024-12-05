export type OnMessageCallback = (topic: string, payload: string) => void;

export type MqttAdapter = {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(topic: string): Promise<void>;
  unsubscribe(topic: string): Promise<void>;
  publish(
    topic: string,
    payload: string,
    qos: 0 | 1 | 2,
    retained: boolean,
  ): Promise<void>;
  onMessage(callback: OnMessageCallback): VoidFunction;
};
