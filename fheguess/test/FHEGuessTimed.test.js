const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("FHEGuessTimed", function () {
  let fheGuessTimed;
  let owner, alice, bob;
  let contractAddress;

  before(async function () {
    console.log("🧪 Setting up FHEGuessTimed tests...");
    
    // Get signers
    [owner, alice, bob] = await ethers.getSigners();
    console.log("👤 Owner:", owner.address);
    console.log("👤 Alice:", alice.address);
    console.log("👤 Bob:", bob.address);

    // Deploy contract
    const FHEGuessTimed = await ethers.getContractFactory("FHEGuessTimed");
    fheGuessTimed = await FHEGuessTimed.deploy();
    await fheGuessTimed.waitForDeployment();
    
    contractAddress = await fheGuessTimed.getAddress();
    console.log("📍 Contract deployed at:", contractAddress);
  });

  describe("⏰ Time Functions", function () {
    it("Should correctly calculate UTC+3 time", async function () {
      const currentHour = await fheGuessTimed.getCurrentHourUTC3();
      console.log("🕐 Current UTC+3 hour:", currentHour.toString());
      
      // UTC+3 saat 0-23 arasında olmalı
      expect(currentHour).to.be.gte(0);
      expect(currentHour).to.be.lt(24);
    });

    it("Should correctly identify odd/even hours", async function () {
      const isOdd = await fheGuessTimed.isOddHour();
      const isEven = await fheGuessTimed.isEvenHour();
      const currentHour = await fheGuessTimed.getCurrentHourUTC3();
      
      console.log("⚡ Hour type check:");
      console.log("   Current hour:", currentHour.toString());
      console.log("   Is odd:", isOdd);
      console.log("   Is even:", isEven);
      
      // Bir tanesi true olmalı, diğeri false
      expect(isOdd !== isEven).to.be.true;
      
      // Saate göre kontrol
      if (Number(currentHour) % 2 === 1) {
        expect(isOdd).to.be.true;
        expect(isEven).to.be.false;
      } else {
        expect(isOdd).to.be.false;
        expect(isEven).to.be.true;
      }
    });
  });

  describe("🎮 Game Logic", function () {
    it("Should initialize with correct default values", async function () {
      const currentRound = await fheGuessTimed.currentRound();
      const roundInfo = await fheGuessTimed.getCurrentRoundInfo();
      
      console.log("📊 Initial state:");
      console.log("   Current round:", currentRound.toString());
      console.log("   Number generated:", roundInfo[1]);
      console.log("   Round ended:", roundInfo[2]);
      console.log("   Player count:", roundInfo[4].toString());
      
      expect(currentRound).to.equal(1);
      expect(roundInfo[1]).to.be.false; // numberGenerated
      expect(roundInfo[2]).to.be.false; // roundEnded
      expect(roundInfo[4]).to.equal(0); // playerCount
    });

    it("Should start new round during odd hours", async function () {
      const isOdd = await fheGuessTimed.isOddHour();
      
      if (isOdd) {
        console.log("🎲 Testing round start (odd hour)...");
        
        const tx = await fheGuessTimed.startNewRound();
        await tx.wait();
        
        const roundInfo = await fheGuessTimed.getCurrentRoundInfo();
        console.log("   Round started, number generated:", roundInfo[1]);
        
        expect(roundInfo[1]).to.be.true; // numberGenerated
      } else {
        console.log("⏭️ Skipping round start test (even hour)");
        
        // Even hour'da start round çağrılamaz
        await expect(fheGuessTimed.startNewRound()).to.be.reverted;
      }
    });

    it("Should submit guess during guess time", async function () {
      // Önce round başlatılmış olmalı
      const roundInfo = await fheGuessTimed.getCurrentRoundInfo();
      
      if (roundInfo[1]) { // numberGenerated
        console.log("🎯 Testing guess submission...");
        
        const guess = 42;
        const tx = await fheGuessTimed.connect(alice).submitGuess(guess);
        await tx.wait();
        
        const playerStatus = await fheGuessTimed.getPlayerGuessStatus(alice.address);
        console.log("   Alice guess status:", playerStatus[0]);
        
        expect(playerStatus[0]).to.be.true; // hasGuessed
      } else {
        console.log("⏭️ Skipping guess test (no round active)");
      }
    });

    it("Should prevent duplicate guesses", async function () {
      const playerStatus = await fheGuessTimed.getPlayerGuessStatus(alice.address);
      
      if (playerStatus[0]) { // hasGuessed
        console.log("🚫 Testing duplicate guess prevention...");
        
        await expect(
          fheGuessTimed.connect(alice).submitGuess(50)
        ).to.be.revertedWith("Already guessed this round");
      } else {
        console.log("⏭️ Skipping duplicate guess test (Alice hasn't guessed)");
      }
    });

    it("Should validate guess range", async function () {
      console.log("📏 Testing guess validation...");
      
      // 100'den büyük değer
      await expect(
        fheGuessTimed.connect(bob).submitGuess(101)
      ).to.be.revertedWith("Guess must be between 0-100");
      
      console.log("   Range validation working ✅");
    });
  });

  describe("📊 View Functions", function () {
    it("Should return correct round history", async function () {
      const currentRound = await fheGuessTimed.currentRound();
      const history = await fheGuessTimed.getRoundHistory(currentRound);
      
      console.log("📈 Round history for round", currentRound.toString());
      console.log("   Ended:", history[0]);
      console.log("   Winner:", history[1]);
      console.log("   Winning number:", history[2].toString());
      console.log("   Player count:", history[5].toString());
    });

    it("Should return game status correctly", async function () {
      const isGuessActive = await fheGuessTimed.isGuessTimeActive();
      const isRevealActive = await fheGuessTimed.isRevealTimeActive();
      
      console.log("🎮 Game status:");
      console.log("   Guess active:", isGuessActive);
      console.log("   Reveal active:", isRevealActive);
      
      // İkisi aynı anda true olamaz
      expect(isGuessActive && isRevealActive).to.be.false;
    });
  });

  after(function () {
    console.log("\n🎉 All tests completed!");
    console.log("📍 Contract address for frontend:", contractAddress);
  });
});
