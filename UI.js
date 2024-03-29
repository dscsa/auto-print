
function onOpen() {
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .createMenu('Printing')
      .addItem('Refresh Printers', 'refreshPrinters')
      .addItem('Reauthorize', 'reauthorize')
      .addToUi();
}

function reauthorize() {
  var url  = getCloudPrintService().getAuthorizationUrl();
  var html = HtmlService.createHtmlOutput('To reauthorize, please copy and paste this URL into your browser<br><br>'+url) //.setSandboxMode(HtmlService.SandboxMode.IFRAME).show()
  SpreadsheetApp.getActiveSpreadsheet().show(html);
}

function refreshPrinters() {

  try{
    var printerList = getPrinterList()
    var printers = printerList.printers
  } catch(e){
    throw new Error("You must reauthorize print@sirum.org in the Printing Menu")
  }

  Logger.log(JSON.stringify(printerList, null, ' '))

  var values = printers.map(function(printer) { return [printer.displayName || printer.name, printer.id, printer.connectionStatus] })
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Printers").getRange(4, 1, values.length, 3).setValues(values)
}


//onEdit simple trigger runs as current user and has limited permissions.  We need to set up a real onEdit trigger
//https://stackoverflow.com/questions/13732976/script-triggered-onedit-runs-into-permissions-error-when-trying-to-edit-protecte
function newJobTrigger(e) {

  var range = e.range;
  var sheet = range.getSheet()

  if(sheet.getName() == "Jobs"){

    if(range.getColumn() == 1){ //When adding a job add dropdowns, when deleting remove dropdowns

      var valid_printer   = null
      var valid_tray      = null
      var valid_duplex    = null
      var valid_frequency = null

      if(typeof e.value == "string") {
        var printer_range = SpreadsheetApp.getActive().getSheetByName('Printers').getRange('A2:A');
        valid_printer     = SpreadsheetApp.newDataValidation().requireValueInRange(printer_range).build();
        valid_tray        = SpreadsheetApp.newDataValidation().requireValueInList(["MP Tray", "Tray1", "Tray2", "Tray3"],true).build();
        valid_duplex      = SpreadsheetApp.newDataValidation().requireValueInList(["Yes", "No"],true).build();
        valid_frequency   = SpreadsheetApp.newDataValidation().requireValueInList(["1 min","30 min","1 hr","12am","1am","2am","3am","4am","5am","6am","7am","8am","9am","9:30am","10am","10:30am","11am","11:30am","12pm","12:30pm","1pm","1:30pm","2pm","2:30pm","3pm","3:30pm","4pm","4:30pm","5pm","5:30pm","6pm","6:30pm","7pm","8pm","9pm","10pm","11pm","Monday","Tuesday","Wednesday","Thursday","Friday"],true).build();
      }

      //var columnOrder = {jobName:0, folderId:1, printerName:2, tray:3, isDuplex:4, frequency:5, printerId:6}
      range.offset(0, columnOrder.printerName).setDataValidation(valid_printer)
      range.offset(0, columnOrder.tray).setDataValidation(valid_tray)
      range.offset(0, columnOrder.isDuplex).setDataValidation(valid_duplex)
      range.offset(0, columnOrder.frequency).setDataValidation(valid_frequency)

    } else if(range.getColumn() == 2){//then check we have access to the entered folder

      //if it passed access test, or it was deleting the cell, then clear out
      range.setBackground("white")
      range.getCell(1,1).setComment("")

      if(typeof e.value != "string") return ///Weird but when value deleted, e.value == {"oldValue":...} rather than falsey. So we need a typeof check


    }
  }
}
