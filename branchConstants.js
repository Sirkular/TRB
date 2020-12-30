// File containing global constants
DEV_MODE = (typeof process.env.DEV_MODE === 'undefined') ? true : (process.env.DEV_MODE == 'true');

CHARACTERS_SHEET = 'Characters';
PLAYERS_SHEET = 'Players';
TIMELINE_SHEET = 'Timeline';
LOGS_SHEET = 'Logs';

SPREADSHEET_ID = '1cbxNvmAEqEGeHtaf09ZaWV3YF9Rmz2F6vayabfYWyf4';
CHARACTERS_SHEET_ID = '0';
PLAYERS_SHEET_ID = '1510652814';
TIMELINE_SHEET_ID = '415116931';
LOGS_SHEET_ID = '1031156454';

if (DEV_MODE) {
  SPREADSHEET_ID = '1Kktm8CFEy3llqVl7hLl74jwDGUfp61nGunWycjROpjY';
  CHARACTERS_SHEET_ID = '0';
  PLAYERS_SHEET_ID = '1539755835';
  TIMELINE_SHEET_ID = '916293335';
  LOGS_SHEET_ID = '1456876918';
}
