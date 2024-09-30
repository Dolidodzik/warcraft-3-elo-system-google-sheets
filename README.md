/*

# Totally not ai genreated code and docs!

## google sheets apps script, chatgpt generated description below

## dziala_spoko-old - older version, that works without some features, disposable

## warcraft_google_sheets_script - main, current version

=============



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
        Location: M:N
        Header:
            M1: "Player"
            N1: "Updated Rating"
        Output:
            Starting from M2, with player names and their updated ratings populated based on processed match results.

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
        This output is written to the range M2:N, dynamically adjusting to the number of players.

    Setting Headers:
        The headers for the output table are set in M1 and N1 to indicate "Player" and "Updated Rating," respectively.

        ===============+

        How to Use

    Open your Google Sheets document containing the player rankings and match results.
    Go to Extensions > Apps Script.
    Copy and paste the script code into the Apps Script editor.
    Save the script with a name of your choice.
    Close the Apps Script editor.
    Back in your Google Sheets, run the script by going to Extensions > Macros > [your script name].
    The updated ratings will be outputted in columns M and N.

Notes

    Ensure there are no empty rows within your initial rankings or match results, as this may affect the script's ability to read data correctly.
    The K-factor can vary for each match, allowing for different levels of impact on ratings based on match significance.
    The output table will overwrite any existing data starting from M2, so ensure that space is available before running the script.

This documentation should provide a comprehensive guide for anyone using the script, including how it functions and how to set it up in Google Sheets. You can easily copy this text into a .txt file for future reference. If you have any further questions or need more adjustments, feel free to ask!

*/
