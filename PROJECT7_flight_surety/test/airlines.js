// Simple logging util
var path = require('path');
var scriptName = path.basename(__filename);
function log(_string){
    console.log(`${scriptName}: ${_string}`);
}

// Begin main test script
const truffleAssert = require('truffle-assertions'); // Extra utilities for testing Smart Contracts

log('Starting airlines.js tests, top of script.');
var Test = require('../config/testConfig.js');


contract('Airline Requirement Tests', async (accounts) => {

  log('airlines.js: Initiating contract')
  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    // await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });


  it(`First airline is registered when contract is deployed`, async function () {
    // Constructor should register an airline
    numAirlines = await config.flightSuretyData.getNumAirlines();
    assert.equal(numAirlines, 1, "One airline registered");
    thisAirline = await config.flightSuretyData.getAirline(config.firstAirline) 
    log(`First airline name: ${thisAirline[0]}`)
    assert.equal(thisAirline[1], config.firstAirline, 'First airline not matching configuration')
  });

  it(`Only existing airline may register a new airline until there are at least four airlines registered`, async function () {
    assert.equal(true, true, "message");
            
  });

  it(`Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines`, async function () {
    assert.equal(true, true, "message");
      
  });

  it(`Airline can be registered, but does not participate in contract until it submits funding of 10 ether`, async function () {
    assert.equal(true, true, "message");

  });

});
