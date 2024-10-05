const RATINGS_SHEET_NAME = "v1.1 (do przetestowania, ale ogolnie git)";
const LOG_OR_NOT_ANALYTICS = true;

const RACE_COLOR_TRANSLATION = {
  "#00ff00": "Night Elf",
  "#9900ff": "Undead",
  "#ff0000": "Orc",
  "#0000ff": "Human"
};

function logging(message) {
  if (LOG_OR_NOT_ANALYTICS) {
    console.log(message);
  }
}

function MAIN() {
  logging("Starting MAIN function");

  // Get the active spreadsheet and the specified sheet
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(RATINGS_SHEET_NAME);

  if (!sheet) {
    logging("Error: '" + RATINGS_SHEET_NAME + "' sheet not found.");
    return;
  }

  // Read and interpret tables
  var initialRankings = readInitialRankings(sheet);
  var matchResults = readMatchResults(sheet);
  var currentRankings = readCurrentRankings(sheet);

  // Log the results
  logging("Initial Rankings:");
  logging(JSON.stringify(initialRankings, null, 2));

  logging("Match Results:");
  logging(JSON.stringify(matchResults, null, 2));

  logging("Current Rankings:");
  logging(JSON.stringify(currentRankings, null, 2));
  
  // Output race winrates to the Analytics sheet
  outputRaceWinrates(spreadsheet, matchResults);

  createPlayerRatingHistory(spreadsheet, initialRankings, matchResults);

  logging("MAIN function completed");
}

function readInitialRankings(sheet) {
  var lastRow = sheet.getLastRow();
  var range = sheet.getRange("A2:B" + lastRow);
  var values = range.getValues();

  return values.filter(row => row[0] !== "" && row[1] !== "")
    .map(row => ({
      player: row[0],
      initialRating: row[1]
    }));
}

function readMatchResults(sheet) {
  var lastRow = sheet.getLastRow();
  var range = sheet.getRange("E2:L" + lastRow);
  var values = range.getValues();
  var backgrounds = range.getBackgrounds();

  return values.filter((row, index) => row[1] !== "" && row[2] !== "" && row[4] !== "")
    .map((row, index) => {
      const result = {
        mapName: row[0],
        kFactor: row[1],
        player1: row[2],
        player1Score: row[3],
        player2Score: row[4],
        player2: row[5],
        player1Race: RACE_COLOR_TRANSLATION[backgrounds[index][2]] || "Unknown",
        player2Race: RACE_COLOR_TRANSLATION[backgrounds[index][5]] || "Unknown",
        player1NewRating: row[6],
        player2NewRating: row[7]
      };
      
      // Log K and L columns
      logging(`Match ${index + 1}: Player1 New Rating (K): ${row[6]}, Player2 New Rating (L): ${row[7]}`);
      
      return result;
    });
}

function readCurrentRankings(sheet) {
  var lastRow = sheet.getLastRow();
  var range = sheet.getRange("O2:P" + lastRow);
  var values = range.getValues();

  return values.filter(row => row[0] !== "" && row[1] !== "")
    .map(row => ({
      player: row[0],
      currentRating: row[1]
    }));
}

function getPeakRating() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var ratingsSheet = spreadsheet.getSheetByName(RATINGS_SHEET_NAME);
  
  if (!ratingsSheet) {
    logging("Error: '" + RATINGS_SHEET_NAME + "' sheet not found.");
    return;
  }
  
  var peakRatingRange = ratingsSheet.getRange("T2");
  var peakRating = peakRatingRange.getValue();
  
  logging("Peak Rating: " + peakRating);
  
  return peakRating;
}

// You can add more functions here, such as updateEloRatings, etc.

// Function to run the script
function runScript() {
  MAIN();
}

function outputRaceWinrates(spreadsheet, matchResults) {
  const ANALYTICS_SHEET_NAME = "Analytics";
  let analyticsSheet = spreadsheet.getSheetByName(ANALYTICS_SHEET_NAME);
  
  if (!analyticsSheet) {
    analyticsSheet = spreadsheet.insertSheet(ANALYTICS_SHEET_NAME);
    logging("Created new Analytics sheet");
  }

  // Initialize race statistics
  const raceStats = {
    "Night Elf": { wins: 0, games: 0 },
    "Undead": { wins: 0, games: 0 },
    "Orc": { wins: 0, games: 0 },
    "Human": { wins: 0, games: 0 }
  };

  // Process match results
  matchResults.forEach(match => {
    raceStats[match.player1Race].games++;
    raceStats[match.player2Race].games++;
    if (match.player1Score > match.player2Score) {
      raceStats[match.player1Race].wins++;
    } else if (match.player2Score > match.player1Score) {
      raceStats[match.player2Race].wins++;
    }
  });

  // Calculate winrates
  const raceWinrates = Object.entries(raceStats).map(([race, stats]) => {
    const winrate = stats.games > 0 ? (stats.wins / stats.games * 100).toFixed(2) : "0.00";
    return [race, `${winrate}%`, stats.games];
  });

  // Output winrates to analytics sheet
  analyticsSheet.getRange("A1").setValue("Race");
  analyticsSheet.getRange("B1").setValue("Winrate");
  analyticsSheet.getRange("C1").setValue("Games Played");
  
  const outputRange = analyticsSheet.getRange(2, 1, raceWinrates.length, 3);
  outputRange.setValues(raceWinrates);
  
  logging("Race winrates written to Analytics sheet");

  // Output race matchup winrates
  const raceMatchupWinrates = analyzeRaceMatchups(matchResults);
  analyticsSheet.getRange("E1").setValue("Race 1");
  analyticsSheet.getRange("F1").setValue("Race 2");
  analyticsSheet.getRange("G1").setValue("Winrate");
  analyticsSheet.getRange("H1").setValue("Games Played");
  
  const matchupOutputRange = analyticsSheet.getRange(2, 5, raceMatchupWinrates.length, 4);
  matchupOutputRange.setValues(raceMatchupWinrates);
  
  logging("Race matchup winrates written to Analytics sheet");
}

function analyzeRaceMatchups(matchResults) {
  const matchups = {};
  const races = ["Night Elf", "Undead", "Orc", "Human"];

  // Initialize matchups
  for (let race1 of races) {
    matchups[race1] = {};
    for (let race2 of races) {
      if (race1 !== race2) {
        matchups[race1][race2] = { wins: 0, games: 0 };
      }
    }
  }

  // Process match results
  matchResults.forEach(match => {
    const race1 = match.player1Race;
    const race2 = match.player2Race;
    if (race1 !== race2) {
      matchups[race1][race2].games++;
      matchups[race2][race1].games++;
      if (match.player1Score > match.player2Score) {
        matchups[race1][race2].wins++;
      } else if (match.player2Score > match.player1Score) {
        matchups[race2][race1].wins++;
      }
    }
  });

  // Calculate winrates
  const raceMatchupWinrates = [];
  for (let race1 of races) {
    for (let race2 of races) {
      if (race1 !== race2) {
        const { wins, games } = matchups[race1][race2];
        const winrate = games > 0 ? (wins / games * 100).toFixed(2) : "0.00";
        raceMatchupWinrates.push([race1, race2, `${winrate}%`, games]);
      }
    }
  }

  return raceMatchupWinrates;
}

function createPlayerRatingHistory(spreadsheet, initialRankings, matchResults) {
  const sheet = spreadsheet.getActiveSheet();
  const players = initialRankings.map(ranking => ranking.player);
  const numMatches = matchResults.length;

  // Clear the range and set headers
  const startColumn = 40; // Column AN
  const headerRange = sheet.getRange(1, startColumn, 1, players.length + 1);
  headerRange.clearContent();
  headerRange.getCell(1, 1).setValue("");
  players.forEach((player, index) => {
    headerRange.getCell(1, index + 2).setValue(player);
  });

  // Set row numbers and initialize player ratings
  let playerRatings = {};
  initialRankings.forEach(ranking => {
    playerRatings[ranking.player] = ranking.initialRating;
  });

  for (let i = 0; i < numMatches + 1; i++) {
    const rowNumber = i + 2;
    const rowRange = sheet.getRange(rowNumber, startColumn, 1, players.length + 1);
    rowRange.getCell(1, 1).setValue(i + 1);

    if (i < numMatches) {
      const match = matchResults[i];
      if (playerRatings[match.player1] !== undefined) {
        playerRatings[match.player1] = match.player1NewRating;
      }
      if (playerRatings[match.player2] !== undefined) {
        playerRatings[match.player2] = match.player2NewRating;
      }
    }

    players.forEach((player, index) => {
      rowRange.getCell(1, index + 2).setValue(playerRatings[player]);
    });
  }

  logging("Player rating history table created");
}

/*

Google Sheets Warcraft III Analytics Script

Overview:
This script analyzes Warcraft III match data from a Google Sheets document, calculating race winrates and outputting the results to an "Analytics" sheet.

Sheet Structure:
1. Main Sheet (named "v1.1 (do przetestowania, ale ogolnie git)"):
   - Initial Rankings: Columns A:B
   - Match Results: Columns E:J
   - Current Rankings: Columns O:P
   - Highest Rated Player: Columns S:T

2. Analytics Sheet (created by the script if not present):
   - Race Winrates: Columns A:D (now includes average rating change)
   - Race Matchup Winrates: Columns F:I

Functions:

1. MAIN()
   Entry point of the script. Reads data from the main sheet and calls other functions for analysis.

2. readInitialRankings(sheet)
   Reads initial player rankings from columns A:B.

3. readMatchResults(sheet)
   Reads match results from columns E:J, including player races based on cell background colors.

4. readCurrentRankings(sheet)
   Reads current player rankings from columns O:P.

5. outputRaceWinrates(spreadsheet, matchResults)
   Calculates and outputs race winrates, games played, and average rating changes to the Analytics sheet.

6. getPeakRating()
   Retrieves the peak rating from cell T2 of the main sheet.

7. logging(message)
   Logs messages to the console if LOG_OR_NOT_ANALYTICS is true.

8. analyzeRaceMatchups(matchResults)
   Calculates winrates for each race matchup.

Race Color Coding:
The script uses the following color codes to determine player races:
- #00ff00: Night Elf
- #9900ff: Undead
- #ff0000: Orc
- #0000ff: Human

How to Use:
1. Open your Google Sheets document containing the Warcraft III match data.
2. Go to Extensions > Apps Script.
3. Copy and paste the script code into the Apps Script editor.
4. Save the script with a name of your choice.
5. Run the MAIN() function to execute the analysis.
6. Check the newly created "Analytics" sheet for race winrate and matchup data.

Notes:
- Ensure that the main sheet is named correctly and that data is in the expected columns.
- The script will create a new "Analytics" sheet if it doesn't exist.
- Make sure cell background colors are set correctly for accurate race determination.
- The highest rated player ever recorded and their rating are now stored in columns S and T of the main sheet.

Output in Analytics Sheet:
- Columns A:D: Overall race winrates, games played, and average rating changes
- Columns F:I: Race matchup winrates

This script provides comprehensive analytics for Warcraft III matches, including individual race performance, specific matchup statistics, and average rating changes for each race.

*/