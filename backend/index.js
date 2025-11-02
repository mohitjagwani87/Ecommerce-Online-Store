require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const seedDB = require('./seed/productSeeds');
const syncPinecone = require('./sync/syncPinecone');
const productRoutes = require('./routes/products');
const checkoutRoutes = require('./routes/checkout');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const { swaggerUi, swaggerSpec, setupSwaggerUi, setupSwaggerJson } = require('./docs/swagger');

// Create Express App
const app = express();
const PORT = process.env.PORT || 8000;

// Detect if running in Vercel serverless environment
const IS_VERCEL = process.env.VERCEL === '1';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Lazy MongoDB connection helper
async function connectMongoDB() {
  if (mongoose.connection.readyState === 1) {
    // Already connected
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2) {
    // Connection in progress, wait for it
    return new Promise((resolve, reject) => {
      mongoose.connection.once('connected', () => resolve(mongoose.connection));
      mongoose.connection.once('error', reject);
    });
  }

  // Connect with optimized settings for serverless
  return mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Serverless-friendly connection options
    serverSelectionTimeoutMS: IS_VERCEL ? 5000 : 30000,
    socketTimeoutMS: IS_VERCEL ? 45000 : 30000,
    maxPoolSize: 1, // Single connection for serverless
    minPoolSize: 1,
  });
}

// Middleware (must be set up before routes)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize MongoDB connection (lazy for serverless)
if (!IS_VERCEL) {
  // Traditional server: connect on startup
  connectMongoDB()
    .then(async () => {
      console.log('MongoDB Connected');

      // 1. Seed the database (only when necessary)
      const skipSeed = process.env.SKIP_SEED_ON_START === 'true';
      if (!skipSeed) {
        try {
          const forceSeed = process.env.FORCE_SEED_ON_START === 'true';
          const result = await seedDB({ force: forceSeed, skipIfExists: !forceSeed });
          if (result?.seeded) {
            console.log('🪴 Database seeded');
          } else if (result?.skipped) {
            console.log('🌱 Seed skipped (existing products retained)');
          }
        } catch (err) {
          console.error('❌ Seeding error:', err);
        }
      } else {
        console.log('🌱 SKIP_SEED_ON_START enabled. Existing products preserved.');
      }

      // 2. Sync with Pinecone (primary recommendation engine)
      try {
        await syncPinecone();
        console.log('✅ Pinecone synced');
      } catch (err) {
        console.error('❌ Pinecone sync error (continuing with fallbacks):', err);
      }

      // 3. Start Express server (only for traditional server)
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server ready on port ${PORT}.`);
      });
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err);
      process.exit(1);
    });
} else {
  // Serverless: connect on first request via middleware (after body parsing)
  app.use(async (req, res, next) => {
    try {
      await connectMongoDB();
      next();
    } catch (err) {
      console.error('❌ MongoDB connection error:', err);
      res.status(503).json({ error: 'Database connection failed' });
    }
  });
}

// Redirect root to /api-docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Setup Swagger UI with customized title
setupSwaggerJson(app); // serves /api-docs/swagger.json
setupSwaggerUi(app);

// Routes
app.use('/api/products', productRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/search', require('./routes/search'));
app.use('/api/auth', authRoutes);

module.exports = app;
