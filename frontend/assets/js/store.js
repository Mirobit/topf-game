class Store {
  constructor() {
    this.homePage = document.getElementById('homePage');
    this.gamePage = document.getElementById('gamePage');

    this.messageNode = document.getElementById('message');

    this.gameMessageNode = document.getElementById('gameMessage');
    this.timeLeftNode = document.getElementById('timeLeft');
    this.currentGuesserNode = document.getElementById('currentGuesser');
    this.currentExplainerNode = document.getElementById('currentExplainer');
    this.currentRoundNode = document.getElementById('currentRound');
    this.totalRoundsNode = document.getElementById('totalRounds');
    this.currentPointsNode = document.getElementById('currentPoints');
    // this.totalPointsNode = document.getElementById('totalPoints');
    this.currentWordNode = document.getElementById('currentWord');

    this.game = {};
    this.player = {
      name: undefined,
      isAdmin: false,
      activity: 'none',
      currentPoints: 0,
      totalPoints: 0,
    };
    this.timeLeftInt = undefined;
    this.token = undefined;
  }

  setCurrentRound(roundNo) {
    this.game.currentRound = roundNo;
    console.log('settinground', roundNo);
    this.currentRoundNode.innerText = roundNo;
  }

  syncTimeLeft(timeLeft) {
    console.log('sync timer');
    clearInterval(this.timeLeftInt);
    this.game.timeLeft = timeLeft;
    this.timeLeftNode.innerText = timeLeft;
  }

  setGameMessage(message) {
    this.gameMessageNode.innerText = message;
  }
}

export default new Store();
