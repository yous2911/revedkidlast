# RevEd Kids Backend

A comprehensive educational platform backend built with Node.js, Express, TypeScript, and PostgreSQL, featuring advanced monitoring, caching, and student management capabilities.

## 🚀 Features

### Core Features
- **Student Management**: Complete student profiles with preferences and adaptations
- **Exercise System**: Dynamic exercise generation and progress tracking
- **Authentication**: Secure JWT-based authentication with parent verification
- **Progress Tracking**: Comprehensive student progress analytics
- **Recommendation Engine**: AI-powered exercise recommendations

### Advanced Features
- **Real-time Monitoring**: Performance metrics, error tracking, and health checks
- **Intelligent Caching**: Redis-based caching with fallback mechanisms
- **Security Hardening**: Rate limiting, input validation, and security headers
- **Database Optimization**: Automatic indexing and connection pooling
- **Accessibility Support**: Built-in adaptations for various learning needs

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Redis 6+ (optional, for caching)
- TypeScript 5+

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd revedkidslast/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your actual values
   nano .env
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb reved_kids
   
   # Run migrations (in development)
   npm run dev
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## ⚙️ Environment Configuration

### Required Variables

```env
# Database (Required)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=reved_kids

# JWT (Required)
JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_chars
```

### Optional Variables

```env
# Redis (Optional - for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=10

# Performance
CACHE_TTL_SECONDS=3600
MAX_REQUEST_SIZE=10mb
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── controllers/          # Request handlers
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── middleware/          # Express middleware
│   ├── db.ts               # Database configuration
│   ├── app.ts              # Express app setup
│   └── server.ts           # Server startup
├── tests/                  # Test files
├── .env                    # Environment variables
├── package.json
└── tsconfig.json
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/login` - Student login
- `POST /api/auth/verify` - Parent code verification
- `POST /api/auth/logout` - Logout

### Students
- `GET /api/eleves/:id` - Get student info
- `PUT /api/eleves/:id/preferences` - Update preferences
- `PUT /api/eleves/:id/adaptations` - Update adaptations
- `GET /api/eleves/:id/statistiques` - Get statistics
- `GET /api/eleves/:id/exercices-recommandes` - Get recommendations
- `POST /api/eleves/:id/exercices/tentative` - Submit exercise attempt

### Monitoring
- `GET /api/monitoring/health` - System health
- `GET /api/monitoring/performance` - Performance metrics
- `GET /api/monitoring/dashboard` - Comprehensive dashboard
- `GET /api/monitoring/alerts` - Active alerts

### Educational Content
- `GET /api/defis` - Get French challenges
- `GET /api/maths` - Get math exercises

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start with nodemon
npm run build           # Build TypeScript
npm run start           # Start production server

# Testing
npm run test            # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
npm run db:reset        # Reset database

# Linting
npm run lint            # Run ESLint
npm run lint:fix        # Fix linting issues
```

### Code Quality

The project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Jest** for testing

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- monitoring.test.ts

# Run tests with coverage
npm run test:coverage
```

## 📊 Monitoring

The backend includes comprehensive monitoring:

### Health Check
```bash
curl http://localhost:3000/api/monitoring/health
```

### Performance Metrics
```bash
curl http://localhost:3000/api/monitoring/performance
```

### Dashboard
```bash
curl http://localhost:3000/api/monitoring/dashboard
```

## 🔒 Security Features

- **Rate Limiting**: Configurable rate limits per endpoint
- **Input Validation**: Comprehensive request validation
- **Security Headers**: CORS, CSP, and other security headers
- **JWT Authentication**: Secure token-based authentication
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization

## 🚀 Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
DB_SSL=true
REDIS_URL=redis://your-production-redis-url
JWT_SECRET=your_production_jwt_secret_very_long_and_secure
RATE_LIMIT_MAX_REQUESTS=50
CACHE_TTL_SECONDS=7200
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the monitoring dashboard for system status
- Review the API documentation

## 🔄 Changelog

### v1.0.0
- Initial release with core features
- Student management system
- Exercise recommendation engine
- Comprehensive monitoring
- Security hardening
- Performance optimization 