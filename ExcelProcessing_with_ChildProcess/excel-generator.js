import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateHugeExcel() {
    console.log('Generating 2 Lakh Excel rows... Please wait...');
    const startTime = Date.now();

    // Ek naya Workbook aur Worksheet create 
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Customers');

    // Exact Columns Set Karo (Jo hamare Child Process ko chahiye)
    worksheet.columns = [
        { header: 'customerId', key: 'customerId', width: 15 },
        { header: 'name', key: 'name', width: 20 },
        { header: 'email', key: 'email', width: 25 },
        { header: 'company', key: 'company', width: 20 },
        { header: 'phone', key: 'phone', width: 15 }
    ];

    // Loop chalakar 2 Lakh data rows array mein daalo
    const totalRecords = 200000;
    
    // Performance optimization ke liye hum data ko chunks mein add karenge
    for (let i = 1; i <= totalRecords; i++) {
        worksheet.addRow({
            customerId: i,
            name: `User Name ${i}`,
            email: `user${i}@example.com`,
            company: `Company ${i}`,
            phone: `${9000000000 + i}`
        });

        // Har 50k rows par console lock dikhao progress ke liye
        if (i % 50000 === 0) {
            console.log(`Generated ${i} rows...`);
        }
    }

    // File ko save karo
    const outputPath = path.join(__dirname, 'customers.xlsx');
    await workbook.xlsx.writeFile(outputPath);

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`BOOM! 2 Lakh Excel records successfully generated in ${totalTime} seconds!`);
    console.log(`File saved at: ${outputPath}`);
}

generateHugeExcel().catch(err => console.error('Error generating excel:', err));