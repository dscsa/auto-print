function testPrintNodeDuplex() {
    printDocViaPrintnode(
        '1nt3xCn9Oe3fMA3c4_OWlm2uCabVBwAahYsnDVQn8Wl0',
        69858230,
        'Test Print',
        '',
        'LONG_EDGE')
}

function testPrintNode() {
    printDocViaPrintnode(
        '1nt3xCn9Oe3fMA3c4_OWlm2uCabVBwAahYsnDVQn8Wl0',
        69858230,
        'Test Print',
        '',
        '')
}

function testPrintNodeTray() {
    printDocViaPrintnode(
        '1nt3xCn9Oe3fMA3c4_OWlm2uCabVBwAahYsnDVQn8Wl0',
        69858230,
        'Test Print',
        'Tray1',
        '')
}


function printDocViaPrintnode(docID, printerID, docName, tray, isDuplex) {
  var printNodeKey = 'B6oLrXliojBEbKJXPg7iuJoqQwMKUgDp0z9VDv1U8Is';
  var doc          = DriveApp.getFileById(docID);
  var pdf          = Utilities.base64Encode(doc.getAs('application/pdf').getBytes());
  var payload      = {
                        "printerId": printerID,
                        "title": docName,
                        "contentType": "pdf_base64",
                        "content": pdf,
                        "source": "auto-print",
                        "options": {
                            "duplex":"one-sided"
                        }
                     };

  if (tray) {
      payload.options.bin = tray;
  }

  if (isDuplex == 'LONG_EDGE') {
      payload.options.duplex = 'long-edge';
  } else if (isDuplex == 'SHORT_EDGE') {
      payload.options.duplex = 'short-edge';
  }

  var response = UrlFetchApp.fetch('https://api.printnode.com/printjobs', {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers: {
      Authorization: "Basic " + Utilities.base64Encode(printNodeKey + ":")
    },
    "muteHttpExceptions": true
  });

  // Just changing whats in the content so we don't overload the logs
  payload.content = 'BASE64_DATA';

  Logger.log(['PrintNode Request', response, JSON.stringify(payload)]);

  if (response.length <= 0) {
      Logger.log(['printDoc ERROR.  Printnode failed to created a job', 'payload', JSON.stringify(payload)]);
      throw new Error('printDoc ERROR.  Printnode failed to created a job');
  }
}
