function logPrinterList(){
  Logger.log(getPrinterList())
}

function getPrinterList() {

  var response = UrlFetchApp.fetch('https://www.google.com/cloudprint/search', {
    headers: {
      Authorization: 'Bearer ' + getCloudPrintService().getAccessToken()
    },
    payload: {
      //'q' : '^recent',
      'use_cdd' : true
    },
    muteHttpExceptions: true
  }).getContentText();

  return JSON.parse(response).printers;
}


function printDoc(docID, printerID, docName, printType) {
  
  Logger.log('printDoc '+docID+' '+printerID+' '+docName+' '+printType)
  
  var ticket = {
    version: "1.0",
    print: {
      color: {
        type: "STANDARD_MONOCHROME", //STANDARD_COLOR
        vendor_id: "Color"
      },
      duplex: {
        type: printType
      }
    }
  };

  var payload = {
    "printerid" : printerID,
    "title"     : docName,
    "content"   : DriveApp.getFileById(docID).getBlob(),
    "contentType": "application/pdf",
    "ticket"    : JSON.stringify(ticket)
  };

  var response = UrlFetchApp.fetch('https://www.google.com/cloudprint/submit', {
    method: "POST",
    payload: payload,
    headers: {
      Authorization: 'Bearer ' + getCloudPrintService().getAccessToken()
    },
    "muteHttpExceptions": true
  });

  response = JSON.parse(response);

  if ( ! response.success) 
    throw new Error(JSON.stringify(response))
}