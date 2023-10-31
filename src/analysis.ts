import csv from 'csv-parser';
import * as validator from 'email-validator';
import * as fs from 'fs';

/**
 * First task - Read the csv files in the inputPath and analyse them
 * @param {string[]} inputPaths An array of csv files to read
 * @param {string} outputPath The path to output the analysis
 */
function analyseFiles(inputPaths: string[], outputPath: string) {
  console.log('Complete the implementation in src/analysis.ts');
  console.log('testing');
  const allMails: string[] = [];
  const validMails: string[] = [];
  const allDomains: string[] = [];

  const output: {
    'valid-domains': string[];
    totalEmailsParsed: number;
    totalValidEmails: number;
    categories: {
      [prop: string]: number;
    };
  } = {
    'valid-domains': [],
    totalEmailsParsed: 0,
    totalValidEmails: 0,
    categories: {},
  };

  let processedFiles = 0;

  for (const input of inputPaths) {
    console.log(`Analysed files ${processedFiles} of ${inputPaths.length}`);
    const readInput = fs.createReadStream(input);
    readInput
      .pipe(csv())
      .on('data', (chunk) => {
        const email = chunk['Emails'];
        output.totalEmailsParsed++;
        allMails.push(email);

        if (validator.validate(email)) {
          validMails.push(email);
          const domain = email.split('@')[1];
          allDomains.push(domain);
        }
      })
      .on('end', () => {
        processedFiles++;

        if (processedFiles === inputPaths.length) {
          console.log('Analysing...');
        }

        const uniqueDomains = [...new Set(allDomains)];

        output['totalValidEmails'] = validMails.length;
        output['valid-domains'] = uniqueDomains;

        for (const domain of uniqueDomains) {
          output['categories'][domain] = allDomains.filter(
            (dom) => dom === domain,
          ).length;
        }

        const jsonToWrite = JSON.stringify(output, null, 2);

        fs.writeFile(outputPath, jsonToWrite, 'utf-8', (err) => {
          if (err) {
            console.error('error writing file');
            console.error(err);
          }
        });

        if (processedFiles === inputPaths.length) {
          console.log('emails parsed:');
          console.log(output.totalEmailsParsed);

          console.log('valid email formats');
          console.log(output.totalValidEmails);

          console.log('finished');
        }
      })
      .on('error', (err) => {
        console.error('problem reading file');
        console.error(err);
      });
  }
}

export default analyseFiles;
