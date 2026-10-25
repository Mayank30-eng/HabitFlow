# 1. Base Image
FROM node:20-alpine

# 2. Set Working Directory
WORKDIR /app

# 3. Copy Dependency Files
COPY package*.json ./

# 4. Install Dependencies
RUN npm ci

# 5. Copy Application Source Code
COPY . .

# 6. Build the Frontend
RUN npm run build

# 7. Expose the Port
EXPOSE 3001

# 8. Start the Server
CMD ["npm", "start"]
