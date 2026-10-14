const fs = require('fs');

console.log("🚀 2 Lakh records generate hona shuru ho rahe hain...");
const startTime = Date.now();

// Stream ka use kar rahe hain taaki memory full na ho aur process crash na kare
const writeStream = fs.createWriteStream('users_data.json');

writeStream.write('[\n');

for (let i = 1; i <= 200000; i++) {
    const user = {
        userId: i,
        name: `User_${i}`,
        email: `user${i}@example.com`,
        city: ["Delhi", "Mumbai", "Surat", "Bangalore"][i % 4],
        age: 18 + (i % 43),
        tags: ["tech,coding", "music,travel", "cooking,sports"][i % 3],
        createdAt: "2026-05-20T10:00:00Z" // Standard ISO Date format for MongoDB TTL
    };
    
    if (i === 200000) {
        writeStream.write(JSON.stringify(user) + '\n');
    } else {
        writeStream.write(JSON.stringify(user) + ',\n');
    }
}

writeStream.write(']');
writeStream.end();

writeStream.on('finish', () => {
    const endTime = Date.now();
    console.log(`✅ Success! 'users_data.json' file taiyar hai.`);
    console.log(`⏱️ Data generation mein laga samay: ${(endTime - startTime) / 1000} seconds.`);
});