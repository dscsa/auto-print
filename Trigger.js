function autoPrint() {

  var lock = LockService.getScriptLock();

  if ( ! lock.tryLock(1000)) {
    var err = 'Refresh Shopping Sheet is already running!'
    logError('autoPrint Error', err)
    return
  }

  //Boiler plate setup
  var jobs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Jobs").getDataRange().getValues()
  var errors = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Errors")

  //Try to process each job
  for(var j = 1; j < jobs.length; j++){

    var jobName   = jobs[j][0].toString().trim()
    var folderId  = jobs[j][1].toString().trim()
    var printerId = jobs[j][5].toString().trim()
    var frequency = jobs[j][4].toString().trim()
    var isDuplex  = jobs[j][3].toString().trim() == "Yes" ? "LONG_EDGE" : "NO_DUPLEX"

    if ( ! printerId.length || ! folderId.length || ! isTriggered(frequency))
      continue

    try{ //to handle each job

      var folder  = DriveApp.getFolderById(folderId)
      var printed = folder.getFoldersByName("Printed").next()

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
        printDoc(files[i].getId(), printerId, files[i].getName(), isDuplex)
        printed.addFile(files[i]);//move to the completed folder
        folder.removeFile(files[i]); //when after printDoc we seemed to be getting duplicate prints. maybe putting ahead will give it "more time to process"?
      }

    } catch(e){
      logError(jobName, e, errors)
    }
  }

  try { //Error: "There are too many LockService operations against the same script." at #Main:79 (updateShopping),	at #Main:17 (triggerShopping)
    lock.releaseLock()
    Logger.log('Autoprint Completed')
  } catch (e) {}
}

//Frquency is from dropdown of [1 min,30 min,1 hr,12am,1am,2am,3am,4am,5am,6am,7am,8am,9am,10am,11am,12pm,1pm,2pm,3pm,4pm,5pm,6pm,7pm,8pm,10pm,11pm,Monday,Tuesday,Wednesday,Thursday,Friday]
function isTriggered(frequency){

  if(frequency.length == 0) return false //they need to specify something

  var today    = new Date()
  var fullHour = today.getMinutes() == 0  || today.getMinutes() == 1
  var halfHour = today.getMinutes() == 30 || today.getMinutes() == 31

  Logger.log('isTriggered: '+today.getDay()+' '+today.getHours()+' '+today.getMinutes())

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

function logError(job,msg, error_sheet){
  var time_stamp = Utilities.formatDate(new Date(), "GMT-05:00", "MM/dd/yyyy HH:mm:ss")
  error_sheet.appendRow([job,msg, time_stamp])
  MailApp.sendEmail("adam@sirum.org", "Printing Error", "There was an error on printing job: " + job + "\n\nError Message: " + msg) //TODO: change this to info@sirum.org
}
