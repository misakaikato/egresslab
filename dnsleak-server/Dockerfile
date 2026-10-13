FROM node:22-slim
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.mjs ./
ENV DB_PATH=/data/hits.db
VOLUME ["/data"]
EXPOSE 53/udp 8090
CMD ["node", "server.mjs"]
