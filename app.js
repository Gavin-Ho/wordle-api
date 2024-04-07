const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Read and parse the JSON file
const data = fs.readFileSync(path.join(__dirname, '2024-04-05.json')); // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ UPDATE TO LATEST JSON FILE ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const updateDate = "05"; // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ UPDATE TO LAST UPDATED DATE ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const json = JSON.parse(data);

// Create an object to store the participants and all their wordle scores
const masterOutput = {};

// Iterate over the messages array
json.messages.forEach(message => {
    const content = message.content;

    if (content) {
        const matches = content.match(/Wordle (\d+) (\d\/\d)/g);

        if (matches) {
            const senderName = message.sender_name;
            if (!masterOutput[senderName]) {
                masterOutput[senderName] = [];
            }
            masterOutput[senderName].unshift(content);
        }
    }
});

// Calculate each participant's monthly score given the starting and ending Wordle Puzzle dates
function calculateScore(startDate, endDate) {
    const monthlyScore = {};
    // Iterate over the participants in the output object
    for (const participant in masterOutput) {
        const messages = masterOutput[participant];
        let score = 0;
        let daysPlayed = 0;

        const wordleNumbers = []

        // Iterate over the messages of the participant
        messages.forEach(message => {
            const matches = message.match(/Wordle (\d+) (\d\/\d)/);
            if (matches) {
                const wordleNumber = parseInt(matches[1], 10);
                const found = wordleNumbers.includes(wordleNumber);
                const scoreOutOfSix = parseInt(matches[2].split('/')[0], 10);
                if (wordleNumber >= startDate && wordleNumber <= endDate && !found) {
                    wordleNumbers.push(wordleNumber);
                    score += scoreOutOfSix;
                    daysPlayed += 1;
                }
            }
        });
        while (daysPlayed <= (endDate - startDate)) {
            score += 7;
            daysPlayed += 1;
        }
        monthlyScore[participant] = score;
    }
    // Sort the participants based on scores in ascending order
    const sortedEntries = Object.entries(monthlyScore).sort((a, b) => a[1] - b[1]);

    // Convert the sorted entries back to an object
    const sortedMonthlyScore = {};
    sortedEntries.forEach(([participant, score]) => {
        sortedMonthlyScore[participant] = score;
    });

    return sortedMonthlyScore;
}


// Create an object to store the monthly scores for each participant
const monthlyScores = {
    'April2024': calculateScore(1017,1021), // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ UPDATE TO LAST INCLUDED WORDLE NUMBER ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    'March2024': calculateScore(986, 999), 
    'February2024': calculateScore(957, 985),
    'January2024': calculateScore(926, 939),
    'December2023': calculateScore(895, 908), 
    'November2023': calculateScore(865, 878),
    'October2023': calculateScore(834, 847),
    'September2023': calculateScore(804, 817),
    'August2023': calculateScore(773, 786),
    'July2023': calculateScore(742, 755),
    'June2023': calculateScore(712, 725),
    'May2023': calculateScore(681, 694),
    'April2023': calculateScore(651, 664),
    'March2023': calculateScore(620, 633),
    'February2023': calculateScore(592, 605),
};

// Output an object with all the past winners
function getMonthlyWinner(monthlyScore) {
    const lowestScore = Math.min(...Object.values(monthlyScore));
    // Filter participants with the lowest score
    const allWinners = {};
    for (const [participant, score] of Object.entries(monthlyScore)) {
        if (score === lowestScore) {
            allWinners[participant] = Math.round((score / 14) * 100) / 100;
        }
    }
    return allWinners;
}


// Create an array of past winners to display in the hall of fame
const hallOfFame = [];

let isFirstEntry = true;

for (const monthYear in monthlyScores) {
    if (isFirstEntry) {
        isFirstEntry = false;
        continue; // Skip the current month for the hall of fame
    }

    const match = /([A-Za-z]+)(\d+)/.exec(monthYear);
    if (match) {
        const month = match[1];
        const year = match[2];
        hallOfFame.push({
            Month: month,
            Year: parseInt(year),
            Winners: getMonthlyWinner(monthlyScores[monthYear])
        });
    }
}

app.get('/api', (req, res) => {
    res.send(masterOutput);
})

app.get('/api/hall-of-fame', (req, res) => {
    res.send(hallOfFame);
})

app.get('/api/scores/currentMonth', (req, res) => {
    res.send({ lastUpdate: updateDate, scores: monthlyScores[Object.keys(monthlyScores)[0]] });
});

// Loop through each month's scores and create API endpoints
for (const monthYear in monthlyScores) {
    app.get(`/api/scores/${monthYear}`, (req, res) => {
        res.send({ scores: monthlyScores[monthYear] });
    });
}

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
