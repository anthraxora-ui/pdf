# 1. Use the official pre-built image that ALREADY has Chrome installed!
FROM ghcr.io/puppeteer/puppeteer:21.11.0

# 2. Switch to the 'root' user so we have permission to copy files
USER root

# 3. Create our app folder
WORKDIR /app

# 4. Copy our ingredients list
COPY package*.json ./

# 5. CRITICAL FIX: Tell Puppeteer NOT to download Chrome again during npm install!
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true

# 6. Install our dependencies (This will be super fast now because it skips the 200MB download)
RUN npm install

# 7. Copy the rest of our server code
COPY . .

# 8. Tell our server exactly where the pre-installed Chrome is hiding
ENV CHROME_PATH=/usr/bin/google-chrome-stable

# 9. Open the window so the UI can talk to us
EXPOSE 3000

# 10. Start the server!
CMD ["node", "server.js"]
