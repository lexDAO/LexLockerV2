const { artifacts, ethers } = require("hardhat");
const { BigNumber } = require("ethers")
const { expect } = require("chai");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const bentoAddress = "0xF5BCE5077908a1b7370B9ae04AdC565EBd643966";
const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
 
chai
  .use(solidity)
  .should();

const BASE_TEN = 10

// Defaults to e18 using amount * 10^18
function getBigNumber(amount, decimals = 18) {
  return BigNumber.from(amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
}

describe("LexLocker", function () {
  it("Should take an ERC20 token deposit and allow release by depositor", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();

    const bento = await ethers.getContractAt("IBentoBoxMinimal", bentoAddress);
 
    const Token = await ethers.getContractFactory("TestERC20");
    const token = await Token.deploy("poc", "poc");
    await token.deployed();
 
    const Locker = await ethers.getContractFactory("LexLocker");
    const locker = await Locker.deploy(bentoAddress, wethAddress);
    await locker.deployed();
 
    token.approve(bentoAddress, getBigNumber(10000));
    token.approve(locker.address, getBigNumber(10000));
    
    await locker.connect(resolver).registerResolver(true, 20);
    await locker.deposit(receiver.address, resolver.address, token.address, getBigNumber(1000), false, "TEST");
    await locker.release(1);
  });
 
  it("Should take an ETH deposit and allow release by depositor", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();
    
    const bento = await ethers.getContractAt("IBentoBoxMinimal", bentoAddress);

    // we use a token address as well to ensure nothing weird happens if user screws up
    const Token = await ethers.getContractFactory("TestERC20");
    const token = await Token.deploy("poc", "poc");
    await token.deployed();
 
    const Locker = await ethers.getContractFactory("LexLocker");
    const locker = await Locker.deploy(bentoAddress, wethAddress);
    await locker.deployed();

    await locker.connect(resolver).registerResolver(true, 20);
    await locker.deposit(receiver.address, resolver.address, token.address, getBigNumber(1000), false, "TEST", { value: getBigNumber(1000) });
    await locker.release(1);
  });

  it("Should enforce ETH deposit and locker value parity", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();

    const bento = await ethers.getContractAt("IBentoBoxMinimal", bentoAddress);

    const Token = await ethers.getContractFactory("TestERC20");
    const token = await Token.deploy("poc", "poc");
    await token.deployed();
 
    const Locker = await ethers.getContractFactory("LexLocker");
    const locker = await Locker.deploy(bentoAddress, wethAddress);
    await locker.deployed();
 
    await locker.connect(resolver).registerResolver(true, 20);
    await locker.deposit(receiver.address, resolver.address, token.address, getBigNumber(10000), false, "TEST", { value: getBigNumber(1000) }).should.be.revertedWith("wrong msg.value");
  });

  it("Should take an ERC20 token deposit, wrap into BentoBox, and allow release by depositor", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();

    const bento = await ethers.getContractAt("IBentoBoxMinimal", bentoAddress);
 
    const Token = await ethers.getContractFactory("TestERC20");
    const token = await Token.deploy("poc", "poc");
    await token.deployed();
 
    const Locker = await ethers.getContractFactory("LexLocker");
    const locker = await Locker.deploy(bentoAddress, wethAddress);
    await locker.deployed();
 
    token.approve(locker.address, getBigNumber(10000));
    
    await locker.connect(resolver).registerResolver(true, 20);
    await locker.depositBento(receiver.address, resolver.address, token.address, getBigNumber(1000), true, "TEST");
    await locker.release(1);
  });

  //it.only("Should take a BentoBox shares deposit and allow release by depositor", async function () {
  //  let depositor, receiver, resolver;
  //  [depositor, receiver, resolver] = await ethers.getSigners();

  //  const bento = await ethers.getContractAt("IBentoBoxMinimal", bentoAddress);
 
  //  const Token = await ethers.getContractFactory("TestERC20");
  //  const token = await Token.deploy("poc", "poc");
  //  await token.deployed();
 
  //  const Locker = await ethers.getContractFactory("LexLocker");
  //  const locker = await Locker.deploy(bentoAddress, wethAddress);
  //  await locker.deployed();
 
  //  token.approve(bentoAddress, getBigNumber(10000));
  //  bento.deposit(token.address, depositor.address, depositor.address, getBigNumber(0), 0);
    // approve locker to spend BentoBox shares
  //  await bento.setMasterContractApproval(depositor.address, locker.address, true, "0", "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000");
    
  //  await locker.connect(resolver).registerResolver(true, 20);
  //  await locker.depositBento(receiver.address, resolver.address, token.address, getBigNumber(0), false, "TEST");
  //  await locker.release(1);
  //});

  it("Should take an ERC721 NFT deposit and allow release by depositor", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();
 
    const NFT = await ethers.getContractFactory("TestERC721");
    const nft = await NFT.deploy("poc", "poc");
    await nft.deployed();
 
    const Locker = await ethers.getContractFactory("LexLocker");
    const locker = await Locker.deploy(bentoAddress, wethAddress);
    await locker.deployed();
 
    await nft.approve(locker.address, 1);
    
    await locker.connect(resolver).registerResolver(true, 20);
    await locker.deposit(receiver.address, resolver.address, nft.address, 1, true, "TEST");
    await locker.release(1);
  });

  it("Should forbid release by non-depositor", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();

    const bento = await ethers.getContractAt("IBentoBoxMinimal", bentoAddress);
 
    const Token = await ethers.getContractFactory("TestERC20");
    const token = await Token.deploy("poc", "poc");
    await token.deployed();
 
    const Locker = await ethers.getContractFactory("LexLocker");
    const locker = await Locker.deploy(bentoAddress, wethAddress);
    await locker.deployed();
    
    token.approve(bentoAddress, getBigNumber(10000));
    token.approve(locker.address, getBigNumber(10000));
    
    await locker.connect(resolver).registerResolver(true, 20);
    await locker.deposit(receiver.address, resolver.address, token.address, getBigNumber(1000), false, "TEST");
    await locker.connect(receiver).release(1).should.be.revertedWith("not depositor");
    await locker.connect(resolver).release(1).should.be.revertedWith("not depositor");
  });

  it("Should forbid repeat release", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();

    const bento = await ethers.getContractAt("IBentoBoxMinimal", bentoAddress);
 
    const Token = await ethers.getContractFactory("TestERC20");
    const token = await Token.deploy("poc", "poc");
    await token.deployed();
 
    const Locker = await ethers.getContractFactory("LexLocker");
    const locker = await Locker.deploy(bentoAddress, wethAddress);
    await locker.deployed();
 
    token.approve(bentoAddress, getBigNumber(10000));
    token.approve(locker.address, getBigNumber(10000));
    
    await locker.connect(resolver).registerResolver(true, 20);
    await locker.deposit(receiver.address, resolver.address, token.address, getBigNumber(1000), false, "TEST");
    await locker.release(1);
    await locker.release(1).should.be.reverted;
  });

  it("Should forbid release of nonexistent locker", async function () {
    const Locker = await ethers.getContractFactory("LexLocker");
    const locker = await Locker.deploy(bentoAddress, wethAddress);
    await locker.deployed();

    await locker.release(1).should.be.reverted;
  });

  it("Should allow lock by depositor", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();

    const bento = await ethers.getContractAt("IBentoBoxMinimal", bentoAddress);
 
    const Token = await ethers.getContractFactory("TestERC20");
    const token = await Token.deploy("poc", "poc");
    await token.deployed();
 
    const Locker = await ethers.getContractFactory("LexLocker");
    const locker = await Locker.deploy(bentoAddress, wethAddress);
    await locker.deployed();
 
    token.approve(bentoAddress, getBigNumber(10000));
    token.approve(locker.address, getBigNumber(10000));
    
    await locker.connect(resolver).registerResolver(true, 20);
    await locker.deposit(receiver.address, resolver.address, token.address, getBigNumber(1000), false, "TEST");
    await locker.lock(1);
  });

  it("Should allow lock by receiver", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();

    const bento = await ethers.getContractAt("IBentoBoxMinimal", bentoAddress);
 
    const Token = await ethers.getContractFactory("TestERC20");
    const token = await Token.deploy("poc", "poc");
    await token.deployed();
 
    const Locker = await ethers.getContractFactory("LexLocker");
    const locker = await Locker.deploy(bentoAddress, wethAddress);
    await locker.deployed();
 
    token.approve(bentoAddress, getBigNumber(10000));
    token.approve(locker.address, getBigNumber(10000));
    
    await locker.connect(resolver).registerResolver(true, 20);
    await locker.deposit(receiver.address, resolver.address, token.address, getBigNumber(1000), false, "TEST");
    await locker.connect(receiver).lock(1);
  });

  it("Should forbid lock by non-party", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();

    const bento = await ethers.getContractAt("IBentoBoxMinimal", bentoAddress);
 
    const Token = await ethers.getContractFactory("TestERC20");
    const token = await Token.deploy("poc", "poc");
    await token.deployed();
 
    const Locker = await ethers.getContractFactory("LexLocker");
    const locker = await Locker.deploy(bentoAddress, wethAddress);
    await locker.deployed();
 
    token.approve(bentoAddress, getBigNumber(10000));
    token.approve(locker.address, getBigNumber(10000));
    
    await locker.connect(resolver).registerResolver(true, 20);
    await locker.deposit(receiver.address, resolver.address, token.address, getBigNumber(1000), false, "TEST");
    await locker.connect(resolver).lock(1).should.be.revertedWith("not locker party");
  });
 
  it("Should allow resolution by resolver over ERC20", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();

    const bento = await ethers.getContractAt("IBentoBoxMinimal", bentoAddress);
 
    const Token = await ethers.getContractFactory("TestERC20");
    const token = await Token.deploy("poc", "poc");
    await token.deployed();
 
    const Locker = await ethers.getContractFactory("LexLocker");
    const locker = await Locker.deploy(bentoAddress, wethAddress);
    await locker.deployed();
 
    token.approve(bentoAddress, getBigNumber(10000));
    token.approve(locker.address, getBigNumber(10000));
    
    await locker.connect(resolver).registerResolver(true, 20);
    await locker.deposit(receiver.address, resolver.address, token.address, getBigNumber(1000), false, "TEST");
    await locker.lock(1);
    
    const resolutionAmount = getBigNumber(1000).div(2);

    await locker.connect(resolver).resolve(1, resolutionAmount, resolutionAmount, "TEST");
  });

  it("Should allow resolution by resolver over ETH", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();

    const bento = await ethers.getContractAt("IBentoBoxMinimal", bentoAddress);
 
    const Token = await ethers.getContractFactory("TestERC20");
    const token = await Token.deploy("poc", "poc");
    await token.deployed();
    
    const Locker = await ethers.getContractFactory("LexLocker");
    const locker = await Locker.deploy(bentoAddress, wethAddress);
    await locker.deployed();
 
    await locker.connect(resolver).registerResolver(true, 20);
    await locker.deposit(receiver.address, resolver.address, token.address, getBigNumber(1000), false, "TEST", { value: getBigNumber(1000) });
    await locker.lock(1);
    
    const resolutionAmount = getBigNumber(1000).div(2);

    await locker.connect(resolver).resolve(1, resolutionAmount, resolutionAmount, "TEST");
  });

  it("Should allow resolution by resolver over NFT", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();
 
    const NFT = await ethers.getContractFactory("TestERC721");
    const nft = await NFT.deploy("poc", "poc");
    await nft.deployed();
    
    const Locker = await ethers.getContractFactory("LexLocker");
    const locker = await Locker.deploy(bentoAddress, wethAddress);
    await locker.deployed();
 
    await nft.approve(locker.address, 1);
   
    await locker.connect(resolver).registerResolver(true, 20);
    await locker.deposit(receiver.address, resolver.address, nft.address, 1, true, "TEST");
    await locker.lock(1);

    await locker.connect(resolver).resolve(1, 1, 0, "TEST");
  });

  it("Should forbid resolution by non-resolver", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();

    const bento = await ethers.getContractAt("IBentoBoxMinimal", bentoAddress);
 
    const Token = await ethers.getContractFactory("TestERC20");
    const token = await Token.deploy("poc", "poc");
    await token.deployed();
 
    const Locker = await ethers.getContractFactory("LexLocker");
    const locker = await Locker.deploy(bentoAddress, wethAddress);
    await locker.deployed();
 
    token.approve(bentoAddress, getBigNumber(10000));
    token.approve(locker.address, getBigNumber(10000));
    
    await locker.connect(resolver).registerResolver(true, 20);
    await locker.deposit(receiver.address, resolver.address, token.address, getBigNumber(1000), false, "TEST");
    await locker.lock(1);
    
    const resolutionAmount = getBigNumber(1000).div(2);

    await locker.connect(depositor).resolve(1, resolutionAmount, resolutionAmount, "TEST").should.be.revertedWith("not resolver");
    await locker.connect(receiver).resolve(1, resolutionAmount, resolutionAmount, "TEST").should.be.revertedWith("not resolver");
  });
  
  it("Should forbid repeat resolution", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();

    const bento = await ethers.getContractAt("IBentoBoxMinimal", bentoAddress);
 
    const Token = await ethers.getContractFactory("TestERC20");
    const token = await Token.deploy("poc", "poc");
    await token.deployed();
 
    const Locker = await ethers.getContractFactory("LexLocker");
    const locker = await Locker.deploy(bentoAddress, wethAddress);
    await locker.deployed();
 
    token.approve(bentoAddress, getBigNumber(10000));
    token.approve(locker.address, getBigNumber(10000));
    
    await locker.connect(resolver).registerResolver(true, 20);
    await locker.deposit(receiver.address, resolver.address, token.address, getBigNumber(1000), false, "TEST");
    await locker.lock(1);
    
    const resolutionAmount = getBigNumber(1000).div(2);

    await locker.connect(resolver).resolve(1, resolutionAmount, resolutionAmount, "TEST");
    await locker.connect(resolver).resolve(1, resolutionAmount, resolutionAmount, "TEST").should.be.reverted;
  });
});
