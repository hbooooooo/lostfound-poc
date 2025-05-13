import express from 'express';
const app = express();
app.use(express.json());
app.get('/api/health', (req, res) => res.send({ status: 'ok' }));
app.listen(3000, () => console.log('Backend listening on port 3000'));
