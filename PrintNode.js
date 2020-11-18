function printDocViaPrintnode(docID, printerID, docName, tray, isDuplex) {
  var printNodeKey = 'B6oLrXliojBEbKJXPg7iuJoqQwMKUgDp0z9VDv1U8Is';
  var doc          = DriveApp.getFileById(docID);
  var pdf          = Utilities.base64Encode(doc.getAs('application/pdf').getBytes());
  var payload      = {
                        "printerId": printerID,
                        "title": docName,
                        "contentType": "pdf_base64",
                        "content": pdf,
                        "source": "auto-print"
                     };
  var options      = {};

  if (tray) {
      options.bin = tray;
  }

  if (isDuplex == 'LONG_EDGE') {
      options.duplex = 'long-edge';
  } else if (isDuplex == 'SHORT_EDGE') {
      options.duplex = 'short-edge';
  }

  if (Object.keys(options).length > 0) {
      payload.options = options;
  }

  var response = UrlFetchApp.fetch('https://api.printnode.com/printjobs', {
    method: "POST",
    payload: payload,
    headers: {
      Authorization: "Basic " + Utilities.base64Encode(printNodeKey + ":")
    },
    "muteHttpExceptions": true
  });

  // Just changing whats in the content so we don't overload the logs
  payload.content = 'BASE64_DATA';

  Logger.log(['PrintNode Request', response, payload]);

  if (response.length <= 0) {
      Logger.log(['printDoc ERROR.  Printnode failed to created a job', 'payload', payload]);
      throw new Error('printDoc ERROR.  Printnode failed to created a job');
  }
}
