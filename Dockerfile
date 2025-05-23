FROM node:22.14-alpine3.21
RUN apk add jq syft
RUN npm install -g @vscode/vsce

WORKDIR /build
COPY . /build
RUN find . \( -name '*.ts' -o -name '*.tsx' \) -print0 | xargs -0 cat | wc -l > total-lines.txt
RUN syft --override-default-catalogers=javascript-lock-cataloger --output cyclonedx-json . > cyclonedx-sbom.json

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

# Package the webapps for IntelliJ/Eclipse
RUN cp /build/packages/package-lock.json /build/webview/generated/web/package-lock.json
RUN tar -czvf /build/webapps.tar.gz -C /build/webview/generated web
