pragma solidity >=0.5.0 <0.6.0;

import {LotteryMaster} from "./LotteryMaster.sol";
import {AbstractLotteryMatch} from "./AbstractLotteryMatch.sol";


/**
 * Match as a digital coin toss between two players. 
 * A tournament is made from a tree of these matches.
 **/
contract InternalMatch is AbstractLotteryMatch{
    
    address public alice;  // Player 1 of the match.
    address public bob;    // Player 2 of the match.
    
    mapping(address => bytes32) public commitments;  // Commitments alice and bob have made.
    mapping(address => uint256) public secrets;      // Secrets, which are preimages to the commitments, alice and bob have made.
    
    AbstractLotteryMatch public left;   // One of the matches for qualifying to this match. A contract address.
    AbstractLotteryMatch public right;  // One of the matches for qualifying to this match. A contract address.
    
    uint256 public tCommit;  // Block height after which making commitments is possible.
    uint256 public tReveal;  // Block height after which making reveals is possible. And commitments no longer possible.
    uint256 public tPlay;  // Block height after which deciding the winner is possible. And reveals no longer possible.
    

    constructor(uint256 _tCommit, uint256 _tReveal, uint256 _tPlay, AbstractLotteryMatch _left, AbstractLotteryMatch _right) public {
        // FOR TESTING require(_tCommit < _tReveal);
        // FOR TESTING require(_tReveal < _tPlay);
        
        tCommit = _tCommit;
        tReveal = _tReveal;
        tPlay = _tPlay;

        left = _left;
        right = _right;
    }
    
    
    /**
     * Have a player commit to a value for the ditial coin toss.
     */
    function commit(bytes32 _c) public {
        // FOR TESTING require(tCommit < block.number);
        // FOR TESTING require(tReveal > block.number);
        
        alice = left.getWinner();
        bob = right.getWinner();
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

        // NOTE: Be careful of an adversary calling this function
        // before a winner should be determined.

        // Check if any player is missing
        if (alice != address(0) && bob == address(0)) {
            return alice;
        } else if (alice == address(0) && bob != address(0)) {
            return bob;
        } else if (alice == address(0) && bob == address(0)) {
            return address(0);
        }
        
        // Check if parties have made commitments.
        if (commitments[alice] != 0 && commitments[bob] == 0) {
            return alice;
        } else if (commitments[alice] == 0 && commitments[bob] != 0) {
            return bob;
        } else if (commitments[alice] == 0 && commitments[bob] == 0) {
            return address(0);
        }

        // Check if parties have revealed.
        if (secrets[alice] != 0 && secrets[bob] == 0) {
            return alice;
        } else if (secrets[alice] == 0 && secrets[bob] != 0) {
            return bob;
        } else if (secrets[alice] == 0 && secrets[bob] == 0) {
            return address(0);
        }
        
        // Both parties have revealed, let's toss the coin.
        if ((secrets[alice] ^ secrets[bob]) % 2 == 0) {
            return alice;
        } else {
            return bob;
        }
    }
}
