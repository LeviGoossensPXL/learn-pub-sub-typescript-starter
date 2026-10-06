import amqp, { type Channel } from "amqplib";

export async function declareAndBind(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
): Promise<[Channel, amqp.Replies.AssertQueue]> {
    const channel = await conn.createChannel();

    let options: amqp.Options.AssertQueue | undefined;
    if (queueType === SimpleQueueType.Durable) {
        options = {durable: true};
    }
    else if (queueType === SimpleQueueType.Transient) {
        options = {autoDelete: true, exclusive: true};
    }

    const queue = await channel.assertQueue(queueName, options);
    await channel.bindQueue(queueName, exchange, key);

    return new Promise(() => {
        [channel, queue];
    });
};

export enum SimpleQueueType {
  Durable,
  Transient,
};