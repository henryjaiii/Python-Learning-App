const express = require('express');
const cors = require('cors');
const { PythonShell } = require('python-shell');
const fs = require('fs').promises;

const app = express();
app.use(cors());
app.use(express.json());

app.post('/execute', async (req, res) => {
  try {
    const { code } = req.body;
    
    console.log('\n========================================');
    console.log('📝 Received code to execute:');
    console.log(code);
    console.log('========================================\n');
    
    // Write code to temporary file
    await fs.writeFile('temp.py', code);

    // Execute Python code
    const options = {
      pythonPath: 'python',
      pythonOptions: ['-u'],
    };

    PythonShell.run('temp.py', options).then(results => {
      console.log('✅ Execution successful:');
      console.log(results.join('\n'));
      console.log('========================================\n');
      res.json({ output: results.join('\n'), error: null });
    }).catch(error => {
      console.error('❌ Execution error:');
      
      const traceback = (error.traceback || '').trim();
      const rawMessage = (error.message || '').trim();
      const combinedTrace = traceback || rawMessage;

      if (combinedTrace) {
        console.error(combinedTrace);
      }
      console.error('========================================\n');

      // Try to extract the line number from traceback or message
      const lineMatch = (combinedTrace.match(/line\s+(\d+)/i)) || (rawMessage.match(/line\s+(\d+)/i));
      const lineNumber = lineMatch ? parseInt(lineMatch[1], 10) : null;

      // Determine a concise message for the client
      
      let conciseMessage = rawMessage || 'Execution error';
      if (traceback) {
        const tracebackLines = traceback.split('\n').map(line => line.trim()).filter(Boolean);
        
        if (tracebackLines.length > 0) {
          conciseMessage = tracebackLines[tracebackLines.length - 1];
        }
      }

      // Remove redundant detected-line suffix if present
      conciseMessage = conciseMessage.replace(/\s*\(detected at line \d+\)/i, '').trim();

      res.json({
        output: null,
        error: {
          message: conciseMessage,
          line: lineNumber,
          raw: rawMessage,
        },
      });
    });

  } catch (error) {
    console.error('❌ Server error:');
    console.error(error.message);
    console.error('========================================\n');
    res.status(500).json({
      error: {
        message: error.message || 'Server error',
        line: null,
        raw: error.stack || error.message,
      },
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});