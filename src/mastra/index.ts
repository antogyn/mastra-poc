
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  server: {
    middleware: [
      {
        handler: async (c, next) => {
          if (c.req.path === '/api') {
            await next();
            return;
          }

          const apiKey = process.env.API_KEY;
          if (!apiKey) {
            return new Response('API key not found', { status: 500 });
          }

          const authHeader = c.req.header('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response('Unauthorized', { status: 401 });
          }

          const token = authHeader.split(' ')[1];
          if (token !== apiKey) {
            return new Response('Forbidden', { status: 403 });
          }

          await next();
        },
        path: '/api/*',
      }
    ]
  }
});
