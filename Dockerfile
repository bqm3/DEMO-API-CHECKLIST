FROM node:20
WORKDIR /app
COPY package.json .
COPY . .
RUN yarn install

CMD npm start
