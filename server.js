const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const chokidar = require('chokidar');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store compilation status
let compilationStatus = {
  isCompiling: false,
  lastCompiled: null,
  error: null,
  method: null
};

// Check if LaTeX is available locally
function checkLatexInstallation() {
  return new Promise((resolve) => {
    // First try system PATH
    exec('which pdflatex', (error) => {
      if (error) {
        // Try MacTeX default location
        exec('ls /usr/local/texlive/2025/bin/universal-darwin/pdflatex', (error2) => {
          if (error2) {
            exec('which xelatex', (error3) => {
              resolve(!error3);
            });
          } else {
            resolve(true);
          }
        });
      } else {
        resolve(true);
      }
    });
  });
}

// Local LaTeX compilation
function compileLatexLocally(inputFile, outputDir) {
  return new Promise((resolve, reject) => {
    // Try system PATH first, then MacTeX location
    let pdflatexCmd = 'pdflatex';
    exec('which pdflatex', (error) => {
      if (error) {
        pdflatexCmd = '/usr/local/texlive/2025/bin/universal-darwin/pdflatex';
      }
      
      const cmd = `cd "${path.dirname(inputFile)}" && ${pdflatexCmd} -output-directory="${outputDir}" "${path.basename(inputFile)}"`;
      
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          reject({ error: error.message, stderr, stdout });
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  });
}

// Online LaTeX compilation using LaTeX.Online API
async function compileLatexOnline(latexContent) {
  try {
    const response = await axios.post('https://latex.ytotech.com/builds/sync', {
      resources: [{
        main: true,
        file: 'resume.tex',
        content: latexContent
      }],
      compiler: 'pdflatex'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer',
      timeout: 30000
    });

    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`Online compilation failed: ${error.message}`);
  }
}

// Main compilation function
async function compileResume() {
  const inputFile = path.join(__dirname, 'resume.tex');
  const outputDir = path.join(__dirname, 'public');
  
  if (!fs.existsSync(inputFile)) {
    throw new Error('resume.tex not found');
  }

  // Ensure public directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  compilationStatus.isCompiling = true;
  compilationStatus.error = null;

  try {
    const hasLocalLatex = await checkLatexInstallation();
    
    if (hasLocalLatex) {
      // Try local compilation first
      try {
        await compileLatexLocally(inputFile, outputDir);
        compilationStatus.method = 'local';
        compilationStatus.lastCompiled = new Date();
        console.log('✓ Local LaTeX compilation successful');
      } catch (localError) {
        console.log('✗ Local compilation failed, trying online...', localError.error);
        throw localError;
      }
    } else {
      throw new Error('Local LaTeX not available');
    }
  } catch (localError) {
    // Fallback to online compilation
    try {
      const latexContent = fs.readFileSync(inputFile, 'utf8');
      const pdfBuffer = await compileLatexOnline(latexContent);
      
      const outputPath = path.join(outputDir, 'resume.pdf');
      fs.writeFileSync(outputPath, pdfBuffer);
      
      compilationStatus.method = 'online';
      compilationStatus.lastCompiled = new Date();
      console.log('✓ Online LaTeX compilation successful');
    } catch (onlineError) {
      compilationStatus.error = `Both local and online compilation failed. Local: ${localError.error || localError.message}, Online: ${onlineError.message}`;
      throw new Error(compilationStatus.error);
    }
  } finally {
    compilationStatus.isCompiling = false;
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/status', (req, res) => {
  res.json(compilationStatus);
});

app.post('/api/compile', async (req, res) => {
  try {
    await compileResume();
    res.json({ success: true, ...compilationStatus });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      ...compilationStatus 
    });
  }
});

app.get('/api/pdf', (req, res) => {
  const pdfPath = path.join(__dirname, 'public', 'resume.pdf');
  
  if (fs.existsSync(pdfPath)) {
    res.sendFile(pdfPath);
  } else {
    res.status(404).json({ error: 'PDF not found. Please compile first.' });
  }
});

app.get('/api/tex', (req, res) => {
  const texPath = path.join(__dirname, 'resume.tex');
  
  if (fs.existsSync(texPath)) {
    const content = fs.readFileSync(texPath, 'utf8');
    res.json({ content });
  } else {
    res.status(404).json({ error: 'resume.tex not found' });
  }
});

// File watching for auto-compilation
const watcher = chokidar.watch('resume.tex', {
  ignored: /[\/\\]\./,
  persistent: true
});

watcher.on('change', async (path) => {
  console.log(`File ${path} has been changed, recompiling...`);
  try {
    await compileResume();
    console.log('Auto-compilation completed');
  } catch (error) {
    console.error('Auto-compilation failed:', error.message);
  }
});

// Initial compilation on startup
async function startup() {
  console.log('Starting LaTeX Resume Viewer...');
  
  try {
    await compileResume();
    console.log('Initial compilation completed');
  } catch (error) {
    console.error('Initial compilation failed:', error.message);
  }
  
  app.listen(port, () => {
    console.log(`🚀 LaTeX Resume Viewer running at http://localhost:${port}`);
    console.log(`📄 Watching resume.tex for changes...`);
  });
}

startup();