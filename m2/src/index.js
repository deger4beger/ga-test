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

  await channel.consume(REQUEST_QUEUE, (msg) => {
    try {
      const textMsg = JSON.parse(msg.content.toString());

      channel.sendToQueue(RESPONSE_QUEUE, Buffer.from(JSON.stringify({
        fromRabbitM2Microservice: textMsg
      })), { correlationId: msg.properties.correlationId })
    } catch { }
  }, { noAck: true });

} catch (err) {
  await fastify.amqp?.close();
  fastify.log.error(err);
  process.exit(1);
}