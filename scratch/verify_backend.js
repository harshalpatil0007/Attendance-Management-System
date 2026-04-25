const axios = require('axios');

async function testEndpoints() {
    try {
        console.log("Checking backend server at http://localhost:5000...");
        const res = await axios.get('http://localhost:5000/api/attendance/subjects');
        console.log("Subjects Endpoint: Success (Note: may return 401 if not logged in, but server is UP)");
    } catch (err) {
        if (err.response) {
            console.log(`Subjects Endpoint: Received ${err.response.status} (Server is UP)`);
        } else {
            console.log("Subjects Endpoint: FAILED (Server is DOWN)");
        }
    }
}

testEndpoints();
