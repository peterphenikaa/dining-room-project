# Legacy default Dockerfile → Dining (prefer Dockerfile.dining in compose)
FROM node:20-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install
COPY . .
RUN rm -rf src/modules/auth src/authMain.ts
RUN npx tsc -p tsconfig.dining.json
EXPOSE 3002
CMD ["npx", "nodemon"]
