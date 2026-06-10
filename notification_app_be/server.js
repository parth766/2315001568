const express = require('express');
const cors = require('cors');
const loggingMiddleware = require('logging_middleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(loggingMiddleware);
app.use(express.json());

// Mock Data mimicking standard upstream campus notification models
const mockNotifications = [
    { ID: "d146095a-0d86-4a34-9e69-3900a14576bc", Type: "Result", Message: "mid-sem", Timestamp: "2026-04-22 17:51:30" },
    { ID: "b283218f-ea5a-4b7c-93a9-1f2f240d64b0", Type: "Placement", Message: "CSX Corporation hiring", Timestamp: "2026-04-22 17:51:18" },
    { ID: "81589ada-0ad3-4f77-9554-f52fb558e09d", Type: "Event", Message: "farewell", Timestamp: "2026-04-22 17:51:06" },
    { ID: "0005513a-142b-4bbc-8678-eefec65e1ede", Type: "Result", Message: "mid-sem", Timestamp: "2026-04-22 17:50:54" },
    { ID: "ea836726-c25e-4f21-a72f-544a6af8a37f", Type: "Result", Message: "project-review", Timestamp: "2026-04-22 17:50:42" },
    { ID: "003cb427-8fc6-47f7-bb00-be228f6b0d2c", Type: "Result", Message: "external", Timestamp: "2026-04-22 17:50:30" },
    { ID: "e5c4ff20-31bf-4d40-8f02-72fda59e8918", Type: "Result", Message: "project-review", Timestamp: "2026-04-22 17:50:18" },
    { ID: "1cfce5ee-ad37-4894-8946-d707627176a5", Type: "Event", Message: "tech-fest", Timestamp: "2026-04-22 17:50:06" },
    { ID: "cf2885a6-45ac-4ba0-b548-6e9e9d4c52c8", Type: "Result", Message: "project-review", Timestamp: "2026-04-22 17:49:54" },
    { ID: "8a7412bd-6065-4d09-8501-a37f11cc848b", Type: "Placement", Message: "Advanced Micro Devices Inc. hiring", Timestamp: "2026-04-22 17:49:42" }
];

const categoryWeights = {
    'Placement': 3,
    'Result': 2,
    'Event': 1
};

app.get('/api/notifications', (req, res) => {
    let { limit, page, notification_type } = req.query;
    
    let filteredData = [...mockNotifications];
    
    // Server-side filtering by "notification_type"
    if (notification_type) {
        filteredData = filteredData.filter(n => n.Type.toLowerCase() === notification_type.toLowerCase());
    }

    // MANDATORY PRIORITY INBOX LOGIC (Stage 1)
    // Sort items by Category Weight first in descending order.
    // If weights match, fallback to sorting by Timestamp recency in descending order.
    filteredData.sort((a, b) => {
        const weightA = categoryWeights[a.Type] || 0;
        const weightB = categoryWeights[b.Type] || 0;
        
        if (weightA !== weightB) {
            return weightB - weightA;
        }
        
        const timeA = new Date(a.Timestamp).getTime();
        const timeB = new Date(b.Timestamp).getTime();
        return timeB - timeA;
    });

    // Multi-criteria pagination via "page" and "limit"
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;
    const startIndex = (parsedPage - 1) * parsedLimit;
    const endIndex = parsedPage * parsedLimit;
    
    const paginatedData = filteredData.slice(startIndex, endIndex);

    res.json({
        total: filteredData.length,
        page: parsedPage,
        limit: parsedLimit,
        notifications: paginatedData
    });
});

app.listen(PORT, () => {
    console.log(`Backend REST API Utility Server running on port ${PORT}`);
});
