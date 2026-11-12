FROM node:24-bookworm-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html tsconfig*.json vite.config.ts tailwind.config.ts postcss.config.js ./
COPY src ./src
COPY public ./public
RUN npm run typecheck && npm run build && npm run build:baseline

FROM node:24-bookworm-slim AS app
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY --from=frontend /app/dist ./dist
COPY --from=frontend /app/dist-baseline ./dist-baseline
COPY server ./server
COPY db/migrations ./db/migrations
COPY api ./api
USER node
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=6s --start-period=25s --retries=4 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]
CMD ["node", "server/index.mjs"]
