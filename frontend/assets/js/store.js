class Store {
  constructor() {
    this.homePage = document.getElementById('homePage');
    this.gamePage = document.getElementById('gamePage');

    this.messageDiv = document.getElementById('message');

    this.gameId = null;
    this.playerName = null;
    this.isAdmin = false;
  }
}

export default new Store();
