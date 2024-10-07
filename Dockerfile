FROM node:20.12.2-alpine
RUN mkdir -p /usr/src/gp-server
WORKDIR /usr/src/gp-server
COPY package.json /usr/src/gp-server/
RUN npm install
COPY . /usr/src/gp-server
EXPOSE 2006 2007
CMD NODE_ENV=staging npm start