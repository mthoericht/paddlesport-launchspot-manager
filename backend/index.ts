import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import launchPointRoutes from './routes/launchPoints.js';
import publicTransportRoutes from './routes/publicTransport.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/launch-points', launchPointRoutes);
app.use('/api/public-transport', publicTransportRoutes);

app.listen(PORT, '0.0.0.0', () => 
{
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

