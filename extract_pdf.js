import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const fs = require('fs');

const dataBuffer = fs.readFileSync('CRS Product Description.pdf');
console.log(pdf);
// Try common variations
const parse = pdf.default || pdf;
parse(dataBuffer).then(function (data) {
    console.log(data.text);
}).catch(console.error);
