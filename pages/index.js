import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { abi } from "../constants/abi";
import styles from "@/styles/Raffle.module.css";

const CONTRACT_ADDRESS = "0x472ed72434b35bd562886256b5de87e887340d25";
const RPC_URL = "https://testnet-rpc.monad.xyz/";
const readOnlyProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, readOnlyProvider);

export default function Home() {
  const [winner, setWinner] = useState("");
  const [poolAmount, setPoolAmount] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [entryAmount, setEntryAmount] = useState("");
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // get init data
        const lastWinner = await contract.getRecentWinner();
        const pool = await contract.getBalance();

        setWinner(lastWinner?.toString() || "No winner yet");
        setPoolAmount(ethers.utils.formatEther(pool));

        // connected
        if (account && window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          await updateUI(provider.getSigner(), account);
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };

    fetchInitialData();

    // events
    if (!account || !window.ethereum) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contractWithSigner = contract.connect(provider.getSigner());

    const onEnterRaffle = (player, value) => {
      if (player.toLowerCase() === account.toLowerCase()) {
        updateUI(provider.getSigner(), account);
      }
    };

    const onWinnerPicked = (winner) => {
      setWinner(winner);
      updateUI(provider.getSigner(), account);
    };

    contractWithSigner.on("RaffleEnter", onEnterRaffle);
    contractWithSigner.on("RaffleReEnter", onEnterRaffle);
    contractWithSigner.on("WinnerPicked", onWinnerPicked);

    return () => {
      contractWithSigner.off("RaffleEnter", onEnterRaffle);
      contractWithSigner.off("RaffleReEnter", onEnterRaffle);
      contractWithSigner.off("WinnerPicked", onWinnerPicked);
    };
  }, [account]);

  const updateUI = async (signer, account) => {
    try {
      const contractWithSigner = contract.connect(signer);

      const lastWinner = await contractWithSigner.getRecentWinner();
      const pool = await contractWithSigner.getBalance();

      // get player balance only if connected
      if (account) {
        const balance = await contractWithSigner.getPlayerBlance(account);
        setUserBalance(parseFloat(ethers.utils.formatEther(balance)).toFixed(4));
      }

      setWinner(lastWinner?.toString() || "No winner yet");
      setPoolAmount(parseFloat(ethers.utils.formatEther(pool)).toFixed(4));
    } catch (error) {
      console.error("Error updating UI:", error);
    }
  };

  // connect metamask
  const handleConnect = async () => {
    try {
      // Clear cached wallet information to ensure re-signing on every connect
      localStorage.removeItem("walletconnect");
      localStorage.removeItem("WALLETCONNECT_DEEPLINK_CHOICE");

      if (!window.ethereum) {
        alert("MetaMask not installed. Please install MetaMask to continue.");
        return;
      }

      // Request permissions to ensure re-authorization
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []); // Request wallet connection

      const signer = provider.getSigner();
      const account = await signer.getAddress();
      setAccount(account);

      // Switch to Monad Testnet
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x279f' }],
        });
      } catch (error) {
        if (error.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x279f",
              chainName: "Monad Testnet",
              nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
              rpcUrls: [RPC_URL],
              blockExplorerUrls: ['https://testnet.monadexplorer.com']
            }]
          });
        } else {
          throw error;
        }
      }

      // Update UI with connected account
      setUserBalance(0); // Reset user balance
      updateUI(signer, account);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
    setUserBalance(0);
    localStorage.removeItem("walletconnect");
    localStorage.removeItem("WALLETCONNECT_DEEPLINK_CHOICE");
  };


  const handleEnter = async () => {
    if (!entryAmount || entryAmount < 0.05) {
      alert("Minimum entry is 0.05 MON");
      return;
    }

    if (!/^\d+(\.\d{1,4})?$/.test(entryAmount)) {
      alert("Entry amount can have at most 4 decimal places");
      return;
    }

    try {
      if (!window.ethereum) throw new Error("MetaMask not installed");

      // Ensure the network is Monad Testnet
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (currentChainId !== '0x279f') {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x279f' }],
          });
        } catch (error) {
          if (error.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: "0x279f",
                chainName: "Monad Testnet",
                nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
                rpcUrls: [RPC_URL],
                blockExplorerUrls: ['https://testnet.monadexplorer.com']
              }]
            });
          } else {
            throw error;
          }
        }
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
      const formattedBalance = ethers.utils.formatEther(balance);
      if (entryAmount > formattedBalance) {
        alert("Insufficient MON balance");
        return;
      }

      const contractWithSigner = contract.connect(signer);

      await contractWithSigner.enterRaffle({
        value: ethers.utils.parseEther(entryAmount),
      });

      setEntryAmount("");
    } catch (error) {
      if (error.code === "ACTION_REJECTED") {
        alert("Transaction was rejected by the user.");
      } else {
        console.error("Error entering raffle:", error);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ color: '#fff', textAlign: 'center', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
        please disable the Core wallet plugin in the browser extension.please use metamask
      </div>
      {/* connect button*/}
      <div className={styles.connectWrapper}>
        {!account ? (
          <button
            onClick={handleConnect}
            className={styles.connectButton}
          >
            Connect MetaMask
          </button>
        ) : (
          <div className={styles.accountInfo}>
            <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
            <button
              onClick={handleDisconnect}
              className={styles.disconnectButton}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* main */}
      <main className={styles.mainContent}>
        <h1 className={styles.title}>Monad Raffle (Testnet)</h1>

        <div className={styles.winnerCard}>
          <h2 className={styles.winnerTitle}>Congratulations to last recent winner!</h2>
          <p className={styles.winnerAddress}>{winner}</p>
        </div>

        {/* show rules */}
        <div className={styles.card}>
          <h3 className={styles.rulesTitle}>Rules:</h3>
          <ul className={styles.rulesList}>
            <li className={styles.rulesItem}>Weekly draw every Thursday 08:30~08:35 UTC</li>
            <li className={styles.rulesItem}>Minimum entry: 0.05 MON</li>
            <li className={styles.rulesItem}>More contribution = Higher chances ❕❕❕</li>
            <li className={styles.rulesItem}>The winning gold will be automatically sent to the winner's address~</li>
          </ul>
        </div>

        {/* show data */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Total Prize Pool</h3>
            <p className={styles.statValue}>{poolAmount} MON</p>
          </div>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Your Contribution</h3>
            <p className={styles.statValue}>{userBalance} MON</p>
          </div>
        </div>

        {/* enter */}
        <div className={styles.entryForm}>
          <div className={styles.formContainer}>
            <input
              type="number"
              value={entryAmount}
              onChange={(e) => setEntryAmount(e.target.value)}
              placeholder="Enter MON amount"
              className={styles.inputField}
              step="0.01"
              min="0.05"
            />
            <button
              onClick={handleEnter}
              disabled={!account}
              className={styles.submitButton}
            >
              {account ? "Enter Raffle!" : "Connect Wallet First"}
            </button>
          </div>
        </div>

        {/* explanation */}
        <div className={styles.techNote}>
          <p className={styles.techNoteText}>
            In monad testnet, Chainlink has not yet implemented VRF and Keepers,
            but Chainlink's CCIP can be used in monad testnet. Therefore:
          </p>
          <ul className={styles.rulesList}>
            <li className={styles.rulesItem}>Using VRF on Avalanche's fuji net to generate random numbers for picking winners</li>
            <li className={styles.rulesItem}>Using Keepers on Avalanche's fuji net to periodically call pickWinner in Monad testnet</li>
          </ul>
        </div>

        {/* footer */}
        <div className={styles.footerLinks}>
          <a
            href="https://testnet.monadexplorer.com/address/0x472ed72434B35Bd562886256B5De87E887340D25?tab=Contract"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            Monad Contract➡
          </a>
          <a
            href="https://subnets-test.avax.network/c-chain/address/0x528508327b2fa3b5d622b7c83152f8fe5d6fa3f7"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            Avalanche Contract➡
          </a>
        </div>
      </main>
    </div>
  );
}