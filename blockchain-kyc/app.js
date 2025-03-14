// Blockchain connection and smart contract interaction
let provider;
let signer;
let kycContract;

// Smart contract address - this would be replaced with actual deployed contract address
const KYC_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

// Smart contract ABI - simplified version for demo
const KYC_CONTRACT_ABI = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_customerId",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_documentHash",
                "type": "string"
            }
        ],
        "name": "submitKYC",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_customerId",
                "type": "string"
            }
        ],
        "name": "approveKYC",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_customerId",
                "type": "string"
            }
        ],
        "name": "getKYCStatus",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Connect to blockchain network
async function connectWallet() {
    try {
        if (typeof window.ethereum !== 'undefined') {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            
            kycContract = new ethers.Contract(
                KYC_CONTRACT_ADDRESS,
                KYC_CONTRACT_ABI,
                signer
            );

            const address = await signer.getAddress();
            document.getElementById('connectWallet').textContent = 
                `Connected: ${address.substring(0, 6)}...${address.substring(38)}`;

            return true;
        } else {
            alert('Please install MetaMask to use this application');
            return false;
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet');
        return false;
    }
}

// Login functions
function loginAsBank() {
    if (!provider) {
        alert('Please connect your wallet first');
        return;
    }
    // Redirect to bank dashboard
    window.location.href = 'bank-dashboard.html';
}

function loginAsCustomer() {
    if (!provider) {
        alert('Please connect your wallet first');
        return;
    }
    // Redirect to customer dashboard
    window.location.href = 'customer-dashboard.html';
}

// Event Listeners
document.getElementById('connectWallet').addEventListener('click', connectWallet);

// KYC Document Handling
async function submitKYC(customerId, documentHash) {
    try {
        const tx = await kycContract.submitKYC(customerId, documentHash);
        await tx.wait();
        return true;
    } catch (error) {
        console.error('Error submitting KYC:', error);
        return false;
    }
}

async function approveKYC(customerId) {
    try {
        const tx = await kycContract.approveKYC(customerId);
        await tx.wait();
        return true;
    } catch (error) {
        console.error('Error approving KYC:', error);
        return false;
    }
}

async function getKYCStatus(customerId) {
    try {
        const status = await kycContract.getKYCStatus(customerId);
        return status;
    } catch (error) {
        console.error('Error getting KYC status:', error);
        return null;
    }
}

// File handling utilities
function hashDocument(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const arrayBuffer = e.target.result;
            const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            resolve(hashHex);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}
