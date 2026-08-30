import app from './app';
import { env } from './config/env';
import './worker';

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`TaskFlow API listening on port ${PORT}`);
  console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});

