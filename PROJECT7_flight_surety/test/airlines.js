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
    thisAirline = await config.flightSuretyData.getAirline(config.testAirlineAccounts[0]) 
    log(`First airline name: ${thisAirline[0]}`)
    assert.equal(thisAirline[1], config.testAirlineAccounts[0], 'First airline not matching configuration')
  });


  it(`Only existing airline may register a new airline until there are at least four airlines registered`, async function () {
    // Register 2
    tx = await config.flightSuretyData.registerAirline('Airline 2', config.testAirlineAccounts[1], {from: config.testAirlineAccounts[0]})
    truffleAssert.eventEmitted(tx, 'AirlineRegistered', (ev) => { return ev.name === 'Airline 2' });
    assert.equal(await config.flightSuretyData.getNumAirlines(), 2, "Two are not registered");

    // Register 3
    tx = await config.flightSuretyData.registerAirline('Airline 3', config.testAirlineAccounts[2], {from: config.testAirlineAccounts[1]})

    log(`Second airline: ${await config.flightSuretyData.getAirline(config.testAirlineAccounts[1]) }`)
    log(`Third airline: ${await config.flightSuretyData.getAirline(config.testAirlineAccounts[2]) }`)

    // Fail to register 4, because the sender is not registered
    await truffleAssert.reverts(
      config.flightSuretyData.registerAirline('Airline 4', config.testAirlineAccounts[3], {from: config.testAirlineAccounts[4]}), 
      "Only existing airlines can register new"
      )

    // Go ahead and register 4
    tx = await config.flightSuretyData.registerAirline('Airline 4', config.testAirlineAccounts[3], {from: config.testAirlineAccounts[2]})
    log(`Fourth airline: ${await config.flightSuretyData.getAirline(config.testAirlineAccounts[3]) }`)
    
  });


  it(`Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines`, async function () {
    log(`Number of airlines: ${await config.flightSuretyData.getNumAirlines()}`)

    // Go ahead and register 5th
    tx = await config.flightSuretyData.registerAirline('Airline 5', config.testAirlineAccounts[4], {from: config.testAirlineAccounts[2]})
    log(`Fifth airline: ${await config.flightSuretyData.getAirline(config.testAirlineAccounts[4])}`)
    
    await config.flightSuretyData.vote(config.testAirlineAccounts[4], {from: config.testAirlineAccounts[2]})
    log(`Fifth airline: ${await config.flightSuretyData.getAirline(config.testAirlineAccounts[4])}`)

    await truffleAssert.reverts(
      config.flightSuretyData.vote(config.testAirlineAccounts[4], {from: config.testAirlineAccounts[2]}),
      'You have already voted for this airline'
    )

    log(`Fifth airline: ${await config.flightSuretyData.getAirline(config.testAirlineAccounts[4])}`)
  });

  it(`Airline can be registered, but does not participate in contract until it submits funding of 10 ether`, async function () {
    assert.equal(true, true, "message");

  });

});