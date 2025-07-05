const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying FHEGuessTimed contract to Sepolia...");
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Get balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  // Deploy contract
  const FHEGuessTimed = await ethers.getContractFactory("FHEGuessTimed");
  
  console.log("⏳ Deploying contract...");
  const fheGuessTimed = await FHEGuessTimed.deploy();
  
  console.log("⌛ Waiting for deployment confirmation...");
  await fheGuessTimed.waitForDeployment();
  
  const contractAddress = await fheGuessTimed.getAddress();
  console.log("✅ FHEGuessTimed deployed to:", contractAddress);
  
  // Verify contract setup
  console.log("🔍 Verifying contract setup...");
  
  try {
    const currentRound = await fheGuessTimed.currentRound();
    console.log("📊 Current round:", currentRound.toString());
    
    const currentHour = await fheGuessTimed.getCurrentHourUTC3();
    console.log("🕐 Current UTC+3 hour:", currentHour.toString());
    
    const isOdd = await fheGuessTimed.isOddHour();
    const isEven = await fheGuessTimed.isEvenHour();
    console.log("⚡ Hour type:", isOdd ? "ODD (Tek)" : "EVEN (Çift)");
    
    const isGuessActive = await fheGuessTimed.isGuessTimeActive();
    const isRevealActive = await fheGuessTimed.isRevealTimeActive();
    console.log("🎮 Guess active:", isGuessActive);
    console.log("🔍 Reveal active:", isRevealActive);
    
  } catch (error) {
    console.log("⚠️ Contract setup verification failed:", error.message);
  }
  
  console.log("\n📋 Contract Deployment Summary:");
  console.log("================================");
  console.log("Contract Address:", contractAddress);
  console.log("Network: Sepolia");
  console.log("Deployer:", deployer.address);
  console.log("\n🔗 Add this address to your frontend:");
  console.log(`const CONTRACT_ADDRESS = "${contractAddress}";`);
  
  return contractAddress;
}

main()
  .then((address) => {
    console.log("\n🎉 Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
