/**
 * Showing with the Express framework http://expressjs.com/
 * Express must be installed for this sample to work
 */

require('tropo-webapi');
var bodyParser = require('body-parser')
var express = require('express');
var http = require('https');
var app = express();

/**
 * Required to process the HTTP body
 * req.body has the Object while req.rawBody has the JSON string
 */

app.use(bodyParser());

app.post('/', function(req, res){
    // Create a new instance of the TropoWebAPI object.
    var tropo = new TropoWebAPI();
    if(req.body['session']['from']['channel'] == "TEXT") {
        tropo.say("This application is voice only.  Please call in using a regular phone or SIP phone.");
                         
    tropo.on("continue", null, null, true);
    
    res.send(TropoJSON(tropo));
    // Use the say method https://www.tropo.com/docs/webapi/say
    } else {
        tropo.say("Welcome to my Tropo Web API node demo.");
        
        // Demonstrates how to use the base Tropo action classes.
        var say = new Say("Please record your region.");
        var choices = new Choices("Brisbane, Cairns, Gold Coast");

        // use the record method https://www.tropo.com/docs/webapi/record
        tropo.ask(choices, 3, null, 0, "region", null, null, say, 10, "Karen", null, 0.3, null, null);
        
        // use the on method https://www.tropo.com/docs/webapi/on
        tropo.on("continue", null, "/answer", true);
        tropo.on("incomplete", null, "/incomplete", true);
        tropo.on("error", null, "/error", true);
        res.send(TropoJSON(tropo));
    }
});

app.post('/answer', function(req, res){
    // Create a new instance of the TropoWebAPI object.
    var tropo = new TropoWebAPI();
    var answer = req.body['result']['actions']['value'];
    tropo.say("Recorded " + answer + " successfully.  Thank you!");
    console.log("Recorded " + answer + " successfully.  Thank you!");
    global.region = answer;
    console.log(global.region);
    
    // Demonstrates how to use the base Tropo action classes.
    var say = new Say("Is this correct?");
    var choices = new Choices("yes, no");

    // use the record method https://www.tropo.com/docs/webapi/record
    tropo.ask(choices, 3, null, 50, "confirm", null, null, say, 10, "Karen", null, 0.3, null, null);
        
    // use the on method https://www.tropo.com/docs/webapi/on
    tropo.on("continue", null, "/confirm", true);
    tropo.on("incomplete", null, "/incomplete", true);
    tropo.on("error", null, "/error", true);
    res.send(TropoJSON(tropo));
});

app.post('/alert/finish', function(req, res){
    console.log(req.body);
    res.send();
});

app.post('/alert/debug', function(req, res){
    console.log(req.body);
    res.send();
});

app.post('/alert/trigger/sms', function(req, res){
    console.log(req.body);
    var tropoHost = "api.tropo.com";
	// Get the URL and Token from the Tropo application - chose either Voice or SMS URLs depending on the application.
    var tropoUri = "/1.0/sessions?action=create&token=<Tropo Token>";
    tropoUri = tropoUri + "&carname="+escape(req.body.car_name);
    tropoUri = tropoUri + "&phone="+escape(req.body.number);
    console.log(tropoUri);
    var options = {
      host: tropoHost,
      path: tropoUri,
      // This is what changes the request to a POST request
      method: 'GET',
    };
        
    callback = function(response) {
      var str = ''
      response.on('data', function (chunk) {
        str += chunk;
      });
      response.on('end', function () {
        console.log(str);
      });
    }
        
    var req = http.request(options, callback);
    //This is the data we are posting, it needs to be a string or a buffer
    req.end();
    res.send();
});

app.post('/alert/send/sms', function(req, res){
    mark('/tmp/pcs-trace-005-manage-sms.log');
    var tropo = new TropoWebAPI();
    console.log(req.body);
    console.log(req.body.session.parameters['carname']);
    console.log(req.body.session.parameters['phone']);
    var carname = req.body.session.parameters['carname'];
    var phone = req.body.session.parameters['phone'];
    tropo.call(phone);
    tropo.say(",,Your car "+carname+" has been detected coming off the track. Please pick up your car and place it back on the track.");
/*
    // Demonstrates how to use the base Tropo action classes.
    var say = new Say("Is this your car?");
    var choices = new Choices("yes, no");
    // use the record method https://www.tropo.com/docs/webapi/record
    tropo.ask(choices, 3, null, 50, "confirm", null, null, say, 10, null, null, 0.3, null, null);
    // use the on method https://www.tropo.com/docs/webapi/on
    tropo.on("incomplete", null, "/incomplete", true);
    tropo.on("error", null, "/error", true);
    res.send(TropoJSON(tropo));
*/
    tropo.on("continue", null, "/alert/finish", true);
    tropo.on("error", null, "/alert/finish", true);
    tropo.on("incomplete", null, "/alert/finish", true);
    console.log(TropoJSON(tropo));
    res.send(TropoJSON(tropo));
    console.log("sent message");
});

app.post('/alert/process', function(req, res){
    var stream = req.body;
    global.msg_id = stream.msg_id;
    var pcsHost = "service-domain.process.us2.oraclecloud.com";
    var pcsPort = "443";
    var pcsUri = "/bpm/api/3.0/processes";
    var pcsAuth = "<Process Cloud Key>";
    var carName = stream.data_carname;
    console.log("Found stream "+stream);
    console.log("Found car "+carName);
    var body = "{ \"processDefId\":\"default~process-def-id\"," +
                  "\"serviceName\":\"process.service\"," +
                  "\"operation\":\"start\"," +
                  "\"action\":\"Submit\"," +
                  "\"payload\":\"<ns:start xmlns:ns='http://xmlns.oracle.com/bpmn/bpmnCloudProcess/app/process'><formArg xmlns:jns1='http://xmlns.oracle.com/bpm/forms/schemas/IncidentWebForm'><jns1:carName>"+carName+"</jns1:carName></formArg></ns:start>\"" +
                "}";
    console.log(body);
    var options = {
      host: pcsHost,
      path: pcsUri,
      // Since we are listening on a custom port, we need to specify it by hand
      port: pcsPort,
      // This is what changes the request to a POST request
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': pcsAuth
      }
    };
        
    callback = function(response) {
      var str = ''
      response.on('data', function (chunk) {
        str += chunk;
      });
      response.on('end', function () {
        console.log(str);
      });
    }
        
    var req = http.request(options, callback);
    //This is the data we are posting, it needs to be a string or a buffer
    req.write(body);
    req.end();
    res.send();
});

app.post('/incomplete', function(req, res){
    var tropo = new TropoWebAPI();
    tropo.say("Sorry, I didn't hear anything.  Please call back and try again.");
    res.send(TropoJSON(tropo));
});

app.post('/error', function(req, res){
    // Create a new instance of the TropoWebAPI object.
    var tropo = new TropoWebAPI();
    tropo.say("Recording failed.  Please call back and try again.");
    res.send(TropoJSON(tropo));
});

app.listen(8080);
console.log('Server running on port :8080');

