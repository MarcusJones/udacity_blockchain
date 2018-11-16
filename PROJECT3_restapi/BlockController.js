const SHA256 = require('crypto-js/sha256');
const blockchain = require('./simpleChain');
console.log(`Blockchain module loaded`);
// console.log('Blockchain = ' + typeof blockchain.Blockchain);
// bc = new blockchain.Blockchain
// console.log(bc);

/**
 * Controller Definition to encapsulate routes to work with blocks
 */

class BlockController {

    /**
     * Constructor to create a new BlockController, you need to initialize here all your endpoints
     * @param {*} server 
     */
    constructor(server) {
        this.server = server;
        this.blockchain = new blockchain.Blockchain()
        // this.blocks = [];
        // this.initializeMockData();
        this.getBlockByIndex();
        this.postNewBlock();
        this.getBlockHeight();
    }
    /**
     * Implement a GET Endpoint to retrieve a block by index, url: "/api/block/:index"
     */
    getBlockByIndex() {
        this.server.route({
            method: 'GET',
            path: '/api/block/{index}',
            handler: (request, h) => {
                var idx = encodeURIComponent(request.params.index)
                console.log('GET /block/' + idx);
                var block = this.blockchain.getBlock(idx)
                return block 
            }
        });
    }

    getBlockHeight() {
        this.server.route({
            method: 'GET',
            path: '/api/blockheight',
            handler: (request, h) => {
                console.log('GET /blockheight');
                return this.blockchain.getBlockHeight()
            }

        })
    }

    /**
     * Implement a POST Endpoint to add a new Block, url: "/api/block"
     * Uses x-www-form-urlencoded POST
     */
    postNewBlock() {
        this.server.route({
            method: 'POST',
            path: '/api/block',
            handler: (request, h) => {
                // var data = JSON.stringify(request.payload)
                // console.log(request.payload.data);
                var data = request.payload.data;
                console.log('POST /block data=' + data);
                var block = new blockchain.Block(data)
                this.blockchain.addBlock(block)
                return 'Added block'
            }
        });
    }

    /**
     * Help method to inizialized Mock dataset, adds 10 test blocks to the blocks array
     */
    initializeMockData() {
        if(this.blocks.length === 0){
            console.log('No blocks found - creating mock data');
            
            for (let index = 0; index < 10; index++) {
                let blockAux = new BlockClass.Block(`Test Data #${index}`);
                blockAux.height = index;
                blockAux.hash = SHA256(JSON.stringify(blockAux)).toString();
                this.blocks.push(blockAux);
            }
        }
    }


}

/**
 * Exporting the BlockController class
 * @param {*} server 
 */
module.exports = (server) => { return new BlockController(server);}
