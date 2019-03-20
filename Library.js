function logPrinterList(){
  
  //https://developers.google.com/cloud-print/docs/appInterfaces#printer
  var logger = {}
  var Authorization = 'Bearer ' + getCloudPrintService().getAccessToken()
  var printers = getPrinterList().printers
  for (var i in printers) {
    //Logger.log(JSON.stringify(printers[i], null, " "))
    Logger.log('https://www.google.com/cloudprint/printer/'+printers[i].id)
    
    var printer = UrlFetchApp.fetch('https://www.google.com/cloudprint/printer', {
      method: "POST",
      payload: { printerid:printers[i].id},
      headers: {
        Authorization:Authorization
      },
      "muteHttpExceptions": true
    }).getContentText()
    
    logger[printers[i].displayName] = JSON.parse(printer).printers[0];
  }
  
  Logger.log(JSON.stringify(logger, null, " "))
    
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

  return JSON.parse(response);
}

/*{
       "height_microns": 297000,  //WORKS FOR TRAY
       "vendor_id": "9",
       "name": "ISO_A4",
       "width_microns": 210000,
       "custom_display_name": "A4"
      },
      {
       "height_microns": 279400,  //WORKS FOR TRAY
       "vendor_id": "1",
       "name": "NA_LETTER",
       "width_microns": 215900,
       "custom_display_name": "Letter",
       "is_default": true
      },
      {
       "height_microns": 355600,   //WORKS FOR TRAY
       "vendor_id": "5",
       "name": "NA_LEGAL",
       "width_microns": 215900,
       "custom_display_name": "Legal"
      },
      {
       "height_microns": 266700,   //WORKS FOR TRAY
       "vendor_id": "7",
       "name": "NA_EXECUTIVE",
       "width_microns": 184100,
       "custom_display_name": "Executive"
      },
      {
       "height_microns": 210000,   //WORKS FOR TRAY
       "vendor_id": "11",
       "name": "ISO_A5",
       "width_microns": 148000,
       "custom_display_name": "A5"
      },
      {
       "height_microns": 148000,
       "vendor_id": "70",
       "name": "ISO_A6",
       "width_microns": 105000,
       "custom_display_name": "A6"
      },
      {
       "height_microns": 250000,
       "vendor_id": "34",
       "name": "ISO_B5",
       "width_microns": 176000,
       "custom_display_name": "B5"
      },
      {
       "height_microns": 241300,
       "vendor_id": "20",
       "name": "NA_NUMBER_10",
       "width_microns": 104700,
       "custom_display_name": "Com-10"
      },
      {
       "height_microns": 220000,
       "vendor_id": "27",
       "name": "ISO_DL",
       "width_microns": 110000,
       "custom_display_name": "DL"
      },
      {
       "height_microns": 229000,
       "vendor_id": "28",
       "name": "ISO_C5",
       "width_microns": 162000,
       "custom_display_name": "C5"
      },
      {
       "height_microns": 190500,
       "vendor_id": "37",
       "name": "NA_MONARCH",
       "width_microns": 98400,
       "custom_display_name": "Monarch"
      },
      {
       "height_microns": 127000,
       "vendor_id": "261",
       "name": "NA_INDEX_3X5",
       "width_microns": 76200,
       "custom_display_name": "3 x 5"
      },
      {
       "height_microns": 330200,  //WORKS FOR TRAY
       "vendor_id": "14",
       "name": "JIS_EXEC",
       "width_microns": 215900,
       "custom_display_name": "Folio"
      },
      {
       "height_microns": 339800, //WORKS FOR TRAY
       "vendor_id": "309",
       "width_microns": 215900,
       "custom_display_name": "Mexico Legal"
      },
      {
       "height_microns": 345000, //WORKS FOR TRAY
       "vendor_id": "310",
       "width_microns": 215000,
       "custom_display_name": "India Legal"
      },
      {
       "height_microns": 420000,
       "vendor_id": "8",
       "name": "ISO_A3",
       "width_microns": 297000,
       "custom_display_name": "A3"
      },
      {
       "height_microns": 431800,
       "vendor_id": "3",
       "name": "NA_LEDGER",
       "width_microns": 279400,
       "custom_display_name": "Ledger"
      },
      {
       "height_microns": 127000,
       "vendor_id": "256",
       "width_microns": 69800,
       "custom_display_name": "User Defined"
      }
      */

//var ticket = "{\"version\":\"1.0\",\"print\":{\"color\":{\"vendor_id\":\"1\",\"type\":1},\"duplex\":{\"type\":0},\"page_orientation\":{\"type\":"0"},\"copies\":{\"copies\": "2"},\"fit_to_page\":{\"type\":3},\"page_range\":{\"interval\":[{\"start\": "1",\"end\":"2"}]},\"media_size\":{\"width_microns\":210000,\"height_microns\":297000,\"is_continuous_feed\":false,\"vendor_id\":\"9\"},\"collate\":{\"collate\":false},\"reverse_order\":{\"reverse_order\":false}}}";
function testA4() {
  
  printerID = "d436bc70-30d3-ebd0-fb5e-7d6b8b057152"
  docID     = "1Nke03Y7LphrWa6aHkkmLn_yh83n4Gwxh"
  docName   = "DonationLabel"
  
  /* //Brother Trays can only 9, 5, 7, 11, 14, 309, 310
      { //A4
       "height_microns": 297000,  //WORKS FOR TRAY
       "vendor_id": "9",
       "width_microns": 210000,
      },
      { //Letter
       "height_microns": 279400,  //WORKS FOR TRAY
       "vendor_id": "1",
       "width_microns": 215900,
      },
      { //A5
       "height_microns": 210000,   //WORKS FOR TRAY
       "vendor_id": "11",
       "width_microns": 148000,
      }*/
  
  var ticket = {
    version: "1.0",
    print: {
      color: {
        type: "STANDARD_MONOCHROME", //STANDARD_COLOR
        vendor_id: "Color"
      },
      media_size: { //A4
       "height_microns": 297000,  //WORKS FOR TRAY
       "vendor_id": "9",
       "width_microns": 210000,
      },
      //page_orientation:{type:1},
      margins: {
        top_microns:0,
        bottom_microns:0,
        left_microns:0,
        right_microns:0
      },
      fit_to_page: {
        type:"NO_FITTING"
      },
      duplex: {
        type: "NO_DUPLEX"
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
  
  /*fit_to_page
    NO_FITTING = 0;
    FIT_TO_PAGE = 1;
    GROW_TO_PAGE = 2;
    SHRINK_TO_PAGE = 3;
    FILL_PAGE = 4;
  */

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