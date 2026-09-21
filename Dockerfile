ARG BASE_IMAGE=registry.access.redhat.com/ubi9/nodejs-20:latest
FROM ${BASE_IMAGE}

WORKDIR /opt/app-root/src

# Install dev dependencies so Vite is available during the React build.
# NODE_ENV=production belongs AFTER the frontend is compiled.
COPY --chown=1001:0 package.json package-lock.json ./
RUN npm ci --include=dev

COPY --chown=1001:0 . .
RUN npm run build \
    && npm prune --omit=dev \
    && chgrp -R 0 /opt/app-root/src \
    && chmod -R g=u /opt/app-root/src

ENV NODE_ENV=production
ENV NGAT_ENV=production
ENV PORT=8080
USER 1001
EXPOSE 8080
CMD ["node", "mssqlserver.js"]
