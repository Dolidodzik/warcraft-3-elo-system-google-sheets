var LOG_OR_NOT = true;

function logging(message) {
  if (LOG_OR_NOT) {
    console.log(message);
  }
}

function updateEloRatings() {
  logging("Starting updateEloRatings function");

  // Get the active sheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  logging("Active sheet retrieved: " + sheet.getName());
  
  // Initialize variables for tracking highest rated player
  var highestRatedPlayer = "";
  var highestRating = 0;

  // Get the initial rankings dynamically (starting from A2:B and expanding to all filled rows)
  var lastRow = sheet.getLastRow(); // Get the last row with data on the sheet
  logging("Last row with data: " + lastRow);

  var rankingRange = sheet.getRange("A2:B" + lastRow);
  var rankings = rankingRange.getValues();
  logging("Initial rankings retrieved: " + JSON.stringify(rankings));

  // Filter out any rows that are empty (this handles dynamic range)
  rankings = rankings.filter(function(row) {
    return row[0] !== "" && row[1] !== "";
  });
  logging("Filtered rankings: " + JSON.stringify(rankings));

  // Get match results dynamically (starting from E2:J and expanding to all filled rows)
  var matchRange = sheet.getRange("E2:J" + lastRow);
  var matches = matchRange.getValues();
  logging("Initial match results retrieved: " + JSON.stringify(matches));

  // Filter out any rows that are empty (this handles dynamic range)
  matches = matches.filter(function(row) {
    return row[1] !== "" && row[2] !== "" && row[4] !== "";  // Ensure K-factor, Player 1, and Player 2 are not empty
  });
  logging("Filtered match results: " + JSON.stringify(matches));

  // Create a dictionary to map player names to their ratings
  var playerRatings = {};
  for (var i = 0; i < rankings.length; i++) {
    var playerName = rankings[i][0];
    var playerRating = rankings[i][1];
    playerRatings[playerName] = playerRating;
    logging("Added player to ratings: " + playerName + " - " + playerRating);

    // Check if this player has the highest initial rating
    if (playerRating > highestRating) {
      highestRatedPlayer = playerName;
      highestRating = playerRating;
    }
  }
  logging("Initial player ratings: " + JSON.stringify(playerRatings));
  logging("Initial highest rated player: " + highestRatedPlayer + " with rating: " + highestRating);

  // Function to calculate expected score
  function expectedScore(ratingA, ratingB) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 600));
  }

  // Loop over all matches and update player ratings
  for (var j = 0; j < matches.length; j++) {
    logging("========================================================");
    logging("Processing match " + (j + 1) + " of " + matches.length);

    var K = matches[j][1];         // K-factor from column F
    var player1 = matches[j][2];    // Player 1 from column G
    var score1 = matches[j][3];     // Player 1 score from column H
    var score2 = matches[j][4];     // Player 2 score from column I
    var player2 = matches[j][5];    // Player 2 from column J

    logging("Match details:");
    logging("K-factor: " + K);
    logging("Player 1: " + player1);
    logging("Player 1 Score: " + score1);
    logging("Player 2: " + player2);
    logging("Player 2 Score: " + score2);

    // Get current ratings of both players
    var rating1 = playerRatings[player1];
    var rating2 = playerRatings[player2];
    logging("Current ratings - " + player1 + ": " + rating1 + ", " + player2 + ": " + rating2);

    // Calculate expected scores
    var expected1 = expectedScore(rating1, rating2);
    var expected2 = expectedScore(rating2, rating1);
    logging("Expected scores - " + player1 + ": " + expected1 + ", " + player2 + ": " + expected2);

    // Calculate actual results
    var result1 = score1 > score2 ? 1 : score1 < score2 ? 0 : 0.5;
    var result2 = score2 > score1 ? 1 : score2 < score1 ? 0 : 0.5;
    logging("Actual results - " + player1 + ": " + result1 + ", " + player2 + ": " + result2);

    // Update the player ratings
    var newRating1 = rating1 + K * (result1 - expected1);
    var newRating2 = rating2 + K * (result2 - expected2);
    logging("New ratings (before rounding) - " + player1 + ": " + newRating1 + ", " + player2 + ": " + newRating2);

    // Save the updated ratings, rounding to the nearest integer
    playerRatings[player1] = Math.round(newRating1);
    playerRatings[player2] = Math.round(newRating2);
    logging("Updated ratings - " + player1 + ": " + playerRatings[player1] + ", " + player2 + ": " + playerRatings[player2]);

    // Write the new ratings to columns K and L
    sheet.getRange(j + 2, 11).setValue(playerRatings[player1]); // Column K
    sheet.getRange(j + 2, 12).setValue(playerRatings[player2]); // Column L

    // Check if either player has achieved a new highest rating
    if (playerRatings[player1] > highestRating) {
      highestRatedPlayer = player1;
      highestRating = playerRatings[player1];
    }
    if (playerRatings[player2] > highestRating) {
      highestRatedPlayer = player2;
      highestRating = playerRatings[player2];
    }
  }

  logging("========================================================");
  logging("All matches processed. Final player ratings: " + JSON.stringify(playerRatings));
  logging("Highest rated player ever recorded: " + highestRatedPlayer + " with rating: " + highestRating);

  // Prepare output table starting from M2:N2
  var output = [];
  for (var k = 0; k < rankings.length; k++) {
    var playerName = rankings[k][0];
    var newRating = playerRatings[playerName];  // Get the updated rating for the player
    output.push([playerName, newRating]);       // Push the player and updated rating to output array
    logging("Prepared output for " + playerName + ": " + newRating);
  }
  logging("Prepared output table (unsorted): " + JSON.stringify(output));

  // Sort the output array in descending order based on the rating
  output.sort(function(a, b) {
    return b[1] - a[1];
  });
  logging("Sorted output table: " + JSON.stringify(output));

  // Write the new table to M2:N (dynamically handles how many rows are needed)
  var outputRange = sheet.getRange(2, 15, output.length, 2); // Start at O2 (15th column is O, P is 16th)
  outputRange.setValues(output);
  logging("Sorted output table written to sheet, starting at O2");

  // Write header at M1:N1
  sheet.getRange("O1").setValue("Nick");
  sheet.getRange("P1").setValue("Aktualny ranking");
  logging("Headers written to O1 and P1");

  // Write headers and data for highest rated player
  sheet.getRange("S1").setValue("Highest rated player ever recorded");
  sheet.getRange("T1").setValue("Highest rating ever recorded");
  sheet.getRange("S2").setValue(highestRatedPlayer);
  sheet.getRange("T2").setValue(highestRating);
  logging("Highest rated player information written to S1:T2");

  logging("updateEloRatings function completed");
}

/*

Google Sheets ELO Rating Update Script Documentation
Overview

This Google Apps Script is designed to automate the calculation of ELO ratings for a group of players based on match results. The script processes match results, updating player ratings progressively rather than resetting to initial ratings for each match.
Expected Table Locations

    Initial Rankings Table
        Location: A:B
        Header:
            A1: "Player"
            B1: "Initial Rating"
        Data:
            Starting from A2 down to the last row with player data (e.g., A2: "Kacperek", B2: "1500").

    Match Results Table
        Location: E:J
        Header:
            E1: "Map Name"
            F1: "K Factor"
            G1: "Player 1"
            H1: "Player 1 Score"
            I1: "Player 2 Score"
            J1: "Player 2"
        Data:
            Starting from E2 down to the last row with match data (e.g., E2: "Wyspy Echa", F2: "15", G2: "Kacperek", H2: "0", I2: "1", J2: "Leśnik").

    Updated Ratings Output Table
        Location: O:P
        Header:
            O1: "Player"
            P1: "Updated Rating"
        Output:
            Starting from O2, with player names and their updated ratings populated based on processed match results.

    Highest Rated Player Output
        Location: S:T
        Header:
            S1: "Highest rated player ever recorded"
            T1: "Highest rating ever recorded"
        Data:
            S2: Name of the player with the highest rating ever recorded
            T2: The highest rating ever recorded

Script Functionality
How the Script Works

    Initialization:
        The script accesses the active Google Sheets document and retrieves the last row with data to define dynamic ranges for both initial rankings and match results.

    Reading Initial Rankings:
        The script reads player names and their initial ratings from the range A2:B, filtering out any empty rows.

    Reading Match Results:
        The script reads match results from the range E2:J, filtering out rows that do not contain relevant match data (i.e., ensuring that the K-factor and player names are present).

    Calculating Ratings:
        A dictionary (playerRatings) is created to map player names to their ratings.
        For each match, the script:
            Retrieves the K-factor.
            Retrieves the player names and their scores.
            Calculates the expected scores for both players using the formula:
            Expected Score(A)=11+10(Rating(B)−Rating(A))/400
            Expected Score(A)=1+10(Rating(B)−Rating(A))/4001​
            Determines the actual match results (win, loss, or draw).
            Updates the players' ratings based on their scores and the K-factor:
            New Rating(A)=Rating(A)+K×(Result(A)−Expected Score(A))
            New Rating(A)=Rating(A)+K×(Result(A)−Expected Score(A))
            The new ratings are rounded to the nearest integer and stored in the dictionary.

    Outputting Updated Ratings:
        After processing all matches, the script prepares an output array containing player names and their updated ratings.
        This output is written to the range O2:P, dynamically adjusting to the number of players.

    Setting Headers:
        The headers for the output table are set in O1 and P1 to indicate "Player" and "Updated Rating," respectively.

    Tracking Highest Rated Player:
        The script initializes variables to track the highest rated player and their rating.
        During the initial player ratings setup and throughout the match processing loop, 
        it continuously updates these variables if a higher rating is encountered.
        After processing all matches, it outputs the name of the player with the highest 
        rating ever recorded and their rating to cells S2 and T2, respectively.

        ===============+

        How to Use

    Open your Google Sheets document containing the player rankings and match results.
    Go to Extensions > Apps Script.
    Copy and paste the script code into the Apps Script editor.
    Save the script with a name of your choice.
    Close the Apps Script editor.
    Back in your Google Sheets, run the script by going to Extensions > Macros > [your script name].
    The updated ratings will be outputted in columns O and P.
    The highest rated player ever recorded and their rating will be outputted in columns S and T.

Notes

    Ensure there are no empty rows within your initial rankings or match results, as this may affect the script's ability to read data correctly.
    The K-factor can vary for each match, allowing for different levels of impact on ratings based on match significance.
    The output table will overwrite any existing data starting from O2, so ensure that space is available before running the script.
    The highest rated player tracking considers both initial ratings and ratings achieved during match calculations.

This documentation should provide a comprehensive guide for anyone using the script, including how it functions and how to set it up in Google Sheets. You can easily copy this text into a .txt file for future reference. If you have any further questions or need more adjustments, feel free to ask!

*/