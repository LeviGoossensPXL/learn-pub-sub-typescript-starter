import amqp, { type Channel } from "amqplib";

export enum SimpleQueueType {
  Durable,
  Transient,
};

export enum AckType {
  Ack,
  NackRequeue,
  NackDiscard
}

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

    return [channel, queue];
};

export async function subscribeJSON<T>(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
  handler: (data: T) => AckType,
): Promise<void> {
    const channelAndQueue = await declareAndBind(conn, exchange, queueName, key, queueType);
    channelAndQueue[0].consume(channelAndQueue[1].queue, (message: amqp.ConsumeMessage | null) => {
        if (message === null) {
            return;
        }

        const jsonParsed = JSON.parse(message.content.toString());
        const ackType = handler(jsonParsed);
        switch (ackType) {
            case AckType.Ack:
                channelAndQueue[0].ack(message);
                console.log("ack");
                break;

            case AckType.NackRequeue:
                channelAndQueue[0].nack(message, false, true);
                console.log("nack requeue");
                break;

            case AckType.NackDiscard:
                channelAndQueue[0].nack(message, false, false);
                console.log("nack discard");
                break;
        
            default:
                break;
        }
    });
};