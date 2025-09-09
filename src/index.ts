import express from 'express';
import bodyParser from 'body-parser';
import personsRouter from './routes/persons';
import meetingsRouter from './routes/meetings';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

dotenv.config();

const app = express();
app.use(bodyParser.json());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Scheduler API',
      version: '1.0.0',
      description: 'API for managing persons and meetings',
    }
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.get('/', (_, res) => {
  res.redirect('/api-docs');
});

app.use('/persons', personsRouter);
app.use('/meetings', meetingsRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));``

app.use((_, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
