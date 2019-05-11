pragma solidity >=0.5.0 <0.6.0;

import {AbstractLotteryMatch} from "./AbstractLotteryMatch.sol";


/**
 * The lottery master contract which individual 1v1 matches reference.
 */
contract LotteryMaster {
    // TODO Need some way of checking whether enough players have joined by tStart
    
    address[] public players;  // All players who have made a deposit.
    mapping(address => uint256) public deposits;  // The value of deposits players have made.
    
    address public owner;  // Owner of this contract.
    
    uint256 public price;  // Price in wei for buying a ticket.
    uint256 public N;  // Max number of players in the lottery.
    
    uint256 public nPlayers;  // Number of players currently joined.
    
    uint256 public tStart;      // Start block height of the lottery.
    uint256 public tFinal;  // Block height when the lottery is over and withdrawals can be made.
    
    AbstractLotteryMatch public finalMatch;  // Reference to the final match which decides the winner.

    bool public isInitialized;  // Whether the lottery is ready to take deposits.
    bool public isFull;  //  Whether the lottery is full and ready to play.
    
    constructor(uint256 _N, uint256 _price, uint256 _tStart, uint256 _tFinal) public {
        require(_tStart < _tFinal, "Time limits invalid. Stop time is before start time.");
        
        N = _N;
        price = _price;
        tStart = _tStart;
        tFinal = _tFinal;

        owner = msg.sender;
    }
    
    /**
     * Set the final match of the lottery. 
     * The lottery should not be able to start before this is set. 
     * It's up to participants to validate that this final match is the correct contract.
     */
    function setFinalMatch(AbstractLotteryMatch _finalMatch) public {
        require(msg.sender == owner, "Only owner can set final match.");
        require(finalMatch == AbstractLotteryMatch(0), "Final match is already set.");  // Make sure finalMatch is immutable once set.
        finalMatch = _finalMatch;

        isInitialized = true;
    }
    
    
    /**
     * Players can make a deposit to join the lottery. This is 
     * equivalent to buying a ticket.
     */
    function deposit() public payable {
        // FOR TESTING require(block.number < t0, "Too late to deposit now.");
        require(finalMatch != AbstractLotteryMatch(0), "Final match not set. Lottery not initialized yet.");
        require(msg.value == price, "Transaction value is not equal to ticket price.");
        require(isFull == false, "Lottery is full");
        // FOR TESTING require(deposits[msg.sender] == 0, "Player has already deposited to this lottery.");
        
        players.push(msg.sender);
        deposits[msg.sender] = msg.value;
        nPlayers++;

        if (nPlayers == N) {
            isFull = true;
        }
    }
    
    /**
     * After the predetermined end time of the lottery has passed, then either
     * (a) the winner can withdraw their prize, or (b) there is no winner and
     * participants can withdraw their deposit.
     */
    function withdraw() public {
        address lotteryWinner = finalMatch.getWinner();
        if (lotteryWinner != address(0)) {
            // The winner can withdraw their prize.
            require(msg.sender == lotteryWinner, "Player is not winner of lottery.");
            msg.sender.transfer(address(this).balance);
        } else {
            // Lottery has concluded without a winner.
            require(block.number > tFinal, "Lottery stop time is not reached.");
            msg.sender.transfer(deposits[msg.sender]);
        }
    }
    
    function getPlayer(uint256 index) public view returns (address player) {
        player = players[index];
    }

    /**
     * The only way to get an array is to make a function to get it.
     */
    function getPlayers() public view returns (address[] memory _players) {
        _players = players;
    }
}
