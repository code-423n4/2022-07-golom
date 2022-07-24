// require('@nomiclabs/hardhat-waffle');
// require('@nomiclabs/hardhat-web3');
// require('@nomiclabs/hardhat-ethers');
// require('hardhat-etherscan-abi');

import { HardhatUserConfig, task } from 'hardhat/config';

import '@typechain/hardhat';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';

// require('dotenv').config();
// import 'hardhat-contract-sizer';

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

export default {
    defaultNetwork: 'hardhat',
    networks: {
        // hardhat: {
        //     forking: {
        //         url: 'https://eth-mainnet.alchemyapi.io/v2/wYxR-MHm86pwKsvhOPF6rMNWB3bQP3oN',
        //         blockNumber: 14358720,
        //     },
        //     chainId: 1,
        // },
        hardhat: {
            allowUnlimitedContractSize: true,
            gas: 12000000,
            blockGasLimit: 0x1fffffffffffff,
        },
        mainnet: {
            url: 'https://eth.golom.io',
        },
    },
    solidity: {
        compilers: [
            {
                version: '0.8.11',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: '0.4.18',
            },
            {
                version: '0.8.11',
            },
            {
                version: '0.8.0',
            },
            {
                version: '0.5.3',
            },
        ],
    },

    etherscan: {
        // Your API key for Etherscan
        // Obtain one at https://etherscan.io/
        apiKey: 'YOUR_ETHERSCAN_API_KEY',
    },
};
