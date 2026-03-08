FROM node:18-slim

# Install necessary libraries for Puppeteer to run
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && apt-get install -y fonts-ipafont-gothic fonts-wqy-zenhei fonts-kacst fonts-freefont-ttf libxss1 \
      libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
      libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# Install dependencies (Puppeteer will download its own Chrome here)
RUN npm install

COPY . .

EXPOSE 3000

# Tell Puppeteer to use the Chrome it downloaded, not a system one
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
ENV CHROME_PATH=""

CMD ["node", "server.js"]
