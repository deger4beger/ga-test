import Fastify from 'fastify';


const fastify = Fastify({
  logger: true
})

fastify.get('/', async function handler (request, reply) {
  return { hello: 'Hello from m1 microservice efwffw rgegegegeeger !' };
})

try {
  await fastify.listen({ port: 8000, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}