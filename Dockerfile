FROM node:22-alpine3.20
RUN apk add jq syft
RUN npm install -g vsce
WORKDIR /build
COPY . /build
RUN find . \( -name '*.ts' -o -name '*.tsx' \) -print0 | xargs -0 cat | wc -l > total-lines.txt
RUN syft -o spdx-json . > spdx-report.json
RUN npm ci
RUN npm run lint || true
RUN jq '[.[] | .errorCount + .warningCount] | add' eslint-report.json > total-issues.txt
RUN vsce package --allow-star-activation --out extension.vsix
