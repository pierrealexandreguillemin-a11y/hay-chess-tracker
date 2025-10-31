const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('ffe-results.html', 'utf8');
const $ = cheerio.load(html);

console.log('Searching for Performance location for BARTHEL Malo');
console.log('');

// Find BARTHEL row
$('tr').filter((_, row) => {
  return $(row).find('div.papi_joueur_box').length > 0;
}).first().each((_, row) => {
  const playerDiv = $(row).find('div.papi_joueur_box');
  const name = playerDiv.find('b').first().text().trim();

  console.log('Player:', name);
  console.log('');

  // ALL cells in outer row (direct children)
  const outerCells = $(row).find('td');
  console.log('Total cells in outer row:', outerCells.length);
  console.log('');

  // Find cells OUTSIDE the papi_joueur_box div
  const cellsOutside = $(row).find('> td').filter((_, cell) => {
    return $(cell).find('div.papi_joueur_box').length === 0;
  });

  console.log('Cells OUTSIDE papi_joueur_box:', cellsOutside.length);
  cellsOutside.each((i, cell) => {
    const text = $(cell).text().trim();
    const className = $(cell).attr('class') || 'no-class';
    console.log(`  [${i}] (${className}): "${text}"`);
  });
});
