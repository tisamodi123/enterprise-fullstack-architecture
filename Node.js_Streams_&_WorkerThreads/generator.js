import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'users_data.json');

const writeStream = fs.createWriteStream(filePath, {
    encoding: 'utf-8'
});

console.log('2lakh dummy data is generating inn few sec....')
const startTime = Date.now();

// JSON Array Start
writeStream.write('[\n');

const totalRecords = 200000;

for (let i = 1; i <= totalRecords; i++) {

    const user = {
        userId: i,
        // name: `User Name ${i}`,
        name: i === 1 ? "Tisha (Updated Name)" : `User Name ${i}`,  //just for check data update working or not
        email: `user${i}@example.com`,
        city: i % 2 === 0 ? 'Surat' : 'Mumbai',
        age: Math.floor(Math.random() * 40) + 20
    };

    const isLast = i === totalRecords;

    writeStream.write(
        JSON.stringify(user, null, 2) + (isLast ? '\n' : ',\n')
    );

    if (i % 50000 === 0) {
        console.log(`⏳ ${i} records written...`);
    }
}

// JSON Array End
writeStream.write(']');
writeStream.end();

writeStream.on('finish', () => {
    const totalTime = (Date.now() - startTime) / 1000;

    console.log('\n✅ MAGIC! users_data.json is created');
    console.log(`⏱️ Time Taken: ${totalTime} seconds`);
    console.log(`📁 File Location: ${filePath}`);
});

