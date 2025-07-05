// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract FHEGuessTimed is SepoliaConfig {
    
    address public owner;
    uint8 public currentRound;
    uint256 public lastRoundTime;
    
    // UTC+3 timezone offset (3 hours = 10800 seconds)
    uint256 constant UTC_OFFSET = 10800;
    
    struct PlayerGuess {
        euint8 encryptedGuess;
        bool hasGuessed;
        uint256 timestamp;
    }
    
    struct Round {
        euint8 secretNumber;
        bool numberGenerated;
        bool roundEnded;
        address winner;
        uint8 winningNumber;
        uint256 startTime;
        uint256 endTime;
        address[] players;
    }
    
    mapping(uint8 => Round) public rounds;
    mapping(uint8 => mapping(address => PlayerGuess)) public playerGuesses;
    
    event RoundStarted(uint8 indexed round, uint256 startTime);
    event GuessSubmitted(address indexed player, uint8 indexed round);
    event RoundEnded(uint8 indexed round, address indexed winner, uint8 secretNumber);
    event NoWinner(uint8 indexed round, uint8 secretNumber);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    modifier onlyDuringGuessTime() {
        require(isGuessTimeActive(), "Not guess time");
        _;
    }
    
    modifier onlyDuringRevealTime() {
        require(isRevealTimeActive(), "Not reveal time");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        currentRound = 1;
        lastRoundTime = block.timestamp;
    }
    
    // UTC+3 saatine göre tek saat mi kontrol et (13:00, 15:00, 17:00...)
    function isOddHour() public view returns (bool) {
        uint256 adjustedTime = block.timestamp + UTC_OFFSET;
        uint256 currentHour = (adjustedTime / 3600) % 24;
        return currentHour % 2 == 1;
    }
    
    // UTC+3 saatine göre çift saat mi kontrol et (14:00, 16:00, 18:00...)
    function isEvenHour() public view returns (bool) {
        uint256 adjustedTime = block.timestamp + UTC_OFFSET;
        uint256 currentHour = (adjustedTime / 3600) % 24;
        return currentHour % 2 == 0;
    }
    
    // Tahmin yapma zamanı aktif mi?
    function isGuessTimeActive() public view returns (bool) {
        if (!rounds[currentRound].numberGenerated) return false;
        if (rounds[currentRound].roundEnded) return false;
        return isOddHour() || (!isEvenHour() && rounds[currentRound].numberGenerated);
    }
    
    // Sonuç açıklama zamanı aktif mi?
    function isRevealTimeActive() public view returns (bool) {
        return isEvenHour() && rounds[currentRound].numberGenerated && !rounds[currentRound].roundEnded;
    }
    
    // Yeni round başlat ve rastgele sayı üret (Tek saatlerde: 13:00, 15:00, 17:00...)
    function startNewRound() external {
        require(isOddHour(), "Can only start round during odd hours");
        require(!rounds[currentRound].numberGenerated || rounds[currentRound].roundEnded, "Round already active");
        
        // Zama FHEVM ile rastgele sayı üret (0-100 arası)
        euint8 randomNumber = FHE.randEuint8(); // 0-255 arası
        
        rounds[currentRound] = Round({
            secretNumber: randomNumber,
            numberGenerated: true,
            roundEnded: false,
            winner: address(0),
            winningNumber: 0,
            startTime: block.timestamp,
            endTime: 0,
            players: new address[](0)
        });
        
        // Kontrata erişim izni ver
        FHE.allowThis(randomNumber);
        
        emit RoundStarted(currentRound, block.timestamp);
    }
    
    // Tahmin gönder (Tek saatlerde ve çift saate kadar)
    function submitGuess(uint8 _guess) external onlyDuringGuessTime {
        require(_guess <= 100, "Guess must be between 0-100");
        require(!playerGuesses[currentRound][msg.sender].hasGuessed, "Already guessed this round");
        
        // Tahmini şifrele
        euint8 encryptedGuess = FHE.asEuint8(_guess);
        
        playerGuesses[currentRound][msg.sender] = PlayerGuess({
            encryptedGuess: encryptedGuess,
            hasGuessed: true,
            timestamp: block.timestamp
        });
        
        rounds[currentRound].players.push(msg.sender);
        
        // ACL izinleri ver
        FHE.allowThis(encryptedGuess);
        FHE.allow(encryptedGuess, msg.sender);
        
        emit GuessSubmitted(msg.sender, currentRound);
    }
    
    // Sonucu açıkla ve kazananı bul (Çift saatlerde: 14:00, 16:00, 18:00...)
    function revealResult() external onlyDuringRevealTime {
        require(rounds[currentRound].numberGenerated, "No number generated");
        require(!rounds[currentRound].roundEnded, "Round already ended");
        
        Round storage round = rounds[currentRound];
        
        // Async decryption için request gönder
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(round.secretNumber);
        FHE.requestDecryption(cts, this.processReveal.selector);
    }
    
    // Decryption callback - Sonucu işle
    function processReveal(
        uint256 requestId,
        uint8 secretNumber,
        bytes[] memory signatures
    ) external {
        // Signature doğrula
        FHE.checkSignatures(requestId, signatures);
        
        Round storage round = rounds[currentRound];
        round.winningNumber = secretNumber;
        round.endTime = block.timestamp;
        
        // Basitleştirilmiş kazanan bulma
        address winner = _findWinnerSimple(secretNumber);
        
        round.roundEnded = true;
        
        if (winner != address(0)) {
            round.winner = winner;
            emit RoundEnded(currentRound, winner, secretNumber);
        } else {
            emit NoWinner(currentRound, secretNumber);
        }
        
        // Bir sonraki round'a geç
        currentRound++;
    }
    
    // Kazanan bulma fonksiyonu - basitleştirilmiş versiyon
    function _findWinnerSimple(uint8 secretNumber) private returns (address winner) {
        Round storage round = rounds[currentRound];
        uint8 minDifference = 255;
        address currentWinner = address(0);
        
        // Bu basit implementasyonda tüm oyuncuların tahminlerini decrypt etmek gerekir
        // Gerçek implementasyonda bu async olarak yapılır
        for (uint i = 0; i < round.players.length; i++) {
            address player = round.players[i];
            // Şimdilik winner selection mantığını basit tutuyoruz
            // Gerçek implementasyonda FHE comparison kullanılır
        }
        
        return currentWinner;
    }
    
    // Mevcut round bilgisini al
    function getCurrentRoundInfo() external view returns (
        uint8 round,
        bool numberGenerated,
        bool roundEnded,
        uint256 startTime,
        uint256 playerCount
    ) {
        Round storage currentRoundData = rounds[currentRound];
        return (
            currentRound,
            currentRoundData.numberGenerated,
            currentRoundData.roundEnded,
            currentRoundData.startTime,
            currentRoundData.players.length
        );
    }
    
    // Player'ın tahmin durumunu kontrol et
    function getPlayerGuessStatus(address player) external view returns (
        bool hasGuessed,
        uint256 timestamp
    ) {
        PlayerGuess storage guess = playerGuesses[currentRound][player];
        return (guess.hasGuessed, guess.timestamp);
    }
    
    // UTC+3 saatini al
    function getCurrentHourUTC3() external view returns (uint256) {
        uint256 adjustedTime = block.timestamp + UTC_OFFSET;
        return (adjustedTime / 3600) % 24;
    }
    
    // Round geçmişini al
    function getRoundHistory(uint8 roundNumber) external view returns (
        bool roundEnded,
        address winner,
        uint8 winningNumber,
        uint256 startTime,
        uint256 endTime,
        uint256 playerCount
    ) {
        Round storage round = rounds[roundNumber];
        return (
            round.roundEnded,
            round.winner,
            round.winningNumber,
            round.startTime,
            round.endTime,
            round.players.length
        );
    }
}
