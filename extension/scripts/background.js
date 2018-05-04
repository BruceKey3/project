/*
chrome.webRequest.onHeadersReceived.addListener(function(details){

  console.log("Headers:")
  console.log(details.responseHeaders);
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {
      "message": "onHeadersReceived",
      "data": details.responseHeaders
    });
  });

}, {urls: ["<all_urls>"]}, ["blocking", "responseHeaders"]);
*/

let shouldBeAttached = {};

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    //console.dir(details);
    let tabId = details.tabId;
    if (shouldBeAttached[tabId])
    {
      chrome.debugger.attach({tabId: tabId},
                              version,
                              onAttachReport.bind(null, tabId));
    }
    return {};
  },
  {urls: ["<all_urls>"]},
  ["blocking", "requestBody"]);

var version = "1.0";
let extensionId = undefined;

function onAttachReport(tabId)
{
  if (chrome.runtime.lastError) {
    console.log(chrome.runtime.lastError.message);
    alert(chrome.runtime.lastError.message);
    return;
  }
  
  delete shouldBeAttached[tabId];
  chrome.windows.create(
     {url: "html/report.html?" + tabId,
      type: "popup",
      width: 800, height: 600});
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(request.message);
    if (request.message === "createReportWindow") {
      console.log("createReportWindow message received");

      let tabId = request.data;
      shouldBeAttached[tabId] = true;
    }
    else if (request.message === "hasLoaded")
    {
      let tabId = sender.tab.id;
    }
    else if (request.message === "getExtensionId")
    {
      sendResponse({extensionId: extensionId});
    }
    // Basically just pass throughs here and send data to the
    // report.js so the report can be added
    else if (request.message ===  "extensionInstallStarted")
    {
      let tabId = sender.tab.id;
      console.log("Content message received: " + request.data);
      chrome.tabs.sendMessage(tabId, {
        "message": "extensionInstallStarted",
        "data": request.data
      });
    }
    else if (request.message ===  "formProcessed")
    {
      let tabId = sender.tab.id;
      console.log("Content message received: " + request.data);
      chrome.tabs.sendMessage(tabId, {
        "message": "formProcessed",
        "data": request.data
      });
    }
    else if (request.message === "checkForms")
    {
      console.log("Content message received checkForms");
      chrome.tabs.sendMessage(request.tabId, {
        "message": "checkForms",
      });
    }

    return true;
});

console.log("background");
chrome.management.getSelf(function(result) {
  console.log(result.id);
  extensionId = result.id;
});
