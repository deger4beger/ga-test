FROM node:alpine

WORKDIR /app

COPY package.json .
RUN pnpm install

COPY ./src/ ./app/

CMD ["pnpm", "dev"]