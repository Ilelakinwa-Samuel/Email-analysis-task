import * as fs from 'fs';
import csv from 'csv-parser';
import * as dns from 'dns';
import * as validator from 'email-validator';

/**
 * Stretch goal - Validate all the emails in this files and output the report
 *
 * @param {string[]} inputPath An array of csv files to read
 * @param {string} outputFile The path where to output the report
 */
async function validateEmailAddresses(inputPath: string[], outputFile: string) {
  const allEmails: string[] = [];
  const allDomains: string[] = [];
  const validDomains: string[] = [];
  const validFormat: string[] = [];
  const validEmails: string[] = [];
  let processedFiles = 0;
  let emailsParsed = 0;

  for (const input of inputPath) {
    const readInput = fs.createReadStream(input);
    readInput
      .pipe(csv())
      .on('data', (chunk) => {
        const email = chunk['Emails'];
        emailsParsed++;
        allEmails.push(email);

        if (validator.validate(email)) {
          validFormat.push(email);
        }
      })
      .on('end', () => {
        processedFiles++;
        console.log(`processed file ${processedFiles} of ${inputPath.length}`);

        if (processedFiles === inputPath.length) {
          console.log('Validating...');
        }

        const domPromises = [];

        for (const email of validFormat) {
          const domain = email.split('@')[1];
          allDomains.push(domain);
        }

        for (const domain of allDomains) {
          domPromises.push(
            new Promise<void>((resolve, reject) => {
              dns.resolveMx(domain, (err, address) => {
                if (err) {
                  // handle error
                } else if (address && address.length) {
                  validDomains.push(domain);
                }
                resolve();
              });
            }),
          );
        }

        Promise.all(domPromises)
          .then(() => {
            const uniqueDomains = [...new Set(validDomains)];

            for (const email of validFormat) {
              const dom = email.split('@')[1];

              if (uniqueDomains.includes(dom)) {
                validEmails.push(email);
              }
            }

            let data = `Emails\r\n`;

            for (const mail of validEmails) {
              data += `${mail}\r\n`;
            }

            if (processedFiles === input.length) {
              fs.writeFile(outputFile, data, 'utf-8', (err) => {
                if (err) {
                  console.error('problem writing file');
                  console.error(err);
                }
                console.log('Successful');
              });
            }
          })
          .catch((err) => {
            if (err) {
              console.error('error resolving emails');
              console.error(err);
            } else {
              console.log('successful');
            }
          });
      })
      .on('err', (err) => {
        if (err) {
          console.error('problem occurred');
          console.error(err);
        } else {
          console.log('Successful');
        }
      });
  }
}

export default validateEmailAddresses;
