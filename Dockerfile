FROM node:18-alpine

ARG SHOPIFY_API_KEY
WORKDIR /app
COPY backend ./backend
COPY frontend ./frontend
WORKDIR /app/backend
RUN npm install
WORKDIR /app/frontend
RUN npm install && npm run build
WORKDIR /app/backend
CMD ["npm", "run", "serve"]
