# User Profile Card Generator

A form-based full-stack web application that processes user details on the Node.js server, saves profile records in MongoDB, and returns dynamically rendered profile cards.

##  Live Demo

[Open the Live Demo](https://user-profile-card-generator-nvdl.onrender.com)

## Features
- Name, Bio, Skills and Social Links form
- Server-side form processing with Express
- Server-side string manipulation for skills and initials
- Dynamic HTML card / avatar response
- MongoDB persistence
- Saved profiles page
- Responsive UI

## Endpoints
- `GET /` — form
- `POST /profiles` — process, save and render a profile
- `GET /profiles` — list saved profiles
- `GET /profiles/:id` — render one profile
- `GET /health` — health check

## Deployment
Use GitHub for source code, MongoDB Atlas for the database, and Render for the live Node.js/Express app.

On Render:
- Build Command: `npm install`
- Start Command: `npm start`
- Environment variable: `MONGODB_URI=<your Atlas connection string>`
- Environment variable: `DB_NAME=profile_card_generator`

Never commit your MongoDB connection string or `.env` file.
