pragma solidity >=0.5.0 <0.6.0;


/**
 * Match as a digital coin toss between two players. 
 * A tournament is made from a tree of these matches.
 **/
contract AbstractLotteryMatch {
    /**
     * Have a player commit to a value for the digital coin toss.
     */
    function commit(bytes32 _c) public;
    
    /**
     * Have a player reveal the value previously commited to for the digital coin toss.
     */
    function reveal(uint256 _s) public;
    
    /**
     * Implicitly calculate the winner by performing the digital coin toss.
     */
    function getWinner() public view returns (address winner);
}
