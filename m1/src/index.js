import Fastify from 'fastify';
import amqp from "amqplib";

import { uuidv4 } from './utils.js';


const fastify = Fastify({
  logger: true
})
const REQUEST_QUEUE = "request";
const RESPONSE_QUEUE = "response";

fastify.post('/', async function handler (request, reply) {
  try {
    const channel = await this.amqp.createChannel();
    await channel.assertQueue(REQUEST_QUEUE);
    await channel.assertQueue(RESPONSE_QUEUE);

    const correlationId = uuidv4();

    await channel.sendToQueue(
      REQUEST_QUEUE,
      Buffer.from(JSON.stringify(request.body)),
      { correlationId }
    );

    await channel.consume(RESPONSE_QUEUE, async (msg) => {
      if (correlationId !== msg.properties.correlationId) return;

      const parsedMsg = JSON.parse(msg.content.toString());
      reply.send(parsedMsg)

      await channel.close();
    }, { noAck: true });

    await reply;
  } catch {
    reply.code(500).send({ msg: "Some server error occured" })
  }
})

const fastifyApp = async () => {
  try {

    await (async () => {
      const connection = await amqp.connect("amqp://admin:admin@rabbitmq:5672");
      fastify.decorate("amqp", connection);
    })();

    await fastify.listen({ port: 8000, host: "0.0.0.0" });
  } catch (err) {

    await fastify.amqp?.close();

    fastify.log.error(err);

    setTimeout(() => {
      fastifyApp();
    }, 5000)
  }
}

fastifyApp();