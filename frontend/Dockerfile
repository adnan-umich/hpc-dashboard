# Stage 1: Build the React app
FROM node:20.9.0-bullseye-slim AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install
RUN npm install web-vitals

# Copy the rest of the application and build the app
COPY . .
RUN npm run build

# Stage 2: Serve the built files
FROM node:20.9.0-bullseye-slim

# Install the `serve` package globally
RUN npm install -g serve

WORKDIR /app

# Copy the built files from the previous stage
COPY --from=builder /app/build ./build

# Expose the port and serve the app
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
