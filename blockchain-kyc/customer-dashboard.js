// Customer Dashboard specific functionality
let uploadedFiles = {
    idProof: null,
    addressProof: null
};

// Mock data for demonstration
const mockKYCHistory = [
    {
        date: '2024-01-15',
        bank: 'Bank A',
        status: 'Approved',
        documentHash: '0x1234...5678'
    },
    {
        date: '2024-01-10',
        bank: 'Bank B',
        status: 'Pending',
        documentHash: '0x5678...9012'
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
        // Update KYC status
        await updateKYCStatus();
        
        // Load KYC history
        loadKYCHistory();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Update KYC status display
async function updateKYCStatus() {
    try {
        // In production, this would fetch status from blockchain
        const status = 'Pending'; // Mock status
        const statusBadge = document.getElementById('kycStatusBadge');
        const statusText = document.getElementById('kycStatusText');

        switch (status) {
            case 'Not Submitted':
                statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800';
                statusText.textContent = 'Submit your KYC documents to get started';
                break;
            case 'Pending':
                statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800';
                statusText.textContent = 'Your KYC verification is in progress';
                break;
            case 'Approved':
                statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800';
                statusText.textContent = 'Your KYC has been verified';
                break;
            case 'Rejected':
                statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800';
                statusText.textContent = 'Your KYC was rejected. Please submit new documents.';
                break;
        }
        statusBadge.textContent = status;
    } catch (error) {
        console.error('Error updating KYC status:', error);
    }
}

// Load KYC history into table
function loadKYCHistory() {
    const tableBody = document.getElementById('kycHistoryTable');
    tableBody.innerHTML = '';

    mockKYCHistory.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${record.date}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${record.bank}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${getStatusColor(record.status)}">
                    ${record.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">${record.documentHash}</div>
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

// Handle file upload
async function handleFileUpload(input, type) {
    const file = input.files[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        input.value = '';
        return;
    }

    // Store file
    uploadedFiles[type] = file;

    // Show preview
    const previewDiv = document.getElementById(`${type}Preview`);
    previewDiv.classList.remove('hidden');
    previewDiv.querySelector('.filename').textContent = file.name;

    // Enable submit button if both files are uploaded
    document.getElementById('submitKYCBtn').disabled = !(uploadedFiles.idProof && uploadedFiles.addressProof);
}

// Remove uploaded file
function removeFile(type) {
    uploadedFiles[type] = null;
    document.getElementById(`${type}Upload`).value = '';
    document.getElementById(`${type}Preview`).classList.add('hidden');
    document.getElementById('submitKYCBtn').disabled = true;
}

// Submit KYC documents
async function submitKYCDocuments() {
    try {
        if (!uploadedFiles.idProof || !uploadedFiles.addressProof) {
            alert('Please upload both ID proof and address proof documents');
            return;
        }

        // Show loading state
        const submitBtn = document.getElementById('submitKYCBtn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        // Generate document hashes
        const idProofHash = await hashDocument(uploadedFiles.idProof);
        const addressProofHash = await hashDocument(uploadedFiles.addressProof);

        // Combine hashes
        const combinedHash = ethers.utils.solidityKeccak256(
            ['string', 'string'],
            [idProofHash, addressProofHash]
        );

        // Submit to blockchain
        const tx = await kycContract.submitKYC(
            await signer.getAddress(),
            combinedHash
        );
        await tx.wait();

        // Update UI
        alert('KYC documents submitted successfully');
        await loadDashboardData();

        // Reset form
        uploadedFiles = { idProof: null, addressProof: null };
        document.getElementById('idProofUpload').value = '';
        document.getElementById('addressProofUpload').value = '';
        document.getElementById('idProofPreview').classList.add('hidden');
        document.getElementById('addressProofPreview').classList.add('hidden');

        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = true;

    } catch (error) {
        console.error('Error submitting KYC documents:', error);
        alert('Failed to submit KYC documents. Please try again.');
        document.getElementById('submitKYCBtn').disabled = false;
    }
}

// Initialize drag and drop functionality
document.addEventListener('DOMContentLoaded', () => {
    const dropZones = document.querySelectorAll('.border-dashed');
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('border-blue-500');
        });

        zone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            zone.classList.remove('border-blue-500');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('border-blue-500');
            
            const type = zone.querySelector('input[type="file"]').id.replace('Upload', '');
            const input = document.getElementById(`${type}Upload`);
            const files = e.dataTransfer.files;

            if (files.length > 0) {
                input.files = files;
                handleFileUpload(input, type);
            }
        });
    });
});
