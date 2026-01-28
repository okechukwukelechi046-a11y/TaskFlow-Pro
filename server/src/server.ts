import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth.routes';
import { taskRoutes } from './routes/task.routes';
import { projectRoutes } from './routes/project.routes';
import { initializeDatabase } from './config/database';
import { setupWebSocket } from './websocket/setup';

class Application {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: config.clientUrl,
      credentials: true
    }));
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private configureRoutes(): void {
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/tasks', taskRoutes);
    this.app.use('/api/v1/projects', projectRoutes);
    
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
  }

  private configureErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      await initializeDatabase();
      
      const server = this.app.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
      });

      setupWebSocket(server);
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

const app = new Application();
app.start();
