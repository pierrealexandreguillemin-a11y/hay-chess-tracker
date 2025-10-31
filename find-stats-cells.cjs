const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('ffe-results.html', 'utf8');
const $ = cheerio.load(html);

$('tr').filter((_, row) => {
  return $(row).find('div.papi_joueur_box').length > 0;
}).first().each((_, row) => {
  const playerDiv = $(row).find('div.papi_joueur_box');
  const name = playerDiv.find('b').first().text().trim();

  console.log('Player:', name);
  console.log('');

  // The papi_joueur_box is inside a <td>
  // We need cells that come AFTER this <td>
  const parentTd = playerDiv.closest('td');
  const followingCells = parentTd.nextAll('td');

  console.log('Cells AFTER papi_joueur_box td:', followingCells.length);
  console.log('First 10:');
  followingCells.slice(0, 10).each((i, cell) => {
    const text = $(cell).text().trim();
    const className = $(cell).attr('class') || 'no-class';
    console.log(`  [${i}] (${className}): "${text}"`);
  });
});
