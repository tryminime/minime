# MiniMe Quick Start

## Local Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Setup

1. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/minime.git
   cd minime
   ```

2. **Start databases**
   ```bash
   docker-compose up -d
   ```

3. **Setup backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your values
   pip install -r requirements.txt
   python -m backend.main
   ```

4. **Setup frontend**
   ```bash
   cd website
   cp .env.example .env.local
   # Edit .env.local with your values
   npm install
   npm run dev
   ```

5. **Access application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Neo4j Browser: http://localhost:7474

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

### Quick deploy to Vercel

```bash
cd website
vercel login
vercel --prod
```

## Documentation

- [Full Implementation Plan](./months_7_8_implementation_plan.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](http://localhost:8000/docs)
- [Stripe Setup](./stripe_setup_guide.md)

## Support

- Issues: https://github.com/yourusername/minime/issues
- Email: hello@tryminime.com
