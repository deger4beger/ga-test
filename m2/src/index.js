import Fastify from 'fastify';
import amqp from "amqplib";


const fastify = Fastify({
  logger: true
})
const REQUEST_QUEUE = "request";
const RESPONSE_QUEUE = "response";

try {
  await (async () => {
    const connection = await amqp.connect("amqp://admin:admin@rabbitmq:5672");
    fastify.decorate("amqp", connection);
  })();
  await fastify.listen({ port: 8000, host: "0.0.0.0" });


  const channel = await fastify.amqp.createChannel();
  await channel.assertQueue(REQUEST_QUEUE);
  await channel.assertQueue(RESPONSE_QUEUE);

  await channel.consume(REQUEST_QUEUE, async (msg) => {
    const textMsg = msg.content.toString();
    console.log('MSG recieved', textMsg);
    channel.ack(msg);
    await channel.sendToQueue(RESPONSE_QUEUE, Buffer.from(textMsg))
    console.log('MSG sent');
  }, { noAck: false });

} catch (err) {
  await fastify.amqp.close();
  fastify.log.error(err);
  process.exit(1);
}