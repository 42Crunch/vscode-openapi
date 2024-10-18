FROM node:22-alpine3.20
RUN npm install -g vsce
WORKDIR /build
COPY . /build
RUN npm ci
RUN vsce package --allow-star-activation --out extension.vsix