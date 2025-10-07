# Use Node.js LTS version
FROM node:20-slim

# Install LaTeX and required packages
RUN apt-get update && apt-get install -y \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create public directory if it doesn't exist
RUN mkdir -p public

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
