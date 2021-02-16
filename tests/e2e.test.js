const { chromium } = require('playwright');

let browserAdmin;
let browserPlayer1;
let browserPlayer2;

let pageAdmin;
let pagePlayer1;
let pagePlayer2;

let gameUrl;

beforeAll(async () => {
  // { headless: false, slowMo: 50 }
  browserAdmin = await chromium.launch();
  browserPlayer1 = await browserAdmin.newContext();
  browserPlayer2 = await browserAdmin.newContext();

  pageAdmin = await browserAdmin.newPage();
  pagePlayer1 = await browserPlayer1.newPage();
  pagePlayer2 = await browserPlayer2.newPage();
});

afterAll(async () => {
  await browserAdmin.close();
  // await browserPlayer1.close();
  // await browserPlayer2.close();
});

test('Create a new game', async () => {
  await pageAdmin.goto('http://localhost:8000');
  await pageAdmin.fill('#gameNameNew', 'Test Game');
  await pageAdmin.fill('#adminNameNew', 'Rome');
  await pageAdmin.fill('#roundsNew', '5');
  await pageAdmin.fill('#timerNew', '50');
  await pageAdmin.fill('#wordsCountNew', '4');
  await pageAdmin.click('#createGameButton');
  await pageAdmin.waitForSelector('#gameUrlNew');
  gameUrl = await pageAdmin.$eval('#gameUrlNew', (el) => el.value);
  expect(gameUrl).toContain('http');
});

test('Login as admin', async () => {
  await pageAdmin.goto(gameUrl);
  await pageAdmin.fill('#loginPlayerName', 'Rome');
  await pageAdmin.click('#joinGameButton');
  const startButton = await pageAdmin.waitForSelector('#startGame');
  expect(startButton).toBeTruthy();
});

test('Submit words as admin', async () => {
  await pageAdmin.fill('#wordSuggestion1', 'nodejs');
  await pageAdmin.fill('#wordSuggestion2', 'playwright');
  await pageAdmin.fill('#wordSuggestion3', 'jest');
  await pageAdmin.fill('#wordSuggestion4', 'github');
  await pageAdmin.click('#submitWords');
  const submitButton = await pageAdmin.waitForSelector('#submitWords', {
    state: 'hidden',
  });
  expect(submitButton).toBe(null);
});

test('Set ready as admin', async () => {
  await pageAdmin.check('#setReady', { force: true });
  expect(await pageAdmin.isChecked('#setReady')).toBe(true);
});

test('Add player 1', async () => {
  await pagePlayer1.goto(gameUrl);
  await pagePlayer1.fill('#loginPlayerName', 'Arminius');
  await pagePlayer1.click('#joinGameButton');
  await pagePlayer1.fill('#wordSuggestion1', 'express');
  await pagePlayer1.fill('#wordSuggestion2', 'mongoose');
  await pagePlayer1.fill('#wordSuggestion3', 'pino');
  await pagePlayer1.fill('#wordSuggestion4', 'eslint');
  await pagePlayer1.click('#submitWords');
  await pagePlayer1.check('#setReady', { force: true });
  expect(await pagePlayer1.isChecked('#setReady')).toBe(true);
});

test('Add player 2', async () => {
  await pagePlayer2.goto(gameUrl);
  await pagePlayer2.fill('#loginPlayerName', 'Arminius');
  await pagePlayer2.click('#joinGameButton');
  await pagePlayer2.fill('#wordSuggestion1', 'express');
  await pagePlayer2.fill('#wordSuggestion2', 'mongoose');
  await pagePlayer2.fill('#wordSuggestion3', 'pino');
  await pagePlayer2.fill('#wordSuggestion4', 'eslint');
  await pagePlayer2.click('#submitWords');
  await pagePlayer2.check('#setReady', { force: true });
  expect(await pagePlayer2.isChecked('#setReady')).toBe(true);
});

test('Start game', async () => {
  await pageAdmin.click('#startGame');
  const wordInput = await pageAdmin.waitForSelector('#wordSuggestion1', {
    state: 'hidden',
  });
  expect(wordInput).toBe(null);
});
