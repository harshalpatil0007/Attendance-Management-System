const mysql = require('mysql2/promise');
require('dotenv').config();

async function normalize() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('--- Normalizing Departments to 7 Standard Names ---');
        
        const tables = ['timetables', 'students', 'teachers'];
        
        const mappings = [
            { 
                newName: 'Computer Engineering', 
                oldNames: ['Computer Science', 'CSE', 'IT', 'Information Technology'] 
            },
            { 
                newName: 'Electronics & Telecommunications Engg.', 
                oldNames: ['ETC', 'Electronics', 'Electronics (ETC)'] 
            },
            { 
                newName: 'Mechanical Engineering', 
                oldNames: ['MECH', 'Mechanical', 'Mechanical (MECH)'] 
            },
            { 
                newName: 'Civil Engineering', 
                oldNames: ['Civil'] 
            },
            { 
                newName: 'Chemical Engineering', 
                oldNames: ['Chemical'] 
            },
            { 
                newName: 'Electrical Engineering', 
                oldNames: ['Electrical'] 
            },
            { 
                newName: 'First Year Engineering', 
                oldNames: ['FE', 'First Year'] 
            }
        ];

        for (const mapping of mappings) {
            for (const table of tables) {
                const [res] = await pool.query(
                    `UPDATE ${table} SET department = ? WHERE department IN (?) OR department = ?`,
                    [mapping.newName, mapping.oldNames, mapping.newName]
                );
                if (res.affectedRows > 0) {
                    console.log(`Updated ${table} -> ${mapping.newName}: ${res.affectedRows} rows.`);
                }
            }
        }

        console.log('\n--- Final Verification ---');
        for (const table of tables) {
            const [rows] = await pool.query(`SELECT DISTINCT department FROM ${table}`);
            console.log(`${table} departments:`, rows.map(r => r.department));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

normalize();
