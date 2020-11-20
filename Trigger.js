var columnOrder = {jobName:0, folderId:1, printerName:2, tray:3, isDuplex:4, frequency:5, printerId:6, destination:7}
var scriptId  = new Date() //A unique id per script run
var mainCache = CacheService.getScriptCache();
var cacheMins = 30

function testJob1() {
  autoPrint(1)
}
function testJob2() {
  autoPrint(2)
}
function testJob3() {
  autoPrint(3)
}
function testJob4() {
  autoPrint(4)
}
function testJob5() {
  autoPrint(5)
}
function testJob6() {
  autoPrint(6)
}

function autoPrint(trigger_override) {

  var lock = LockService.getScriptLock();

  var errors = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Errors")

  if ( ! lock.tryLock(1000)) {
    var err = 'Autoprint is already running!'
    //logError('autoPrint Error', err, errors)
    return
  }

  //Boiler plate setup
  var jobs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Jobs").getDataRange().getValues()

  //Try to process each job
  for(var j = 1; j < jobs.length; j++){

    var jobName     = jobs[j][columnOrder.jobName].toString().trim()
    var folderId    = jobs[j][columnOrder.folderId].toString().trim()
    var tray        = jobs[j][columnOrder.tray].toString().trim()
    var isDuplex    = jobs[j][columnOrder.isDuplex].toString().trim() == "Yes" ? "LONG_EDGE" : "NO_DUPLEX"
    var frequency   = jobs[j][columnOrder.frequency].toString().trim()
    var printerId   = jobs[j][columnOrder.printerId].toString().trim()
    var destination = jobs[j][columnOrder.destination].toString().trim()

    if ( ! printerId.length || ! folderId.length)
      continue

    var today     = new Date()
    var override  = trigger_override === j
    var triggered =  typeof trigger_override == 'object' ? isTriggered(frequency) : override

    Logger.log('isTriggered: '+jobName+' frequency:'+frequency+' day:'+today.getDay()+' hours:'+today.getHours()+' mins:'+today.getMinutes()+' j:'+j+' triggered:'+triggered+' trigger_override:'+JSON.stringify(trigger_override)+' job:'+JSON.stringify(jobs[j]))

    try{ //to handle each job
      var folder  = DriveApp.getFolderById(folderId)
      var printed = folder.getFoldersByName("Printed")
      var faxed   = folder.getFoldersByName("Faxed")

      if (printed.hasNext())
        var completed = printed.next()
      else if (faxed.hasNext())
        var completed = faxed.next()
      else
        return logError(jobName, 'Does not have a printed or faxed folder', errors)

      var iterator = folder.getFiles()
      var files    = []

      //then actually process the files
      while(iterator.hasNext())
        files.push(iterator.next())

      //For now default files to be sorted by name
      files.sort(function(a, b) {
        var aName = a.getName()
        var bName = b.getName()

        if (aName < bName) return -1
        if (aName > bName) return 1
      })

      //then actually process the files
      for(i in files){

        var fileId = files[i].getId()

        Logger.log(['DEBUG autoPrint', files[i].getName(), 'Original Script', mainCache.get(fileId), 'This Script', scriptId.toJSON()])

        if ( ! override && mainCache.get(fileId)) {
          Logger.log(['Duplicate File Printing with '+cacheMins+' mins', [files[i].getName(), fileId, 'Original Script', mainCache.get(fileId), 'This Script', scriptId.toJSON()], errors])
          continue
        }

        if ( ! override) mainCache.put(fileId, scriptId.toJSON(), cacheMins*60)

        Logger.log([fileId, printerId, files[i].getName(), tray, isDuplex]);

        // Check to see if the description includes a printed date
        // If it does, skip the printing and just let it get moved.
        // If it doesn't, Add a printed date and move forward.
        var fileDesc = files[i].getDescription() || '';
        if (!files[i].isStarred()) {

            fileDesc += "{printed:" + Date.now() + "}";
            files[i].setDescription(fileDesc);
            files[i].setStarred(true);

            // If the file was sucessfully moved, then we are ready to print it.
            if (printerId.slice(0,4) == 'sfax') {
              faxDoc(fileId, printerId, files[i].getName(), tray, isDuplex);
            } else if(destination == 'printnode') {
              printDocViaPrintnode(fileId, printerId, files[i].getName(), tray, isDuplex);
            } else {
              printDoc(fileId, printerId, files[i].getName(), tray, isDuplex);
            }

            Logger.log("Printing - " + fileId +  ", DESC - " + fileDesc);

        } else {
            Logger.log(
                [
                    "Duplicate print attempted",
                    fileId
                ]
            );
        }

        try {
          files[i].moveTo(completed);
          files[i].setStarred(false);
        } catch (e) {
          var message = 'Printing Error ERROR Folder Move '+files[i].getName()+': '+folder.getName()+' -> '+completed.getName()+' '+e.message+' '+e.stack
          var permissions = ' Active User '+Session.getActiveUser().getEmail()+' Effective User '+Session.getEffectiveUser().getEmail()+' File Owner '+files[i].getOwner().getEmail()
          Logger.log([message, permissions]);
          MailApp.sendEmail("tech@sirum.org", "Printing Error", message+permissions);
        }
      }

    } catch(e){
      Logger.log(['DEBUG AutoPrint Error', e, e.stack])
      if (fileId) mainCache.remove(fileId)
      logError(jobName, e, errors)
    }
  }

  try { //Error: "There are too many LockService operations against the same script." at #Main:79 (updateShopping),	at #Main:17 (triggerShopping)
    lock.releaseLock()
    Logger.log('Autoprint Completed')
  } catch (e) {}
}

// Frquency is from dropdown of [1 min,30 min,1 hr,12am,1am,2am,3am,4am,5am,6am,
// 7am,8am,9am,10am,11am,12pm,1pm,2pm,3pm,4pm,5pm,6pm,7pm,8pm,10pm,11pm,Monday,
// Tuesday,Wednesday,Thursday,Friday]
function isTriggered(frequency){

  if(frequency.length == 0) return false //they need to specify something

  var today    = new Date()
  var fullHour = today.getMinutes() == 0  || today.getMinutes() == 1
  var halfHour = today.getMinutes() == 30 || today.getMinutes() == 31

  if(frequency == "1 min") //were running a trigger like that anyway, so just use it
    return true

  if (frequency == "30 min")
    return halfHour || fullHour

  if (frequency == "1 hr")
    return fullHour

  if(frequency.indexOf("am") > -1 || frequency.indexOf("pm") > -1) //if it's a daily trigger, check if it's that time
    return ( ~ frequency.indexOf(":30") ? halfHour : fullHour) && today.getHours() == getTwentyFourFormat(frequency)

  //then it's a weekly schedule, need to check if it's today & confirm it's runtime
  var numbered_day = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].indexOf(frequency) //this'll match the javascript way of labelling time
  return fullHour && today.getHours() == 9 && today.getDay() == numbered_day    //its the right day, hour, and either 0/1 minutes i, //arbitrarily determined, but just run all the weekly triggers at 9AM on the day in question
}

function getTwentyFourFormat(twelveHourFormat){
  var add = twelveHourFormat.indexOf("pm") > -1 ? 12: 0
  return parseInt(twelveHourFormat.replace("12","0").replace(/(a|p)m/g,"")) + add //if its midnight of noon, set it to zero, and remove the pm/am. We'll add 12 if it's pm
}

function logError(job, msg, error_sheet){
  var time_stamp = Utilities.formatDate(new Date(), "GMT-05:00", "MM/dd/yyyy HH:mm:ss")
  if (error_sheet && error_sheet.appendRow) error_sheet.appendRow([job,msg, time_stamp])
  if (msg.stack) msg = msg.name+' '+msg.message+' '+msg.stack //this is an error and JSON.stringify won't work well
  MailApp.sendEmail("tech@sirum.org", "Printing Error", "There was an error on printing job: " + JSON.stringify(job) + "\n\nError Message: " + JSON.stringify(msg)) //TODO: change this to info@sirum.org
}
