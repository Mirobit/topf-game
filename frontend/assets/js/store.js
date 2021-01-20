class Store {
  constructor() {
    this.homePage = document.getElementById('homePage');
    this.gamePage = document.getElementById('gamePage');

    this.messageNode = document.getElementById('message');

    this.countdownNode = document.getElementById('gameCountdown');
    this.timeLeftNode = document.getElementById('timeLeft');
    this.currentGuesserNode = document.getElementById('currentGuesser');
    this.currentExplainerNode = document.getElementById('currentExplainer');
    this.currentRoundNode = document.getElementById('currentRound');
    this.totalRoundsNode = document.getElementById('totalRounds');
    this.currentPointsNode = document.getElementById('currentPoints');
    this.totalPointsNode = document.getElementById('totalPoints');
    this.currentWordNode = document.getElementById('currentWord');

    this.game = null;
    this.player = {
      name: null,
      isAdmin: false,
      activity: null,
      currentPoints: 0,
      totalPoints: 0,
    };
    this.timeLeftInt = null;
  }
}

export default new Store();
