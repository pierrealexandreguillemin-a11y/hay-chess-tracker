const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('ffe-results.html', 'utf8');
const $ = cheerio.load(html);

console.log('Finding where Performance 2160 is located');
console.log('');

// Find all cells containing exactly "2160"
$('td').filter((_, cell) => {
  const text = $(cell).text().trim();
  return text === '2160';
}).each((_, cell) => {
  console.log('Found cell with 2160:');
  console.log('  Class:', $(cell).attr('class'));
  console.log('  Text:', $(cell).text());

  // Get parent row
  const row = $(cell).closest('tr');
  const rowClass = row.attr('class') || 'no-class';
  console.log('  Parent row class:', rowClass);

  // Get all siblings
  const siblings = row.find('td');
  console.log('  Total cells in row:', siblings.length);

  // Find which index this cell is
  const index = row.find('td').index(cell);
  console.log('  Cell index in row:', index);

  // Show surrounding cells
  console.log('  Surrounding cells:');
  siblings.slice(Math.max(0, index - 3), Math.min(siblings.length, index + 4)).each((i, sibling) => {
    const sibText = $(sibling).text().trim();
    const actualIndex = row.find('td').index(sibling);
    const marker = actualIndex === index ? ' <-- HERE' : '';
    console.log(`    [${actualIndex}]: "${sibText}"${marker}`);
  });
});
