const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Read and parse the JSON file
const data = fs.readFileSync(path.join(__dirname, '2023-07-14.json')); // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ UPDATE ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
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
const julyScores = calculateScore(742, 755) // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ UPDATE ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const juneScores = calculateScore(712, 725);
const mayScores = calculateScore(681, 694);
const aprilScores = calculateScore(651, 664);
const marchScores = calculateScore(620, 633);
const februaryScores = calculateScore(592, 605);

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

const hallOfFame = [
    {
        Month: "July",
        Year: 2023,
        Winners: getMonthlyWinner(julyScores)
    },
    {
        Month: "June",
        Year: 2023,
        Winners: getMonthlyWinner(juneScores)
    },
    {
        Month: "May",
        Year: 2023,
        Winners: getMonthlyWinner(mayScores)
    },
    {
        Month: "April",
        Year: 2023,
        Winners: getMonthlyWinner(aprilScores)
    },
    {
        Month: "March",
        Year: 2023,
        Winners: getMonthlyWinner(marchScores)
    },
    {
        Month: "February",
        Year: 2023,
        Winners: getMonthlyWinner(februaryScores)
    }
];

const updateDate = "14"; // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ UPDATE ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.get('/api', (req, res) => {
    res.send(masterOutput);
})

app.get('/api/hall-of-fame', (req, res) => {
    // res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.send(hallOfFame);
})

app.get('/api/scores/currentMonth', (req, res) => {
    // res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.send({ lastUpdate: updateDate, scores: julyScores });
});

app.get('/api/scores/2023/06', (req, res) => {
    // res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.send({ scores: juneScores });
});

app.get('/api/scores/2023/05', (req, res) => {
    // res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.send(mayScores);
});

app.get('/api/scores/2023/04', (req, res) => {
    // res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.send(aprilScores);
});

app.get('/api/scores/2023/03', (req, res) => {
    // res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.send(marchScores);
});

app.get('/api/scores/2023/02', (req, res) => {
    // res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.send(februaryScores);
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
