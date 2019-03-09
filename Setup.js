//First-Time Set up Instructions
//0 - Set up accompanying spreadsheet with following sheets
      //'Memory', with three columns 'Document Name,	Document ID,	Date Printed'
      //'System', with two columns 'Folder_ID,	Printer_ID'
//1 - Copy these three code pages into your script sheet
//2 - Publish > Deploy as Web App
//3 - Resources > Libraries > Add Oauth2 Library w/ code: 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF
//4 - Resources > Cloud Project Platform > Menu (top-left three lines) > API & Services > Credentials > Create credentials (web app)
//5 - Set the redirect URL of the credentials you just created to https://script.google.com/macros/d/SCRIPT_ID/usercallback where you find SCRIPT_ID in File > Project Properties
//6 - On Cloud Project Platform, copy the clientID and clientSecret into lines 23-24 below

//ADAM: Adding New Users should only Require these
//7a - Login as the correct google user
//7  - run showURL, navigate to that url, grant permissions
//8  - run getPrinterList(), View logs, pick printer(s) and copy their ID(s) into autoPrinting.gs
//9  - Edit > Current Project Triggers > Add a trigger for autoPrint function to run every five minutes

function getCloudPrintService() {
  return OAuth2.createService('print')
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
    .setTokenUrl('https://accounts.google.com/o/oauth2/token')
    .setClientId(CLIENT_ID) 
    .setClientSecret(CLIENT_SECRET)
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope('https://www.googleapis.com/auth/cloudprint')
    .setParam('login_hint', 'print@sirum.org')
    .setParam('access_type', 'offline')
    .setParam('approval_prompt', 'force');
}

function authCallback(request) {
  var isAuthorized = getCloudPrintService().handleCallback(request);
  var html = HtmlService.createHtmlOutput(isAuthorized ? 'You can now use Google Cloud Print from Apps Script.' : 'Cloud Print Error: Access Denied');
  SpreadsheetApp.getActiveSpreadsheet().show(html);
  return html //not sure if this is necessary but Omar had it
}