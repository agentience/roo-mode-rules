const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const mkdirp = require('mkdirp');

// Read the mode-rule-context.yaml file
try {
  const roomodesContent = fs.readFileSync('mode-rule-context.yaml', 'utf8');
  const roomodesData = yaml.load(roomodesContent);

  if (!roomodesData || !roomodesData.modes) {
    console.error('No modes found in mode-rule-context.yaml');
    process.exit(1);
  }

  // Process each mode
  Object.entries(roomodesData.modes).forEach(([modeName, modeConfig]) => {
    if (!modeConfig.context || !Array.isArray(modeConfig.context)) {
      console.warn(`No context files found for mode: ${modeName}`);
      return;
    }

    // Create the target directory
    const targetDir = path.join('.roo', `rules-${modeName}`);
    mkdirp.sync(targetDir);
    console.log(`Created directory: ${targetDir}`);

    // Copy each context file
    modeConfig.context.forEach(contextFile => {
      try {
        // Check if the source file exists
        if (!fs.existsSync(contextFile)) {
          console.warn(`Source file does not exist: ${contextFile}`);
          return;
        }

        // Get the filename without the path
        const fileName = path.basename(contextFile);
        const targetFile = path.join(targetDir, fileName);

        // Copy the file
        fs.copyFileSync(contextFile, targetFile);
        console.log(`Copied: ${contextFile} -> ${targetFile}`);
      } catch (err) {
        console.error(`Error copying file ${contextFile}: ${err.message}`);
      }
    });

    console.log(`Processed mode: ${modeName}`);
  });

  console.log('Context files copying completed successfully!');
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}