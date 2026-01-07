class EnvConverterTool {
  static convertToEnv() {
    try {
      const intellijInput = document.getElementById('intellij-input').value.trim();
      const errorDiv = document.getElementById('error');
      errorDiv.textContent = '';

      if (!intellijInput) {
        errorDiv.textContent = 'Please enter IntelliJ format environment variables';
        return;
      }

      // Split by semicolon and process each key-value pair
      const pairs = intellijInput.split(';').filter(pair => pair.trim());
      const envLines = [];

      for (const pair of pairs) {
        const trimmedPair = pair.trim();
        if (!trimmedPair) continue;

        // Validate format (should contain =)
        if (!trimmedPair.includes('=')) {
          errorDiv.textContent = `Invalid format: "${trimmedPair}" - must contain "="`;
          return;
        }

        // Add to env format
        envLines.push(trimmedPair);
      }

      // Output to .env format
      document.getElementById('dotenv-input').value = envLines.join('\n');

    } catch (error) {
      document.getElementById('error').textContent = `Error: ${error.message}`;
    }
  }

  static convertToIntellij() {
    try {
      const dotenvInput = document.getElementById('dotenv-input').value.trim();
      const errorDiv = document.getElementById('error');
      errorDiv.textContent = '';

      if (!dotenvInput) {
        errorDiv.textContent = 'Please enter .env format environment variables';
        return;
      }

      // Split by newlines and process each line
      const lines = dotenvInput.split('\n');
      const pairs = [];

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('#')) continue;

        // Validate format (should contain =)
        if (!trimmedLine.includes('=')) {
          errorDiv.textContent = `Invalid format: "${trimmedLine}" - must contain "="`;
          return;
        }

        pairs.push(trimmedLine);
      }

      // Output to IntelliJ format
      document.getElementById('intellij-input').value = pairs.join(';');

    } catch (error) {
      document.getElementById('error').textContent = `Error: ${error.message}`;
    }
  }

  static clear() {
    document.getElementById('intellij-input').value = '';
    document.getElementById('dotenv-input').value = '';
    document.getElementById('error').textContent = '';
  }

  static copyIntellij() {
    const intellijInput = document.getElementById('intellij-input');
    if (!intellijInput.value) {
      document.getElementById('error').textContent = 'Nothing to copy';
      return;
    }

    intellijInput.select();
    navigator.clipboard.writeText(intellijInput.value)
      .then(() => {
        const errorDiv = document.getElementById('error');
        errorDiv.style.color = 'green';
        errorDiv.textContent = 'Copied to clipboard!';
        setTimeout(() => {
          errorDiv.style.color = 'red';
          errorDiv.textContent = '';
        }, 2000);
      })
      .catch(err => {
        document.getElementById('error').textContent = `Failed to copy: ${err}`;
      });
  }

  static copyDotenv() {
    const dotenvInput = document.getElementById('dotenv-input');
    if (!dotenvInput.value) {
      document.getElementById('error').textContent = 'Nothing to copy';
      return;
    }

    dotenvInput.select();
    navigator.clipboard.writeText(dotenvInput.value)
      .then(() => {
        const errorDiv = document.getElementById('error');
        errorDiv.style.color = 'green';
        errorDiv.textContent = 'Copied to clipboard!';
        setTimeout(() => {
          errorDiv.style.color = 'red';
          errorDiv.textContent = '';
        }, 2000);
      })
      .catch(err => {
        document.getElementById('error').textContent = `Failed to copy: ${err}`;
      });
  }
}
