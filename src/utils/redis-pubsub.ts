import { client } from "../redis";

class RedisPubSub {
  private publisher = client.duplicate();
  private subscriber = client.duplicate();

  async publish(channel: string, message: any) {
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel: string, callback: (data: any) => void) {
    await this.subscriber.subscribe(channel, (message) => {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error) {
        console.error('Error parsing pub/sub message:', error);
      }
    });
  }
}

export const redisPubSub = new RedisPubSub();