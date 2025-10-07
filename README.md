# LaTeX Resume Viewer

A web-based LaTeX viewer for your resume with live preview capabilities. This tool automatically compiles your `resume.tex` file and displays the resulting PDF in your browser with real-time updates.

## Features

- 🔄 **Live Preview**: Automatically recompiles when you edit `resume.tex`
- 🌐 **Web Interface**: Clean, responsive browser-based viewer
- 🔍 **PDF Controls**: Zoom in/out, fit to width, actual size
- 📥 **Download**: Download the compiled PDF directly
- 🔧 **Dual Compilation**: Supports both local LaTeX and online compilation
- 📊 **Status Monitoring**: Real-time compilation status and error reporting
- 🐳 **Docker Ready**: Fully containerized with LaTeX included

## Quick Start

### Using Docker (Recommended)

1. **Build and Run**
   ```bash
   docker-compose up -d
   ```

2. **Open in Browser**
   Visit: http://localhost:3000

3. **Stop the Container**
   ```bash
   docker-compose down
   ```

### Using Node.js

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Viewer**
   ```bash
   npm start
   ```

3. **Open in Browser**
   Visit: http://localhost:3000

## Docker Deployment

The application is fully containerized with Docker support:

- **LaTeX included**: No need to install LaTeX separately
- **Volume mounts**: Edit `resume.tex` locally and see live updates
- **Persistent storage**: Generated PDFs are saved to `./public`

### Alternative Docker Commands

Build and run manually:
```bash
# Build the image
docker build -t latex-resume .

# Run the container
docker run -d -p 3000:3000 \
  -v $(pwd)/resume.tex:/app/resume.tex \
  -v $(pwd)/public:/app/public \
  latex-resume
```

## LaTeX Setup for Local Development

If running without Docker, install LaTeX locally:

### macOS
```bash
# Using Homebrew
brew install --cask mactex-no-gui

# Or full MacTeX (larger download)
brew install --cask mactex
```

### Ubuntu/Debian
```bash
sudo apt-get install texlive-latex-base texlive-latex-extra texlive-fonts-recommended
```

### Windows
Download and install [MiKTeX](https://miktex.org/) or [TeX Live](https://www.tug.org/texlive/)

## How It Works

1. **File Watching**: The server monitors `resume.tex` for changes
2. **Auto Compilation**: When changes are detected, it automatically recompiles
3. **Dual Strategy**: 
   - First tries local LaTeX compilation (faster, more reliable)
   - Falls back to online compilation if local LaTeX isn't available
4. **Live Updates**: The browser automatically refreshes to show the latest PDF

## File Structure

```
my_resume_latex/
├── resume.tex          # Your LaTeX resume source
├── server.js           # Node.js backend server
├── package.json        # Project dependencies
├── Dockerfile          # Docker image configuration
├── docker-compose.yml  # Docker Compose setup
├── .dockerignore       # Docker ignore patterns
├── public/             # Frontend files
│   └── index.html      # Web interface
└── README.md           # This file
```

## API Endpoints

- `GET /` - Web interface
- `GET /api/pdf` - Download compiled PDF
- `GET /api/tex` - Get LaTeX source content
- `GET /api/status` - Get compilation status
- `POST /api/compile` - Trigger manual compilation

## Development

Start with auto-restart on changes:
```bash
npm install -g nodemon
npm run dev
```

## Troubleshooting

### LaTeX Not Found
If you see "Local LaTeX not available":
1. Install LaTeX using the instructions above
2. Restart the server: `npm start`
3. The viewer will fall back to online compilation automatically

### Online Compilation Fails
If both local and online compilation fail:
1. Check your LaTeX syntax in `resume.tex`
2. Ensure all required packages are available
3. Try compiling manually with `pdflatex resume.tex`

### Port Already in Use
If port 3000 is busy:
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or modify server.js to use a different port
```

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## License

MIT License - Feel free to modify and distribute!