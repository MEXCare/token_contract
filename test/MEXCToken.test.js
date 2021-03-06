/**
 *
 * MIT License
 *
 * Copyright (c) 2018, MEXC Program Developers.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

import expectThrow from 'zeppelin-solidity/test/helpers/expectThrow';
import assertRevert from 'zeppelin-solidity/test/helpers/assertRevert';

var MEXCToken = artifacts.require('./MEXCToken.sol');

contract('MEXCTokenTest', (accounts) => {
  let symbol = 'MEXC';
  let decimals = 18;

  // accounts
  let owner = accounts[0];
  let acc1 = accounts[1];
  let acc2 = accounts[2];
  let acc3 = accounts[3];

  let token;

  beforeEach(async () => {
    token = await MEXCToken.deployed();
  });  

  it('should have MEXC symbol', async () => {
    let symbol = await token.symbol();
    assert.equal('MEXC', symbol, 'Symbol should be MEXC');
  });

  it('should have 18 decimals', async () => {
    let dec = await token.decimals();
    assert.equal(18, dec, 'Decimals should be 18');
  });

  it('should be able to mint 4000 for acc1', async () => {
    let res = await token.mint(acc1, web3.toWei(4000, 'ether'));
    let bal = await token.balanceOf(acc1);
    let supply = await token.totalSupply.call();

    let balance = bal.toString('10');
    assert.equal(web3.toWei(4000, 'ether').toString('10'), balance, 'Balance should be 3500 ether');        

    let s = supply.toString('10');
    let expected = web3.toWei(4000, 'ether').toString('10');
    assert.equal(s, expected, 'Total supply should be 4000 ether');
  });

  it('should disable transfers to acc2', async () => {
    await expectThrow(token.transferFrom(acc1, acc2, web3.toWei(1, 'ether')));
    let bal = await token.balanceOf(acc2);
    assert.equal('0', bal.toString('10'), 'Balance should be 0');
  });

  it('should enable transfer', async () => {
    let r = await token.allowTransfers();
    let status = await token.transferDisabled();
    assert.equal(false, status, 'Transfer should be enabled');
  });

  it('should enable transfer to acc2', async () => {
    let res = await token.mint(acc1, web3.toWei(20, 'ether'));
    await token.transfer(acc2, web3.toWei(1, 'ether'), {from: acc1});
    let bal = await token.balanceOf(acc2);
    assert.equal(web3.toWei(1, 'ether'), bal.toString('10'), 'Balance should be 1 ether');
  });

  it('should blackList acc3', async() => {
    let res = await token.mint(acc3, web3.toWei(2, 'ether'));
    await token.blackListAddress(acc3);

    // acc3 transfer to acc2
    await expectThrow(token.transfer(acc2, web3.toWei(1, 'ether'), {from: acc3}));
    let bal = await token.balanceOf(acc3);
    assert.equal(web3.toWei(2, 'ether'), bal.toString('10'), 'Balance should still be 2 ether');
  });

  it('should be able to confiscate acc3 balance', async () => {
    let ownBal = await token.balanceOf(owner);
    let res = await token.mint(acc3, web3.toWei(2, 'ether'));
    let acc3Bal = await token.balanceOf(acc3);
    assert.equal(web3.toWei(4, 'ether'), acc3Bal.toString('10'), 'Balance should be 4 ether');

    // confiscate
    await token.confiscate(acc3);
    let acc3BalNow = await token.balanceOf(acc3);
    assert.equal(web3.toWei(0, 'ether'), acc3BalNow.toString('10'), 'Balance should be 0 ether');
  });

})
