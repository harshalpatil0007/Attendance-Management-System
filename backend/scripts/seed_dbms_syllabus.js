const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const syllabusData = [
    {
        unit_number: 1,
        unit_name: 'Introduction to DBMS',
        lecture_count: 8,
        topics: [
            'Database-System Applications',
            'Purpose of Database Systems',
            'View of Data: Data Abstraction, Instances and Schemas, data independence',
            'Data Models: Relational, ER, Object-Based, Semistructured',
            'Database Languages',
            'Data Storage and Querying',
            'Transaction Management',
            'Database Architecture',
            'Database Users and Administrators',
            'Database Design and E-R Model: Overview',
            'Entity Sets, Relationship Sets, Attributes, Constraints',
            'ER Diagram: Basic Structure, Mapping Cardinality, Roles, Weak Entity sets',
            'Extended E-R Features: Specialization, Generalization, Attribute Inheritance, Constraints on Generalizations, Aggregation'
        ]
    },
    {
        unit_number: 2,
        unit_name: 'Formal Relational Query Languages',
        lecture_count: 8,
        topics: [
            'Relational Algebra: select, project, union, set-difference, Cartesian-product, rename',
            'Formal definition of Relational Algebra',
            'Additional Algebra Operations: set-intersection, natural-join, assignment, outer join',
            'Extended Relational-Algebra Operations: Generalized Projection, Aggregation',
            'Tuple Relational Calculus: Formal Definition, Example Queries',
            'Domain Relational Calculus: Formal Definition, Example'
        ]
    },
    {
        unit_number: 3,
        unit_name: 'Structured Query Language',
        lecture_count: 8,
        topics: [
            'Introduction to relational Model: structure, schema, keys, schema diagrams',
            'Overview of SQL Query Language',
            'SQL Data Definition',
            'Basic Structure of SQL Queries',
            'Additional Basic Operations',
            'Set Operations',
            'Null Values',
            'Aggregate Functions',
            'Nested Subqueries',
            'Modification of the Database',
            'Intermediate SQL: Joined Expressions (Join Conditions, Outer Joins)',
            'Views',
            'Integrity Constraints',
            'Functions and Procedures',
            'Triggers'
        ]
    },
    {
        unit_number: 4,
        unit_name: 'Storage strategies and Relational Database Design',
        lecture_count: 9,
        topics: [
            'Storage strategies - Indexing: Basic concepts, Ordered Indices',
            'B+ tree Index Files',
            'Features of Good Relational Designs',
            'Atomic Domains and First Normal Form',
            'Decomposition Using Functional Dependencies',
            'Keys and Functional Dependencies',
            'Boyce-Codd Normal Form (BCNF) and Dependency Preservation',
            'Third Normal Form (3NF)',
            'Decomposition Using Multivalued Dependencies',
            'Fourth Normal Form (4NF)'
        ]
    },
    {
        unit_number: 5,
        unit_name: 'Transaction Management and Architectures',
        lecture_count: 9,
        topics: [
            'Transaction Concept',
            'A simple Transaction Model',
            'Transaction Atomicity and Durability',
            'Concurrency Control: Lock-Based Protocols',
            'Locks, Granting of Locks',
            'The Two Phase Locking protocol',
            'Timestamp-Based Protocols: Timestamps, Timestamp-Ordering Protocol',
            'Recovery System: Failure Classification, Storage',
            'Recovery and Atomicity: Log records',
            'Database Modification, Concurrency Control and Recovery',
            'Transaction Commit',
            'Using the Log to Redo and Undo Transactions',
            'Database-System Architectures: Centralized and Client-Server',
            'Server System Architectures',
            'Parallel Systems, Parallel Database Architectures',
            'Distributed Systems'
        ]
    }
];

const seedSyllabus = async () => {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'yourpassword',
            database: process.env.DB_NAME || 'attendance_db'
        });

        // 1. Find DBMS subject
        console.log('Finding DBMS subject...');
        const [subjects] = await connection.query('SELECT id FROM subjects WHERE subject_code = ? OR subject_name LIKE ?', ['CSE302', '%DBMS%']);
        
        if (subjects.length === 0) {
            console.error('DBMS subject (CSE302) not found in database. Please seed subjects first.');
            process.exit(1);
        }

        const subjectId = subjects[0].id;
        console.log(`Found DBMS subject with ID: ${subjectId}`);

        // 2. Clear existing syllabus for this subject to avoid duplicates if re-run
        console.log('Clearing existing syllabus data for DBMS...');
        await connection.query('DELETE FROM syllabus_progress WHERE subject_id = ?', [subjectId]);

        // 3. Insert new syllabus data
        console.log('Inserting DBMS syllabus topics...');
        for (const unit of syllabusData) {
            console.log(`Inserting ${unit.unit_name} (Unit ${unit.unit_number})...`);
            for (const topic of unit.topics) {
                await connection.query(
                    'INSERT INTO syllabus_progress (subject_id, unit_number, unit_name, topic_name, lecture_count) VALUES (?, ?, ?, ?, ?)',
                    [subjectId, unit.unit_number, unit.unit_name, topic, 1] // Assigning 1 lecture count per topic for simplicity
                );
            }
        }

        console.log('DBMS syllabus seeded successfully!');
    } catch (error) {
        console.error('Error seeding syllabus:', error);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
};

seedSyllabus();
