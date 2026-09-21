FROM registry.access.redhat.com/ubi9/nodejs-20:latest
WORKDIR /opt/app-root/src
ENV NODE_ENV=production PORT=8080 NGAT_ENV=production
COPY --chown=1001:0 package.json package-lock.json ./
RUN npm ci
COPY --chown=1001:0 . .
RUN npm run build && npm prune --omit=dev && chgrp -R 0 /opt/app-root/src && chmod -R g=u /opt/app-root/src
USER 1001
EXPOSE 8080
CMD ["node", "mssqlserver.js"]
