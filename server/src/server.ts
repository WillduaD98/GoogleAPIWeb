import express from 'express';
import path from 'node:path';
import type { Request, Response } from 'express';
import db from './config/connection.js';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers} from './schemas/index.js'
// import routes from './routes/index.js';
import { authenticateToken } from './services/auth.js';
import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true
});

console.log('🔎 typeDefs:', typeDefs);
console.log('🔎 resolvers:', resolvers);


const startApolloServer = async () => {
  await server.start();
  await db();

  const app = express();
  const PORT = process.env.PORT || 3001;
  
  app.use(express.json()); // ✅ Primero, obligatorio

  // Middleware temporal para ver qué está llegando
  app.use('/graphql', (req, _res, next) => {
    console.log('🧾 req.body:', JSON.stringify(req.body, null, 2));
    next();
  });
  
  // Apollo middleware — NUNCA DEBE FALTAR
  app.use('/graphql', expressMiddleware(server, { context: authenticateToken }));
  
  

    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../../client/dist')))

      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, '../../client/dist/index.html'))
      })
    }

    app.listen(PORT, () => {
      console.log(`API server runnin on port ${PORT}!`)
      console.log(`Use GraphQl at http://localhost:${PORT}/graphql`);
    });
};
console.log('🚧 NODE_ENV:', process.env.NODE_ENV);

startApolloServer();

// const app = express();
// const PORT = process.env.PORT || 3001;

// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// // if we're in production, serve client/build as static assets
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../client/build')));
// }

// app.use(routes);

// db.once('open', () => {
//   app.listen(PORT, () => console.log(`🌍 Now listening on localhost:${PORT}`));
// });
