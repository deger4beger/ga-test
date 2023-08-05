FROM node:alpine

WORKDIR /app

COPY package.json .

RUN npm i -g pnpm
RUN pnpm install

COPY ./src ./src/

CMD ["pnpm", "dev:docker"]