FROM node:22-alpine3.20
RUN apk add jq syft
RUN npm install -g @vscode/vsce

WORKDIR /build
COPY . /build
RUN find . \( -name '*.ts' -o -name '*.tsx' \) -print0 | xargs -0 cat | wc -l > total-lines.txt
RUN syft -o spdx-json . > spdx-report.json

RUN npm ci
RUN npm run lint || true
RUN jq '[.[] | .errorCount + .warningCount] | add' eslint-report.json > total-issues.txt
# Calculate stats
RUN echo "`cat total-issues.txt` / `cat total-lines.txt` * 1000" | bc -l > issues-per-1k-lines.txt
RUN echo "Total lines: `cat total-lines.txt`" > stats.txt
RUN echo "Total issues: `cat total-issues.txt`" >> stats.txt
RUN echo "Issues per 1000 lines: `cat issues-per-1k-lines.txt`" >> stats.txt

# Build the extension
RUN vsce package `jq -r '.version' < package.json`-build-`date +"%Y%m%d%H%M%S"` --allow-star-activation --follow-symlinks --no-git-tag-version

# Build the extension that uses the dev endpoints
COPY packages/common/src/endpoints-dev.ts /build/packages/common/src/endpoints.ts
COPY package.json /build/package.json
RUN jq '.contributes.configuration.properties."openapi.platformRepository".default = "https://repo.42crunch.com/downloads/rc"' package.json > package.json.tmp && mv package.json.tmp package.json
RUN vsce package `jq -r '.version' < package.json`-build-dev-`date +"%Y%m%d%H%M%S"` --allow-star-activation --follow-symlinks --no-git-tag-version
