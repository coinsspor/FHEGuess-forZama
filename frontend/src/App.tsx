import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './custom.css';
import logoZama from './assets/logozama.png';

// Contract configuration - REAL SEPOLIA DEPLOYMENT
const CONTRACT_ADDRESS = "0x4Ec99867250a377B4cc07A6989CcC664aEA935D3";
const CONTRACT_ABI = [
  "function submitGuess(uint8 _guess) external",
  "function startNewRound() external",
  "function revealResult() external",
  "function getCurrentRoundInfo() external view returns (uint8, bool, bool, uint256, uint256)",
  "function getPlayerGuessStatus(address) external view returns (bool, uint256)",
  "function getCurrentHourUTC3() external view returns (uint256)",
  "function isOddHour() external view returns (bool)",
  "function isEvenHour() external view returns (bool)",
  "function isGuessTimeActive() external view returns (bool)",
  "function isRevealTimeActive() external view returns (bool)",
  "function getRoundHistory(uint8) external view returns (bool, address, uint8, uint256, uint256, uint256)",
  "event RoundStarted(uint8 indexed round, uint256 startTime)",
  "event GuessSubmitted(address indexed player, uint8 indexed round)",
  "event RoundEnded(uint8 indexed round, address indexed winner, uint8 secretNumber)",
  "event NoWinner(uint8 indexed round, uint8 secretNumber)"
];

interface RoundInfo {
  round: number;
  numberGenerated: boolean;
  roundEnded: boolean;
  startTime: number;
  playerCount: number;
}

interface PlayerStatus {
  hasGuessed: boolean;
  timestamp: number;
}

function App() {
  // State variables
  const [account, setAccount] = useState<string>('');
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [guess, setGuess] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [roundInfo, setRoundInfo] = useState<RoundInfo | null>(null);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus | null>(null);
  const [isOddHour, setIsOddHour] = useState<boolean>(false);
  const [isEvenHour, setIsEvenHour] = useState<boolean>(false);
  const [isGuessActive, setIsGuessActive] = useState<boolean>(false);
  const [isRevealActive, setIsRevealActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Connect wallet to start playing on Sepolia!');

  // UTC+3 saatini doÄŸru hesapla
  const getUTC3Time = () => {
    const now = new Date();
    // Ã–nce UTC'ye Ã§evir, sonra +3 saat ekle
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const utc3 = new Date(utc + (3 * 60 * 60 * 1000));
    return utc3;
  };

  // UTC+3 saatinin tek mi Ã§ift mi olduÄŸunu kontrol et
  const checkHourType = (date: Date) => {
    const hour = date.getHours();
    return {
      isOdd: hour % 2 === 1,
      isEven: hour % 2 === 0,
      hour: hour
    };
  };

  // Saat deÄŸiÅŸtiÄŸinde otomatik refresh
  useEffect(() => {
    const timer = setInterval(() => {
      const utc3Time = getUTC3Time();
      setCurrentTime(utc3Time);
      
      const hourInfo = checkHourType(utc3Time);
      setIsOddHour(hourInfo.isOdd);
      setIsEvenHour(hourInfo.isEven);
      
      // Kontrat baÄŸlÄ±ysa durumlarÄ± gÃ¼ncelle
      if (contract) {
        updateGameStatus();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [contract]);

  // Real wallet baÄŸlantÄ±sÄ±
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      setLoading(true);
      setMessage('Connecting to MetaMask...');

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Sepolia network check
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') { // Sepolia chain ID
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia Test Network',
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18
                },
                blockExplorerUrls: ['https://sepolia.etherscan.io/']
              }]
            });
          }
        }
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setAccount(accounts[0]);
      setContract(contractInstance);
      setMessage('Connected to Sepolia! í ¼í¾‰');
      
      // Ä°lk durumu yÃ¼kle
      await updateGameStatus();
      
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setMessage('Wallet connection failed âŒ');
    } finally {
      setLoading(false);
    }
  };

  // Oyun durumunu gÃ¼ncelle
  const updateGameStatus = async () => {
    if (!contract) return;

    try {
      // Round bilgilerini al
      const roundData = await contract.getCurrentRoundInfo();
      setRoundInfo({
        round: Number(roundData[0]),
        numberGenerated: roundData[1],
        roundEnded: roundData[2],
        startTime: Number(roundData[3]),
        playerCount: Number(roundData[4])
      });

      // Player durumunu al
      if (account) {
        const playerData = await contract.getPlayerGuessStatus(account);
        setPlayerStatus({
          hasGuessed: playerData[0],
          timestamp: Number(playerData[1])
        });
      }

      // Oyun durumlarÄ±nÄ± al
      const guessActive = await contract.isGuessTimeActive();
      const revealActive = await contract.isRevealTimeActive();
      
      setIsGuessActive(guessActive);
      setIsRevealActive(revealActive);

    } catch (error) {
      console.error('Failed to update game status:', error);
    }
  };

  // Real tahmin gÃ¶nder
  const submitGuess = async () => {
    if (!contract || !guess) {
      setMessage('Please connect wallet and enter a guess!');
      return;
    }

    const guessNum = parseInt(guess);
    if (guessNum < 0 || guessNum > 100) {
      setMessage('Guess must be between 0-100!');
      return;
    }

    if (!isGuessActive) {
      setMessage('Guess time is not active!');
      return;
    }

    if (playerStatus?.hasGuessed) {
      setMessage('You already guessed this round!');
      return;
    }

    try {
      setLoading(true);
      setMessage('Submitting encrypted guess to blockchain...');
      
      const tx = await contract.submitGuess(guessNum);
      setMessage('Transaction sent! Waiting for confirmation...');
      
      await tx.wait();
      
      setMessage(`Guess ${guessNum} submitted successfully! í ¼í¾‰`);
      setGuess('');
      await updateGameStatus();
      
    } catch (error) {
      console.error('Submit guess failed:', error);
      setMessage('Failed to submit guess âŒ');
    } finally {
      setLoading(false);
    }
  };

  // Real yeni round baÅŸlat
  const startNewRound = async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      setMessage('Starting new round on blockchain...');
      
      const tx = await contract.startNewRound();
      setMessage('Transaction sent! Waiting for confirmation...');
      
      await tx.wait();
      
      setMessage('New round started! í ½íº€');
      await updateGameStatus();
      
    } catch (error) {
      console.error('Start round failed:', error);
      setMessage('Failed to start round âŒ');
    } finally {
      setLoading(false);
    }
  };

  // Real sonuÃ§ aÃ§Ä±kla
  const revealResult = async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      setMessage('Revealing result on blockchain...');
      
      const tx = await contract.revealResult();
      setMessage('Transaction sent! Waiting for decryption...');
      
      await tx.wait();
      
      setMessage('Result reveal requested! Wait for decryption oracle... â³');
      await updateGameStatus();
      
    } catch (error) {
      console.error('Reveal result failed:', error);
      setMessage('Failed to reveal result âŒ');
    } finally {
      setLoading(false);
    }
  };

  // Durum mesajÄ±
  const getStatusMessage = () => {
    if (!contract) return 'Connect wallet to start playing!';
    
    if (isOddHour && roundInfo && !roundInfo.numberGenerated) {
      return 'í ¼í¾² Odd hour! New round can be started!';
    }
    
    if (isOddHour && isGuessActive) {
      return 'â° Guess time! Submit your prediction!';
    }
    
    if (isEvenHour && isRevealActive) {
      return 'í ½í´ Even hour! Results can be revealed!';
    }
    
    if (roundInfo?.roundEnded) {
      return 'âœ… Round ended! Waiting for next odd hour...';
    }
    
    return 'Waiting for next round...';
  };

  // Kalan sÃ¼re hesapla
  const getTimeUntilNextHour = () => {
    const now = getUTC3Time();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    const diff = nextHour.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="terminal-box">
      <img src={logoZama} alt="Zama Logo" className="logo" />
      <h1 className="title">FHEGuess</h1>

      {/* Real Blockchain Info */}
      <div className="blockchain-info">
        <p>&gt; <strong>LIVE ON SEPOLIA</strong> - Real blockchain deployment active!</p>
        <p>&gt; Contract: <span className="highlight">0x4Ec9...5D3</span></p>
      </div>

      {/* Zaman GÃ¶stergesi */}
      <div className="time-info">
        <p>&gt; Current UTC+3 Time: <span className="highlight">{currentTime.toLocaleTimeString()}</span></p>
        <p>&gt; Current Hour: <span className="highlight">{currentTime.getHours()}:00</span> 
           {isOddHour && <span className="odd-hour"> (ODD - Round Start Time!)</span>}
           {isEvenHour && <span className="even-hour"> (EVEN - Reveal Time!)</span>}
        </p>
        <p>&gt; Time until next hour: <span className="highlight">{getTimeUntilNextHour()}</span></p>
      </div>

      {/* Round Bilgisi */}
      {roundInfo && (
        <div className="round-info">
          <p>&gt; Current Round: <span className="highlight">#{roundInfo.round}</span></p>
          <p>&gt; Players: <span className="highlight">{roundInfo.playerCount}</span></p>
          <p>&gt; Status: <span className="highlight">{getStatusMessage()}</span></p>
          {playerStatus?.hasGuessed && (
            <p>&gt; Your Status: <span className="highlight">âœ… Guess Submitted</span></p>
          )}
        </div>
      )}

      <div className="terminal-text">
        <p>&gt; Welcome to FHEGuess â€“ a fully encrypted number guessing game powered by Zama's FHE technology.</p>
        <p>&gt; Your goal: Guess a number between 0 and 100.</p>
        <p>&gt; All guesses are encrypted on-chain.</p>
        <p>&gt; No one (not even the game host) can see them.</p>
        <p>&gt; At the end of each round, all guesses are decrypted and the closest guess wins!</p>
        <p>&gt; <strong>NEW:</strong> Odd hours (13:00, 15:00, 17:00...) start new rounds.</p>
        <p>&gt; <strong>NEW:</strong> Even hours (14:00, 16:00, 18:00...) reveal results.</p>
        <p>&gt; Powered by FHEVM â€“ secure, private, fun.</p>
      </div>

      {/* Mesaj GÃ¶stergesi */}
      {message && (
        <div className="message-box">
          <p>&gt; {message}</p>
        </div>
      )}

      {/* Guess Input - Sadece guess time'da aktif */}
      {account && isGuessActive && !playerStatus?.hasGuessed && (
        <input
          className="input-box"
          type="number"
          placeholder="Enter your guess (0-100)"
          min="0"
          max="100"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          disabled={loading}
        />
      )}

      <div className="button-group">
        {!account ? (
          <button 
            className="wallet-button" 
            onClick={connectWallet}
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <>
            <button className="wallet-button connected" disabled>
              {account.slice(0, 6)}...{account.slice(-4)}
            </button>
            
            {/* Guess Button - Sadece guess time'da */}
            {isGuessActive && !playerStatus?.hasGuessed && (
              <button 
                className="button guess-button" 
                onClick={submitGuess}
                disabled={loading || !guess}
              >
                {loading ? 'Submitting...' : 'Submit Guess'}
              </button>
            )}
            
            {/* Start Round Button - Sadece odd hours'da */}
            {isOddHour && roundInfo && (!roundInfo.numberGenerated || roundInfo.roundEnded) && (
              <button 
                className="button start-round" 
                onClick={startNewRound}
                disabled={loading}
              >
                {loading ? 'Starting...' : 'Start New Round'}
              </button>
            )}
            
            {/* Reveal Button - Sadece even hours'da */}
            {isRevealActive && (
              <button 
                className="button reveal-result" 
                onClick={revealResult}
                disabled={loading}
              >
                {loading ? 'Revealing...' : 'Reveal Result'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="footer">
        <p>&gt; Live on Sepolia Testnet! Real FHE encryption in action!</p>
      </div>
    </div>
  );
}

export default App;