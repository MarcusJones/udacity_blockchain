const boom = require('boom');
const RequestValidator = require('./RequestValidator');
const blockchainlib = require('./simpleChain');
const blocklib = require('../models/Block')
const bitcoinMessage = require('bitcoinjs-message');

requestPool = new RequestValidator.RequestPool()
blockchain = new blockchainlib.Blockchain()

var exported = {

    /**
     * 
     * @param {*} request 
     * @param {*} h 
     */
    POST_requestValidation: async function (request, h) {
        /*
        1   VALIDATION
        1.1 A user (address) submits a validation request. They pass their wallet address as data. 
        1.2 The server calls AddRequestValidation to append the validation request to the mempool
        1.3 The server returns a requestObject wtih the address, the timestamp of the request, 
            the message, and the validation windows (300 seconds)

        */
        console.log(`POST Validation requested: ${JSON.stringify(request.payload)}`);
        if (!request.payload.hasOwnProperty('address')) {
            return boom.badRequest('Missing payload key. Pass address as JSON.');
        }

        thisAddress = request.payload.address;
        if (thisAddress in requestPool.mempool) {
            return requestPool.mempool[thisAddress].respond()
        }
        response = requestPool.addRequest(thisAddress)
        return response;
    },

    /**
     * 
     * @param {*} request 
     * @param {*} h 
     */
    POST_messageSigValidate: async function (request, h) {
        console.log(`POST Signature provided, validate: ${JSON.stringify(request.payload)}`);
        if (!request.payload.hasOwnProperty('address')) {
            return boom.badRequest('Missing payload key. Pass address as JSON.');
        }
        if (!request.payload.hasOwnProperty('signature')) {
            return boom.badRequest('Missing payload key. Pass signature as JSON.');
        }

        address = request.payload.address;

        if (address in requestPool.mempool) {
            requestInstance = requestPool.mempool[thisAddress]
            requestObject = requestInstance.respond();

            let signature = request.payload.signature
            let message = requestObject.message

            let isValid = bitcoinMessage.verify(message, address, signature);
            
            if (isValid) {
                console.log('Valid signature.');
                // This will shift the wallet from pending to approved list
                requestPool.approveWallet(address);
                return requestPool.validRequests[address].respond();;
            } else {
                return boom.badRequest('Invalid signature.');
            }

        } else {
            return boom.badRequest('This address has not requested validation.');
        }
    },

    /**
     * 
     * @param {*} request 
     * @param {*} h 
     */
    POST_block: async function (request, h) {
        console.log(`POST validation requested: ${JSON.stringify(request.payload)}`);
        if (!request.payload.hasOwnProperty('address')) {
            return boom.badRequest('Missing payload key. Pass address as JSON.');
        }
        if (!request.payload.hasOwnProperty('star')) {
            return boom.badRequest('Missing payload key. Pass star as JSON.');
        }

        var stardata  = request.payload.star;
        console.log(request.payload);
        

        try {
            let block = new blocklib.Block(stardata);
            // console.log(block);
            console.log('Block added');
            block = await blockchain.addBlock(block);
            return h.response(block).code(201);
        } catch (err) {
            console.log(err);
            return boom.badImplementation('Error ', err);
        }
    },

    /**
     * 
     * @param {*} request 
     * @param {*} h 
     */
    GET_starByHash: async function (request, h) {
        console.log(`GET block by BLOCK_HASH: ${request.params.BLOCK_HASH}`);
        return 'GET_starByHash';
    },

    /**
     * 
     * @param {*} request 
     * @param {*} h 
     */
    GET_starByAddress: async function (request, h) {
        console.log(`GET block by BLOCK_ADDRESS: ${request.params.BLOCK_ADDRESS}`);
        return 'GET_starByAddress';
    },

    GET_blockByHeight: async function (request, h) {
        console.log(`GET block by BLOCK_HEIGHT: ${request.params.BLOCK_HEIGHT}`);
        return 'GET_blockByHeight';
    },

}
module.exports = exported