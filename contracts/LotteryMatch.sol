pragma solidity >=0.5.0 <0.6.0;

import {LotteryMaster} from "./LotteryMaster.sol";


/**
 * Match as a digital coin toss between two players. 
 * A tournament is made from a tree of these matches.
 **/
contract LotteryMatch {
    
    address alice;  // Player 1 of the match.
    address bob;    // Player 2 of the match.
    
    mapping(address => bytes32) commitments;  // Commitments alice and bob have made.
    mapping(address => uint256) secrets;      // Secrets, which are preimages to the commitments, alice and bob have made.
    
    LotteryMatch left;   // One of the matches for qualifying to this match. A contract address.
    LotteryMatch right;  // One of the matches for qualifying to this match. A contract address.
    
    LotteryMaster lottery;  // The master lottery contract.
    bool isFirstLevel;  // There is a difference between first level matches and matches one must qualify for.
    uint256 index;  // Matches on the first level are indexed so that they map to specific players in the lottery;
    
    uint256 tCommit;  // Block height after which making commitments is possible.
    uint256 tReveal;  // Block height after which making reveals is possible. And commitments no longer possible.
    uint256 tPlay;  // Block height after which deciding the winner is possible. And reveals no longer possible.
    
    address owner;  // Owner of this contract.

    bool isInitialized;
    

    constructor(uint256 _tCommit, uint256 _tReveal, uint256 _tPlay) public {
        // FOR TESTING require(_tCommit < _tReveal);
        // FOR TESTING require(_tReveal < _tPlay);
        
        tCommit = _tCommit;
        tReveal = _tReveal;
        tPlay = _tPlay;
        
        owner = msg.sender;
    }
    
    /**
     * Initialize the match as a first level match.
     */
    function initFirstLevelMatch(LotteryMaster _lottery, uint256 _index) public {
        require(isInitialized == false, "Match is already initialized.");
        require(msg.sender == owner, "Only owner can initialize match.");
        
        lottery = _lottery;
        index = _index;
        isFirstLevel = true;

        isInitialized = true;
    }
    
    /**
     * Initialize the match as a match inside the tournament tree.
     */
    function initInternalMatch(LotteryMatch _left, LotteryMatch _right) public {
        require(isInitialized == false, "Match is already initialized.");
        require(msg.sender == owner, "Only owner can initialize match.");
        
        left = _left;
        right = _right;

        isInitialized = true;
    }
    
    /**
     * Have a player commit to a value for the ditial coin toss.
     */
    function commit(bytes32 _c) public {
        require(isInitialized == true, "Match must be initialized.");
        // FOR TESTING require(tCommit < block.number);
        // FOR TESTING require(tReveal > block.number);
        
        if (isFirstLevel == true) {
            alice = lottery.getPlayer(index * 2);
            bob = lottery.getPlayer(index * 2 + 1);
        } else {
            alice = left.getWinner();
            bob = right.getWinner();
        }
        require(msg.sender == alice || msg.sender == bob, "Wrong player for this match.");
        require(commitments[msg.sender] == 0, "Player has already commited to this match.");
        
        commitments[msg.sender] = _c;
    }
    
    /**
     * Have a player reveal the value previously commited to for the digital coin toss.
     */
    function reveal(uint256 _s) public {
        // FOR TESTING require(tReveal < block.number);
        // FOR TESTING require(tPlay > block.number);
        
        require(keccak256(abi.encodePacked(msg.sender, _s)) == commitments[msg.sender], "Secret not preimage of commitment.");
        
        secrets[msg.sender] = _s;
        
    }
    
    /**
     * Implicitly calculate the winner by performing the digital coin toss.
     */
    function getWinner() public view returns (address winner) {
        // FOR TESTING require(tPlay < block.number);
        
        // TODO Handle the cases with timeouts and lack of commitments/secrets.
        
        if (secrets[alice] ^ secrets[bob] % 2 == 0) {
            return alice;
        } else {
            return bob;
        }
    }

    function getLeft() public view returns (LotteryMatch _left) {
        _left = left;
    }
    function getRight() public view returns (LotteryMatch _right) {
        _right = right;
    }
    
}
