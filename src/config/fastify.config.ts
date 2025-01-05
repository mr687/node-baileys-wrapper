import { FastifyAdapter } from '@nestjs/platform-fastify';

export function registerFastify() {
  const fastify = new FastifyAdapter({
    logger: {
      timestamp: () => `,"time":"${new Date().toJSON()}"`,
    },
    trustProxy: 'loopback',
  });
  return fastify;
}
