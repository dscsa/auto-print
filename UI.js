
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
    printers = getPrinterList()
  } catch(e){
    throw new Error("You must reauthorize print@sirum.org in the Printing Menu")
  }

  var values = printers.map(function(printer) { return [printer.name, printer.id, printer.connectionStatus] })
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Printers").getRange(2, 1, values.length, 3).setValues(values)
}


//onEdit simple trigger runs as current user and has limited permissions.  We need to set up a real onEdit trigger
//https://stackoverflow.com/questions/13732976/script-triggered-onedit-runs-into-permissions-error-when-trying-to-edit-protecte
function newJobTrigger(e) {

  var range = e.range;
  var sheet = range.getSheet()

  if(sheet.getName() == "Jobs"){

    if(range.getColumn() == 1){ //When adding a job add dropdowns, when deleting remove dropdowns

      var valid_printer = null
      var valid_duplex  = null
      var valid_timing  = null

      if(typeof e.value == "string") {
        var printer_range = SpreadsheetApp.getActive().getSheetByName('Printers').getRange('A2:A');
        valid_printer = SpreadsheetApp.newDataValidation().requireValueInRange(printer_range).build();
        valid_duplex  = SpreadsheetApp.newDataValidation().requireValueInList(["Yes", "No"],true).build();
        valid_timing  = SpreadsheetApp.newDataValidation().requireValueInList(["1 min","30 min","1 hr","12am","1am","2am","3am","4am","5am","6am","7am","8am","9am","9:30am","10am","10:30am","11am","11:30am","12pm","12:30pm","1pm","1:30pm","2pm","2:30pm","3pm","3:30pm","4pm","4:30pm","5pm","5:30pm","6pm","6:30pm","7pm","8pm","9pm","10pm","11pm","Monday","Tuesday","Wednesday","Thursday","Friday"],true).build();                                                                      
      }

      range.offset(0, 2).setDataValidation(valid_printer)
      range.offset(0, 3).setDataValidation(valid_duplex)
      range.offset(0, 4).setDataValidation(valid_timing)

    } else if(range.getColumn() == 2){//then check we have access to the entered folder

      //if it passed access test, or it was deleting the cell, then clear out
      range.setBackground("white")
      range.getCell(1,1).setComment("")

      if(typeof e.value != "string") return ///Weird but when value deleted, e.value == {"oldValue":...} rather than falsey. So we need a typeof check

      try{
        var parent  = DriveApp.getFolderById(e.value) //make sure we can access the folder to print
        var printed = parent.getFoldersByName("Printed")
        if( ! printed.hasNext()){
          throw new Error("There is no 'Printed' folder in the job folder with name: " + parent.getName() + ". There needs to be a 'Printed' folder to move finished files")
        }

      } catch(e) { //will throw error if folder doesnt work or printer@ doesn't have access, so catch and highlight cell
        range.setBackground("pink")
        range.getCell(1,1).setComment("Please check this folder exists and is shared with print@sirum.org "+JSON.stringify(e))
      }

    }
  }
}
