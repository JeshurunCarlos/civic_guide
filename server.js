import express from 'express';
import path from 'path';

const app = express();
const port = process.env.PORT || 8080;
const distDir = path.join(process.cwd(), 'dist');

app.use(express.static(distDir));
app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
