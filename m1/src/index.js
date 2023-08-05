import Fastify from 'fastify';
import amqp from "amqplib";


const fastify = Fastify({
  logger: true
})
const REQUEST_QUEUE = "request";
const RESPONSE_QUEUE = "response";

fastify.get('/', async function handler (request, reply) {

  const channel = await this.amqp.createChannel();
  await channel.assertQueue(REQUEST_QUEUE);
  await channel.assertQueue(RESPONSE_QUEUE);

  await channel.sendToQueue(REQUEST_QUEUE, Buffer.from("some_task"))
  console.log('MSG sent');

  await channel.consume(RESPONSE_QUEUE, async (msg) => {
    const textMsg = msg.content.toString();
    console.log('MSG recieved', textMsg);
    channel.ack(msg);

    reply.send({ rabbit: textMsg })
    await channel.close();
  }, { noAck: false });

  return reply;
})

try {

  await (async () => {
    const connection = await amqp.connect("amqp://admin:admin@rabbitmq:5672");
    fastify.decorate("amqp", connection);
  })();

  await fastify.listen({ port: 8000, host: "0.0.0.0" });
} catch (err) {

  await fastify.amqp.close();

  fastify.log.error(err);
  process.exit(1);
}