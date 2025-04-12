# Whiff & Wonder

A modern e-commerce platform for perfumes with Redis-backed session management and user preferences.

## Project Structure

```
/Whiff&Wonder
├── public/               # Static files
│   ├── css/             # Stylesheets
│   ├── images/          # Image assets
│   ├── js/              # Client-side JavaScript
│   └── pages/           # HTML pages
├── server/              # Server-side code
│   └── server.js        # Express server
├── config/              # Configuration files
│   └── redis.conf       # Redis configuration
├── data/                # Application data
│   └── items.json       # Product catalog
├── docker/              # Docker configuration
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── copy-to-docker.{bat,sh}
└── package.json         # Project dependencies
```

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development environment:
   ```bash
   cd docker
   docker-compose up -d
   ```

3. Access the application:
   - Main site: http://localhost:3333
   - Admin dashboard: http://localhost:3333/admin (requires login)

## Key Features

- Responsive design with mobile-first approach
- Multi-language support (English/Romanian)
- User authentication with Redis session management
- Product recommendations
- Favorites and recent views tracking

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

Copyright © 2025 Whiff & Wonder. All rights reserved.