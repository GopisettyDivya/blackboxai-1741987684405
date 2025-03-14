// Bank Dashboard specific functionality
let currentKYCRequest = null;

// Mock data for demonstration - In production, this would come from the blockchain
const mockKYCRequests = [
    {
        customerId: "CUS001",
        documentHash: "0x1234...5678",
        submissionDate: "2024-01-15",
        status: "Pending"
    },
    {
        customerId: "CUS002",
        documentHash: "0x5678...9012",
        submissionDate: "2024-01-14",
        status: "Approved"
    }
];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Check if wallet is connected
    if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        
        try {
            const address = await signer.getAddress();
            document.getElementById('walletAddress').textContent = 
                `Wallet: ${address.substring(0, 6)}...${address.substring(38)}`;
            
            // Initialize contract
            kycContract = new ethers.Contract(
                KYC_CONTRACT_ADDRESS,
                KYC_CONTRACT_ABI,
                signer
            );

            // Load dashboard data
            await loadDashboardData();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            alert('Please connect your wallet to access the dashboard');
            window.location.href = 'index.html';
        }
    } else {
        alert('Please install MetaMask to use this application');
        window.location.href = 'index.html';
    }
});

// Load dashboard data
async function loadDashboardData() {
    try {
        // Update stats
        updateStats();
        
        // Load KYC requests
        await loadKYCRequests();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Update dashboard statistics
function updateStats() {
    const pending = mockKYCRequests.filter(req => req.status === 'Pending').length;
    const approved = mockKYCRequests.filter(req => req.status === 'Approved').length;
    const rejected = mockKYCRequests.filter(req => req.status === 'Rejected').length;

    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('approvedCount').textContent = approved;
    document.getElementById('rejectedCount').textContent = rejected;
}

// Load KYC requests into table
async function loadKYCRequests() {
    const tableBody = document.getElementById('kycRequestsTable');
    tableBody.innerHTML = '';

    mockKYCRequests.forEach(request => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${request.customerId}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">${request.documentHash}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">${request.submissionDate}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${getStatusColor(request.status)}">
                    ${request.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                ${getActionButtons(request)}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Get status color class
function getStatusColor(status) {
    switch (status) {
        case 'Pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'Approved':
            return 'bg-green-100 text-green-800';
        case 'Rejected':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// Get action buttons based on status
function getActionButtons(request) {
    if (request.status === 'Pending') {
        return `
            <button onclick="viewDocument('${request.customerId}')" 
                class="text-blue-600 hover:text-blue-900 mr-4">
                View
            </button>
            <button onclick="showApprovalModal('${request.customerId}')" 
                class="text-green-600 hover:text-green-900 mr-4">
                Approve
            </button>
            <button onclick="showRejectionModal('${request.customerId}')" 
                class="text-red-600 hover:text-red-900">
                Reject
            </button>
        `;
    }
    return `
        <button onclick="viewDocument('${request.customerId}')" 
            class="text-blue-600 hover:text-blue-900">
            View
        </button>
    `;
}

// View document details
function viewDocument(customerId) {
    currentKYCRequest = mockKYCRequests.find(req => req.customerId === customerId);
    document.getElementById('documentModal').classList.remove('hidden');
    
    // In a real application, we would fetch and display the actual document
    document.getElementById('documentPreview').innerHTML = `
        <div class="p-4 border rounded">
            <h4 class="font-semibold mb-2">Customer ID: ${currentKYCRequest.customerId}</h4>
            <p class="text-sm text-gray-600">Document Hash: ${currentKYCRequest.documentHash}</p>
            <p class="text-sm text-gray-600">Submission Date: ${currentKYCRequest.submissionDate}</p>
        </div>
    `;
}

// Close modal
function closeModal() {
    document.getElementById('documentModal').classList.add('hidden');
    currentKYCRequest = null;
}

// Approve KYC
async function approveKYC() {
    if (!currentKYCRequest) return;

    try {
        // Call smart contract method
        const tx = await kycContract.approveKYC(currentKYCRequest.customerId);
        await tx.wait();

        // Update UI
        const index = mockKYCRequests.findIndex(req => req.customerId === currentKYCRequest.customerId);
        if (index !== -1) {
            mockKYCRequests[index].status = 'Approved';
        }

        closeModal();
        await loadDashboardData();
        
        alert('KYC approved successfully');
    } catch (error) {
        console.error('Error approving KYC:', error);
        alert('Failed to approve KYC');
    }
}

// Reject KYC
async function rejectKYC() {
    if (!currentKYCRequest) return;

    try {
        // In production, this would call a smart contract method
        const index = mockKYCRequests.findIndex(req => req.customerId === currentKYCRequest.customerId);
        if (index !== -1) {
            mockKYCRequests[index].status = 'Rejected';
        }

        closeModal();
        await loadDashboardData();
        
        alert('KYC rejected successfully');
    } catch (error) {
        console.error('Error rejecting KYC:', error);
        alert('Failed to reject KYC');
    }
}
