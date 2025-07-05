# FHEGuess - Fully Encrypted Number Guessing Game

<div align="center">

![FHEGuess Logo](https://img.shields.io/badge/FHEGuess-Encrypted%20Gaming-gold?style=for-the-badge&logo=ethereum)

**A privacy-preserving number guessing game built with Zama's FHEVM technology**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-zama--fheguess.coinsspor.com-success?style=for-the-badge)](https://zama-fheguess.coinsspor.com/)
[![Sepolia](https://img.shields.io/badge/Network-Sepolia_Testnet-blue?style=for-the-badge)](https://sepolia.etherscan.io/)
[![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

## 🎯 What is FHEGuess?

FHEGuess is a revolutionary number guessing game that leverages **Fully Homomorphic Encryption (FHE)** to create a completely private gaming experience. Players submit encrypted guesses that remain hidden throughout the game, ensuring true zero-knowledge gameplay.

### 🔗 **Live Application**
**Demo:** [https://zama-fheguess.coinsspor.com/](https://zama-fheguess.coinsspor.com/)

## 🌟 Key Features

### 🔐 **Privacy-First Gaming**
- **Fully Encrypted Gameplay**: All guesses are encrypted on-chain using Zama's FHEVM
- **Zero-Knowledge Privacy**: No player can see others' guesses until results are revealed
- **Confidential Smart Contracts**: Game logic operates on encrypted data without decryption

### ⏰ **Time-Based Round System**
- **Odd Hours (13:00, 15:00, 17:00...)**: Round initiation and guess submission
- **Even Hours (14:00, 16:00, 18:00...)**: Result revelation and winner announcement
- **UTC+3 Timezone**: Real-time scheduling system

### 🎮 **How to Play**
1. **Connect Wallet**: MetaMask integration with Sepolia testnet
2. **Wait for Odd Hour**: Rounds start automatically during odd hours
3. **Submit Encrypted Guess**: Enter a number between 0-100
4. **Wait for Reveal**: Results disclosed during even hours
5. **Winner Selection**: Closest guess to the secret number wins

## 🛠️ Technology Stack

### **Smart Contracts**
- **Solidity ^0.8.24**: Smart contract development
- **Zama FHEVM**: Fully Homomorphic Encryption library
- **Hardhat**: Development environment and testing framework
- **Sepolia Testnet**: Ethereum test network deployment

### **Frontend**
- **React 19**: User interface framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Ethers.js 6**: Blockchain interaction library
- **Custom CSS**: Terminal-style UI design

### **Infrastructure**
- **Nginx**: Reverse proxy and web server
- **Certbot**: SSL certificate management
- **Domain**: Custom domain with HTTPS support

## 📦 Project Structure

```
fheguess/
├── contracts/                 # Smart Contracts
│   ├── FHEGuessTimed.sol     # Main game contract
│   └── FHECounter.sol        # Example counter contract
├── scripts/                   # Deployment Scripts
│   └── deploy-fheguess.js    # Main deployment script
├── test/                      # Contract Tests
│   └── FHEGuessTimed.test.js # Comprehensive test suite
├── frontend/                  # React Application
│   ├── src/
│   │   ├── App.tsx           # Main application component
│   │   ├── custom.css        # Styling
│   │   └── assets/           # Static assets
│   ├── package.json          # Frontend dependencies
│   └── vite.config.ts        # Vite configuration
├── hardhat.config.ts          # Hardhat configuration
├── package.json               # Contract dependencies
└── README.md                  # This file
```

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js 18+** (LTS recommended)
- **MetaMask** browser extension
- **Sepolia ETH** for gas fees

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/fheguess.git
cd fheguess
```

### 2. Smart Contract Setup
```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Sepolia (optional)
npx hardhat run scripts/deploy-fheguess.js --network sepolia
```

### 3. Frontend Setup
```bash
# Navigate to frontend
cd frontend/

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### 4. Environment Configuration
Create `.env` file in project root:
```env
MNEMONIC="your twelve word seed phrase here"
INFURA_API_KEY="your_infura_project_id"
```

## 🔐 FHE Operations Deep Dive

### Core FHEVM Functions Used

#### **Random Number Generation**
```solidity
euint8 randomNumber = FHE.randEuint8(); // Generates encrypted random 0-255
```

#### **Encrypted Input Processing**
```solidity
euint8 encryptedGuess = FHE.asEuint8(_guess); // Convert plaintext to encrypted
```

#### **Access Control Management**
```solidity
FHE.allowThis(randomNumber);           // Grant contract access
FHE.allow(encryptedGuess, msg.sender); // Grant user access
```

#### **Async Decryption Oracle**
```solidity
bytes32[] memory cts = new bytes32[](1);
cts[0] = FHE.toBytes32(round.secretNumber);
FHE.requestDecryption(cts, this.processReveal.selector);
```

#### **Signature Verification**
```solidity
FHE.checkSignatures(requestId, signatures); // Verify KMS signatures
```

## 📋 Smart Contract API

### Main Functions

#### `startNewRound()`
- **Access**: Public (only during odd hours)
- **Function**: Generates encrypted random number and initiates new round
- **Gas**: ~166,427

#### `submitGuess(uint8 _guess)`
- **Access**: Public (only during guess time)
- **Parameters**: `_guess` - Number between 0-100
- **Function**: Encrypts and stores player guess
- **Gas**: ~212,252

#### `revealResult()`
- **Access**: Public (only during even hours)
- **Function**: Triggers decryption oracle to reveal results
- **Requirements**: Active round with players

#### `getCurrentRoundInfo()`
- **Access**: View function
- **Returns**: `(uint8 round, bool numberGenerated, bool roundEnded, uint256 startTime, uint256 playerCount)`

#### `getPlayerGuessStatus(address player)`
- **Access**: View function
- **Returns**: `(bool hasGuessed, uint256 timestamp)`

### Time Helper Functions

#### `getCurrentHourUTC3()`
- **Returns**: Current hour in UTC+3 timezone

#### `isOddHour()` / `isEvenHour()`
- **Returns**: Boolean indicating current hour type

#### `isGuessTimeActive()` / `isRevealTimeActive()`
- **Returns**: Boolean indicating current game phase

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/FHEGuessTimed.test.js

# Run tests with gas reporting
npx hardhat test --network hardhat
```

### Test Coverage
- ✅ **Time Functions**: UTC+3 calculations, odd/even hour detection
- ✅ **Game Logic**: Round initialization, guess submission, duplicate prevention
- ✅ **Validation**: Input range checking, access control
- ✅ **View Functions**: Status queries, round history

### Sample Test Output
```
  FHEGuess Timed
    ⏰ Time Functions
      ✓ Should correctly calculate UTC+3 time
      ✓ Should correctly identify odd/even hours
    🎮 Game Logic  
      ✓ Should initialize with correct default values
      ✓ Should start new round during odd hours
      ✓ Should submit guess during guess time
      ✓ Should prevent duplicate guesses
      ✓ Should validate guess range
    📊 View Functions
      ✓ Should return correct round history
      ✓ Should return game status correctly

  9 passing (57ms)
```

## 🌐 Deployment Information

### **Smart Contract**
- **Address**: `0x4Ec99867250a377B4cc07A6989CcC664aEA935D3`
- **Network**: Sepolia Testnet
- **Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0x4Ec99867250a377B4cc07A6989CcC664aEA935D3)

### **Frontend**
- **URL**: [https://zama-fheguess.coinsspor.com/](https://zama-fheguess.coinsspor.com/)
- **SSL**: Let's Encrypt certificate
- **Server**: Nginx reverse proxy

### **Deployment Commands**
```bash
# Contract deployment
npx hardhat run scripts/deploy-fheguess.js --network sepolia

# Frontend deployment
npm run build
# Deploy dist/ to web server
```

## 🔒 Security Considerations

### **FHE Security Features**
- **Confidential Computation**: All sensitive operations performed on encrypted data
- **Access Control Lists**: Granular permissions for ciphertext access
- **Oracle Verification**: KMS signature validation for decryption results
- **Replay Protection**: Transaction-bound encryption prevents reuse attacks

### **Smart Contract Security**
- **Input Validation**: Range checking for all user inputs
- **Time-based Access Control**: Function restrictions based on hour type
- **Duplicate Prevention**: Single guess per player per round
- **Safe Math**: Overflow protection in calculations

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🔗 Links and Resources

### **Project Links**
- **Live Demo**: [https://zama-fheguess.coinsspor.com/](https://zama-fheguess.coinsspor.com/)
- **Smart Contract**: [0x4Ec99867250a377B4cc07A6989CcC664aEA935D3](https://sepolia.etherscan.io/address/0x4Ec99867250a377B4cc07A6989CcC664aEA935D3)
- **Website**: [coinsspor.com](https://coinsspor.com)

### **Technology Documentation**
- **Zama FHEVM**: [docs.zama.ai](https://docs.zama.ai)
- **Hardhat**: [hardhat.org](https://hardhat.org)
- **React**: [reactjs.org](https://reactjs.org)
- **Vite**: [vitejs.dev](https://vitejs.dev)

### **Blockchain Resources**
- **Sepolia Testnet**: [sepoliafaucet.com](https://sepoliafaucet.com)
- **MetaMask**: [metamask.io](https://metamask.io)
- **Etherscan**: [sepolia.etherscan.io](https://sepolia.etherscan.io)

## 📞 Contact

**Developer**: Erdal Fatih  
**Email**: erdalfatih@gmail.com  
**Organization**: Coinsspor  

---

<div align="center">

**Built with ❤️ using Zama's FHEVM technology**

[![Zama](https://img.shields.io/badge/Powered_by-Zama_FHEVM-gold?style=flat-square)](https://zama.ai)
[![Ethereum](https://img.shields.io/badge/Built_on-Ethereum-blue?style=flat-square)](https://ethereum.org)
[![React](https://img.shields.io/badge/Frontend-React-61dafb?style=flat-square)](https://reactjs.org)

</div>
