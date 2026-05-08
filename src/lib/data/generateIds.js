
// a node js script to generate array of ids from questions.json

const fs = require('fs');
const path = require('path');

const questionsPath = path.join(__dirname, 'questions.json');
const outputPath = path.join(__dirname, 'ids.json');

fs.readFile(questionsPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading questions.json:', err);
    return;
  }

  try {
    const questions = JSON.parse(data);
    const ids = questions.map(q => q.ticket_id);
    fs.writeFile(outputPath, JSON.stringify(ids), 'utf8', err => {
      if (err) {
        console.error('Error writing ids.json:', err);
      } else {
        console.log('IDs successfully written to ids.json');
      }
    });
  } catch (parseErr) {
    console.error('Error parsing questions.json:', parseErr);
  }
});