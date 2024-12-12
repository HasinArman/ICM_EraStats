# Use Node.js LTS version
FROM node:16

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Rebuild bcrypt for the Docker environment
RUN npm rebuild bcrypt --build-from-source

# Copy the rest of the application
COPY . .

# Expose the application's port
EXPOSE 5000

# Start the application
CMD ["node", "app.js"]
