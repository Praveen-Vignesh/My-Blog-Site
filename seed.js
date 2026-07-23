const { Client } = require("pg");
const bcrypt = require("bcrypt");
require("dotenv").config();

const hashPassword = async (rawPassword) => {
    const saltRounds = 12;

    try{
        return await bcrypt.hash(rawPassword, saltRounds);
    }
    catch (error){
        console.error("Cryptographic hashing failed:", error);
        throw error;
    }
};

const connectToDatabase = async () => {
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT
    });

    try{
        await client.connect();
        console.log("Connected to database successfully");
        return client;

    }catch (error){
        console.log('Database connection failed:', error);
        throw error;
    }
};


const executeSeeding = async () => {
    
    if (!process.env.ADMIN_PASSWORD) {
        console.error("Missing ADMIN_PASSWORD in environment variables.");
        process.exit(1);
    }

    let client;
    
    try {
        client = await connectToDatabase();
        const hashedPassword = await hashPassword(process.env.ADMIN_PASSWORD);

        const insertQuery = `
            INSERT INTO users (username, password_hash) 
            VALUES ($1, $2) 
            RETURNING id, username, created_at;
        `;

        const result = await client.query(insertQuery, ['Praveen', hashedPassword]);
        
        console.log("\nAdmin user successfully seeded:");
        console.log(result.rows[0]);

    } catch (error) {
        console.error("Seeding script failed:", error);
    } finally {

        if (client) {
            await client.end();
            console.log("\nDatabase connection closed.");
        }
    }
};

executeSeeding();