# JobScope TN

IT job market aggregator for Tunisia. It collects job offers from **Keejob** and **Tanitjobs**, stores them in several NoSQL databases, and exposes them through a secured **REST API** consumed by a React website.

Academic project: **Web Services** + **NoSQL**.

## Features

- Landing page with job search and filters (keyword, city, contract)
- Account creation and login (JWT)
- Dashboard: top skills, cities, postings per source
- Full-text search (Elasticsearch) and related skills (Neo4j)
- Interactive graph of jobs and skills (Neo4j)
- Favorites with status and notes (POST, GET, PUT, DELETE)
- Profile update and account deletion

## Architecture

```
Keejob / Tanitjobs
      |
ETL (Python: requests, BeautifulSoup)
      |
MongoDB (raw + normalized) --> Neo4j (graph)
                           --> Elasticsearch (search)
      |
Spring Boot REST API (JWT, Redis cache)
      |
React frontend
```

| Component | Role |
|---|---|
| MongoDB | Raw pages, normalized postings, users, favorites |
| Neo4j | Graph: Company, Posting, Skill, City |
| Elasticsearch | Full-text search |
| Redis | Response cache (120 s) |

## Tech stack

- **Backend:** Java 17, Spring Boot 3.3, Spring Security, JWT (JJWT), Maven
- **Frontend:** React, Vite, React Router, Recharts, react-force-graph-2d
- **ETL:** Python, requests, BeautifulSoup, pymongo
- **Databases:** MongoDB 7, Neo4j 5, Elasticsearch 8, Redis 7
- **Tools:** Docker Compose, pytest, Postman

## Project structure

```
jobscope-tn/
├── backend/    Spring Boot API
├── frontend/   React app
├── etl/        Python scraping, parsing, loaders
├── data/       skills.json
├── docs/       report, diagrams, Postman collection
└── docker/     docker-compose.yml
```

## Getting started

### 1. Databases

```bash
cd docker
docker compose up -d
```

MongoDB is exposed on port **27018** (to avoid a conflict with a local MongoDB on 27017).

### 2. Data (ETL)

```bash
cd etl
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
python run_all.py               # scrape raw pages into MongoDB
python parse_postings.py        # normalize into the postings collection
python load_neo4j.py            # build the graph
python load_es.py               # index in Elasticsearch
```

### 3. Backend

Java 17 is required.

```bash
cd backend
./mvnw spring-boot:run          # Windows: .\mvnw.cmd spring-boot:run
```

API: http://localhost:8080/api

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## REST API

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/jobs`, `/api/search`, `/api/related/{skill}`, `/api/stats`, `/api/graph` | Public |
| GET, PUT, DELETE | `/api/me` | JWT |
| GET, POST, PUT, DELETE | `/api/favorites` | JWT |

Protected routes need the header `Authorization: Bearer <token>`.

## Ethical scraping

`robots.txt` is checked before scraping, requests are spaced by 2 seconds, and a clear User-Agent is used. Data is for educational purposes only. Job offers belong to their original sites, and each posting links back to its source.

## Limitations

- The keyword-based IT filter can let a few non-IT offers through.
- Scraping is run manually (no scheduler).
- CORS is open to all origins for development.

## Authors

Your name(s), course, university, 2026.