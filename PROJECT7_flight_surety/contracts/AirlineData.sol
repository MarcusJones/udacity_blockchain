pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract AirlineData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    mapping(address => bool) private authorizedContracts;

    uint public airlineAnte = 10 ether;       
    /* AIRLINES
    Each airline is represented by their public address
    Airlines have various status codes to represent their state in the contract.
    */
    enum RegistrationState
    {
        Proposed,  // 0
        Registered, // 1
        Funded
        // Rejected    // 2
        // ForSale,    // 3
        // Sold,       // 4
        // Shipped,    // 5
        // Received,   // 6
        // Purchased   // 7
    }

    struct Airline {
        string name;
        address airlineAddress;
        RegistrationState registrationState; // This is set to register for the first 4 airlines, and then by voting
        address[] votes; // This is the list of addresses who have voted for this airline
    }

    mapping(address => Airline) private airlines;
    address[] airlineAddresses;
    address[] registeredAirlines;


    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event AirlineRegistered(address airlineAddress, string name, uint registrationState, uint256 numVotes);
    event AirlineProposed(address airlineAddress, string name, address sponsor);
    event AirlineStatus(address airlineAddress, string name, uint256 registrationState, uint256 numVotes);
    event Funded(address airlineAddress);
    event VotedIn(address airlineAddress);

    /********************************************************************************************/
    /*                                       CONSTUCTOR                                         */
    /********************************************************************************************/

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    *      The deploying account must register the first airline
    */
    constructor (string _airlineName, address _airlineAddress) public
    {
        contractOwner = msg.sender;

        // Create first Airline
        airlines[_airlineAddress] = Airline({
            name: _airlineName,
            airlineAddress: _airlineAddress,
            registrationState: RegistrationState.Registered,
            votes: new address[](0)
            });
        airlineAddresses.push(_airlineAddress);
        registeredAirlines.push(_airlineAddress);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
    * @dev Modifier that requires function caller to be authorized caller.
    */
    modifier requireCallerAuthorized()
    {
        require(authorizedContracts[msg.sender] == true, "Caller is not authorized caller");
        _;
    }

    /**
     * Modifier that requires an airline to be registered.
     */
    modifier requireAirlineExists(address _airlineAddress)
    {
        bool exists = addressInList(airlineAddresses, _airlineAddress);
        require(exists, "Airline address does not exist in this contract");
        _;
    }

    modifier requireAirlineRegistered(address _airlineAddress)
    {
        require(airlines[_airlineAddress].registrationState == RegistrationState.Registered);
        _;
    }

    modifier requireAirlineFunded(address _airlineAddress)
    {
        require(airlines[_airlineAddress].registrationState == RegistrationState.Funded);
        _;
    }

    modifier requireSufficientAnte() {
        require(msg.value >= airlineAnte, "Minimum funding level not met");
        _;
    }
    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational() public view returns(bool) {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus ( bool mode) external requireContractOwner {
        operational = mode;
    }

    /**
    * @dev This checks if an address appears in the list of addresses.
    */
    function addressInList ( address[] memory addresses, address addressToCheck) internal pure returns(bool)
    {
        bool exists = false;
        for(uint c = 0; c < addresses.length; c++) {
            if (addresses[c] == addressToCheck) {
                exists = true;
                break;
            }
        }
        return exists;
    }


    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline(string _airlineName, address _airlineAddress) external
    {
        // Case 1: Only existing airlines can register new airlines, <= 4 airlines
        if (airlineAddresses.length < 4){
            require(addressInList(airlineAddresses, msg.sender), 'Only existing airlines can register new airlines');
            airlines[_airlineAddress] = Airline({
                name: _airlineName,
                airlineAddress: _airlineAddress,
                registrationState: RegistrationState.Registered,
                votes: new address[](0)
                });
            airlineAddresses.push(_airlineAddress);
            registeredAirlines.push(_airlineAddress);
            emit AirlineRegistered(_airlineAddress, _airlineName, uint(airlines[_airlineAddress].registrationState), airlines[_airlineAddress].votes.length);

        // Case 2: > 4 airlines
        } else if (airlineAddresses.length >= 4) {
            require(addressInList(airlineAddresses, msg.sender), 'Only existing airlines can propose new airlines');
            airlines[_airlineAddress] = Airline({
                name: _airlineName,
                airlineAddress: _airlineAddress,
                registrationState: RegistrationState.Proposed,
                votes: new address[](0)
                });
            // The sponsoring airline automatically votes 
            airlines[_airlineAddress].votes.push(msg.sender);
            airlineAddresses.push(_airlineAddress);
            emit AirlineProposed(_airlineAddress, _airlineName, msg.sender);
        }
    }

    function getNumAirlines ( )
        external
        view
        returns(uint airlineCount)
    {
        return airlineAddresses.length;
    }

    function getAirline ( address _address )  external view requireAirlineExists(_address) returns(string, address, uint, uint256)  {
        return (airlines[_address].name,
                airlines[_address].airlineAddress,
                uint(airlines[_address].registrationState),
                airlines[_address].votes.length
        );
    }

    function getNumRegisteredAirlines() external view returns (uint) {
        return registeredAirlines.length;
    }

    function getVoteThreshold() external view returns (uint) {
        return registeredAirlines.length.div(2);
    }

    function vote (address _address) external requireAirlineExists(_address) requireAirlineExists(msg.sender) returns(uint) {
        require(!addressInList(airlines[_address].votes, msg.sender), 'You have already voted for this airline');
        airlines[_address].votes.push(msg.sender);
        
        // Check the votes
        uint votes = airlines[_address].votes.length;
        uint voteThreshold = registeredAirlines.length.div(2);
        if (airlines[_address].votes.length > voteThreshold) {
            airlines[_address].registrationState = RegistrationState.Registered;
            registeredAirlines.push(_address);
            emit VotedIn(_address);
            return voteThreshold;
        }
        else {
            return voteThreshold;
        }
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund () public payable
    {
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable {
        fund();
    }

    /**
    * @dev note
    */
    function authorizeCaller ( address contractAddress) external requireContractOwner
    {
        authorizedContracts[contractAddress] = true;
    }

    /**
    * @dev note
    */
    function deauthorizeCaller ( address contractAddress) external requireContractOwner
    {
        delete authorizedContracts[contractAddress];
    }

}
