const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const syllabusData = [
    {
        unit_number: 1,
        unit_name: 'Introduction to Algorithm',
        lecture_count: 8,
        topics: [
            'Definition',
            'Role of Algorithm in computing',
            'Performance analysis: space and time complexity',
            'Asymptotic notation and complexity issues',
            'Analysis of Algorithm: Insertion sort and bubble sort',
            'Recurrence: The Master Method'
        ]
    },
    {
        unit_number: 2,
        unit_name: 'Divide and Conquer',
        lecture_count: 8,
        topics: [
            'General strategy, analysis',
            'Merge sort',
            'Quick Sort',
            'Binary Search- Analysis of algorithm',
            'Hiring Problem',
            'Indicator Random variable Problem',
            'Randomized algorithms'
        ]
    },
    {
        unit_number: 3,
        unit_name: 'Backtracking and Branch and Bound',
        lecture_count: 9,
        topics: [
            'Backtracking: Introduction and Analysis',
            'N Queens Problem',
            'graph coloring Problem',
            'Branch and Bound: General Strategy and analysis',
            'Traveling salesman\'s problem',
            'knapsack problem',
            'Single Source Shortest Path in directed acyclic Graph'
        ]
    },
    {
        unit_number: 4,
        unit_name: 'Greedy Algorithm and Dynamic Programming',
        lecture_count: 9,
        topics: [
            'Greedy Algorithms: General strategy, analysis',
            'Huffman Code',
            'Job sequencing',
            'optimal merge patterns',
            'Dynamic Programming: Elements of dynamic programming',
            'Multistage graph',
            'Traveling salesman problem',
            '0/1 Knapsack Problem',
            'Optimal Binary Search Tree'
        ]
    },
    {
        unit_number: 5,
        unit_name: 'Classification of problems',
        lecture_count: 8,
        topics: [
            'Non-deterministic algorithm',
            'Satisfiability Problem',
            'P, NP-Hard and NP-complete class with example',
            'NP-Hard problems: code generation Problems',
            'Approximation algorithm for NP-hard problems',
            'Parallel Sorting Networks: The zero-one Principle',
            'Parallel Merging Networks',
            'Improved Sorting Networks'
        ]
    }
];

const seedDAASyllabus = async () => {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // 1. Ensure "Design and Analysis of Algorithms" subject exists
        console.log('Checking for DAA subject...');
        let [subjects] = await connection.query(
            'SELECT id FROM subjects WHERE subject_name LIKE ? OR subject_code = ?',
            ['%Design and Analysis of Algorithm%', 'CS401']
        );

        let subjectId;
        if (subjects.length === 0) {
            console.log('DAA subject not found. Creating it...');
            const [result] = await connection.query(
                'INSERT INTO subjects (subject_code, subject_name, department, semester) VALUES (?, ?, ?, ?)',
                ['CS401', 'Design and Analysis of Algorithm', 'Computer Engineering', 6]
            );
            subjectId = result.insertId;
        } else {
            subjectId = subjects[0].id;
            console.log('DAA subject found.');
        }
        console.log(`Using subject ID: ${subjectId}`);

        // Check if new schema tables exist
        const [tables] = await connection.query("SHOW TABLES LIKE 'syllabus_units'");
        if (tables.length === 0) {
            console.error('New syllabus tables (syllabus_units) not found. Please run migrate_syllabus_v2.js first.');
            process.exit(1);
        }

        // 2. Clear existing syllabus for this subject in the NEW schema
        console.log('Clearing existing syllabus data...');
        const [units] = await connection.query('SELECT id FROM syllabus_units WHERE subject_id = ?', [subjectId]);
        const unitIds = units.map(u => u.id);
        
        if (unitIds.length > 0) {
            await connection.query('DELETE FROM syllabus_topics WHERE unit_id IN (?)', [unitIds]);
            await connection.query('DELETE FROM syllabus_units WHERE subject_id = ?', [subjectId]);
        }

        // 3. Insert Units and Topics
        for (const unit of syllabusData) {
            console.log(`Inserting Unit ${unit.unit_number}: ${unit.unit_name}...`);
            const [unitResult] = await connection.query(
                'INSERT INTO syllabus_units (subject_id, unit_number, unit_name, total_lectures) VALUES (?, ?, ?, ?)',
                [subjectId, unit.unit_number, unit.unit_name, unit.lecture_count]
            );
            const unitId = unitResult.insertId;

            for (const topic of unit.topics) {
                await connection.query(
                    'INSERT INTO syllabus_topics (unit_id, topic_name, lecture_count) VALUES (?, ?, ?)',
                    [unitId, topic, 1]
                );
            }
        }

        console.log('Design and Analysis of Algorithms syllabus seeded successfully!');
    } catch (error) {
        console.error('Error seeding DAA syllabus:', error);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
};

seedDAASyllabus();
