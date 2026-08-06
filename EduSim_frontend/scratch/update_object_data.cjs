const fs = require('fs');
const path = require('path');

const objectDataPath = path.join(__dirname, '../src/data/objectData.js');

let fileContent = fs.readFileSync(objectDataPath, 'utf8');

// Using a regex to extract the object, or eval if it's safe.
// Since it's huge, we'll try to require it.
let objectData;
try {
  objectData = require(objectDataPath).default || require(objectDataPath);
} catch (e) {
  console.error("Failed to require objectData.js", e);
  process.exit(1);
}

const fallbackAliases = {
  truck: ['lorry', 'vehicle', 'pickup'],
  barrier: ['wall', 'blockade', 'obstacle'],
  car: ['vehicle', 'automobile'],
  ball: ['sphere', 'projectile', 'orb'],
  pendulum: ['weight', 'bob']
};

for (const [key, obj] of Object.entries(objectData)) {
  // Ensure image
  if (obj.file && !obj.image) {
    obj.image = obj.file;
  }
  
  // Basic dimensions defaults based on category
  if (obj.width === undefined || obj.height === undefined) {
    if (obj.category === 'vehicles') {
      obj.width = 3.4;
      obj.height = 1.7;
    } else if (obj.category === 'characters') {
      obj.width = 1.0;
      obj.height = 1.9;
    } else if (obj.category === 'physics' && obj.objectFamily?.includes('ball')) {
      obj.width = 0.9;
      obj.height = 0.9;
    } else {
      obj.width = 1.6;
      obj.height = 1.0;
    }
  }

  // Physics defaults
  if (obj.mass === undefined) {
    if (obj.category === 'vehicles') obj.mass = 1200;
    else if (obj.category === 'characters') obj.mass = 80;
    else obj.mass = 1;
  }

  if (obj.friction === undefined) {
    if (obj.category === 'terrain') obj.friction = 0.8;
    else obj.friction = 0.1;
  }

  if (obj.bounce === undefined) obj.bounce = 0.2;

  // Aliases
  obj.aliases = obj.aliases || [];
  
  // Specific aliases based on key or objectFamily
  for (const [base, aliases] of Object.entries(fallbackAliases)) {
    if (key.includes(base) || (obj.objectFamily && obj.objectFamily.includes(base))) {
      for (const alias of aliases) {
        if (!obj.aliases.includes(alias)) {
          obj.aliases.push(alias);
        }
      }
    }
  }
}

const newContent = `// V2 Deep Metadata System
const objectData = ${JSON.stringify(objectData, null, 2)};

export default objectData;
`;

fs.writeFileSync(objectDataPath, newContent, 'utf8');
console.log("objectData.js updated successfully.");
