class Store {
  constructor() {
    this.homePage = document.getElementById('homePage');
    this.gamePage = document.getElementById('gamePage');

    this.messageNode = document.getElementById('message');

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
      role: null,
      currentPoints: 0,
      totalPoints: 0,
    };
    // this.playerName = null;
    // this.isAdmin = false;
    // this.role = null;
    // this.currentPoints = 0;
    // this.totalPoints = 0;
  }
}

export default new Store();
