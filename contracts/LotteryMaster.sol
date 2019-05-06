pragma solidity >=0.5.0 <0.6.0;

import {LotteryMatch} from "./LotteryMatch.sol";


/**
 * The lottery master contract which individual 1v1 matches reference.
 */
contract LotteryMaster {
    
    address[] players;  // All players who have made a deposit.
    mapping(address => uint256) deposits;  // The value of deposits players have made.
    
    address owner;  // Owner of this contract.
    
    uint256 price;  // Price in wei for buying a ticket.
    uint256 N;  // Max number of players in the lottery.
    
    uint256 nPlayers;  // Number of players currently joined.
    
    uint256 t0;      // Start block height of the lottery.
    uint256 tFinal;  // Block height when the lottery is over and withdrawals can be made.
    
    LotteryMatch finalMatch;  // Reference to the final match which decides the winner.
    
    constructor(uint256 _N, uint256 _price, uint256 _t0, uint256 _tFinal) public {
        require(_t0 < _tFinal, "Time limits invalid. Stop time is before start time.");
        
        N = _N;
        price = _price;
        t0 = _t0;
        tFinal = _tFinal;

        owner = msg.sender;
        players = new address[](_N);
    }
    
    /**
     * Set the final match of the lottery. 
     * The lottery should not be able to start before this is set. 
     * It's up to participants to validate that this final match is the correct contract.
     */
    function setFinalMatch(LotteryMatch _finalMatch) public {
        require(msg.sender == owner, "Only owner can set final match.");
        // TODO require(finalMatch);  // Make sure finalMatch is immutable once set.
        finalMatch = _finalMatch;
    }
    
    
    /**
     * Players can make a deposit to join the lottery. This is 
     * equivalent to buying a ticket.
     */
    function deposit() public payable {
        // FOR TESTING require(block.number < t0, "Too late to deposit now.");
        // TODO require(finalMatch != address(0));
        require(msg.value == price, "Transaction value is not equal to ticket price.");
        require(nPlayers < N, "Lottery is full");
        // FOR TESTING require(deposits[msg.sender] == 0, "Player has already deposited to this lottery.");
        
        players[nPlayers] = msg.sender;
        deposits[msg.sender] = msg.value;
        nPlayers++;
    }
    
    /**
     * After the predetermined end time of the lottery has passed, then either
     * (a) the winner can withdraw their prize, or (b) there is no winner and
     * participants can withdraw their deposit.
     */
    function withdraw() public {
        require(block.number > tFinal, "Lottery stop time is not reached.");
        
        address lotteryWinner = finalMatch.getWinner();
        if (lotteryWinner == address(0)) {  // Lottery has concluded without a winner.
            msg.sender.transfer(deposits[msg.sender]);
        } else {  // The winner can withdraw their prize.
            require(msg.sender == finalMatch.getWinner(), "Player is not winner of lottery.");
            msg.sender.transfer(address(this).balance);
        }
    }
    
    function getPlayer(uint256 index) public view returns (address player) {
        player = players[index];
    }
}