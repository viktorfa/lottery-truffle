pragma solidity >=0.5.0 <0.6.0;

import { AbstractLotteryMatch } from "./AbstractLotteryMatch.sol";

/**
 * The lottery master contract which individual 1v1 matches reference.
 */
contract LotteryMaster {
    
    address[] public players;  // All players who have made a deposit.
    mapping(address => uint256) public deposits;  // The value of deposits players have made.
    
    address public owner;  // Owner of this contract.
    
    uint256 public price;  // Price in wei for buying a ticket.
    uint256 public N;  // Max number of players in the lottery.
    
    uint256 public nPlayers;  // Number of players currently joined.
    
    uint256 public tStart;  // Start block height of the lottery.
    
    AbstractLotteryMatch public finalMatch;  // Reference to the final match which decides the winner.

    bool public isInitialized;  // Whether the lottery is ready to take deposits.
    bool public isFull;  //  Whether the lottery is full and ready to play.
    
    constructor(uint256 _N, uint256 _price, uint256 _tStart) public {
        require(_tStart < block.number, "Time limits invalid start time is in the past.");

        N = _N;
        price = _price;
        tStart = _tStart;

        owner = msg.sender;
    }
    
    /**
     * Set the final match of the lottery. 
     * The lottery should not be able to start before this is set. 
     * It's up to participants to validate that this final match is the correct contract.
     */
    function setFinalMatch(AbstractLotteryMatch _finalMatch) public {
        require(msg.sender == owner, "Only owner can set final match.");
        require(finalMatch == AbstractLotteryMatch(0), "Final match is already set.");
        finalMatch = _finalMatch;

        isInitialized = true;
    }
    
    
    /**
     * Players can make a deposit to join the lottery. This is 
     * equivalent to buying a ticket.
     */
    function deposit() public payable {
        require(block.number < tStart, "Too late to deposit now.");
        require(isInitialized == true, "Final match not set. Lottery not initialized yet.");
        require(msg.value == price, "Transaction value is not equal to ticket price.");
        require(isFull == false, "Lottery is full");
        require(deposits[msg.sender] == 0, "Player has already deposited to this lottery.");
        
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

        if (block.number >= tStart && !isFull) {
            // Lottery did not get enough participants, so participants can withdraw their deposit.
            msg.sender.transfer(deposits[msg.sender]);
        } else {
            // The winner can withdraw their prize.
            address lotteryWinner = finalMatch.getWinner();
            require(msg.sender == lotteryWinner, "Player is not winner of lottery.");
            msg.sender.transfer(address(this).balance);
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
