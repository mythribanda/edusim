import fs from 'fs';
import path from 'path';

const objectDataFile = path.resolve('src/data/objectData.js');

try {
  const content = fs.readFileSync(objectDataFile, 'utf-8');
  // Hack to extract the objectData variable
  const jsonMatch = content.match(/const objectData = (\{[\s\S]*?\});?\s*(?:export|module\.exports)/);
  
  let objectData;
  if (jsonMatch && jsonMatch[1]) {
      // Need to evaluate it since it might not be strict JSON (might have trailing commas etc)
      objectData = eval('(' + jsonMatch[1] + ')');
  } else {
      // Alternative approach if regex fails
      const cleaned = content.replace(/^(const objectData = |export default objectData;|module\.exports = objectData;)/gm, '').trim();
      objectData = eval('(' + cleaned + ')');
  }

  const assetSemanticIndex = {};
  const categories = {};

  for (const [key, value] of Object.entries(objectData)) {
    const category = value.category || 'misc';
    
    // Add to categories
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(key);

    // Build Semantic Index
    assetSemanticIndex[key] = {
      aliases: value.aliases || [],
      tags: value.tags || [],
      path: value.file ? `/assets/${value.file}` : null,
      category: category,
      subCategory: value.subCategory || null,
      objectFamily: value.objectFamily || null,
    };
  }

  fs.writeFileSync('src/data/assetSemanticIndex.json', JSON.stringify(assetSemanticIndex, null, 2));
  fs.writeFileSync('src/data/categories.json', JSON.stringify(categories, null, 2));

  console.log('Successfully generated assetSemanticIndex.json and categories.json');
} catch (error) {
  console.error('Error parsing objectData:', error);
}
