# Auto Print

Google Apps Script microservice for printing documents via PrintNode and sending faxes via SFax

---

## Development Environment Setup

Code is pulled using clasp which requires nodeJS to be installed

1. Install clasp globally
    ```zsh
    npm i -g @google/clasp
    ```

2. Clone this repo
    ```zsh
    git clone git@github.com:dscsa/auto-print.git
    cd auto-print
    ```

3. Login to clasp. This should open a browser tab prompting auth via Google
    ```zsh
    clasp login
    ```

4. Pull down the latest changes to make sure everything is in sync. If this is the first time you have pulled changes this will also fetch the `Keys.js` file
    ```zsh
    clasp pull
    ```

For more information on using clasp, see https://developers.google.com/apps-script/guides/clasp

---

## Production Deployment Details

This project is deployed under the `print@sirum.org` account (details in LastPass). The Apps Script console can be accessed https://script.google.com

- The Google Sheet is: `AutoPrintFax_v2`
- Code/deployment setup: `Extenstions > Apps Script`

A trigger is set up to calls the `autoPrint()` function every minute. This is pointed at HEAD, so to deploy code changes we just need to push changes via clasp

```zsh
clasp push   
```
