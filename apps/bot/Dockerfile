FROM node:lts-alpine
WORKDIR /app
COPY package*.json ./

RUN corepack enable

RUN apt add cmake g++ gcc libuv1-dev libopus-dev
RUN pnpm i git://github.com/davidzeng0/sange.git

RUN apt add pkg-config libssl-dev libmp3lame-dev libopus-dev libvorbis-dev nasm

RUN pnpm install
RUN 

COPY . ./app
CMD ["npm", "start"]