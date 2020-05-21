function faxDoc(docID, printerID, docName, tray, isDuplex) {

  Logger.log(['faxDoc Start', docID, printerID, docName, tray, isDuplex])

  var fax  = DriveApp.getFileById(docID)
  var from = printerID.slice(5) //If invalid to send (back) to the From address
  var to   = fax.getName()

  to = formatPhone(to) || from //If invalid to send (back) to the From address

  //logError('faxDoc to', [to, docID, docName])

  try {
    var blob = toFaxFormat(fax)
  } catch (e) {
    logError('Conversion to Fax Format failed, retrying',  [to, fax.getName(), fax.getUrl()])
    Utilities.sleep(2000)
    var blob = toFaxFormat(fax)
  }

  var res = sendSFax(from, to, blob) //(faxTo, pdf)

  if ( ! res || ! res.isSuccess) {
    logError('Fax Out Failed', ['isSuccess', res.isSuccess, 'to', to, fax.getName(), fax.getUrl(), 'res', res])
    throw new Error(JSON.stringify(res))
  }
}

function formatPhone(phone) {
  phone = phone.match(/(\d\d\d[.\-) ]*\d\d\d[.\- ]*\d\d\d\d)/)

  if ( ! phone) return ''

  phone = phone[0].replace(/\D/g, '')

  if (phone.length != 10) return ''

  return phone
}

function toFaxFormat(fax) {
  //var pdf = fax.getAs(MimeType.PDF) //SFax Help Ticket: This stopped working on Nov 18th 2019 because Google's Skia PDF library added "rasterization" into that sfax couldn't parse
  //Instead of PDF we have to be a little hacky and use a docx instead
  var url  = 'https://docs.google.com/feeds/download/documents/export/Export?id='+fax.getId()+'&exportFormat=docx'
  Logger.log(['toFaxFormat', url])
  var docx = UrlFetchApp.fetch(url,{ headers : { Authorization : 'Bearer '+ ScriptApp.getOAuthToken() }})
  return docx.getBlob()
}

//Given the info from an SFax ping, puts together an API request to them, and process the full info for a given fax
//https://stackoverflow.com/questions/26615546/google-apps-script-urlfetchapp-post-file
//https://stackoverflow.com/questions/24340340/urlfetchapp-upload-file-multipart-form-data-in-google-apps-script
function sendSFax(fromFax, toFax, blob){

  var token = getToken()
  //var blob  = DriveApp.getFileById("1lyRpFl0GiEvj5Ixu-BwTvQB-sw6lt3UH").getBlob()

  var url = "https://api.sfaxme.com/api/SendFax?token=" + encodeURIComponent(token) + "&ApiKey=" + encodeURIComponent(SFAX_KEY) + "&RecipientName=" + encodeURIComponent('Good Pill Pharmacy - Active')  + "&RecipientFax=" + encodeURIComponent('1'+toFax)

  if (toFax != fromFax) //Have external faxes come from Good Pill and gointo our sent folder
    url += "&OptionalParams=" + encodeURIComponent('SenderFaxNumber=1'+fromFax)

  Logger.log(['sendSFax', url])

  var opts  = {
    method:'POST',
    url:url,
    payload:{file:blob}
  }

  try{

    //var req = UrlFetchApp.getRequest(url,opts);   // (OPTIONAL) generate the request so you
    //Logger.log("Request payload: " + JSON.stringify(req)); // can examine it (useful for debugging)

    var res = UrlFetchApp.fetch(url, opts)

    //logError('sendSFax res: ' + JSON.stringify(res) + ' || ' + res.getResponseCode() + ' || ' + JSON.stringify(res.getHeaders()) + ' || ' + res.getContentText())

    return JSON.parse(res.getContentText()) //{"SendFaxQueueId":"539658135EB742968663C6820BE33DB0","isSuccess":true,"message":"Fax is received and being processed"}

  } catch(err){
    logError('sendSFax err' + err)
    return err
  }
}


function getToken(){

  var raw = "Username="+SFAX_USER+"&ApiKey="+SFAX_KEY+"&GenDT="+(new Date).toJSON()
  Logger.log('TOKEN '+raw)

   var token = CryptoJS.AES.encrypt(raw, CryptoJS.enc.Utf8.parse(SFAX_SECRET), {
    iv:CryptoJS.enc.Utf8.parse(SFAX_INIT_VECTOR),
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC
  });

  Logger.log('Encrypted Token '+ typeof token + ' ' + token)
  return token
}


function testDecrypt() {
  var token = '8jx9Uhg20DB/L3Fq5YukuFaF3/NkiWKB5PGlXBxsaZqRNCjDlCsUlKRVp++rm7x+Um9by5YTDOxxixJCO/t9loBMP9afTl4u/bdaSt2HqN7MS5lIXliT2OvW9nL6X4Zn' //'8jx9Uhg20DB/L3Fq5YukuFaF3/NkiWKB5PGlXBxsaZqRNCjDlCsUlKRVp++rm7x+Um9by5YTDOxxixJCO/t9lgyp5GyMAlSjagK3j0jl1pf5EY150TmsmHqM1S1VavwD'

   var raw = CryptoJS.AES.decrypt(token, CryptoJS.enc.Utf8.parse(SFAX_SECRET), {
    iv:CryptoJS.enc.Utf8.parse(SFAX_INIT_VECTOR),
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC
  });

  Logger.log(raw.toString(CryptoJS.enc.Utf8))
}
