FROM node:20-alpine

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ .
COPY version.json /app/version.json

ENV PORT=5001
EXPOSE 5001

CMD ["npm", "start"]
