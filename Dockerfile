# Inkview hosted server: the single bundled file on a slim Node runtime.
#   docker build -t inkview .
#   docker run -p 8080:8080 inkview        → http://localhost:8080/mcp
ARG NODE_IMAGE=node:22-alpine
FROM ${NODE_IMAGE} AS build
WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM ${NODE_IMAGE}
LABEL org.opencontainers.image.source="https://github.com/feimacode/inkview" \
      org.opencontainers.image.licenses="MIT"
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
COPY --from=build /app/dist/inkview.js /app/dist/inkview.js.LEGAL.txt ./
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:${PORT}/healthz || exit 1
CMD ["node", "inkview.js", "--http"]
