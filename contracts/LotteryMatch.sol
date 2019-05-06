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
    
    uint256 t0;  // Block height after which making commitments is possible.
    uint256 t1;  // Block height after which making reveals is possible. And commitments no longer possible.
    uint256 t2;  // Block height after which deciding the winner is possible. And reveals no longer possible.
    
    address owner;  // Owner of this contract.

    bool isInitialized;
    
    
    
    constructor(uint256 _t0, uint256 _t1, uint256 _t2) public {
        // FOR TESTING require(_t0 < _t1);
        // FOR TESTING require(_t1 < _t2);
        
        t0 = _t0;
        t1 = _t1;
        t2 = _t2;
        
        owner = msg.sender;
        isInitialized = false;
    }
    
    /**
     * Initialize the match as a first level match.
     */
    function initFirstLevelMatch(LotteryMaster _lottery, uint256 _index) public {
        // TODO require(lottery == address(0));
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
        // TODO require(left == address(0));
        // TODO require(right == address(0));
        
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
        // FOR TESTING require(t0 < block.number);
        // FOR TESTING require(t1 > block.number);
        
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
        // FOR TESTING require(t1 < block.number);
        // FOR TESTING require(t2 > block.number);
        
        require(keccak256(abi.encodePacked(msg.sender, _s)) == commitments[msg.sender], "Secret not preimage of commitment.");
        
        secrets[msg.sender] = _s;
        
    }
    
    /**
     * Implicitly calculate the winner by performing the digital coin toss.
     */
    function getWinner() public view returns (address winner) {
        // FOR TESTING require(t2 < block.number);
        
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